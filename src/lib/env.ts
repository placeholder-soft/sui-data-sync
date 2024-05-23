import { createEnv } from '@t3-oss/env-core';
import memoizee from 'memoizee';
import { z } from 'zod';
import { EnvSUINodeRPCSchema, SUI_ENV } from './model/env.model';

export const env = memoizee(() => {
  const envObj = createEnv({
    server: {
      SUI_NODE_RPC_URL: z.string().optional(),
      SUI_ENV: SUI_ENV.default('devnet'),
    },
    runtimeEnv: process.env,
  });

  let SUI_NODE_RPC_URL = envObj.SUI_NODE_RPC_URL;
  if (SUI_NODE_RPC_URL == null) {
    SUI_NODE_RPC_URL = EnvSUINodeRPCSchema.parse(envObj.SUI_ENV);
  }

  return {
    ...envObj,
    SUI_NODE_RPC_URL,
  };
});

env().SUI_NODE_RPC_URL; //?
