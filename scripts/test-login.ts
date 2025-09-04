import bcrypt from 'bcryptjs'
import connectDB from '../src/lib/mongodb'
import { User } from '../src/lib/models'

async function testLogin() {
  try {
    await connectDB()
    
    console.log('🔍 Testing login credentials...')
    
    // Test password hashing
    const testPassword = 'admin123'
    const hashedPassword = await bcrypt.hash(testPassword, 12)
    console.log('Test hash:', hashedPassword)
    
    const isValid = await bcrypt.compare(testPassword, hashedPassword)
    console.log('Hash comparison test:', isValid ? '✅ PASS' : '❌ FAIL')
    
    // Check actual users in database
    const users = await User.find({}).select('email password role')
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.email}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Password hash: ${user.password}`)
      
      // Test password comparison
      const passwordTest = await bcrypt.compare('admin123', user.password)
      console.log(`   Password test: ${passwordTest ? '✅ PASS' : '❌ FAIL'}`)
      
      // Test different variations
      const variations = ['admin123', 'Admin123', 'ADMIN123']
      for (const variation of variations) {
        const test = await bcrypt.compare(variation, user.password)
        if (test) {
          console.log(`   ✅ PASSWORD WORKS: "${variation}"`)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
  } finally {
    process.exit(0)
  }
}

testLogin()
