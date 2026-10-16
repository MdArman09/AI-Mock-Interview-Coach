import { PDFParse } from '../server/node_modules/pdf-parse/dist/pdf-parse/esm/index.js';

function createValidPdf(text) {
  const lines = text.split('\n');
  let stream = 'BT /F1 11 Tf 50 750 Td 14 TL ';
  for (const line of lines) {
    const safeLine = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    stream += `(${safeLine}) ' `;
  }
  stream += 'ET';
  const streamBuf = Buffer.from(stream, 'utf8');

  let body = '%PDF-1.4\n';
  const offsets = [];

  function addObj(id, content) {
    offsets.push(Buffer.byteLength(body, 'utf8'));
    body += `${id} 0 obj\n${content}\nendobj\n`;
  }

  addObj(1, '<</Type /Catalog /Pages 2 0 R>>');
  addObj(2, '<</Type /Pages /Kids [3 0 R] /Count 1>>');
  addObj(3, '<</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources <</Font <</F1 5 0 R>>>>>>');
  addObj(4, `<</Length ${streamBuf.length}>>\nstream\n${stream}\nendstream`);
  addObj(5, '<</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>');

  const startxref = Buffer.byteLength(body, 'utf8');
  let xref = `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    xref += String(off).padStart(10, '0') + ' 00000 n \n';
  }
  const trailer = `trailer\n<</Size ${offsets.length + 1} /Root 1 0 R>>\nstartxref\n${startxref}\n%%EOF`;

  return Buffer.from(body + xref + trailer, 'utf8');
}

const sample = `Jordan Smith
Computer Science Student
JavaScript, React, Node.js
Project: Web Calculator`;

const pdfBuffer = createValidPdf(sample);
const parser = new PDFParse({ data: pdfBuffer });
const res = await parser.getText();
console.log('Parsed lines count:', res.text.split('\n').filter(Boolean).length);
console.log('Sample parsed:', res.text.slice(0, 100));
