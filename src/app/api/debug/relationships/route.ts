import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Member, User } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    console.log('🔍 Testing user-member relationships...')
    
    // Get some recent users and check their member relationships
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('memberId')
    
    const results = []
    
    for (const user of users) {
      const userInfo = {
        userId: user._id.toString(),
        email: user.email,
        hasPopulatedMember: !!user.memberId,
        memberIdFromUser: user.memberId?.toString(),
        memberDetails: null,
        backLinkCheck: null
      }
      
      // If user has a memberId, get member details
      if (user.memberId) {
        const member = user.memberId as any
        userInfo.memberDetails = {
          memberId: member._id.toString(),
          name: `${member.firstName} ${member.lastName}`,
          email: member.email,
          userId: member.userId?.toString()
        }
        
        // Check back-link from member to user
        userInfo.backLinkCheck = {
          memberUserIdMatches: member.userId?.toString() === user._id.toString(),
          memberUserId: member.userId?.toString(),
          actualUserId: user._id.toString()
        }
      }
      
      results.push(userInfo)
    }
    
    // Also check orphaned members (members without users)
    const allMembers = await Member.find({}).limit(5).sort({ createdAt: -1 })
    const membersWithoutUsers = []
    
    for (const member of allMembers) {
      if (!member.userId) {
        membersWithoutUsers.push({
          memberId: member._id.toString(),
          name: `${member.firstName} ${member.lastName}`,
          email: member.email,
          hasUserId: false
        })
      } else {
        // Check if the referenced user actually exists
        const userExists = await User.findById(member.userId)
        if (!userExists) {
          membersWithoutUsers.push({
            memberId: member._id.toString(),
            name: `${member.firstName} ${member.lastName}`,
            email: member.email,
            hasUserId: true,
            userExists: false,
            referencedUserId: member.userId.toString()
          })
        }
      }
    }
    
    console.log('📊 Relationship test results:', {
      usersChecked: results.length,
      orphanedMembers: membersWithoutUsers.length
    })
    
    return NextResponse.json({
      success: true,
      data: {
        userMemberRelationships: results,
        orphanedMembers: membersWithoutUsers,
        summary: {
          totalUsersChecked: results.length,
          usersWithMembers: results.filter(u => u.hasPopulatedMember).length,
          usersWithoutMembers: results.filter(u => !u.hasPopulatedMember).length,
          orphanedMembersCount: membersWithoutUsers.length
        }
      }
    })
    
  } catch (error: any) {
    console.error('Relationship test error:', error)
    return NextResponse.json(
      { message: 'Test failed', error: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
