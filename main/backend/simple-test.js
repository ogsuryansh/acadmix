const axios = require('axios');

async function testAPI() {
  try {
    console.log('🔍 Testing API directly...');
    
    // Test with explicit headers
    const response = await axios.get('https://api.acadmix.shop/api/health', {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    console.log('✅ Success:', response.status);
    console.log('📄 Data:', response.data);
  } catch (error) {
    console.log('❌ Error:', error.response?.status || error.code);
    console.log('📄 Error Data:', error.response?.data);
    console.log('🔍 Full Error:', error.message);
  }
}

testAPI();


