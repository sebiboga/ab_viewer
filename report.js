    // Parse the results file
    async function parseResults() {
        try {
          const response = await fetch('https://sebiboga.github.io/ab/results.txt');
          const text = await response.text();
          const lines = text.split('\n');
          
          const parsedData = {
            startTime: text.match(/Test started at::\s*(.+)/)[1].trim(),
            duration: extractValue(lines, 'Run time (sec):'),
            concurrency: extractValue(lines, 'Workload (concurrency):'),
            targetUrl: text.match(/Target URL:\s*(.+)/)[1].trim(),
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
        let found = false;
        for (const line of lines) {
          if (line.includes(pattern)) {
            if (isSecondOccurrence && found) {
              // Return value after last colon or bracket
              const value = line.split(':').pop().trim().split(' ')[0];
              return parseNumber(value);
            } else if (!isSecondOccurrence) {
              const value = line.split(':').pop().trim().split(' ')[0];
              return parseNumber(value);
            }
            found = true;
          }
        }
        return 0;
      }
  
      function extractConnectionTime(lines, type) {
        const line = lines.find(l => l.includes('Connection Times') || l.includes('Total:'));
        if (!line) return 0;
        
        // Find the line with connection times
        const timesLine = lines[lines.indexOf(line) + 2];
        if (!timesLine) return 0;
        
        const parts = timesLine.split(/\s+/).filter(p => p);
        switch(type) {
          case 'min': return parseInt(parts[1]);
          case 'mean': return parseInt(parts[2]);
          case 'median': return parseInt(parts[4]);
          case 'max': return parseInt(parts[5]);
          default: return 0;
        }
      }
  
      function extractPercentiles(lines) {
        const startIndex = lines.findIndex(l => l.includes('Percentage of the requests'));
        if (startIndex === -1) return {};
        
        const percentiles = {};
        for (let i = startIndex + 1; i < lines.length; i++) {
          if (lines[i].trim() === '') break;
          
          const parts = lines[i].split('%').map(p => p.trim());
          if (parts.length === 2) {
            const percentile = parts[0] + '%';
            const value = parts[1].split(' ')[0];
            percentiles[percentile] = parseInt(value);
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
      async function generateReport() {
        const testData = await parseResults();
        if (!testData) return;
      
        document.getElementById('currentDate').textContent = new Date().toISOString();
        document.getElementById('targetUrl').textContent = testData.targetUrl;
        document.getElementById('startTime').textContent = testData.startTime;
        document.getElementById('duration').textContent = testData.duration + ' seconds';
        document.getElementById('concurrency').textContent = testData.concurrency;
        document.getElementById('throughput').innerHTML = `${testData.rps.toFixed(2)} <small>req/sec</small>`;
        document.getElementById('responseTime').innerHTML = `${testData.timePerRequest.toFixed(2)} <small>ms</small>`;
        
        const successRate = ((testData.completeRequests / (testData.completeRequests + testData.failedRequests)) * 100).toFixed(2);
        document.getElementById('successRate').innerHTML = `${successRate}% <small>(${testData.completeRequests}/${testData.completeRequests + testData.failedRequests})</small>`;
        
        document.getElementById('dataTransferred').innerHTML = `${(testData.totalTransferred / 1024 / 1024).toFixed(2)} <small>MB</small>`;
        
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
          }
        });
      }
  
      // Start report generation
      generateReport();
  
