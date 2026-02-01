import { describe, it, expect, vi, afterEach } from 'vitest';
import { getArticlesOnThisDay } from './actions';
import { db } from '@/db';
import { processRtfContent } from '@/lib/rtf-content-converter';

// Mock setup
vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  unstable_cache: <T>(fn: T) => fn,
}));

vi.mock('@/lib/rtf-content-converter', () => ({
  processRtfContent: vi.fn().mockResolvedValue('processed extract'),
}));

interface MockChain {
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  then: (resolve: (value: unknown) => void) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockChain = (returnData: any[]): MockChain => {
  const chain: Partial<MockChain> = {};
  const methods = ['from', 'where', 'limit', 'orderBy'] as const;
  methods.forEach((method) => {
    chain[method] = vi.fn().mockReturnValue(chain);
  });
  chain.then = (resolve: (value: unknown) => void) => {
    resolve(returnData);
    return Promise.resolve();
  };
  return chain as MockChain;
};

describe('getArticlesOnThisDay Optimization', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should use plainText column if available and NOT call processRtfContent', async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValue(createMockChain([{
        id: 1,
        content: Buffer.from('content'),
        plainText: 'Pre-computed text'
    }]));

    const result = await getArticlesOnThisDay(1, 1);

    expect(result[0].extract).toBe('Pre-computed text');
    expect(processRtfContent).not.toHaveBeenCalled();
  });

  it('should fallback to processRtfContent if plainText is null', async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValue(createMockChain([{
        id: 1,
        content: Buffer.from('content'),
        plainText: null
    }]));

    const result = await getArticlesOnThisDay(1, 1);

    expect(result[0].extract).toBe('processed extract');
    expect(processRtfContent).toHaveBeenCalled();
  });

  it('should use empty string from plainText and NOT call processRtfContent', async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValue(createMockChain([{
        id: 1,
        content: Buffer.from('content'),
        plainText: ''
    }]));

    const result = await getArticlesOnThisDay(1, 1);

    expect(result[0].extract).toBe('');
    expect(processRtfContent).not.toHaveBeenCalled();
  });
});
