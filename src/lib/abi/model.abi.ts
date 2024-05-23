import { z } from 'zod';
import { BufferSchema } from '../model/base.model';

export const EventSchema_GiftBoxMinted = z.object({
  object_id: BufferSchema,
  name: z.string(),
  creator: BufferSchema,
});
