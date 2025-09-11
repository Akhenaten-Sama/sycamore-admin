import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Giving } from '@/lib/models'

// CORS headers for mobile app
const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
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

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')
    const category = searchParams.get('category')
    const method = searchParams.get('method')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const isRecurring = searchParams.get('isRecurring')

    const query: any = {}

    if (memberId) {
      query.memberId = memberId
    }

    if (category) {
      query.category = category
    }

    if (method) {
      query.method = method
    }

    if (isRecurring !== null) {
      query.isRecurring = isRecurring === 'true'
    }

    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = new Date(startDate)
      if (endDate) query.date.$lte = new Date(endDate)
    }

    const givings = await Giving.find(query)
      .populate('memberId', 'firstName lastName email')
      .sort({ date: -1 })

    // Calculate totals
    const totalAmount = givings.reduce((sum, giving) => sum + giving.amount, 0)

    return NextResponse.json({
      success: true,
      data: givings,
      total: givings.length,
      totalAmount: totalAmount
    })
  } catch (error) {
    console.error('Error fetching giving records:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch giving records' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    
    // Validate required fields
    if (!body.memberId || !body.amount || !body.method || !body.category) {
      return NextResponse.json(
        { success: false, error: 'Member ID, amount, method, and category are required' },
        { status: 400 }
      )
    }

    if (body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than zero' },
        { status: 400 }
      )
    }

    const newGiving = new Giving({
      memberId: body.memberId,
      amount: body.amount,
      currency: body.currency || 'USD',
      method: body.method,
      category: body.category,
      description: body.description,
      date: body.date ? new Date(body.date) : new Date(),
      isRecurring: body.isRecurring || false,
      recurringFrequency: body.recurringFrequency
    })

    const savedGiving = await newGiving.save()
    
    // Populate the saved giving record
    const populatedGiving = await Giving.findById(savedGiving._id)
      .populate('memberId', 'firstName lastName email')

    return NextResponse.json({
      success: true,
      data: populatedGiving,
      message: 'Giving record created successfully'
    })
  } catch (error) {
    console.error('Error creating giving record:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create giving record' },
      { status: 500 }
    )
  }
}
