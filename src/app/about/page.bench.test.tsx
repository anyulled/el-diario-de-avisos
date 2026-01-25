import { vi, describe, it, expect } from 'vitest';
import AboutPage from './page';

// Mock the actions with delay
vi.mock('../actions', () => ({
  getIntegrantes: vi.fn(async () => { await new Promise(r => setTimeout(r, 100)); return []; }),
  getTutores: vi.fn(async () => { await new Promise(r => setTimeout(r, 100)); return []; }),
  getDevelopers: vi.fn(async () => { await new Promise(r => setTimeout(r, 100)); return []; }),
}));

// Mock components to avoid rendering issues if any
vi.mock('@/components/member-card', () => ({ MemberCard: () => null }));
vi.mock('@/components/navbar', () => ({ Navbar: () => null }));

describe('AboutPage Performance', () => {
  it('measures execution time', async () => {
    const start = performance.now();
    await AboutPage();
    const end = performance.now();
    const duration = end - start;
    console.log(`Execution time: ${duration}ms`);
    /**
     * Expect parallel execution (approx 100ms)
     * Allowing some buffer for overhead, but definitely less than 300ms
     */
    expect(duration).toBeLessThan(200);
  });
});
