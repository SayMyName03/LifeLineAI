import fetch from 'node-fetch';

async function testHospitalLogin() {
  try {
    console.log('Testing hospital login...');
    
    const response = await fetch('http://localhost:5001/auth/hospital-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        hospitalName: 'Apollo Hospital Sheshadripuram', 
        password: '12345' 
      }),
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success! Response data:', JSON.stringify(data, null, 2));
    } else {
      const errorData = await response.text();
      console.log('Error response:', errorData);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

testHospitalLogin();
