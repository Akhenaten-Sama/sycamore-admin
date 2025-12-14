import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Testimony } from '@/lib/models'

// CORS headers for mobile app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'false',
}

function createCorsResponse(data: any, status: number) {
  return NextResponse.json(data, { status, headers: corsHeaders })
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  })
}

// GET /api/mobile/testimonies - Get all approved testimonies for mobile app
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const userId = searchParams.get('userId')
    
    const skip = (page - 1) * limit
    
    let query: any = { isApproved: true }
    
    // If userId is provided, also include their pending testimonies
    if (userId) {
      query = {
        $or: [
          { isApproved: true },
          { submittedBy: userId, isApproved: false }
        ]
      }
    }

    const testimonies = await Testimony.find(query)
      .populate('submittedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Testimony.countDocuments(query)

    return createCorsResponse({
      success: true,
      data: testimonies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, 200)
  } catch (error) {
    console.error('Error fetching testimonies:', error)
    return createCorsResponse({ 
      success: false, 
      error: 'Internal server error' 
    }, 500)
  }
}

// POST /api/mobile/testimonies - Submit a new testimony
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    
    // Validate required fields
    if (!body.title || !body.testimony || !body.submittedBy) {
      return createCorsResponse(
        { success: false, error: 'Title, testimony, and user ID are required' },
        400
      )
    }

    const newTestimony = new Testimony({
      title: body.title,
      testimony: body.testimony,
      category: body.category || 'General',
      submittedBy: body.submittedBy,
      submitterName: body.submitterName,
      submitterEmail: body.submitterEmail,
      isApproved: false, // Requires admin approval by default
      isPublic: body.isPublic !== undefined ? body.isPublic : true
    })

    const savedTestimony = await newTestimony.save()
    
    return createCorsResponse({
      success: true,
      message: 'Testimony submitted successfully! It will be reviewed by our team.',
      data: savedTestimony
    }, 201)
  } catch (error) {
    console.error('Error creating testimony:', error)
    return createCorsResponse({ 
      success: false, 
      error: 'Failed to submit testimony' 
    }, 500)
  }
}
