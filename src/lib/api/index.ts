import got from 'got-cjs';
import { env } from '../env';
import {
  MethodTypes,
  SUIQueryRequest,
  SUIQueryResponse,
  SUIQuerySchema,
} from '../model/json-rpc';

class QueryInconsistencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QueryInconsistencyError';
  }
}

export async function sui_query<T extends MethodTypes>(
  method: T,
  params: Extract<SUIQuerySchema, { method: T }>['request'],
): Promise<Extract<SUIQuerySchema, { method: T }>['response']> {
  const randomID = Math.floor(Math.random() * 1000000);
  const request = SUIQueryRequest.parse({
    jsonrpc: '2.0',
    id: randomID,
    method: method,
    params: params,
  });

  const data = await got
    .post(env().SUI_NODE_RPC_URL, {
      json: request,
      // https://github.com/sindresorhus/got/blob/main/documentation/7-retry.md
      retry: {
        methods: ['post'],
        limit: 10, // Number of retries to attempt. the last one is (2 ** (attemptCount − 1) /60) ~= 8 mins
        statusCodes: [408, 413, 429, 500, 502, 503, 504, 521, 522, 524],
      },
    })
    .json();

  const typedData = SUIQueryResponse.parse(data);
  if (typedData.id !== randomID) {
    throw new QueryInconsistencyError(
      `Invalid response id: ${typedData.id}, expected: ${randomID}`,
    );
  }

  const validator = SUIQuerySchema.parse({
    method,
    request: params,
    response: typedData.result,
  });

  return validator.response as any;
}

// sui_query('suix_queryEvents', [
//   {
//     MoveEventType:
//       '0xceba50ec29ada96392373f340fe4eeffab45140ac66acc9459770e5a3c58abf8::simple_gift_box::GiftBoxMinted',
//   },
//   null,
//   5,
//   true,
// ]).then(a => {
//   console.log(parseJSON(stringifyJSON(a, 2)));
// }); //?
