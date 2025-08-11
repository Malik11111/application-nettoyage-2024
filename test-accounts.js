const axios = require('axios');

const BASE_URL = 'http://localhost:5002/api';

const ACCOUNTS = [
  { email: 'admin@cleaning.com', password: '123456', expected_role: 'SUPER_ADMIN', name: 'SUPER_ADMIN' },
  { email: 'admin1@etablissement.com', password: '123456', expected_role: 'ADMIN', name: 'ADMIN 1' },
  { email: 'admin2@etablissement.com', password: '123456', expected_role: 'ADMIN', name: 'ADMIN 2' },
  { email: 'agent1a@etablissement.com', password: '123456', expected_role: 'AGENT', name: 'AGENT 1A' },
  { email: 'agent2a@etablissement.com', password: '123456', expected_role: 'AGENT', name: 'AGENT 2A' },
  { email: 'agent1b@etablissement.com', password: '123456', expected_role: 'AGENT', name: 'AGENT 1B' }
];

async function testAccount(account) {
  try {
    console.log(`\n🧪 Testing ${account.name} (${account.email}):`);
    
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: account.email,
      password: account.password
    });

    if (response.data && response.data.user && response.data.token) {
      const { user, token } = response.data;
      
      if (user.role === account.expected_role) {
        console.log(`  ✅ Login Success - Role: ${user.role}, Organization: ${user.organization.name}`);
        
        // Test API access with token
        try {
          const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log(`  ✅ Token Valid - User: ${meResponse.data.name}`);
          
          // Test dashboard data based on role
          if (user.role === 'AGENT') {
            try {
              const tasksResponse = await axios.get(`${BASE_URL}/tasks?assignedAgentId=${user.id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              console.log(`  ✅ Tasks API Success - ${tasksResponse.data.length} tasks found`);
            } catch (error) {
              console.log(`  ⚠️  Tasks API Error: ${error.response?.data?.message || error.message}`);
            }
          } else {
            try {
              const dashboardResponse = await axios.get(`${BASE_URL}/dashboard/stats`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              console.log(`  ✅ Dashboard API Success - Stats loaded`);
            } catch (error) {
              console.log(`  ⚠️  Dashboard API Error: ${error.response?.data?.message || error.message}`);
            }
          }
          
        } catch (tokenError) {
          console.log(`  ❌ Token Test Failed: ${tokenError.response?.data?.message || tokenError.message}`);
        }
        
      } else {
        console.log(`  ❌ Role Mismatch - Expected: ${account.expected_role}, Got: ${user.role}`);
      }
    } else {
      console.log(`  ❌ Invalid Response Structure`);
    }
    
  } catch (error) {
    console.log(`  ❌ Login Failed: ${error.response?.data?.message || error.message}`);
  }
}

async function testAllAccounts() {
  console.log('🚀 Starting Multi-Tenant Account Tests...\n');
  
  for (const account of ACCOUNTS) {
    await testAccount(account);
  }
  
  console.log('\n✅ Testing Complete!');
}

testAllAccounts();