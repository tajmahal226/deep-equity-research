// Debug script to see what the actual SSE response looks like
async function debugResponse() {
  console.log('🔍 Debugging SSE Response...\n');
  
  const payload = {
    query: "What are the current trends in AI stocks?",
    provider: "openai",
    thinkingModel: "gpt-4o",
    taskModel: "gpt-4o", 
    searchProvider: "tavily",
    language: "en",
    maxResult: 5,
    temperature: 0.7
  };

  try {
    const response = await fetch('http://localhost:3001/api/sse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000)
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);
    console.log(`Response Headers:`);
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`\nError Response: ${errorText}`);
      return;
    }

    console.log(`\nReading response stream...`);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let chunkCount = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log(`\nStream ended. Total chunks: ${chunkCount}`);
          break;
        }
        
        chunkCount++;
        const chunk = decoder.decode(value);
        console.log(`\nChunk ${chunkCount}:`);
        console.log(`Raw: ${JSON.stringify(chunk.slice(0, 200))}`);
        console.log(`Decoded: ${chunk.slice(0, 200)}${chunk.length > 200 ? '...' : ''}`);
        
        if (chunkCount >= 5) {
          console.log(`\nStopping after 5 chunks...`);
          break;
        }
      }
    } finally {
      reader.releaseLock();
    }

  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

debugResponse();