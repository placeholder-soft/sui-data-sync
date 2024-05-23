import { z } from 'zod';

export const BufferSchema = z.preprocess((val, ctx) => {
  if (typeof val === 'string') {
    if (val.length >= 2 && val[1] === 'x') {
      return Buffer.from(val.slice(2), 'hex');
    }
    if (
      val.length >= 3 &&
      val[0] === '\\' &&
      val[1] === '\\' &&
      val[2] === 'x'
    ) {
      return Buffer.from(val.slice(3), 'hex');
    } else {
      return Buffer.from(val, 'hex');
    }
  }
  if (val instanceof Uint8Array) {
    return Buffer.from(val);
  }
  if (val instanceof Buffer) {
    return val;
  }
  ctx.addIssue({
    message: `val is not a buffer: ${val}`,
    code: 'custom',
  });
  return z.NEVER;
}, z.instanceof(Buffer)) as z.ZodType<Buffer, z.ZodTypeDef, Buffer>;

export const BufferStringSchema = z.preprocess((val, ctx) => {
  if (typeof val === 'string') {
    return val.startsWith('0x') ? val : `0x${val}`;
  }
  if (val instanceof Buffer) {
    return `0x${val.toString('hex')}`;
  }
  if (val instanceof Uint8Array) {
    const buf = BufferSchema.parse(val);
    return `0x${buf.toString('hex')}`;
  }
  ctx.addIssue({
    message: `val is not a buffer: ${val}`,
    code: 'custom',
  });
  return z.NEVER;
}, z.string());
