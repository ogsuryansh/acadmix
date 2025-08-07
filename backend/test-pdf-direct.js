// Using built-in fetch (Node.js 18+)

async function testPDFDirect() {
  const pdfUrl = 'https://res.cloudinary.com/dlk7oahyd/raw/upload/v1754325228/acadmix/pdfs/i71biqtwpypskkqucioz.pdf';
  
  console.log('🔍 Testing PDF access directly...');
  console.log(`🔗 URL: ${pdfUrl}`);
  
  try {
    // Test 1: HEAD request
    console.log('\n📋 Test 1: HEAD request');
    const headResponse = await fetch(pdfUrl, { method: 'HEAD' });
    console.log(`Status: ${headResponse.status} - ${headResponse.statusText}`);
    console.log('Headers:', Object.fromEntries(headResponse.headers.entries()));
    
    // Test 2: GET request
    console.log('\n📋 Test 2: GET request');
    const getResponse = await fetch(pdfUrl);
    console.log(`Status: ${getResponse.status} - ${getResponse.statusText}`);
    console.log('Headers:', Object.fromEntries(getResponse.headers.entries()));
    
    if (getResponse.ok) {
      const arrayBuffer = await getResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log(`✅ PDF content length: ${buffer.length} bytes`);
    } else {
      const text = await getResponse.text();
      console.log(`❌ Error response: ${text.substring(0, 200)}...`);
    }
    
    // Test 3: Try with different URL format (without version)
    console.log('\n📋 Test 3: URL without version');
    const urlWithoutVersion = pdfUrl.replace('/v1754325228/', '/');
    console.log(`🔗 URL: ${urlWithoutVersion}`);
    
    const response3 = await fetch(urlWithoutVersion, { method: 'HEAD' });
    console.log(`Status: ${response3.status} - ${response3.statusText}`);
    
    // Test 4: Try with different URL format (with fl_attachment)
    console.log('\n📋 Test 4: URL with fl_attachment');
    const urlWithAttachment = pdfUrl + '?fl_attachment';
    console.log(`🔗 URL: ${urlWithAttachment}`);
    
    const response4 = await fetch(urlWithAttachment, { method: 'HEAD' });
    console.log(`Status: ${response4.status} - ${response4.statusText}`);
    
  } catch (error) {
    console.error('❌ Error testing PDF:', error.message);
  }
}

testPDFDirect(); 