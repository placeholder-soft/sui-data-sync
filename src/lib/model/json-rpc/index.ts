import { z } from 'zod';
import { SUIMethod } from './query-schema.model';

export const SUIQueryRequest = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.number(),
  method: SUIMethod,
  params: z.array(z.any()),
});

export const SUIQueryResponse = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.number(),
  result: z.any(),
});

export * from './base.model';
export * from './query-schema.model';
