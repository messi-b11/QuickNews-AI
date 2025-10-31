const axios = require('axios');
const fs = require('fs').promises;

// Configuration
const TOTAL_REQUESTS = 100;
const CONCURRENT_REQUESTS = 10;
const API_URL = process.env.API_URL || 'http://localhost:3000/news';
const SEARCH_TERMS = ['AI', 'Technology', 'Science', 'Business', 'Health'];

async function measureLatency(searchTerm) {
  const start = process.hrtime.bigint();
  try {
    await axios.get(`${API_URL}?keyword=${encodeURIComponent(searchTerm)}`);
    const end = process.hrtime.bigint();
    return Number(end - start) / 1e6; // Convert to milliseconds
  } catch (error) {
    console.error(`Request failed for term "${searchTerm}":`, error.message);
    return null;
  }
}

async function runBatch(searchTerm, batchSize) {
  const promises = Array(batchSize).fill().map(() => measureLatency(searchTerm));
  const results = await Promise.all(promises);
  return results.filter(r => r !== null);
}

async function runBenchmark() {
  console.log(`Running search speed benchmark...
Configuration:
- Total requests: ${TOTAL_REQUESTS}
- Concurrent requests: ${CONCURRENT_REQUESTS}
- API URL: ${API_URL}
- Search terms: ${SEARCH_TERMS.join(', ')}
`);

  const results = {
    byTerm: {},
    overall: []
  };

  // Run benchmarks for each search term
  for (const term of SEARCH_TERMS) {
    console.log(`\nTesting search term: "${term}"`);
    const termResults = [];
    
    // Run batches until we hit TOTAL_REQUESTS
    while (termResults.length < TOTAL_REQUESTS) {
      const remaining = TOTAL_REQUESTS - termResults.length;
      const batchSize = Math.min(remaining, CONCURRENT_REQUESTS);
      const batchResults = await runBatch(term, batchSize);
      termResults.push(...batchResults);
      
      process.stdout.write(`Progress: ${termResults.length}/${TOTAL_REQUESTS}\r`);
    }
    
    results.byTerm[term] = termResults;
    results.overall.push(...termResults);
    
    // Calculate stats for this term
    const avg = termResults.reduce((a, b) => a + b, 0) / termResults.length;
    const sorted = [...termResults].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    
    console.log(`\nResults for "${term}":
- Average latency: ${avg.toFixed(2)}ms
- 95th percentile: ${p95.toFixed(2)}ms
- Min: ${sorted[0].toFixed(2)}ms
- Max: ${sorted[sorted.length - 1].toFixed(2)}ms
`);
  }

  // Calculate overall stats
  const overall = results.overall;
  const overallAvg = overall.reduce((a, b) => a + b, 0) / overall.length;
  const sorted = [...overall].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(sorted.length * 0.95)];

  console.log(`\nOverall Results (${overall.length} successful requests):
- Average latency: ${overallAvg.toFixed(2)}ms
- 95th percentile: ${p95.toFixed(2)}ms
- Min: ${sorted[0].toFixed(2)}ms
- Max: ${sorted[sorted.length - 1].toFixed(2)}ms
`);

  // Save detailed results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsPath = `./bench-results-${timestamp}.json`;
  await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\nDetailed results saved to: ${resultsPath}`);
}

// Run the benchmark
runBenchmark().catch(console.error);