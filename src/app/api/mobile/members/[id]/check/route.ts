import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Member } from '@/lib/models'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const { id: memberId } = await params
    console.log('🔍 Checking member ID:', memberId)
    
    // Try to find the member
    const member = await Member.findById(memberId)
    console.log('👤 Member exists:', member ? 'YES' : 'NO')
    
    if (member) {
      const memberDoc = member as any
      console.log('📋 Member details:', {
        id: memberDoc._id,
        name: `${memberDoc.firstName} ${memberDoc.lastName}`,
        email: memberDoc.email,
        dateJoined: memberDoc.dateJoined
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
        id: (member as any)._id,
        firstName: (member as any).firstName,
        lastName: (member as any).lastName,
        email: (member as any).email,
        dateJoined: (member as any).dateJoined
      } : null
    })
    
  } catch (error) {
    console.error('Error checking member:', error)
    return NextResponse.json(
      { message: 'Failed to check member', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
