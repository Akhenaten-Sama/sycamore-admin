import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Member } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Get all members for testing
    const members = await Member.find({}).limit(10).select('_id firstName lastName email')
    
    return NextResponse.json({
      success: true,
      count: members.length,
      members: members.map(member => ({
        id: member._id,
        name: `${member.firstName} ${member.lastName}`,
        email: member.email
      }))
    })
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { message: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}
