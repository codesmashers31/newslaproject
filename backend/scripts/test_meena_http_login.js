async function testLogin(identifier, password) {
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: identifier, password, deviceId: 'test-device-123' })
    });
    const data = await res.json();
    console.log(`Login test [Identifier: "${identifier}", Password: "${password}"] -> Status ${res.status}:`, data.name || data.message);
  } catch (err) {
    console.error('Login request failed:', err.message);
  }
}

async function runTests() {
  console.log('--- Testing Meena R Student Logins ---');
  await testLogin('SLA-1006', 'SLA-1006');
  await testLogin('SLA-1006', 'student123');
  await testLogin('9876543215', '9876543215');
  await testLogin('9876543215', 'student123');
  await testLogin('meena@sla.com', 'SLA-1006');
  await testLogin('meena@sla.com', 'student123');
}

runTests();
