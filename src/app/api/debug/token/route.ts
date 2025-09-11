import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { Member, User } from '@/lib/models'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json(
        { message: 'Token is required' },
        { status: 400 }
      )
    }
    
    console.log('🔍 Analyzing token...')
    
    // Decode token
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any
      console.log('✅ Token valid and decoded:', {
        userId: decoded.userId,
        memberId: decoded.memberId,
        email: decoded.email,
        role: decoded.role
      })
    } catch (error: any) {
      console.log('❌ Token invalid:', error?.message)
      return NextResponse.json({
        success: false,
        error: 'Invalid token',
        details: error?.message
      })
    }
    
    // Check if user exists
    let userExists: any = null
    let memberExists: any = null
    let userMemberLink: any = null
    
    if (decoded.userId) {
      const user = await User.findById(decoded.userId).populate('memberId')
      if (user) {
        userExists = {
          id: (user._id as any).toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          memberId: user.memberId?._id?.toString(),
          hasPopulatedMember: !!user.memberId
        }
        
        // Check if the memberId in token matches the user's actual memberId
        userMemberLink = {
          tokenMemberId: decoded.memberId,
          userMemberId: user.memberId?._id?.toString(),
          matches: decoded.memberId === user.memberId?._id?.toString()
        }
      }
    }
    
    // Check if member exists
    if (decoded.memberId) {
      const member = await Member.findById(decoded.memberId)
      if (member) {
        memberExists = {
          id: (member._id as any).toString(),
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          userId: member.userId?.toString(),
          dateJoined: member.dateJoined
        }
      }
    }
    
    const analysis = {
      tokenValid: true,
      tokenData: {
        userId: decoded.userId,
        memberId: decoded.memberId,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions
      },
      userExists: !!userExists,
      userDetails: userExists,
      memberExists: !!memberExists,
      memberDetails: memberExists,
      userMemberLink,
      issues: [] as string[]
    }
    
    // Identify issues
    if (!userExists) {
      analysis.issues.push('User from token does not exist in database')
    }
    
    if (!memberExists) {
      analysis.issues.push('Member from token does not exist in database')
    }
    
    if (userExists && !userExists.hasPopulatedMember) {
      analysis.issues.push('User exists but has no associated member')
    }
    
    if (userMemberLink && !userMemberLink.matches) {
      analysis.issues.push('Token memberId does not match user\'s actual memberId')
    }
    
    if (userExists && memberExists && memberExists.userId !== userExists.id) {
      analysis.issues.push('Member\'s userId does not point back to the user')
    }
    
    console.log('🔍 Token analysis complete:', {
      userExists: !!userExists,
      memberExists: !!memberExists,
      issuesFound: analysis.issues.length
    })
    
    return NextResponse.json({
      success: true,
      data: analysis
    })
    
  } catch (error: any) {
    console.error('Token analysis error:', error)
    return NextResponse.json(
      { message: 'Analysis failed', error: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
