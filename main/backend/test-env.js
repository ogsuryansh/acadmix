require('dotenv').config();

console.log('🔍 Testing Environment Variables...\n');

const envVars = [
  'MONGO_URI',
  'JWT_SECRET', 
  'ADMIN_USER',
  'ADMIN_PASS',
  'PORT',
  'NODE_ENV',
  'FRONTEND_ORIGIN'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName.includes('SECRET') || varName.includes('PASS') ? '***SET***' : value}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log('\n🔍 Testing Admin Authentication Logic...\n');

const username = 'admin';
const password = 'admin123';
const envUsername = process.env.ADMIN_USER;
const envPassword = process.env.ADMIN_PASS;

console.log(`Username provided: ${username}`);
console.log(`Password provided: ${password}`);
console.log(`ADMIN_USER from env: ${envUsername}`);
console.log(`ADMIN_PASS from env: ${envPassword ? '***SET***' : 'NOT SET'}`);

if (envUsername && envPassword) {
  const isValidAdmin = username === envUsername && password === envPassword;
  console.log(`\n🔍 Authentication check: ${isValidAdmin ? '✅ VALID' : '❌ INVALID'}`);
  
  if (isValidAdmin) {
    console.log('✅ Admin credentials should work!');
  } else {
    console.log('❌ Admin credentials mismatch!');
  }
} else {
  console.log('\n❌ Environment variables not properly set!');
}

console.log('\n🏁 Environment test complete!');

