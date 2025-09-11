import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { Giving, Member, User } from '@/lib/models'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    return jwt.verify(token, JWT_SECRET) as any
  } catch (error) {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const decoded = getUserFromToken(request)
    if (!decoded) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    const memberId = decoded.memberId
    if (!memberId) {
      return NextResponse.json(
        { message: 'Member profile required' },
        { status: 400 }
      )
    }

    const {
      amount,
      category,
      method,
      description,
      isRecurring,
      recurringFrequency
    } = await request.json()

    console.log('💰 Processing donation:', { memberId, amount, category, method })

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { message: 'Valid amount is required' },
        { status: 400 }
      )
    }

    if (!category) {
      return NextResponse.json(
        { message: 'Donation category is required' },
        { status: 400 }
      )
    }

    if (!method) {
      return NextResponse.json(
        { message: 'Payment method is required' },
        { status: 400 }
      )
    }

    // In a real application, you would process the payment with a payment processor
    // For this demo, we'll simulate successful payment processing
    
    const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create the giving record
    const giving = new Giving({
      memberId,
      amount: parseFloat(amount),
      currency: 'USD',
      method,
      category,
      description,
      date: new Date(),
      isRecurring: isRecurring || false,
      recurringFrequency: recurringFrequency || null
    })

    const savedGiving = await giving.save()

    // Update member's total giving
    await Member.findByIdAndUpdate(memberId, {
      $inc: { totalGiving: amount }
    })

    console.log('✅ Donation processed successfully:', savedGiving._id)

    // Simulate different payment outcomes for demo
    const success = Math.random() > 0.1 // 90% success rate
    
    if (!success) {
      // Simulate payment failure
      return NextResponse.json(
        { 
          success: false,
          message: 'Payment processing failed. Please try again.',
          errorCode: 'PAYMENT_DECLINED'
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Donation processed successfully',
      data: {
        donationId: savedGiving._id,
        paymentId,
        amount: savedGiving.amount,
        category: savedGiving.category,
        method: savedGiving.method,
        date: savedGiving.date,
        status: 'completed'
      }
    })

  } catch (error) {
    console.error('Donation processing error:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to process donation. Please try again.',
        errorCode: 'PROCESSING_ERROR'
      },
      { status: 500 }
    )
  }
}

// Get donation/giving statistics and history
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const decoded = getUserFromToken(request)
    if (!decoded) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'history' or 'stats'
    const memberId = decoded.memberId

    if (!memberId) {
      return NextResponse.json(
        { message: 'Member profile required' },
        { status: 400 }
      )
    }

    if (type === 'history') {
      // Get giving history
      const givingHistory = await Giving.find({ memberId })
        .sort({ date: -1 })
        .limit(50)

      return NextResponse.json({
        success: true,
        data: givingHistory.map(giving => ({
          id: giving._id,
          amount: giving.amount,
          category: giving.category,
          method: giving.method,
          description: giving.description,
          date: giving.date,
          isRecurring: giving.isRecurring,
          recurringFrequency: giving.recurringFrequency
        }))
      })
    }

    if (type === 'stats') {
      // Get giving statistics
      const currentYear = new Date().getFullYear()
      const yearStart = new Date(currentYear, 0, 1)
      
      const [totalGiving, yearlyGiving, monthlyStats] = await Promise.all([
        // Total giving all time
        Giving.aggregate([
          { $match: { memberId } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]),
        
        // Yearly giving
        Giving.aggregate([
          { $match: { memberId, date: { $gte: yearStart } } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]),
        
        // Monthly breakdown for current year
        Giving.aggregate([
          { $match: { memberId, date: { $gte: yearStart } } },
          {
            $group: {
              _id: { $month: '$date' },
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id': 1 } }
        ])
      ])

      const stats = {
        totalGiving: totalGiving[0]?.total || 0,
        totalDonations: totalGiving[0]?.count || 0,
        yearlyGiving: yearlyGiving[0]?.total || 0,
        yearlyDonations: yearlyGiving[0]?.count || 0,
        monthlyBreakdown: monthlyStats.map(month => ({
          month: month._id,
          total: month.total,
          count: month.count
        }))
      }

      return NextResponse.json({
        success: true,
        data: stats
      })
    }

    return NextResponse.json(
      { message: 'Invalid type parameter. Use "history" or "stats"' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error fetching giving data:', error)
    return NextResponse.json(
      { message: 'Failed to fetch giving data' },
      { status: 500 }
    )
  }
}
