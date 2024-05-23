import { z } from 'zod';

export const EnvSUINodeRPCSchema = z.preprocess((val, ctx) => {
  if (typeof val === 'string') {
    if (val === 'devnet') {
      return 'https://fullnode.devnet.sui.io';
    }
    if (val === 'testnet') {
      return 'https://fullnode.testnet.sui.io';
    }
    if (val === 'mainnet') {
      return 'https://fullnode.mainnet.sui.io';
    }
  }
  ctx.addIssue({
    message: `val is not a string: ${val}`,
    code: 'custom',
  });
  return z.NEVER;
}, z.string());

export const SUI_ENV = z.enum(['devnet', 'testnet', 'mainnet']);


export const BooleanSchema = z.preprocess((val, ctx) => {
  if (typeof val === 'boolean') {
    return val;
  }
  if (typeof val === 'string') {
    return val === 'true';
  }
  if (typeof val === 'number') {
    return val === 1;
  }
  ctx.addIssue({
    message: `val is not a boolean: ${val}`,
    code: 'custom',
  });
  return z.NEVER;
}, z.boolean());
