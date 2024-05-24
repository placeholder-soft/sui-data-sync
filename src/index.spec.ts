import { main } from './index';

describe('main test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });

  it.skip('should run main', async () => {
    await main();
  });
});
