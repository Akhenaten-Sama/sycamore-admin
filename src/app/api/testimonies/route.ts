import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Testimony } from '@/lib/models'

// GET /api/testimonies - Get all testimonies (admin)
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') // 'approved', 'pending', 'all'
    
    const skip = (page - 1) * limit
    
    let query: any = {}
    
    if (status === 'approved') {
      query.isApproved = true
    } else if (status === 'pending') {
      query.isApproved = false
    }
    // 'all' means no filter on isApproved

    const testimonies = await Testimony.find(query)
      .populate('submittedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Testimony.countDocuments(query)

    return NextResponse.json({
      success: true,
      data: testimonies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching testimonies:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch testimonies' },
      { status: 500 }
    )
  }
}

// POST /api/testimonies - Create a new testimony (typically for testing)
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    
    // Validate required fields
    if (!body.title || !body.testimony || !body.submittedBy) {
      return NextResponse.json(
        { success: false, error: 'Title, testimony, and submitter ID are required' },
        { status: 400 }
      )
    }

    const newTestimony = new Testimony({
      title: body.title,
      testimony: body.testimony,
      category: body.category || 'General',
      submittedBy: body.submittedBy,
      submitterName: body.submitterName,
      submitterEmail: body.submitterEmail,
      isApproved: body.isApproved !== undefined ? body.isApproved : false,
      isPublic: body.isPublic !== undefined ? body.isPublic : true
    })

    const savedTestimony = await newTestimony.save()
    
    return NextResponse.json({
      success: true,
      message: 'Testimony created successfully',
      data: savedTestimony
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating testimony:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create testimony' 
    }, { status: 500 })
  }
}
