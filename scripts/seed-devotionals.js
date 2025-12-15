const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sycamore';

const mockDevotionals = [
  {
    id: 'devotional_1',
    title: "Walking in God's Light",
    verse: "1 John 1:7 - But if we walk in the light, as he is in the light, we have fellowship with one another, and the blood of Jesus his Son cleanses us from all sin.",
    content: "Walking in God's light means more than just avoiding darkness. It means actively pursuing righteousness, truth, and fellowship with Him. When we choose to walk in His light, we discover the beauty of community with fellow believers and experience the cleansing power of Christ's sacrifice. Today, ask yourself: What areas of my life need more of God's light?",
    author: 'Pastor Johnson',
    category: 'daily_bread',
    readingPlan: 'Through the Bible in a Year',
    tags: ['faith', 'light', 'fellowship'],
    readTime: 5,
    questions: [
      "What areas of your life need more of God's light?",
      "How can you actively pursue righteousness today?",
      "Who can you fellowship with this week?"
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'devotional_2',
    title: "Finding Peace in His Presence",
    verse: "Philippians 4:7 - And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.",
    content: "In a world filled with anxiety and uncertainty, God offers us a peace that transcends human understanding. This divine peace acts as a guardian over our hearts and minds, protecting us from the storms of life. When we surrender our worries to Him through prayer, we open ourselves to receive this supernatural peace. What worries can you surrender to God today?",
    author: 'Pastor Johnson',
    category: 'daily_bread',
    readingPlan: 'Through the Bible in a Year',
    tags: ['peace', 'prayer', 'trust'],
    readTime: 4,
    questions: [
      "What worries can you surrender to God today?",
      "How does God's peace differ from worldly peace?",
      "In what ways can you cultivate His presence daily?"
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'devotional_3',
    title: "The Power of Prayer",
    verse: "1 Thessalonians 5:17 - Pray without ceasing.",
    content: "Prayer is not just a religious duty; it's our lifeline to heaven. Through constant communication with God, we align our hearts with His will and find strength for each day. Prayer transforms not just our circumstances, but more importantly, it transforms us. Make prayer a continuous conversation with your Heavenly Father today.",
    author: 'Pastor Johnson',
    category: 'daily_bread',
    readingPlan: 'Through the Bible in a Year',
    tags: ['prayer', 'communion', 'relationship'],
    readTime: 5,
    questions: [
      "How consistent is your prayer life?",
      "What does 'praying without ceasing' mean to you?",
      "How has prayer transformed you?"
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'devotional_4',
    title: "God's Unfailing Love",
    verse: "Romans 8:38-39 - For I am sure that neither death nor life, nor angels nor rulers, nor things present nor things to come, nor powers, nor height nor depth, nor anything else in all creation, will be able to separate us from the love of God in Christ Jesus our Lord.",
    content: "God's love is not based on our performance or worthiness. It's an unchanging, unshakeable love that nothing can separate us from. Whether we're facing triumph or trial, success or failure, God's love remains constant. This truth should give us incredible confidence and security. How does knowing this love change how you face today's challenges?",
    author: 'Pastor Johnson',
    category: 'daily_bread',
    readingPlan: 'Through the Bible in a Year',
    tags: ['love', 'security', 'grace'],
    readTime: 6,
    questions: [
      "How does God's unchanging love affect your daily life?",
      "What challenges are you facing that need God's love?",
      "How can you share this love with others?"
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'devotional_5',
    title: "Strength in Weakness",
    verse: "2 Corinthians 12:9 - But he said to me, 'My grace is sufficient for you, for my power is made perfect in weakness.'",
    content: "God often displays His greatest power through our weaknesses. When we acknowledge our limitations and depend on Him, His strength is perfected in us. This paradox of the Christian life teaches us that our insufficiency is the perfect canvas for God's sufficiency. What weakness can you surrender to God's strength today?",
    author: 'Pastor Johnson',
    category: 'daily_bread',
    readingPlan: 'Through the Bible in a Year',
    tags: ['strength', 'grace', 'weakness'],
    readTime: 5,
    questions: [
      "What weakness are you struggling with?",
      "How can you depend more on God's strength?",
      "Where have you seen God's power in your weakness?"
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'devotional_6',
    title: "Trusting God's Plan",
    verse: "Jeremiah 29:11 - For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope.",
    content: "God's plans for us are always good, even when we can't see the bigger picture. His plans include a hope and a future that surpass our wildest dreams. Trusting His plan requires faith, especially during difficult seasons, but His faithfulness in the past gives us confidence for the future. How can you trust God's plan more fully today?",
    author: 'Pastor Johnson',
    category: 'daily_bread',
    readingPlan: 'Through the Bible in a Year',
    tags: ['trust', 'hope', 'future'],
    readTime: 4,
    questions: [
      "What part of God's plan are you struggling to trust?",
      "How has God been faithful in your past?",
      "What hope can you hold onto today?"
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'devotional_7',
    title: "Joy in the Journey",
    verse: "Nehemiah 8:10 - Do not be grieved, for the joy of the Lord is your strength.",
    content: "True joy comes not from our circumstances but from the Lord Himself. The joy of the Lord becomes our strength, enabling us to face any challenge with hope and confidence. This joy is deeper than happiness—it's a settled peace and confidence in God's goodness. Let the joy of the Lord strengthen you today.",
    author: 'Pastor Johnson',
    category: 'daily_bread',
    readingPlan: 'Through the Bible in a Year',
    tags: ['joy', 'strength', 'hope'],
    readTime: 5,
    questions: [
      "How does the joy of the Lord differ from happiness?",
      "Where do you need God's joy today?",
      "How can joy be your strength in challenges?"
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seedDevotionals() {
  let client;
  
  try {
    console.log('🌱 Starting devotionals seed...');
    console.log('📡 Connecting to MongoDB:', MONGODB_URI);
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const devotionalsCollection = db.collection('devotionals');
    
    // Clear existing devotionals
    const deleteResult = await devotionalsCollection.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing devotionals`);
    
    // Insert mock devotionals
    const result = await devotionalsCollection.insertMany(mockDevotionals);
    console.log(`✅ Inserted ${result.insertedCount} devotionals`);
    
    // Create indexes
    await devotionalsCollection.createIndex({ id: 1 }, { unique: true });
    await devotionalsCollection.createIndex({ createdAt: -1 });
    await devotionalsCollection.createIndex({ isActive: 1 });
    console.log('✅ Created indexes');
    
    console.log('🎉 Devotionals seed completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding devotionals:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('👋 Database connection closed');
    }
  }
}

// Run the seed function
seedDevotionals();
