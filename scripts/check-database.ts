import connectDB from '../src/lib/mongodb'
import { User } from '../src/lib/models'

async function checkDatabase() {
  try {
    await connectDB()
    
    console.log('🔍 Checking database for users...')
    
    // Check all users
    const users = await User.find({}).select('email role isActive')
    console.log('👥 Total users found:', users.length)
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.role}) - Active: ${user.isActive}`)
    })
    
    // Specifically look for admin user
    const adminUser = await User.findOne({ email: 'admin@church.org' })
    console.log('\n🔍 Searching for admin@church.org:')
    console.log('Found:', adminUser ? 'YES' : 'NO')
    
    if (adminUser) {
      console.log('Email:', adminUser.email)
      console.log('Role:', adminUser.role)
      console.log('Active:', adminUser.isActive)
      console.log('Password hash:', adminUser.password)
    }
    
    // Test case sensitivity
    const adminUserLower = await User.findOne({ email: 'admin@church.org'.toLowerCase() })
    console.log('\n🔍 Searching with toLowerCase():')
    console.log('Found:', adminUserLower ? 'YES' : 'NO')
    
  } catch (error) {
    console.error('❌ Database check error:', error)
  } finally {
    process.exit(0)
  }
}

checkDatabase()
