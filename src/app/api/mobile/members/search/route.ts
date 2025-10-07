import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { User, Member } from '@/lib/models'
import { getCorsHeaders, corsResponse, handlePreflight } from '@/lib/cors'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function OPTIONS(request: NextRequest) {
  return handlePreflight(request)
}

async function verifyMobileToken(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw new Error('No token provided')
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = await User.findById(decoded.userId).populate('memberId')
    
    if (!user || !user.isActive) {
      throw new Error('Invalid user')
    }
    
    return { user, member: user.memberId }
  } catch (error) {
    throw new Error('Invalid token')
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { user, member } = await verifyMobileToken(request)
    
    if (!member) {
      return corsResponse(
        { message: 'Member profile not found' },
        request,
        404
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query || query.length < 2) {
      return corsResponse({
        success: true,
        data: []
      }, request, 200)
    }

    // Search members by name or email
    const searchRegex = new RegExp(query, 'i')
    const members = await Member.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ['$firstName', ' ', '$lastName'] },
              regex: query,
              options: 'i'
            }
          }
        }
      ],
      isActive: true
    })
    .select('firstName lastName email avatar')
    .limit(20)

    const memberResults = members.map(member => ({
      id: member._id,
      name: `${member.firstName} ${member.lastName}`,
      email: member.email,
      avatar: member.avatar
    }))

    return corsResponse({
      success: true,
      data: memberResults
    }, request, 200)

  } catch (error) {
    console.error('Member search error:', error)
    
    if (error instanceof Error && error.message.includes('token')) {
      return corsResponse(
        { message: error.message },
        request,
        401
      )
    }
    
    return corsResponse(
      { message: 'Failed to search members' },
      request,
      500
    )
  }
}