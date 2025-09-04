// Simple test to hit the login API directly
const testCredentials = [
  { email: 'superadmin@church.org', password: 'admin123' },
  { email: 'admin@church.org', password: 'admin123' },
  { email: 'leader@church.org', password: 'admin123' }
]

async function testLogin() {
  for (const creds of testCredentials) {
    console.log(`\n🧪 Testing login: ${creds.email}`)
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(creds),
      })

      const data = await response.json()
      
      console.log(`Status: ${response.status}`)
      console.log(`Response:`, data)
      
      if (response.ok) {
        console.log('✅ LOGIN SUCCESS')
      } else {
        console.log('❌ LOGIN FAILED')
      }
    } catch (error) {
      console.error('🚨 Error:', error)
    }
  }
}

testLogin()
