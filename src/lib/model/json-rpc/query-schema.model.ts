import { z } from 'zod';
import { BufferSchema } from '../base.model';
import {
  EventFilter,
  makePaginationResponseSchema,
  PageCursorEvent,
} from './base.model';

export const SUIMethod = z.enum([
  'suix_queryEvents',
  'suix_queryTransactionBlocks',
]);

// region - suix_queryEvents
export const PageEvent = z.object({
  id: z.object({
    txDigest: z.string(),
    eventSeq: z.string(),
  }),
  packageId: BufferSchema,
  transactionModule: z.string(),
  sender: BufferSchema,
  type: z.string(),
  parsedJson: z.any(),
  bcs: z.string(),
  timestampMs: z.string(),
});
export type PageEvent = z.infer<typeof PageEvent>;

export const SUIQuerySchemaEvents = z.object({
  method: z.literal(SUIMethod.enum.suix_queryEvents),
  request: z.tuple([
    EventFilter, //query
    PageCursorEvent.nullish(), //cursor
    z.number().nullish().default(50), //limit
    z.boolean().nullish().default(true), //descending_order
  ]),
  response: makePaginationResponseSchema(PageEvent),
});
// endregion

// region - suix_queryTransactionBlocks
export const SUIQuerySchemaTransactionBlocks = z.object({
  method: z.literal(SUIMethod.enum.suix_queryTransactionBlocks),
  request: z.tuple([
    z.string(), //query
  ]),
  response: makePaginationResponseSchema(z.object({})),
});
// endregion

// region - SUIQuerySchema
export const SUIQuerySchema = z.discriminatedUnion('method', [
  SUIQuerySchemaEvents,
  SUIQuerySchemaTransactionBlocks,
]);
export type SUIQuerySchema = z.infer<typeof SUIQuerySchema>;
// endregion
