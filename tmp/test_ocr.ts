import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function testOCR() {
  console.log('Testing OCR...');
  const imagePath = 'd:/Mokith/Project/Healthcare_Chatbot/backend/uploads/bg_dummy.png'; // Need a real image or dummy
  
  // Create a dummy image if not exists for testing syntax/loading
  if (!fs.existsSync(imagePath)) {
    console.log('Creating dummy image for structural test...');
     // Just a tiny 1x1 black png
    const dummyBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(imagePath, dummyBuffer);
  }

  const buffer = fs.readFileSync(imagePath);
  
  try {
    const processedBuffer = await sharp(buffer)
      .grayscale()
      .normalize()
      .sharpen()
      .toBuffer();

    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(processedBuffer);
    console.log('Extracted Text:', text);
    await worker.terminate();
    console.log('OCR Test DONE');
  } catch (err) {
    console.error('OCR Test FAILED:', err);
  }
}

testOCR();
