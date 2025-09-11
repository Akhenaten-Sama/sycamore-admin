import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Member, User } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    console.log('🔍 DEBUG: Checking database status...')
    
    // Count documents
    const memberCount = await Member.countDocuments()
    const userCount = await User.countDocuments()
    
    console.log(`📊 Total members: ${memberCount}`)
    console.log(`👤 Total users: ${userCount}`)
    
    // Get recent members
    const recentMembers = await Member.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('_id firstName lastName email dateJoined')
    
    // Get recent users with their member connections
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('memberId', 'firstName lastName')
      .select('_id email firstName lastName memberId role')
    
    console.log('📋 Recent members:', recentMembers.map(m => ({
      id: (m._id as any).toString(),
      name: `${m.firstName} ${m.lastName}`,
      email: m.email
    })))
    
    console.log('👥 Recent users:', recentUsers.map(u => ({
      id: (u._id as any).toString(),
      email: u.email,
      memberId: u.memberId?.toString(),
      memberName: u.memberId ? `${(u.memberId as any).firstName} ${(u.memberId as any).lastName}` : 'No member'
    })))
    
    // Check for orphaned users (users without valid member records)
    const orphanedUsers = []
    for (const user of recentUsers) {
      if (user.memberId) {
        const memberExists = await Member.findById(user.memberId)
        if (!memberExists) {
          orphanedUsers.push({
            userId: (user._id as any).toString(),
            email: user.email,
            missingMemberId: user.memberId.toString()
          })
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        memberCount,
        userCount,
        recentMembers: recentMembers.map(m => ({
          id: (m._id as any).toString(),
          name: `${m.firstName} ${m.lastName}`,
          email: m.email,
          dateJoined: m.dateJoined
        })),
        recentUsers: recentUsers.map(u => ({
          id: (u._id as any).toString(),
          email: u.email,
          memberId: u.memberId?.toString(),
          role: u.role
        })),
        orphanedUsers
      }
    })
    
  } catch (error: any) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { message: 'Debug failed', error: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
