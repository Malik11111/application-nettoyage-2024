const http = require('http');

// Test Frontend
http.get('http://localhost:3005', (res) => {
  console.log(`✅ Frontend Status: ${res.statusCode}`);
}).on('error', (err) => {
  console.error('❌ Frontend Error:', err.message);
});

// Test Backend API  
const postData = JSON.stringify({
  email: 'admin@cleaning.com',
  password: '123456'
});

const options = {
  hostname: 'localhost',
  port: 5002,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`✅ Backend API Status: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(`✅ Login Test Success - User: ${parsed.user.name} (${parsed.user.role})`);
    } catch (e) {
      console.log('❌ Login Response Parse Error');
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Backend API Error:', err.message);
});

req.write(postData);
req.end();