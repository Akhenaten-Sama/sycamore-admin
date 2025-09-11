import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'

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

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // Optional: get devotional for specific date
    const limit = parseInt(searchParams.get('limit') || '7') // Default to one week
    
    console.log('📖 Devotionals request - date:', date, 'limit:', limit)

    // Create mock devotionals data for development
    const today = new Date()
    const devotionals = []

    for (let i = 0; i < limit; i++) {
      const devotionalDate = new Date(today)
      devotionalDate.setDate(devotionalDate.getDate() - i)
      
      const devotionalData = {
        _id: `devotional_${i + 1}`,
        title: getDailyTitle(i),
        verse: getDailyVerse(i),
        content: getDailyContent(i),
        date: devotionalDate,
        author: 'Pastor Johnson',
        category: 'daily_bread',
        readingPlan: 'Through the Bible in a Year',
        tags: getDailyTags(i),
        likes: Math.floor(Math.random() * 50) + 10,
        comments: Math.floor(Math.random() * 20) + 3,
        readTime: Math.floor(Math.random() * 3) + 3, // 3-5 minutes
        questions: getDailyQuestions(i)
      }
      
      devotionals.push(devotionalData)
    }

    // If specific date requested, filter to that date
    if (date) {
      const requestedDate = new Date(date)
      const filtered = devotionals.filter(d => {
        const devDate = new Date(d.date)
        return devDate.toDateString() === requestedDate.toDateString()
      })
      
      return NextResponse.json({
        success: true,
        data: filtered[0] || null,
        message: filtered.length === 0 ? 'No devotional found for this date' : 'Devotional found'
      })
    }

    console.log(`✅ Returning ${devotionals.length} devotionals`)

    return NextResponse.json({
      success: true,
      data: devotionals,
      total: devotionals.length
    })

  } catch (error) {
    console.error('Error fetching devotionals:', error)
    return NextResponse.json(
      { message: 'Failed to fetch devotionals' },
      { status: 500 }
    )
  }
}

function getDailyTitle(day: number): string {
  const titles = [
    "Walking in God's Light",
    "Finding Peace in His Presence",
    "The Power of Prayer",
    "God's Unfailing Love",
    "Strength in Weakness",
    "Trusting God's Plan",
    "Joy in the Journey"
  ]
  return titles[day % titles.length]
}

function getDailyVerse(day: number): string {
  const verses = [
    "1 John 1:7 - But if we walk in the light, as he is in the light, we have fellowship with one another, and the blood of Jesus his Son cleanses us from all sin.",
    "Philippians 4:7 - And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.",
    "1 Thessalonians 5:17 - Pray without ceasing.",
    "Romans 8:38-39 - For I am sure that neither death nor life, nor angels nor rulers, nor things present nor things to come, nor powers, nor height nor depth, nor anything else in all creation, will be able to separate us from the love of God in Christ Jesus our Lord.",
    "2 Corinthians 12:9 - But he said to me, 'My grace is sufficient for you, for my power is made perfect in weakness.'",
    "Jeremiah 29:11 - For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope.",
    "Nehemiah 8:10 - Do not be grieved, for the joy of the Lord is your strength."
  ]
  return verses[day % verses.length]
}

function getDailyContent(day: number): string {
  const content = [
    "Walking in God's light means more than just avoiding darkness. It means actively pursuing righteousness, truth, and fellowship with Him. When we choose to walk in His light, we discover the beauty of community with fellow believers and experience the cleansing power of Christ's sacrifice. Today, ask yourself: What areas of my life need more of God's light?",
    
    "In a world filled with anxiety and uncertainty, God offers us a peace that transcends human understanding. This divine peace acts as a guardian over our hearts and minds, protecting us from the storms of life. When we surrender our worries to Him through prayer, we open ourselves to receive this supernatural peace. What worries can you surrender to God today?",
    
    "Prayer is not just a religious duty; it's our lifeline to heaven. Through constant communication with God, we align our hearts with His will and find strength for each day. Prayer transforms not just our circumstances, but more importantly, it transforms us. Make prayer a continuous conversation with your Heavenly Father today.",
    
    "God's love is not based on our performance or worthiness. It's an unchanging, unshakeable love that nothing can separate us from. Whether we're facing triumph or trial, success or failure, God's love remains constant. This truth should give us incredible confidence and security. How does knowing this love change how you face today's challenges?",
    
    "God often displays His greatest power through our weaknesses. When we acknowledge our limitations and depend on Him, His strength is perfected in us. This paradox of the Christian life teaches us that our insufficiency is the perfect canvas for God's sufficiency. What weakness can you surrender to God's strength today?",
    
    "God's plans for us are always good, even when we can't see the bigger picture. His plans include a hope and a future that surpass our wildest dreams. Trusting His plan requires faith, especially during difficult seasons, but His faithfulness in the past gives us confidence for the future. How can you trust God's plan more fully today?",
    
    "True joy comes not from our circumstances but from the Lord Himself. The joy of the Lord becomes our strength, enabling us to face any challenge with hope and confidence. This joy is deeper than happiness—it's a settled peace and confidence in God's goodness. Let the joy of the Lord strengthen you today."
  ]
  return content[day % content.length]
}

function getDailyTags(day: number): string[] {
  const tagSets = [
    ['light', 'fellowship', 'righteousness'],
    ['peace', 'prayer', 'trust'],
    ['prayer', 'communication', 'transformation'],
    ['love', 'security', 'faithfulness'],
    ['strength', 'weakness', 'grace'],
    ['trust', 'hope', 'future'],
    ['joy', 'strength', 'confidence']
  ]
  return tagSets[day % tagSets.length]
}

function getDailyQuestions(day: number): string[] {
  const questionSets = [
    ["What areas of your life need more of God's light?", "How can you walk more closely with fellow believers?"],
    ["What worries can you surrender to God today?", "How have you experienced God's peace in difficult times?"],
    ["How can you make prayer a more constant part of your day?", "What has God been saying to you in prayer recently?"],
    ["How does knowing God's unchanging love affect your daily decisions?", "In what ways have you experienced God's love recently?"],
    ["What weakness can you surrender to God's strength today?", "How has God shown His strength through your weaknesses before?"],
    ["How can you trust God's plan more fully today?", "What evidence do you see of God's good plans in your life?"],
    ["How can the joy of the Lord strengthen you today?", "What brings you the deepest joy in your relationship with God?"]
  ]
  return questionSets[day % questionSets.length]
}
