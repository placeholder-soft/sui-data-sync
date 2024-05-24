import { Inject, Logger } from '@nestjs/common';
import assert from 'assert';
import PQueue from 'p-queue';
import { sui_query } from '../api';
import { PageCursorEvent, PageEvent } from '../model/json-rpc';
import { noAwait } from '../utils/no-await';
import { DataSyncService, EventSyncSchema } from './data-sync.interface';
import { DataSyncRepository } from './data-sync.repository';

const kQueryLimit = 50;
const kFetchLimit = 100000;
export class DefaultDataSyncService implements DataSyncService {
  private syncingTypes: string[] = [];
  private readonly logger = new Logger(DataSyncService.name);
  public syncInterval = 10e3;
  private syncing = false;
  public schemas: EventSyncSchema[] = [];

  constructor(
    @Inject(DataSyncRepository)
    private readonly dataSyncRepository: DataSyncRepository,
  ) {}

  startSync() {
    noAwait(this.loopSync());
  }

  stopSync() {
    this.syncing = false;
  }

  setSchemas(schemas: EventSyncSchema[]) {
    this.schemas = schemas;
  }

  async loopSync() {
    let pass = true;
    for (const schema of this.schemas) {
      const valid = await this.dataSyncRepository.preCheckEventsAbi(schema);
      if (!valid) {
        pass = false;
        break;
      }
    }

    if (!pass) {
      throw new Error(`there are invalid schemas, please check the logs`);
    }
    this.syncing = true;
    while (this.syncing) {
      try {
        await this.syncMoveEventTypes();
      } catch (e) {
        this.logger.error(`sync error: ${e}`);
      }
      await new Promise(r => setTimeout(r, this.syncInterval));
    }
  }

  private findModuleEvent(type: string) {
    const types = type.split('::');
    if (types.length !== 3) {
      throw new Error(`invalid event type: ${type}`);
    }
    const packageId = types[0];
    assert(packageId, `missing package id: ${type}`);
    const moduleName = types[1];
    assert(moduleName, `missing module name: ${type}`);
    const schema = this.schemas.find(s => {
      return s.transactionModule == moduleName;
    });
    if (!schema) {
      throw new Error(`missing schema for ${moduleName}`);
    }

    const typeName = types[2];
    assert(typeName, `missing event type name: ${type}`);
    const event = schema.events.find(e => {
      return e.eventName == typeName;
    });
    if (!event) {
      throw new Error(`missing event ${typeName} in schema ${moduleName}`);
    }

    return {
      packageId,
      transactionModule: moduleName,
      typeName,
      event,
      tableSchema: schema.tableSchema,
    };
  }

  addSyncMoveEventType(type: string) {
    const types = type.split('::');
    if (types.length !== 3) {
      throw new Error(`invalid event type: ${type}`);
    }
    if (this.syncingTypes.includes(type)) {
      return;
    }
    this.findModuleEvent(type);

    this.syncingTypes.push(type);
  }

  private async syncMoveEventType(type: string) {
    const { tableSchema } = this.findModuleEvent(type);
    const latestInDb = await this.dataSyncRepository.getLatestEventDigest(
      type,
      tableSchema,
    );
    const containLatestResult = (results: PageEvent[]) => {
      if (!latestInDb) {
        return false;
      }
      return results.find(
        r =>
          r.id.txDigest === latestInDb.txDigest &&
          r.id.eventSeq === latestInDb.eventSeq,
      );
    };

    let cursor: PageCursorEvent | null = null;
    const sink: PageEvent[] = [];
    for (let i = 0; i < kFetchLimit; i++) {
      const response = await sui_query('suix_queryEvents', [
        { MoveEventType: type },
        cursor,
        kQueryLimit,
        true,
      ]);
      const data = response.data;
      if (data === null) {
        break;
      }
      // building sink until finished
      sink.push(...data);
      if (containLatestResult(data)) {
        break;
      }
      if (!response.hasNextPage) {
        break;
      }

      if (
        response.nextCursor == null ||
        response.nextCursor.eventSeq == null ||
        response.nextCursor.txDigest == null
      ) {
        this.logger.error(`invalid cursor: ${JSON.stringify(response)}`);
        break;
      }
      cursor = response.nextCursor as any;
      // this.logger.verbose(`next cursor: ${JSON.stringify(cursor)}`);

      if (i === kFetchLimit - 1) {
        throw new Error(`fetch limit reached: ${kFetchLimit}`);
      }
    }

    // write to db
    await this.dataSyncRepository.saveEvents({
      events: sink,
      schemas: this.schemas,
    });
  }

  private internalSyncCounter = 0;
  private async syncMoveEventTypes() {
    this.logger.verbose(
      `[${++this.internalSyncCounter}] syncing ${
        this.syncingTypes.length
      } types...`,
    );
    const queue = new PQueue({ concurrency: this.syncingTypes.length });
    for (const type of this.syncingTypes) {
      noAwait(queue.add(() => this.syncMoveEventType(type)));
    }
    await queue.onIdle();
    this.logger.debug(
      `[${this.internalSyncCounter}] syncing ${this.syncingTypes.length} types done`,
    );
  }
}

const DataSyncServiceProvider = {
  provide: DataSyncService,
  useClass: DefaultDataSyncService,
};

export default DataSyncServiceProvider;
