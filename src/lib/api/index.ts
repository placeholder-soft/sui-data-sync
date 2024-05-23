import got from 'got-cjs';
import { env } from '../env';
import {
  SUIQueryRequest,
  SUIQueryResponse,
  SUIQuerySchema,
} from '../model/json-rpc';
import { parseJSON, stringifyJSON } from '../utils/json';

class QueryInconsistencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QueryInconsistencyError';
  }
}

export async function sui_query<T extends SUIQuerySchema>(
  method: T['method'],
  params: T['request'],
): Promise<T['response']> {
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

  return validator.response;
}

sui_query('suix_queryEvents', [
  {
    MoveEventType:
      '0xceba50ec29ada96392373f340fe4eeffab45140ac66acc9459770e5a3c58abf8::simple_gift_box::GiftBoxMinted',
  },
  null,
  5,
  true,
]).then(a => {
  console.log(parseJSON(stringifyJSON(a, 2)));
}); //?
