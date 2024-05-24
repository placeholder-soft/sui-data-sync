import { Inject, Logger } from '@nestjs/common';
import assert from 'assert';
import { DatabaseTransactionConnection, SqlToken } from 'slonik';
import { raw } from 'slonik-sql-tag-raw';
import { z } from 'zod';
import { env } from '../env';
import { PageEvent } from '../model/json-rpc';
import { SQL } from '../persistent/SQL';
import { PersistentService } from '../persistent/persistent.interface';

export type EventSyncSchema = {
  tableSchema: string;
  transactionModule: string;
  events: {
    eventName: string;
    fields: { [name: string]: 'string' | 'buffer' | 'number' | 'bool' };
  }[];
};

export class DataSyncRepository {
  private readonly logger = new Logger(DataSyncRepository.name, {
    timestamp: true,
  });

  constructor(
    @Inject(PersistentService)
    private readonly persistentService: PersistentService,
  ) {}

  async preCheckSchemaName(schema: string): Promise<boolean> {
    const exists = await this.persistentService.pgPool.one(SQL.type(
      z.object({ exists: z.boolean() }),
    ) // language=TEXT format=false
    `
        SELECT EXISTS(
                 SELECT
                 FROM information_schema.schemata
                 WHERE schema_name = ${schema});`);

    if (exists.exists) {
      return true;
    }
    this.logger.log(`missing schema: ${schema}, generate creating SQL...`);

    const createSchemaSql = `
        CREATE SCHEMA "${schema}";
    `;

    if (env().SYNC_AUTO_CREATE_SCHEMAS) {
      this.logger.log(`auto creating schema: ${schema}`);
      await this.runTableCreationSQL(createSchemaSql);
      this.logger.log(
        `auto created schema: ${schema} successfully!, retry validation...`,
      );
    } else {
      this.logger.warn(createSchemaSql);
    }

    return true;
  }

  async preCheckEventAbi(params: {
    eventName: string;
    fields: EventSyncSchema['events'][0]['fields'];
    transactionModule: string;
    tableSchema: string;
  }): Promise<boolean> {
    const { eventName, fields, transactionModule, tableSchema } = params;
    let pass = false;

    await this.preCheckSchemaName(tableSchema);

    const tableName = `${transactionModule}_evt_${eventName}`;

    const exists = await this.persistentService.pgPool.one(SQL.type(
      z.object({ exists: z.boolean() }),
    ) // language=TEXT format=false
    `
        SELECT EXISTS(
                 SELECT
                 FROM information_schema.tables
                 WHERE table_schema = ${tableSchema}
                   AND table_name = ${tableName});`);

    if (exists.exists) {
      return true;
    }
    this.logger.log(`missing table: ${tableName}, generate creating SQL...`);

    const typeMapper = {
      buffer: 'bytea',
      string: 'text',
      number: 'numeric',
      bool: 'bool',
    } as const;

    const fieldsSql = Object.entries(fields)
      .map(
        ([name, type]) =>
          `            \"${name}\" ${typeMapper[type]} NOT NULL,`,
      )
      .join('\n');

    // language=TEXT format=false
    const createTableSql = `
        CREATE TABLE "${tableSchema}"."${tableName}"
        (
            "txDigest"          text      NOT NULL,
            "eventSeq"          numeric   NOT NULL,
            "eventName"         text      NOT NULL,
            "packageId"         bytea     NOT NULL,
            "transactionModule" text      NOT NULL,
            "sender"            bytea     NOT NULL,
            "bcs"               text      NOT NULL,
            "timestampMs"       timestamp NOT NULL,
            "parsedJson"        jsonb NOT NULL,
${fieldsSql}
            PRIMARY KEY ("txDigest", "eventSeq")
        );
    `; //?

    if (env().SYNC_AUTO_CREATE_TABLES) {
      this.logger.log(`auto creating table: ${tableName}`);
      await this.runTableCreationSQL(createTableSql);
      this.logger.log(
        `auto created table: ${tableName} successfully!, retry validation...`,
      );
      pass = await this.preCheckEventAbi(params);
    } else {
      this.logger.warn(createTableSql);
    }

    return pass;
  }

  async preCheckEventsAbi(schema: EventSyncSchema): Promise<boolean> {
    let pass = true;
    for (const event of schema.events) {
      const passEvent = await this.preCheckEventAbi({
        eventName: event.eventName,
        fields: event.fields,
        transactionModule: schema.transactionModule,
        tableSchema: schema.tableSchema,
      });
      if (!passEvent) {
        pass = false;
      }
    }

    return pass;
  }

  private async runTableCreationSQL(creationSQL: string) {
    try {
      await this.persistentService.pgPool.transaction(async connection => {
        await connection.query(SQL.typeAlias('void')`${raw(creationSQL)}`);
      });
    } catch (e) {
      this.logger.error(`
      error: ${e}
      create table failed rollback:
      ${creationSQL}
      `);
      throw e;
    }
  }

  async saveEvents(params: {
    schemas: EventSyncSchema[];
    events: PageEvent[];
  }) {
    const { schemas, events } = params;

    for (const event of events) {
      const schema = (() => {
        const filters = schemas.filter(s => {
          return s.transactionModule === event.transactionModule;
        });
        if (filters.length === 0) {
          return null;
        }
        if (filters.length > 1) {
          throw new Error(
            `duplicate transactionModule: ${event.transactionModule}`,
          );
        }

        return filters[0] ?? null;
      })();
      if (!schema) {
        this.logger.warn(`missing schema for ${event.transactionModule}`);
        continue;
      }

      await this.persistentService.pgPool.transaction(async conn => {
        await this.saveEvent({ schema, event }, conn);
      });
    }
  }
  async saveEvent(
    params: { schema: EventSyncSchema; event: PageEvent },
    conn: DatabaseTransactionConnection,
  ) {
    const { schema, event } = params;
    // event type: 0x1::simple_gift_box::GiftBoxMinted
    const eventTypeName = event.type.split('::')[2];
    assert(eventTypeName, `missing event type name: ${event.type}`);

    const eventAbis = schema.events.filter(e => e.eventName === eventTypeName);
    if (eventAbis.length === 0) {
      this.logger.warn(`missing abi for ${event.type}`);
      return;
    }
    if (eventAbis.length > 1) {
      throw new Error(`duplicate abi for ${event.type}`);
    }
    const eventAbi = eventAbis[0]!;

    const fields = [
      SQL.identifier(['txDigest']),
      SQL.identifier(['eventSeq']),
      SQL.identifier(['eventName']),
      SQL.identifier(['packageId']),
      SQL.identifier(['transactionModule']),
      SQL.identifier(['sender']),
      SQL.identifier(['type']),
      SQL.identifier(['bcs']),
      SQL.identifier(['timestampMs']),
      SQL.identifier(['parsedJson']),
    ];
    const values: (SqlToken | string)[] = [
      SQL.string(event.id.txDigest),
      SQL.string(event.id.eventSeq),
      SQL.string(eventTypeName),
      SQL.buffer(event.packageId),
      SQL.string(event.transactionModule),
      SQL.buffer(event.sender),
      SQL.string(event.type),
      SQL.string(event.bcs),
      SQL.string(event.timestampMs),
      SQL.jsonb(event.parsedJson),
    ];

    for (const [name, type] of Object.entries(eventAbi.fields)) {
      fields.push(SQL.identifier([name]));
      values.push(SQL.jsonb(event.parsedJson[name]));
    }

    const keyFragments = SQL.join(fields, SQL.fragment`, `);
    const valueFragments = SQL.join(values, SQL.fragment`, `);

    const tableName = `${schema.transactionModule}_evt_${eventTypeName}`;

    await conn.query(SQL.typeAlias('void')`
        insert into ${SQL.identifier([schema.tableSchema, tableName])}
          (${keyFragments})
        values (${valueFragments})
        on conflict do nothing;
      `);
  }
}
