import { DataSyncService } from './data-sync.interface';

export class DefaultDataSyncService implements DataSyncService {
  constructor() {
  }
}

const DataSyncServiceProvider = {
  provide: DataSyncService,
  useClass: DefaultDataSyncService,
};

export default DataSyncServiceProvider;
