import { NestFactory } from '@nestjs/core';
import {
  DataSyncModule,
  DataSyncService,
  EventSyncSchema,
} from './lib/data-sync';

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

describe('main test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });

  it.skip('should run main', async () => {
    await main();
  });
});
