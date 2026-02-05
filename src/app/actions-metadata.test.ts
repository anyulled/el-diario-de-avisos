import { describe, it, expect, vi, afterEach } from 'vitest';
import { getIntegrantesNames, getTutoresNames, getDevelopersNames } from './actions';
import { db } from '@/db';

vi.mock('next/cache', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unstable_cache: (fn: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return fn;
  },
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

type MockResult = Record<string, unknown>;

interface MockChain {
  from: () => MockChain;
  then: (resolve: (val: MockResult[]) => void) => Promise<void>;
}

// Helper to create a chainable mock
const createMockChain = (result: MockResult[]) => {
  const chain: Partial<MockChain> = {};
  chain.from = vi.fn().mockReturnValue(chain as MockChain);
  chain.then = (resolve) => Promise.resolve(result).then(resolve);
  return chain as MockChain;
};

describe('Metadata Actions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getIntegrantesNames should fetch only firstName and lastName', async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValue(createMockChain([{ firstName: 'John', lastName: 'Doe' }]));

    const result = await getIntegrantesNames();

    expect(mockSelect).toHaveBeenCalledWith(expect.objectContaining({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      firstName: expect.anything(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      lastName: expect.anything(),
    }));

    expect(result).toEqual([{ firstName: 'John', lastName: 'Doe' }]);
  });

  it('getTutoresNames should fetch only names', async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValue(createMockChain([{ names: 'Jane Doe' }]));

    const result = await getTutoresNames();

    expect(mockSelect).toHaveBeenCalledWith(expect.objectContaining({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      names: expect.anything(),
    }));

    expect(result).toEqual([{ names: 'Jane Doe' }]);
  });

  it('getDevelopersNames should fetch only firstName and lastName', async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValue(createMockChain([{ firstName: 'Dev', lastName: 'Eloper' }]));

    const result = await getDevelopersNames();

    expect(mockSelect).toHaveBeenCalledWith(expect.objectContaining({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      firstName: expect.anything(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      lastName: expect.anything(),
    }));

    expect(result).toEqual([{ firstName: 'Dev', lastName: 'Eloper' }]);
  });
});
