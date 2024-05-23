import { z } from 'zod';

export function makePaginationResponseSchema<T>(data: z.ZodType<T>) {
  return z.object({
    data: z.array(data),
    hasNextPage: z.boolean(),
    nextCursor: z
      .object({
        txDigest: z.string(),
        eventSeq: z.string(),
      })
      .nullish(),
  });
}

const EventFilterTransaction = z.object({
  Transaction: z.string(),
});
const EventFilterMoveModule = z.object({
  MoveModule: z.object({
    package: z.string(),
    module: z.string(),
  }),
});
const EventFilterMoveEventModule = z.object({
  MoveEventModule: z.object({
    package: z.string(),
    module: z.string(),
  }),
});
const EventFilterMoveEvent = z.object({
  MoveEvent: z.string(),
});
const EventFilterEventType = z.object({
  EventType: z.string(),
});
const EventFilterMoveEventType = z.object({
  MoveEventType: z.string(),
});
const EventFilterSender = z.object({
  Sender: z.string(),
});
const EventFilterRecipient = z.object({
  Recipient: z.object({
    AddressOwner: z.string(),
  }),
});
const EventFilterObject = z.object({
  Object: z.string(),
});
const EventFilterTimeRange = z.object({
  TimeRange: z.object({
    startTime: z.number(),
    endTime: z.number(),
  }),
});
const EventFilterAll = z.object({
  All: z.string(),
});
export const EventFilter = z.union([
  EventFilterTransaction,
  EventFilterMoveModule,
  EventFilterMoveEventModule,
  EventFilterMoveEvent,
  EventFilterEventType,
  EventFilterMoveEventType,
  EventFilterSender,
  EventFilterRecipient,
  EventFilterObject,
  EventFilterTimeRange,
  EventFilterAll,
]);
export const PageCursorEvent = z.object({
  txDigest: z.string(),
  eventSeq: z.string(),
});