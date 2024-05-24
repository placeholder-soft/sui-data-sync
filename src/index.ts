import { NestFactory } from '@nestjs/core';
import { Client } from '@nestjs/microservices';
import {
  DataSyncModule,
  DataSyncService,
  EventSyncSchema,
} from './lib/data-sync';

export * from './lib/data-sync';
const schema: EventSyncSchema = {
  tableSchema: 'gifted',
  transactionModule: 'simple_gift_box',
  events: [
    {
      eventName: 'GiftBoxMinted',
      fields: { object_id: 'buffer', name: 'string', creator: 'buffer' },
    },
  ],
};

export async function main() {
  /*
  add nxChecks to prevent nx dependency checks
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const nxChecks = {
    Client,
  };
  const app = await NestFactory.createMicroservice(DataSyncModule, {
    logger: ['log', 'verbose', 'error', 'warn', 'debug', 'fatal'],
  });
  const syncService = app.get(DataSyncService);

  syncService.setSchemas([schema]);
  syncService.addSyncMoveEventType(
    `0xceba50ec29ada96392373f340fe4eeffab45140ac66acc9459770e5a3c58abf8::simple_gift_box::GiftBoxMinted`,
  );
  syncService.startSync();
}

// main().catch(console.error);
