// PDF Export Functionality
document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.getElementById('exportPdfBtn');
    
    exportBtn.addEventListener('click', () => {
      const element = document.getElementById('reportContent');
      
      const options = {
        margin: 10,
        filename: `performance-report-${getFormattedDate()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
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
  
      // Generate PDF
      html2pdf().set(options).from(element).save();
    });
  
    function getFormattedDate() {
      const now = new Date();
      return now.toISOString().split('T')[0];
    }
  });
  