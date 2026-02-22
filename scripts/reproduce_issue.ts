// scripts/reproduce_issue.ts

console.log('--- Performance Optimization Simulation ---\n');

// Mock dependencies with delays
async function getArticleSection(columnId: number) {
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate DB latency
  return { id: columnId, name: 'Section Name' };
}

async function processRtfContent(content: string, id: number) {
  await new Promise(resolve => setTimeout(resolve, 150)); // Simulate CPU processing
  return `<p>${content}</p>`;
}

// Current Implementation (Sequential)
async function runSequential() {
  const start = performance.now();

  const article = { columnId: 1, content: 'rtf content', id: 123 };

  // Sequential execution
  const section = article.columnId ? await getArticleSection(article.columnId) : null;
  const rawHtmlContent = await processRtfContent(article.content, article.id);

  const end = performance.now();
  return end - start;
}

// Optimized Implementation (Concurrent)
async function runConcurrent() {
  const start = performance.now();

  const article = { columnId: 1, content: 'rtf content', id: 123 };

  // Concurrent execution
  const [section, rawHtmlContent] = await Promise.all([
    article.columnId ? getArticleSection(article.columnId) : Promise.resolve(null),
    processRtfContent(article.content, article.id)
  ]);

  const end = performance.now();
  return end - start;
}

async function run() {
  console.log('Running sequential implementation...');
  const seqTime = await runSequential();
  console.log(`Sequential execution time: ${seqTime.toFixed(2)}ms\n`);

  console.log('Running concurrent implementation...');
  const concTime = await runConcurrent();
  console.log(`Concurrent execution time: ${concTime.toFixed(2)}ms\n`);

  const improvement = ((seqTime - concTime) / seqTime) * 100;
  console.log(`Performance Improvement: ${improvement.toFixed(2)}% faster`);
  console.log(`Speedup Factor: ${(seqTime / concTime).toFixed(2)}x`);
}

run().catch(console.error);
