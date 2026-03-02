const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFService {
  generateCertificate(userName, courseName, date) {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
    const filePath = path.join(__dirname, '../uploads/certificates', `cert_${Date.now()}.pdf`);
    doc.pipe(fs.createWriteStream(filePath));

    // Design certificate
    doc.font('Helvetica-Bold').fontSize(40).text('Certificate of Completion', { align: 'center' });
    doc.moveDown();
    doc.fontSize(30).text(`This certifies that ${userName}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(25).text(`has successfully completed the course:`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(35).text(courseName, { align: 'center', underline: true });
    doc.moveDown();
    doc.fontSize(20).text(`Date: ${date}`, { align: 'center' });

    doc.end();
    return filePath;
  }

  async generateInvoice(order) {
    // Implementation for invoice generation
  }
}
module.exports = new PDFService();
