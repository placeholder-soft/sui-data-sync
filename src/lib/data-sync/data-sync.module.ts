import { Module } from '@nestjs/common';
import { PersistentModule } from '../persistent/persistent.module';
import { DataSyncRepository } from './data-sync.repository';
import DataSyncServiceProvider from './data-sync.service';

@Module({
  imports: [PersistentModule],
  providers: [DataSyncServiceProvider, DataSyncRepository],
  exports: [DataSyncServiceProvider, DataSyncRepository],
})
export class DataSyncModule {}
