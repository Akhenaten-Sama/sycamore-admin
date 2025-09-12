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
      const userDoc = user as any // Cast to any to access MongoDB document properties
      const userInfo: any = {
        userId: userDoc._id.toString(),
        email: userDoc.email,
        hasPopulatedMember: !!userDoc.memberId,
        memberIdFromUser: userDoc.memberId?.toString(),
        memberDetails: null,
        backLinkCheck: null
      }
      
      // If user has a memberId, get member details
      if (userDoc.memberId) {
        const member = userDoc.memberId as any
        userInfo.memberDetails = {
          memberId: member._id.toString(),
          name: `${member.firstName} ${member.lastName}`,
          email: member.email,
          userId: member.userId?.toString()
        }
        
        // Check back-link from member to user
        userInfo.backLinkCheck = {
          memberUserIdMatches: member.userId?.toString() === userDoc._id.toString(),
          memberUserId: member.userId?.toString(),
          actualUserId: userDoc._id.toString()
        }
      }
      
      results.push(userInfo)
    }
    
    // Also check orphaned members (members without users)
    const allMembers = await Member.find({}).limit(5).sort({ createdAt: -1 })
    const membersWithoutUsers = []
    
    for (const member of allMembers) {
      const memberDoc = member as any // Cast to any to access MongoDB document properties
      if (!memberDoc.userId) {
        membersWithoutUsers.push({
          memberId: memberDoc._id.toString(),
          name: `${memberDoc.firstName} ${memberDoc.lastName}`,
          email: memberDoc.email,
          hasUserId: false
        })
      } else {
        // Check if the referenced user actually exists
        const userExists = await User.findById(memberDoc.userId)
        if (!userExists) {
          membersWithoutUsers.push({
            memberId: memberDoc._id.toString(),
            name: `${memberDoc.firstName} ${memberDoc.lastName}`,
            email: memberDoc.email,
            hasUserId: true,
            userExists: false,
            referencedUserId: memberDoc.userId.toString()
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
