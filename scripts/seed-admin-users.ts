import bcrypt from 'bcryptjs'
import connectDB from '../src/lib/mongodb'
import { User, Role } from '../src/lib/models'

async function seedAdminUsers() {
  try {
    console.log('🔗 Connecting to MongoDB...')
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'Not found')
    
    await connectDB()
    
    console.log('🌱 Seeding admin users...')

    // Define permissions
    const allPermissions = [
      // Member Management
      'members.view', 'members.create', 'members.edit', 'members.delete',
      // Team Management
      'teams.view', 'teams.create', 'teams.edit', 'teams.delete',
      // Event Management
      'events.view', 'events.create', 'events.edit', 'events.delete',
      // Financial Management
      'giving.view', 'giving.edit', 'reports.financial',
      // Content Management
      'blog.view', 'blog.create', 'blog.edit', 'blog.delete',
      // System Management
      'admin.view', 'admin.create', 'admin.edit', 'admin.delete',
      'settings.manage'
    ]

    const adminPermissions = [
      'members.view', 'members.create', 'members.edit',
      'teams.view', 'teams.create', 'teams.edit',
      'events.view', 'events.create', 'events.edit',
      'giving.view', 'blog.view', 'blog.create', 'blog.edit'
    ]

    const teamLeaderPermissions = [
      'teams.view', 'teams.edit', 'members.view'
    ]

    // Create Super Admin
    const superAdminExists = await User.findOne({ email: 'superadmin@church.org' })
    if (!superAdminExists) {
      const superAdmin = new User({
        email: 'superadmin@church.org',
        password: await bcrypt.hash('admin123', 12),
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        permissions: allPermissions,
        isActive: true,
        loginAttempts: 0
      })
      await superAdmin.save()
      console.log('✅ Super Admin created: superadmin@church.org / admin123')
    } else {
      console.log('ℹ️  Super Admin already exists')
    }

    // Create Admin
    const adminExists = await User.findOne({ email: 'admin@church.org' })
    if (!adminExists) {
      const admin = new User({
        email: 'admin@church.org',
        password: await bcrypt.hash('admin123', 12),
        firstName: 'Church',
        lastName: 'Admin',
        role: 'admin',
        permissions: adminPermissions,
        isActive: true,
        loginAttempts: 0
      })
      await admin.save()
      console.log('✅ Admin created: admin@church.org / admin123')
    } else {
      console.log('ℹ️  Admin already exists')
    }

    // Create Team Leader
    const teamLeaderExists = await User.findOne({ email: 'leader@church.org' })
    if (!teamLeaderExists) {
      const teamLeader = new User({
        email: 'leader@church.org',
        password: await bcrypt.hash('leader123', 12),
        firstName: 'Team',
        lastName: 'Leader',
        role: 'team_leader',
        permissions: teamLeaderPermissions,
        isActive: true,
        loginAttempts: 0,
        teamIds: [] // Will be populated when teams are created
      })
      await teamLeader.save()
      console.log('✅ Team Leader created: leader@church.org / leader123')
    } else {
      console.log('ℹ️  Team Leader already exists')
    }

    console.log('🎉 Admin users seeding completed!')
    console.log('\n📝 Demo Credentials:')
    console.log('Super Admin: superadmin@church.org / admin123')
    console.log('Admin: admin@church.org / admin123')
    console.log('Team Leader: leader@church.org / leader123')

  } catch (error) {
    console.error('❌ Error seeding admin users:', error)
  } finally {
    process.exit(0)
  }
}

// Run the seed function
seedAdminUsers()
