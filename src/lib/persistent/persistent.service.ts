import { OnModuleDestroy } from '@nestjs/common';
import {
  createDateTypeParser,
  createIntervalTypeParser,
  createPool,
  createTimestampTypeParser,
  createTimestampWithTimeZoneTypeParser,
  DatabasePool,
} from 'slonik';
import { createQueryLoggingInterceptor } from 'slonik-interceptor-query-logging';
import { createResultParserInterceptor } from './interceptor/result-parser-interceptor';
import {
  createByteaTypeParser,
  createFloat4TypeParser,
  createFloat8TypeParser,
  createInt8TypeParser,
  createIntegerTypeParser,
  createNumericTypeParser,
} from './parsers';
import { PersistentService } from './persistent.interface';

function getNodeDatabaseURL() {
  const NODE_DATABASE_URL = process.env.NODE_DATABASE_URL;
  if (NODE_DATABASE_URL == null || NODE_DATABASE_URL.length === 0) {
    return null
  }
  return NODE_DATABASE_URL;
}

export class DefaultPersistentService
  extends PersistentService
  implements OnModuleDestroy
{
  private _pgPool: DatabasePool | null = null;

  get pgPool(): DatabasePool {
    if (this._pgPool === null) {
      throw new Error('pgPool is not initialized');
    }
    return this._pgPool;
  }

  async connectPool() {
    const NODE_DATABASE_URL = getNodeDatabaseURL();
    if (NODE_DATABASE_URL == null) {
      throw new Error('NODE_DATABASE_URL is not set');
    }
    const pool = await createPool(
      NODE_DATABASE_URL,
      {
        typeParsers: [
          // - customized type parsers
          createInt8TypeParser(),
          createNumericTypeParser(),
          createFloat4TypeParser(),
          createFloat8TypeParser(),
          createIntegerTypeParser(),
          createByteaTypeParser(),

          // - default type parsers
          createDateTypeParser(),
          createIntervalTypeParser(),
          createTimestampTypeParser(),
          createTimestampWithTimeZoneTypeParser(),
        ],
        interceptors: [
          createQueryLoggingInterceptor(),
          createResultParserInterceptor(),
        ],
      },
    );

    this._pgPool = pool;
  }

  onModuleDestroy() {
    return this.pgPool.end();
  }
}

const PersistentServiceProvider = {
  provide: PersistentService,
  useFactory: async () => {
    const service = new DefaultPersistentService();
    const url = getNodeDatabaseURL();
    if (url != null && url.length > 0) {
      await service.connectPool();
    } else {
      console.warn('NODE_DATABASE_URL is not set, skip connecting to DB');
    }
    return service;
  },
};

export default PersistentServiceProvider;
