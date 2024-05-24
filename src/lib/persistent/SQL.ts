import { createSqlTag, type SerializableValue } from 'slonik';
import z from 'zod';
import { BufferSchema } from '../model/base.model';

export const SQL = {
  ...createSqlTag({
    typeAliases: {
      id: z.object({
        id: z.number(),
      }),
      void: z.object({}).strict(),
      any: z.any(),
    },
  }),
  bigint: (bigInt: bigint) => bigInt.toString(10),
  number: (num: number) => num,
  string: (str: string) => str,
  boolean: (bool: boolean) => bool,
  bool: (bool: boolean) => bool,
  buffer: (buffer: string | Buffer) => {
    if (typeof buffer === 'string') {
      return SQL.binary(BufferSchema.parse(buffer));
    }
    return SQL.binary(buffer);
  },
  get nullish() {
    return {
      number: (num: number | null | undefined) => {
        if (num == null) {
          return null;
        }
        return num;
      },
      date: (date: Date | null | undefined) => {
        if (date == null) {
          return null;
        }
        return SQL.date(date);
      },
      timestamp: (date: Date | null | undefined) => {
        if (date == null) {
          return null;
        }
        return SQL.timestamp(date);
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
      jsonb: (json: SerializableValue | null | undefined) => {
        if (json == null) {
          return null;
        }
        return SQL.jsonb(json);
      },
    };
  },
};

function SQL_to_buffer(buffer: string | Buffer | null | undefined) {
  if (buffer == null) {
    return null;
  }
  if (typeof buffer === 'string') {
    return SQL.binary(BufferSchema.parse(buffer));
  }
  return SQL.binary(buffer);
}
