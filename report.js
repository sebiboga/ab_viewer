async function parseResults(resultsUrl) {
    try {
      const response = await fetch(resultsUrl);
      const text = await response.text();
      const lines = text.split('\n');
  
      const parsedData = {
        startTime: extractValue(lines, 'Test started at:'),
        duration: extractValue(lines, 'Run time (sec):'),
        concurrency: extractValue(lines, 'Workload (concurrency):'),
        targetUrl: extractTargetUrl(lines),
        serverSoftware: extractValue(lines, 'Server Software:'),
        completeRequests: extractValue(lines, 'Complete requests:'),
        failedRequests: extractValue(lines, 'Failed requests:'),
        totalTransferred: extractValue(lines, 'Total transferred:'),
        htmlTransferred: extractValue(lines, 'HTML transferred:'),
        rps: extractValue(lines, 'Requests per second:'),
        timePerRequest: extractValue(lines, 'Time per request:'),
        timePerRequestConcurrent: extractValue(lines, 'Time per request:.*concurrent', true),
        transferRate: extractValue(lines, 'Transfer rate:'),
        connectionTimes: {
          min: extractConnectionTime(lines, 'min'),
          mean: extractConnectionTime(lines, 'mean'),
          median: extractConnectionTime(lines, 'median'),
          max: extractConnectionTime(lines, 'max')
        },
        percentiles: extractPercentiles(lines)
      };
  
      return parsedData;
    } catch (error) {
      console.error('Error parsing results:', error);
      document.getElementById('loading').textContent = 'Error loading results file';
      return null;
    }
  }
  
  // Helper functions for parsing
  function extractValue(lines, pattern, isSecondOccurrence = false) {
      for (const line of lines) {
          if (line.includes(pattern)) {
              return line.split(':')[1].trim();
          }
      }
      return null;
  }
  
  function extractTargetUrl(lines) {
      for (const line of lines) {
          if (line.includes('Target URL:')) {
              return line.split(':')[1].trim();
          }
      }
      return null;
  }
  
  function extractConnectionTime(lines, type) {
    const connectionTimesIndex = lines.findIndex(line => line.includes('Connection Times (ms)'));
      if (connectionTimesIndex === -1) return null;
  
      const headerLineIndex = lines.slice(connectionTimesIndex).findIndex(line => line.includes('min')) + connectionTimesIndex;
      if (headerLineIndex === -1 || headerLineIndex === connectionTimesIndex) return null;
  
      const dataLineIndex = headerLineIndex + 1;
      if (dataLineIndex >= lines.length) return null;
  
      const dataLine = lines[dataLineIndex];
      const values = dataLine.trim().split(/\s+/);
  
      const typeIndexMap = {
          'min': 0,
          'mean': 1,
          'median': 2,
          'max': 3
      };
  
      if (!typeIndexMap.hasOwnProperty(type)) return null;
      const index = typeIndexMap[type];
  
      if (values.length <= index) return null;
      return parseFloat(values[index]);
  }
  
  function extractPercentiles(lines) {
    const startIndex = lines.findIndex(line => line.includes('Percentage of the requests'));
      if (startIndex === -1) return {};
  
      const percentiles = {};
      for (let i = startIndex + 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line === '') break;
  
          const match = line.match(/(\d+)%\s+(\d+)/);
          if (match) {
              const percentile = match[1] + '%';
              const value = parseInt(match[2]);
              percentiles[percentile] = value;
          }
      }
      return percentiles;
  }
  
  function parseNumber(value) {
    if (value.includes('#')) value = value.replace('#', '');
    if (value.includes('[')) value = value.split('[')[0];
    return parseFloat(value);
  }
  
  // Generate the report
  async function generateReport(testData) {
    if (!testData) return;
  
    document.getElementById('currentDate').textContent = new Date().toISOString();
    document.getElementById('targetUrl').textContent = testData.targetUrl;
    document.getElementById('startTime').textContent = testData.startTime;
    document.getElementById('duration').textContent = testData.duration + ' seconds';
    document.getElementById('concurrency').textContent = testData.concurrency;
    document.getElementById('throughput').innerHTML = `${testData.rps} <small>req/sec</small>`;
    document.getElementById('responseTime').innerHTML = `${testData.timePerRequest} <small>ms</small>`;
  
    const completeRequests = parseInt(testData.completeRequests.replace(/,/g, ''));
    const failedRequests = parseInt(testData.failedRequests.replace(/,/g, ''));
    const successRate = ((completeRequests / (completeRequests + failedRequests)) * 100).toFixed(2);
  
    document.getElementById('successRate').innerHTML = `${successRate}% <small>(${completeRequests}/${completeRequests + failedRequests})</small>`;
    document.getElementById('dataTransferred').innerHTML = `${(parseInt(testData.totalTransferred) / 1024 / 1024).toFixed(2)} <small>MB</small>`;
  
    document.getElementById('connMin').textContent = testData.connectionTimes.min;
    document.getElementById('connMean').textContent = testData.connectionTimes.mean;
    document.getElementById('connMedian').textContent = testData.connectionTimes.median;
    document.getElementById('connMax').textContent = testData.connectionTimes.max;
  
    // Populate percentile table
    const percentileTable = document.getElementById('percentileTable');
    Object.entries(testData.percentiles).forEach(([key, value]) => {
      const row = document.createElement('tr');
      row.innerHTML = `<th>${key}</th><td>${value} ms</td>`;
      percentileTable.appendChild(row);
    });
  
    // Show content and hide loader
    document.getElementById('loading').style.display = 'none';
    document.getElementById('reportContent').style.display = 'block';
  
    // Percentile Chart
    const ctx = document.getElementById('percentileChart').getContext('2d');
    const labels = Object.keys(testData.percentiles);
    const data = Object.values(testData.percentiles);
  
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Response Time (ms)',
          data: data,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
          fill: false
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Response Time Percentiles'
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Milliseconds'
            }
          }
        }
      });
  }
  
  async function loadReport() {
    const resultsUrl = document.getElementById('resultsUrl').value;
    document.getElementById('loading').style.display = 'block';
    document.getElementById('reportContent').style.display = 'none';
    const testData = await parseResults(resultsUrl);
    generateReport(testData);
  }
  