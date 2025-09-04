import bcrypt from 'bcryptjs'
import connectDB from '../src/lib/mongodb'
import { User } from '../src/lib/models'

async function testSpecificLogin() {
  try {
    await connectDB()
    
    console.log('🔍 Testing specific login scenarios...')
    
    // Test credentials we know should work
    const testCases = [
      { email: 'superadmin@church.org', password: 'admin123' },
      { email: 'admin@church.org', password: 'admin123' },
      { email: 'leader@church.org', password: 'leader123' }
    ]
    
    for (const testCase of testCases) {
      console.log(`\n👤 Testing: ${testCase.email}`)
      
      // Find user exactly like the API does
      const user = await User.findOne({ email: testCase.email.toLowerCase() })
      
      if (!user) {
        console.log('❌ User not found')
        continue
      }
      
      console.log('✅ User found:', user.email)
      console.log('🔐 Stored hash:', user.password)
      console.log('📝 Active:', user.isActive)
      console.log('🔒 Locked:', user.lockoutUntil ? 'YES' : 'NO')
      console.log('🔢 Login attempts:', user.loginAttempts)
      
      // Test password exactly like the API does
      const isValid = await bcrypt.compare(testCase.password, user.password)
      console.log('🔐 Password valid:', isValid ? '✅ YES' : '❌ NO')
      
      if (!isValid) {
        // Test if there might be whitespace issues
        const trimmedPassword = testCase.password.trim()
        const isValidTrimmed = await bcrypt.compare(trimmedPassword, user.password)
        console.log('🔐 Trimmed password valid:', isValidTrimmed ? '✅ YES' : '❌ NO')
        
        // Test different variations
        const variations = [testCase.password.toLowerCase(), testCase.password.toUpperCase()]
        for (const variation of variations) {
          const testVariation = await bcrypt.compare(variation, user.password)
          if (testVariation) {
            console.log(`✅ WORKING PASSWORD: "${variation}"`)
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
  } finally {
    process.exit(0)
  }
}

testSpecificLogin()
