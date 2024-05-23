import { z } from 'zod';
import { BufferSchema } from '../model/base.model';

// TODO: automatically generate abi via: sui_getNormalizedMoveModulesByPackage
export const EventSchema_GiftBoxMinted = z.object({
  object_id: BufferSchema,
  name: z.string(),
  creator: BufferSchema,
});

export const EventAbi_GiftBoxMinted = {
  object_id: 'buffer',
  name: 'string',
  creator: 'buffer',
};
