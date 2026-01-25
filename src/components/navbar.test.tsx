import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Navbar } from './navbar';
import * as actions from '@/app/actions';

// Mock the actions
vi.mock('@/app/actions', () => ({
  getEssays: vi.fn(),
}));

// Mock next/cache with a simple in-memory cache implementation
vi.mock('next/cache', () => {
  const cache = new Map<string, unknown>();
  return {
    unstable_cache: <T,>(fn: () => Promise<T>, keyParts: string[]) => {
      // Return a wrapped function that caches the result
      return async (): Promise<T> => {
        const key = keyParts.join('-');
        if (cache.has(key)) {
          return cache.get(key) as T;
        }
        const result = await fn();
        cache.set(key, result);
        return result;
      };
    },
  };
});

describe('Navbar Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    /**
     * Specific cache clearing is not possible with this mock structure,
     * but since we only have one test or can rely on fresh module per file (sometimes),
     * we'll rely on the logic that it SHOULD cache.
     */
  });

  it('calls getEssays only once due to caching', async () => {
    const getEssaysMock = vi.mocked(actions.getEssays);
    getEssaysMock.mockResolvedValue([{ id: 1, title: 'Test Essay' }]);

    // First Call
    await Navbar();
    expect(getEssaysMock).toHaveBeenCalledTimes(1);

    // Second Call - should use cache
    await Navbar();
    expect(getEssaysMock).toHaveBeenCalledTimes(1);

    // Third Call - should use cache
    await Navbar();
    expect(getEssaysMock).toHaveBeenCalledTimes(1);
  });
});
