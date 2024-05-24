import { NestFactory } from '@nestjs/core';
import { DataSyncService, EventSyncSchema } from './data-sync.interface';
import { DataSyncModule } from './data-sync.module';

export * from './data-sync.interface';
export * from './data-sync.module';

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

async function main() {
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

main().catch(console.error);
