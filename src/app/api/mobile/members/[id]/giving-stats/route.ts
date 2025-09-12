import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Member, Giving } from '@/lib/models'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const { id: memberId } = await params

    console.log('💰 Member giving stats request for ID:', memberId)

    // Get member
    const member = await Member.findById(memberId)
    if (!member) {
      console.log('❌ Member not found in database')
      return NextResponse.json(
        { message: 'Member not found' },
        { status: 404 }
      )
    }

    // Get giving statistics
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()
    const yearStart = new Date(currentYear, 0, 1)
    const monthStart = new Date(currentYear, currentMonth, 1)
    
    const [totalGiving, yearlyGiving, monthlyGiving, categoryBreakdown, recentGiving] = await Promise.all([
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
      
      // Monthly giving
      Giving.aggregate([
        { $match: { memberId, date: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      
      // Category breakdown
      Giving.aggregate([
        { $match: { memberId } },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Recent giving
      Giving.find({ memberId })
        .sort({ date: -1 })
        .limit(10)
    ])

    // Monthly breakdown for the year
    const monthlyBreakdown = await Giving.aggregate([
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

    const stats = {
      totalGiving: totalGiving[0]?.total || 0,
      totalDonations: totalGiving[0]?.count || 0,
      yearlyGiving: yearlyGiving[0]?.total || 0,
      yearlyDonations: yearlyGiving[0]?.count || 0,
      monthlyGiving: monthlyGiving[0]?.total || 0,
      monthlyDonations: monthlyGiving[0]?.count || 0,
      averageDonation: totalGiving[0]?.count > 0 ? 
        (totalGiving[0]?.total / totalGiving[0]?.count) : 0,
      categoryBreakdown: categoryBreakdown.map(cat => ({
        category: cat._id,
        total: cat.total,
        count: cat.count,
        percentage: totalGiving[0]?.total > 0 ? 
          Math.round((cat.total / totalGiving[0].total) * 100) : 0
      })),
      monthlyBreakdown: monthlyBreakdown.map(month => ({
        month: month._id,
        monthName: getMonthName(month._id),
        total: month.total,
        count: month.count
      })),
      recentGiving: recentGiving.map(giving => ({
        id: giving._id,
        amount: giving.amount,
        category: giving.category,
        method: giving.method,
        date: giving.date,
        description: giving.description
      }))
    }

    console.log('✅ Member giving stats loaded successfully')

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Error fetching member giving stats:', error)
    return NextResponse.json(
      { message: 'Failed to fetch giving stats' },
      { status: 500 }
    )
  }
}

function getMonthName(monthNumber: number): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]
  return months[monthNumber - 1] || 'Unknown'
}
