import { DriverTypeParser } from 'slonik';
const numericParser = (value: string) => {
  return BigInt(value);
};

export const createNumericTypeParser = (): DriverTypeParser => {
  return {
    name: 'numeric',
    parse: numericParser,
  };
};
