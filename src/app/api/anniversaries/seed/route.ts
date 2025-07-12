import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Anniversary, Member } from '@/lib/models'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Get all members first
    const members = await Member.find({})
    
    if (members.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No members found. Please add members first.' },
        { status: 400 }
      )
    }

    let created = 0
    
    // Create sample anniversary data for testing
    const sampleAnniversaries = [
      {
        memberId: members[0]._id,
        type: 'birthday',
        date: new Date('1990-03-15'),
        recurring: true,
        notes: `Birthday for ${members[0].firstName} ${members[0].lastName}`
      },
      {
        memberId: members[0]._id,
        type: 'wedding',
        date: new Date('2015-06-20'),
        recurring: true,
        notes: `Wedding anniversary for ${members[0].firstName} ${members[0].lastName}`
      }
    ]

    // Add more test data if we have more members
    if (members.length > 1) {
      sampleAnniversaries.push({
        memberId: members[1]._id,
        type: 'birthday',
        date: new Date('1985-08-25'),
        recurring: true,
        notes: `Birthday for ${members[1].firstName} ${members[1].lastName}`
      })
    }

    if (members.length > 2) {
      sampleAnniversaries.push({
        memberId: members[2]._id,
        type: 'birthday',
        date: new Date('1992-12-10'),
        recurring: true,
        notes: `Birthday for ${members[2].firstName} ${members[2].lastName}`
      })
    }

    // Check if anniversaries already exist and create only if they don't
    for (const anniversaryData of sampleAnniversaries) {
      const existingAnniversary = await Anniversary.findOne({
        memberId: anniversaryData.memberId,
        type: anniversaryData.type
      })
      
      if (!existingAnniversary) {
        const newAnniversary = new Anniversary(anniversaryData)
        await newAnniversary.save()
        created++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${created} test anniversary records`,
      data: { created }
    })
  } catch (error) {
    console.error('Error creating test anniversaries:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create test anniversaries' },
      { status: 500 }
    )
  }
}
