import { hexToBuffer } from './utils';
import { DriverTypeParser } from 'slonik';


const byteaParser = (value: string) => {
  return hexToBuffer(value);
};

export const createByteaTypeParser = (): DriverTypeParser => {
  return {
    name: 'bytea',
    parse: byteaParser,
  };
};
