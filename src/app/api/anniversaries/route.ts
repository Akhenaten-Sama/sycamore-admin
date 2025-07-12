import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Anniversary } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    console.log('Attempting to connect to MongoDB...')
    await connectDB()
    console.log('Connected to MongoDB successfully')
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const upcoming = searchParams.get('upcoming')

    let query: any = {}

    if (type) {
      query.type = type
    }

    if (upcoming === 'true') {
      const now = new Date()
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
      query.date = { $gte: now, $lte: nextMonth }
    }

    console.log('Executing Anniversary.find with query:', query)
    const anniversaries = await Anniversary.find(query)
      .populate('memberId', 'firstName lastName email')
      .sort({ date: 1 })

    console.log(`Found ${anniversaries.length} anniversaries`)
    return NextResponse.json({
      success: true,
      data: anniversaries,
      total: anniversaries.length
    })
  } catch (error) {
    console.error('Detailed error fetching anniversaries:')
    console.error('Error name:', (error as any)?.name)
    console.error('Error message:', (error as any)?.message)
    if ((error as any)?.stack) console.error('Error stack:', (error as any).stack)
    if ((error as any)?.cause) console.error('Error cause:', (error as any).cause)
    
    // Check if it's a MongoDB Atlas IP whitelist issue
    const errorMessage = (error as any)?.message || ''
    if (errorMessage.includes('whitelisted') || errorMessage.includes('IP') || errorMessage.includes('Atlas cluster')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'MongoDB Atlas Connection Issue', 
          details: 'Your IP address needs to be added to the MongoDB Atlas IP whitelist. Please add your IP address in the MongoDB Atlas Network Access settings.',
          instructions: [
            '1. Go to MongoDB Atlas Dashboard',
            '2. Navigate to Network Access',
            '3. Click "Add IP Address"',
            '4. Add your current IP or 0.0.0.0/0 for development'
          ]
        },
        { status: 503 } // Service Unavailable
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch anniversaries', details: (error as any)?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    
    // Validate required fields
    if (!body.memberId || !body.type || !body.date) {
      return NextResponse.json(
        { success: false, error: 'Member ID, type, and date are required' },
        { status: 400 }
      )
    }

    const newAnniversary = new Anniversary({
      memberId: body.memberId,
      type: body.type,
      date: new Date(body.date),
      recurring: body.recurring !== false, // Default to true
      notes: body.notes
    })

    const savedAnniversary = await newAnniversary.save()
    
    // Populate the saved anniversary
    const populatedAnniversary = await Anniversary.findById(savedAnniversary._id)
      .populate('memberId', 'firstName lastName email')

    return NextResponse.json({
      success: true,
      data: populatedAnniversary,
      message: 'Anniversary created successfully'
    })
  } catch (error) {
    console.error('Error creating anniversary:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create anniversary' },
      { status: 500 }
    )
  }
}
