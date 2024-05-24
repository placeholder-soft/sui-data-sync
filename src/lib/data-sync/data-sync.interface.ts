export abstract class DataSyncService {
  abstract startSync(): void;
  abstract stopSync(): void;
  abstract setSchemas(schemas: EventSyncSchema[]): void;
  abstract addSyncMoveEventType(type: string): void;
}

export type EventSyncSchema = {
  tableSchema: string;
  transactionModule: string;
  events: {
    eventName: string;
    fields: { [name: string]: 'string' | 'buffer' | 'number' | 'bool' };
  }[];
};
