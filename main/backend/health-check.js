const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function healthCheck() {
  console.log('🏥 Running API Health Check...\n');
  
  const endpoints = [
    { path: '/health', method: 'GET', name: 'Health Check' },
    { path: '/ping', method: 'GET', name: 'Ping' },
    { path: '/test', method: 'GET', name: 'Database Test' },
    { path: '/books', method: 'GET', name: 'Books API' },
    { path: '/admin/login', method: 'POST', name: 'Admin Login', data: { username: 'admin', password: 'admin123' } }
  ];

  for (const endpoint of endpoints) {
    try {
      const config = {
        method: endpoint.method,
        url: `${BASE_URL}${endpoint.path}`,
        timeout: 5000,
        ...(endpoint.data && { data: endpoint.data })
      };
      
      const response = await axios(config);
      console.log(`✅ ${endpoint.name}: ${response.status}`);
    } catch (error) {
      const status = error.response?.status || 'NO_RESPONSE';
      console.log(`❌ ${endpoint.name}: ${status} - ${error.response?.data?.error || error.message}`);
    }
  }
  
  console.log('\n🏁 Health check complete!');
}

healthCheck().catch(console.error);

