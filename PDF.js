document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.getElementById('exportPdfBtn');
    
    exportBtn.addEventListener('click', async () => {
      // Disable animations and update chart
      if (window.myChart) {
        window.myChart.options.animation = false;
        window.myChart.update();
      }
  
      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 200));
  
      const element = document.getElementById('reportContent');
      const options = {
        margin: 10,
        filename: `performance-report-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { 
          scale: 3, // High resolution
          useCORS: true,
          logging: false,
          scrollY: 0
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        }
      };
  
      html2pdf().set(options).from(element).save();
    });
  });
  