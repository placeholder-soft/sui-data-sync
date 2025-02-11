import { DriverTypeParser } from 'slonik';

const bigintParser = (value: string) => {
  return BigInt(value);
};

// SELECT oid, typarray, typname FROM pg_type

export const createInt8TypeParser = (): DriverTypeParser => {
  return {
    name: 'int8',
    parse: bigintParser,
  };
};

export const createFloat4TypeParser = (): DriverTypeParser => {
  return {
    name: 'float4',
    parse: bigintParser,
  };
};

export const createFloat8TypeParser = (): DriverTypeParser => {
  return {
    name: 'float8',
    parse: bigintParser,
  };
};

export const createIntegerTypeParser = (): DriverTypeParser => {
  return {
    name: 'int4',
    parse: bigintParser,
  };
};
