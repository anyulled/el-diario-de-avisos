
type NewsType = { id: number; name: string };

async function simulateDbCall(): Promise<NewsType[]> {
  await new Promise((resolve) => setTimeout(resolve, 50)); // 50ms latency
  return [{ id: 1, name: "Type A" }, { id: 2, name: "Type B" }];
}

async function getNewsTypesUncached() {
  return await simulateDbCall();
}

let cachedTypes: NewsType[] | null = null;
async function getNewsTypesCached() {
  if (cachedTypes) return cachedTypes;
  cachedTypes = await simulateDbCall();
  return cachedTypes;
}

async function benchmark() {
  console.log("Starting benchmark...");
  const iterations = 20;

  // Uncached
  const startUncached = performance.now();
  for (let i = 0; i < iterations; i++) {
    await getNewsTypesUncached();
  }
  const endUncached = performance.now();
  const totalUncached = endUncached - startUncached;
  console.log(`Uncached: ${iterations} iterations took ${totalUncached.toFixed(2)}ms`);
  console.log(`Average Uncached: ${(totalUncached / iterations).toFixed(2)}ms`);

  // Cached
  const startCached = performance.now();
  for (let i = 0; i < iterations; i++) {
    await getNewsTypesCached();
  }
  const endCached = performance.now();
  const totalCached = endCached - startCached;
  console.log(`Cached: ${iterations} iterations took ${totalCached.toFixed(2)}ms`);
  console.log(`Average Cached: ${(totalCached / iterations).toFixed(2)}ms`);

  console.log(`Improvement: ${(totalUncached / totalCached).toFixed(1)}x faster`);
}

benchmark();
