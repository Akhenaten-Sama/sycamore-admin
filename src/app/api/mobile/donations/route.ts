import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { Giving, Member, User } from '@/lib/models'
import { verifyPaystackPayment, convertFromPaystackAmount } from '@/lib/paystack'
import { ObjectId } from 'mongodb'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// CORS headers for mobile app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'false',
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  })
}

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
      currency,
      description,
      note,
      paymentReference,
      status,
      isRecurring,
      recurringFrequency
    } = await request.json()

    console.log('💰 Processing donation:', { memberId, amount, category, method, currency, paymentReference })

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

    if (!currency || !['NGN', 'USD', 'EUR', 'GBP', 'CAD', 'GHS', 'ZAR', 'KES'].includes(currency)) {
      return NextResponse.json(
        { message: 'Valid currency (NGN, USD, EUR, GBP, CAD, GHS, ZAR, or KES) is required' },
        { status: 400 }
      )
    }

    // Verify Paystack payment if reference is provided
    if (paymentReference && method === 'paystack') {
      try {
        console.log('🔍 Verifying Paystack payment:', paymentReference)
        const verification = await verifyPaystackPayment(paymentReference)
        
        if (!verification.status || verification.data.status !== 'success') {
          console.error('❌ Paystack verification failed:', verification)
          return NextResponse.json(
            { message: 'Payment verification failed. Transaction was not successful.' },
            { status: 400 }
          )
        }

        // Verify the amount matches (convert from kobo/cents)
        const verifiedAmount = convertFromPaystackAmount(verification.data.amount, currency)
        if (Math.abs(verifiedAmount - parseFloat(amount)) > 0.01) {
          console.error('❌ Amount mismatch:', { 
            expected: amount, 
            verified: verifiedAmount 
          })
          return NextResponse.json(
            { message: 'Payment amount verification failed.' },
            { status: 400 }
          )
        }

        // Verify the currency matches
        if (verification.data.currency !== currency) {
          console.error('❌ Currency mismatch:', {
            expected: currency,
            verified: verification.data.currency
          })
          return NextResponse.json(
            { message: 'Payment currency verification failed.' },
            { status: 400 }
          )
        }

        console.log('✅ Paystack payment verified successfully:', {
          reference: paymentReference,
          amount: verifiedAmount,
          currency: verification.data.currency,
          customer: verification.data.customer.email
        })
        
      } catch (error) {
        console.error('❌ Paystack verification error:', error)
        return NextResponse.json(
          { message: 'Payment verification failed. Please contact support.' },
          { status: 400 }
        )
      }
    }
    
    // Create the giving record
    const giving = new Giving({
      memberId,
      amount: parseFloat(amount),
      currency: currency || 'USD',
      method,
      category,
      description: description || note,
      paymentReference,
      status: status || 'completed',
      date: new Date(),
      isRecurring: isRecurring || false,
      recurringFrequency: recurringFrequency || null
    })

    const savedGiving = await giving.save()

    // Update member's total giving (convert to USD for consistency if needed)
    const conversionRates: { [key: string]: number } = {
      'USD': 1,
      'NGN': 1500, // Rough conversion rate
      'EUR': 0.85,
      'GBP': 0.73,
      'CAD': 1.25,
      'GHS': 12.0,  // Ghana Cedi
      'ZAR': 18.5,  // South African Rand  
      'KES': 150.0  // Kenyan Shilling
    };
    
    const amountInUSD = parseFloat(amount) / (conversionRates[currency] || 1);
    await Member.findByIdAndUpdate(memberId, {
      $inc: { totalGiving: amountInUSD }
    })

    console.log('✅ Donation processed successfully:', savedGiving._id)

    return NextResponse.json({
      success: true,
      message: 'Donation processed successfully',
      data: {
        donationId: savedGiving._id,
        paymentReference: paymentReference || `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: savedGiving.amount,
        currency: savedGiving.currency,
        category: savedGiving.category,
        method: savedGiving.method,
        date: savedGiving.date,
        status: savedGiving.status || 'completed'
      }
    }, { headers: corsHeaders })

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
    console.log('🔍 Decoded token:', decoded)
    
    if (!decoded) {
      console.log('❌ No valid token found')
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401, headers: corsHeaders }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'history' or 'stats'
    const memberId = decoded.memberId
    
    console.log('🔍 Request details:', {
      type,
      memberId,
      decodedKeys: Object.keys(decoded)
    })

    if (!memberId) {
      console.log('❌ No memberId in token')
      return NextResponse.json(
        { message: 'Member profile required' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (type === 'history') {
      // Get giving history
      const memberObjectId = new ObjectId(memberId)
      console.log('🔍 History query for memberId:', memberId, 'as ObjectId:', memberObjectId)
      
      const givingHistory = await Giving.find({ memberId: memberObjectId })
        .sort({ date: -1 })
        .limit(50)

      console.log('📜 Found', givingHistory.length, 'donation records');

      return NextResponse.json({
        success: true,
        data: givingHistory.map((giving: any) => ({
          id: giving._id,
          amount: giving.amount,
          currency: giving.currency,
          category: giving.category,
          method: giving.method,
          description: giving.description,
          date: giving.date,
          paymentReference: giving.paymentReference,
          status: giving.status,
          isRecurring: giving.isRecurring,
          recurringFrequency: giving.recurringFrequency
        }))
      }, { headers: corsHeaders })
    }

    if (type === 'stats') {
      // Get giving statistics
      const currentYear = new Date().getFullYear()
      const yearStart = new Date(currentYear, 0, 1)
      
      // Convert memberId to ObjectId for aggregation queries
      const memberObjectId = new ObjectId(memberId)
      
      console.log('🔍 Stats query for memberId:', memberId, 'as ObjectId:', memberObjectId)
      
      const [totalGiving, yearlyGiving, monthlyStats] = await Promise.all([
        // Total giving all time
        Giving.aggregate([
          { $match: { memberId: memberObjectId } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]),
        
        // Yearly giving
        Giving.aggregate([
          { $match: { memberId: memberObjectId, date: { $gte: yearStart } } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]),
        
        // Monthly breakdown for current year
        Giving.aggregate([
          { $match: { memberId: memberObjectId, date: { $gte: yearStart } } },
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

      console.log('📊 Aggregation results:');
      console.log('Total giving:', totalGiving);
      console.log('Yearly giving:', yearlyGiving);
      console.log('Monthly stats:', monthlyStats);

      const stats = {
        totalGiving: totalGiving[0]?.total || 0,
        totalDonations: totalGiving[0]?.count || 0,
        yearlyGiving: yearlyGiving[0]?.total || 0,
        yearlyDonations: yearlyGiving[0]?.count || 0,
        monthlyBreakdown: monthlyStats.map((month: any) => ({
          month: month._id,
          total: month.total,
          count: month.count
        }))
      }

      console.log('✅ Final stats response:', stats);

      return NextResponse.json({
        success: true,
        data: stats
      }, { headers: corsHeaders })
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
