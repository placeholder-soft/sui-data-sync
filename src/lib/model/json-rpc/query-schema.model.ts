import { z } from 'zod';
import { EventFilter, makePaginationResponseSchema, PageCursorEvent } from './base.model';

export const SUIMethod = z.enum([
  'suix_queryEvents',
  'suix_queryTransactionBlocks',
]);

/// - suix_queryEvents
const PageEvent = z.object({
  id: z.object({
    txDigest: z.string(),
    eventSeq: z.string(),
  }),
  packageId: z.string(),
  transactionModule: z.string(),
  sender: z.string(),
  type: z.string(),
  parsedJson: z.any(),
  bcs: z.string(),
  timestampMs: z.string(),
});
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

/// - suix_queryTransactionBlocks
export const SUIQuerySchemaTransactionBlocks = z.object({
  method: z.literal(SUIMethod.enum.suix_queryTransactionBlocks),
  request: z.tuple([
    z.string(), //query
  ]),
  response: makePaginationResponseSchema(z.object({})),
});
export const SUIQuerySchema = z.discriminatedUnion('method', [
  SUIQuerySchemaEvents,
  SUIQuerySchemaTransactionBlocks,
]);
export type SUIQuerySchema = z.infer<typeof SUIQuerySchema>;