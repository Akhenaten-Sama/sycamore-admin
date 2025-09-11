import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Member } from '@/lib/models'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const { id: memberId } = await params
    console.log('🔍 Checking member ID:', memberId)
    
    // Try to find the member
    const member = await Member.findById(memberId)
    console.log('👤 Member exists:', member ? 'YES' : 'NO')
    
    if (member) {
      console.log('📋 Member details:', {
        id: member._id,
        name: `${member.firstName} ${member.lastName}`,
        email: member.email,
        dateJoined: member.dateJoined
      })
    }
    
    // Also check if it's a valid ObjectId format
    const mongoose = require('mongoose')
    const isValidId = mongoose.Types.ObjectId.isValid(memberId)
    console.log('🆔 Valid ObjectId format:', isValidId)
    
    return NextResponse.json({
      success: true,
      exists: !!member,
      validId: isValidId,
      member: member ? {
        id: member._id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        dateJoined: member.dateJoined
      } : null
    })
    
  } catch (error) {
    console.error('Error checking member:', error)
    return NextResponse.json(
      { message: 'Failed to check member', error: error.message },
      { status: 500 }
    )
  }
}
