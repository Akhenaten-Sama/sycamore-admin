import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Member, User } from '@/lib/models'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { action, userId, memberId } = await request.json()
    
    console.log('🔧 Repair action:', action, { userId, memberId })
    
    if (action === 'link-user-member' && userId && memberId) {
      // Link existing user to existing member
      const user = await User.findById(userId)
      const member = await Member.findById(memberId)
      
      if (!user) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        )
      }
      
      if (!member) {
        return NextResponse.json(
          { message: 'Member not found' },
          { status: 404 }
        )
      }
      
      // Update the links
      user.memberId = memberId
      member.userId = userId
      
      await user.save()
      await member.save()
      
      console.log('✅ Successfully linked user and member')
      
      return NextResponse.json({
        success: true,
        message: 'User and member successfully linked',
        data: {
          userId: user._id,
          memberId: member._id
        }
      })
    }
    
    if (action === 'create-member-for-user' && userId) {
      // Create a member for an existing user
      const user = await User.findById(userId)
      
      if (!user) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        )
      }
      
      // Create member record
      const member = new Member({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: '',  // Default empty
        dateJoined: new Date(),
        isFirstTimer: true,
        isTeamLead: false,
        isAdmin: false,
        maritalStatus: 'single',
        communityIds: [],
        attendanceStreak: 0,
        totalAttendance: 0,
        totalGiving: 0,
        lastActivityDate: new Date(),
        userId: user._id
      })
      
      const savedMember = await member.save()
      
      // Update user with member reference
      user.memberId = savedMember._id as any
      await user.save()
      
      console.log('✅ Created member for user')
      
      return NextResponse.json({
        success: true,
        message: 'Member created for user',
        data: {
          userId: user._id,
          memberId: savedMember._id
        }
      })
    }
    
    if (action === 'fix-all-broken-links') {
      // Find all users without valid member links and fix them
      const users = await User.find({}).populate('memberId')
      const fixes = []
      
      for (const user of users) {
        if (!user.memberId) {
          // Try to find a member with the same email
          const member = await Member.findOne({ email: user.email })
          
          if (member) {
            // Link them
            user.memberId = member._id as any
            member.userId = user._id as any
            
            await user.save()
            await member.save()
            
            fixes.push({
              type: 'linked-existing',
              userId: user._id,
              memberId: member._id,
              email: user.email
            })
          } else {
            // Create a new member
            const newMember = new Member({
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: '',
              dateJoined: new Date(),
              isFirstTimer: true,
              isTeamLead: false,
              isAdmin: false,
              maritalStatus: 'single',
              communityIds: [],
              attendanceStreak: 0,
              totalAttendance: 0,
              totalGiving: 0,
              lastActivityDate: new Date(),
              userId: user._id
            })
            
            const savedMember = await newMember.save()
            
            user.memberId = savedMember._id as any
            await user.save()
            
            fixes.push({
              type: 'created-new',
              userId: user._id,
              memberId: savedMember._id,
              email: user.email
            })
          }
        }
      }
      
      console.log(`✅ Fixed ${fixes.length} broken user-member links`)
      
      return NextResponse.json({
        success: true,
        message: `Fixed ${fixes.length} broken links`,
        data: { fixes }
      })
    }
    
    return NextResponse.json(
      { message: 'Invalid action. Use: link-user-member, create-member-for-user, or fix-all-broken-links' },
      { status: 400 }
    )
    
  } catch (error: any) {
    console.error('Repair error:', error)
    return NextResponse.json(
      { message: 'Repair failed', error: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
