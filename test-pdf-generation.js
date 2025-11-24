import { generateOrderTicketPDF } from './api/utils/generate-order-ticket-pdf.js';
import fs from 'fs';
import path from 'path';

// Test order data with mixed Japanese characters (Kanji + Hiragana)
const testOrderData = {
  reservationCode: 'AB123',
  order: {
    familyNameKanji: '田中',
    nameKanji: '恵',
    familyNameKatakana: 'タナカ',
    nameKatakana: 'めぐみ',
    phoneNumber: '090-1234-5678',
    email: 'test@example.com',
    deliveryDateTime: new Date('2025-12-25T15:00:00'),
    paymentStatus: 'completed',
    cartItems: [
      {
        cakeType: 'merveilleux',
        cakeSize: '6-8',
        serviceType: 'takein',
        cakeText: 'Happy Birthday!',
        price: 5000,
        quantity: 2,
      },
      {
        cakeType: 'incroyable',
        cakeSize: '4-6',
        serviceType: 'takeout',
        cakeText: '',
        price: 3500,
        quantity: 1,
      },
      {
        cakeType: 'plate',
        serviceType: 'takein',
        cakeText: 'Congratulations',
        price: 1000,
        quantity: 3,
      },
    ],
  },
};

async function testPDFGeneration() {
  try {
    console.log('🧪 Testing PDF generation...');
    console.log('📋 Test order data:', JSON.stringify(testOrderData, null, 2));

    const pdfBuffer = await generateOrderTicketPDF(testOrderData);

    // Save PDF to file for inspection
    const outputPath = path.join(process.cwd(), 'test-order-ticket.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);

    console.log('✅ PDF generated successfully!');
    console.log(`📄 PDF saved to: ${outputPath}`);
    console.log(`📏 PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    console.log('\n👀 Open the PDF to verify all information is included:');
    console.log('   - Reservation code: AB123');
    console.log('   - Customer name (Kanji): 田中 恵');
    console.log('   - Customer name (Katakana/Hiragana mix): タナカ めぐみ');
    console.log('   - Phone: 090-1234-5678');
    console.log('   - Payment status: ✓ PAID');
    console.log('   - Pickup date: Dec 25, 2025, 03:00 PM');
    console.log('   - 3 cake items with checkboxes and details');
    console.log('   - 8 ticket layout (4x2 grid) with cut lines');
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    process.exit(1);
  }
}

testPDFGeneration();
