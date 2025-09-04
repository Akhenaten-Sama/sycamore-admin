import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { UserActivity } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const activityType = searchParams.get('activityType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = searchParams.get('limit')

    const query: any = {}

    if (userId) {
      query.userId = userId
    }

    if (activityType) {
      query.activityType = activityType
    }

    if (startDate || endDate) {
      query.timestamp = {}
      if (startDate) query.timestamp.$gte = new Date(startDate)
      if (endDate) query.timestamp.$lte = new Date(endDate)
    }

    let queryBuilder = UserActivity.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ timestamp: -1 })

    if (limit) {
      queryBuilder = queryBuilder.limit(parseInt(limit))
    }

    const activities = await queryBuilder

    return NextResponse.json({
      success: true,
      data: activities,
      total: activities.length
    })
  } catch (error) {
    console.error('Error fetching user activities:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user activities' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    
    // Validate required fields
    if (!body.userId || !body.activityType || !body.description) {
      return NextResponse.json(
        { success: false, error: 'User ID, activity type, and description are required' },
        { status: 400 }
      )
    }

    const newActivity = new UserActivity({
      userId: body.userId,
      activityType: body.activityType,
      description: body.description,
      metadata: body.metadata,
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date()
    })

    const savedActivity = await newActivity.save()
    
    // Populate the saved activity
    const populatedActivity = await UserActivity.findById(savedActivity._id)
      .populate('userId', 'firstName lastName email')

    return NextResponse.json({
      success: true,
      data: populatedActivity,
      message: 'User activity logged successfully'
    })
  } catch (error) {
    console.error('Error logging user activity:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to log user activity' },
      { status: 500 }
    )
  }
}
