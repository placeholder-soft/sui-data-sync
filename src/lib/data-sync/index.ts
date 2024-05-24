import { NestFactory } from '@nestjs/core';
import { DataSyncModule } from './data-sync.module';
import { DataSyncRepository, EventSyncSchema } from './data-sync.repository';

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
  const repo = app.get(DataSyncRepository);

  repo.preCheckEventsAbi(schema).then(a => {
    console.log(a); //?
  });
}

main().catch(console.error);
