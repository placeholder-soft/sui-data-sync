import {
  BinarySqlToken,
  createSqlTag,
  JsonBinarySqlToken,
  SerializableValue,
  sql,
  SqlTag,
} from 'slonik';
import z from 'zod';
import { BufferSchema } from '../model/base.model';

type SqlTagType = ReturnType<typeof createSqlTag>;

const SqlTag: SqlTagType = createSqlTag({
  typeAliases: {
    id: z.object({
      id: z.number(),
    }),
    void: z.object({}).strict(),
    any: z.any(),
  },
});

const SqlHelper = {
  bigint: (bigInt: bigint) => bigInt.toString(10),
  number: (num: number) => num,
  string: (str: string) => str,
  boolean: (bool: boolean) => bool,
  bool: (bool: boolean) => bool,
  buffer: (buffer: string | Buffer): BinarySqlToken => {
    if (typeof buffer === 'string') {
      return sql.binary(BufferSchema.parse(buffer));
    }
    return sql.binary(buffer);
  },
  get nullish() {
    return {
      number: (num: number | null | undefined) => {
        if (num == null) {
          return null;
        }
        return num;
      },
      date: (
        date: Date | null | undefined,
      ): ReturnType<SqlTag['date']> | null => {
        if (date == null) {
          return null;
        }
        return sql.date(date);
      },
      timestamp: (
        date: Date | null | undefined,
      ): ReturnType<SqlTag['timestamp']> | null => {
        if (date == null) {
          return null;
        }
        return sql.timestamp(date);
      },
      bigint: (bigInt: bigint | null | undefined) => {
        if (bigInt == null) {
          return null;
        }
        return bigInt.toString(10);
      },
      string: (str: string | null | undefined) => {
        if (str == null) {
          return null;
        }
        return str;
      },
      boolean: (bool: boolean | null | undefined) => {
        if (bool == null) {
          return null;
        }
        return bool;
      },
      binary: SQL_to_buffer,
      buffer: SQL_to_buffer,
      jsonb: (
        json: SerializableValue | null | undefined,
      ): null | JsonBinarySqlToken => {
        if (json == null) {
          return null;
        }
        return sql.jsonb(json);
      },
    };
  },
};

export const SQL: SqlTagType & typeof SqlHelper = {
  ...SqlTag,
  ...SqlHelper,
};

function SQL_to_buffer(
  buffer: string | Buffer | null | undefined,
): BinarySqlToken | null {
  if (buffer == null) {
    return null;
  }
  if (typeof buffer === 'string') {
    return sql.binary(BufferSchema.parse(buffer));
  }
  return sql.binary(buffer);
}
