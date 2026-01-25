
type NewsType = { id: number; name: string };

/**
 * Simulates a database call with latency.
 */
async function simulateDbCall(): Promise<NewsType[]> {
  // 50ms latency
  await new Promise((resolve) => setTimeout(resolve, 50));
  return [{ id: 1, name: "Type A" }, { id: 2, name: "Type B" }];
}

async function getNewsTypesUncached() {
  return await simulateDbCall();
}

const cachedTypesContainer: { data: NewsType[] | null } = { data: null };
async function getNewsTypesCached() {
  if (cachedTypesContainer.data) return cachedTypesContainer.data;
  cachedTypesContainer.data = await simulateDbCall();
  return cachedTypesContainer.data;
}

async function benchmark() {
  console.log("Starting benchmark...");
  const iterations = 20;

  // Uncached
  const startUncached = performance.now();

  /**
   * Helper to run promises sequentially without mutable loop variables.
   */
  const runSequentially = async (fn: () => Promise<unknown>, times: number) => {
    if (times <= 0) return;
    await fn();
    await runSequentially(fn, times - 1);
  };

  await runSequentially(getNewsTypesUncached, iterations);

  const endUncached = performance.now();
  const totalUncached = endUncached - startUncached;
  console.log(`Uncached: ${iterations} iterations took ${totalUncached.toFixed(2)}ms`);
  console.log(`Average Uncached: ${(totalUncached / iterations).toFixed(2)}ms`);

  // Cached
  const startCached = performance.now();
  await runSequentially(getNewsTypesCached, iterations);
  const endCached = performance.now();
  const totalCached = endCached - startCached;
  console.log(`Cached: ${iterations} iterations took ${totalCached.toFixed(2)}ms`);
  console.log(`Average Cached: ${(totalCached / iterations).toFixed(2)}ms`);

  console.log(`Improvement: ${(totalUncached / totalCached).toFixed(1)}x faster`);
}

benchmark();
