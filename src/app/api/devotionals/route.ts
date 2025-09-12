import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { Member } from '@/lib/models'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

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

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Mock devotionals data - in production, this would come from database
    const devotionals = [
      {
        id: '1',
        title: 'Walking in Faith',
        date: new Date().toISOString().split('T')[0], // Today
        verse: 'Hebrews 11:1',
        verseText: 'Now faith is confidence in what we hope for and assurance about what we do not see.',
        content: `Faith is not just a belief system; it's a way of life. When we walk in faith, we trust God even when the path ahead isn't clear. Today, take a step forward trusting that God has prepared the way before you.

Walking in faith means:
• Trusting God's timing, even when it seems delayed
• Believing in His promises when circumstances suggest otherwise  
• Taking action based on His word, not just our feelings
• Finding peace in uncertainty because we know Who holds tomorrow

Remember, faith isn't the absence of doubt—it's choosing to trust God despite our doubts. Every step of faith you take today strengthens your spiritual muscles for tomorrow's challenges.`,
        author: 'Pastor John Williams',
        readTime: 3,
        tags: ['faith', 'trust', 'spiritual-growth'],
        reflectionQuestions: [
          'What area of your life requires more faith today?',
          'How has God proven faithful to you in the past?',
          'What step of faith is God calling you to take this week?'
        ],
        prayer: 'Lord, increase my faith. Help me to trust You completely, even when I cannot see the way forward. Give me courage to step out in faith, knowing that You are always with me. Amen.',
        likes: 45,
        comments: [
          {
            id: '1',
            author: 'Sarah M.',
            text: 'This really spoke to me today. Thank you! 🙏',
            date: new Date()
          },
          {
            id: '2', 
            author: 'Michael R.',
            text: 'Needed this reminder about God\'s timing.',
            date: new Date()
          }
        ]
      },
      {
        id: '2',
        title: 'The Power of Gratitude',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
        verse: '1 Thessalonians 5:18',
        verseText: 'Give thanks in all circumstances; for this is God\'s will for you in Christ Jesus.',
        content: `Gratitude transforms our perspective and opens our hearts to see God's goodness in every situation. It's not just about being thankful when things go well—it's about finding reasons to praise God even in difficult times.

The transformative power of gratitude:
• Shifts our focus from what's lacking to what's abundant
• Builds resilience in challenging seasons
• Increases our awareness of God's daily provisions
• Creates joy independent of circumstances
• Strengthens our relationship with God and others

Start each day by listing three things you're grateful for. Watch how this simple practice changes your entire outlook on life. God has been good to you—let gratitude be your response.`,
        author: 'Pastor Sarah Johnson',
        readTime: 4,
        tags: ['gratitude', 'thanksgiving', 'joy', 'perspective'],
        reflectionQuestions: [
          'What are three things you\'re grateful for today?',
          'How has gratitude changed your perspective in difficult times?',
          'Who can you thank today for their impact on your life?'
        ],
        prayer: 'Thank You, Lord, for Your countless blessings. Help me to have a heart of gratitude in all circumstances. Open my eyes to see Your goodness everywhere. Amen.',
        likes: 38,
        comments: [
          {
            id: '3',
            author: 'Grace L.',
            text: 'Starting my gratitude journal today!',
            date: new Date()
          }
        ]
      },
      {
        id: '3',
        title: 'God\'s Perfect Timing',
        date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
        verse: 'Ecclesiastes 3:1',
        verseText: 'To every thing there is a season, and a time to every purpose under the heaven.',
        content: `Waiting can be one of life's greatest challenges, especially when we're eager for breakthrough or answers. But God's timing is always perfect, even when it doesn't align with our expectations.

Understanding God's timing:
• His perspective spans eternity, ours is limited to the present
• Delays often mean preparation, not denial
• Character is developed in the waiting seasons
• God's timing maximizes His glory and our good
• What seems delayed to us is precisely on time to Him

Trust that God is working behind the scenes. Your breakthrough, your answer, your blessing is coming at exactly the right moment. Use this waiting time to grow, prepare, and strengthen your faith.`,
        author: 'Elder David Thompson',
        readTime: 3,
        tags: ['timing', 'patience', 'waiting', 'trust'],
        reflectionQuestions: [
          'What are you waiting on God for right now?',
          'How can you use this waiting period for spiritual growth?',
          'What has God taught you through previous seasons of waiting?'
        ],
        prayer: 'Father, help me trust in Your perfect timing. Give me patience to wait on You and wisdom to prepare for what You have in store. I believe Your timing is best. Amen.',
        likes: 52,
        comments: []
      }
    ]

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const tag = searchParams.get('tag')

    let filteredDevotionals = devotionals

    if (date) {
      filteredDevotionals = filteredDevotionals.filter(d => d.date === date)
    }

    if (tag) {
      filteredDevotionals = filteredDevotionals.filter(d => 
        d.tags.includes(tag.toLowerCase())
      )
    }

    return createCorsResponse({
      success: true,
      data: filteredDevotionals,
      total: filteredDevotionals.length
    }, 200)

  } catch (error) {
    console.error('Error fetching devotionals:', error)
    return createCorsResponse(
      { error: 'Failed to fetch devotionals' },
      500
    )
  }
}

// Mark devotional as read or add comment
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Get authorization header
    const authorization = request.headers.get('authorization')
    if (!authorization) {
      return createCorsResponse({ error: 'Authorization required' }, 401)
    }

    const token = authorization.replace('Bearer ', '')
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return createCorsResponse({ error: 'Invalid token' }, 401)
    }

    const { devotionalId, action, comment } = await request.json()

    if (action === 'mark_read') {
      // In production, save reading progress to database
      // For now, just return success
      
      return createCorsResponse({
        success: true,
        message: 'Devotional marked as read',
        data: {
          devotionalId,
          readDate: new Date(),
          memberId: decoded.memberId
        }
      }, 200)
    }

    if (action === 'add_comment') {
      // In production, save comment to database
      return createCorsResponse({
        success: true,
        message: 'Comment added successfully',
        data: {
          devotionalId,
          comment,
          author: decoded.email,
          date: new Date()
        }
      }, 201)
    }

    return createCorsResponse({ error: 'Invalid action' }, 400)

  } catch (error) {
    console.error('Error updating devotional:', error)
    return createCorsResponse(
      { error: 'Failed to update devotional' },
      500
    )
  }
}
