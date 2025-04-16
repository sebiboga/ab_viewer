// PDF Export Functionality
document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.getElementById('exportPdfBtn');
    
    exportBtn.addEventListener('click', () => {
      // Get report element
      const element = document.getElementById('reportContent');
      
      // PDF Options
      const options = {
        margin: 10,
        filename: `performance-report-${getFormattedDate()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false
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
  
    // Helper function for filename
    function getFormattedDate() {
      const now = new Date();
      return now.toISOString().split('T')[0];
    }
  });
  