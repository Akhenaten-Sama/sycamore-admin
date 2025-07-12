import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sycamore-admin'

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local')
}

// Extend global type to include mongoose
declare global {
  var mongoose: any
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // Add connection timeout and server selection timeout
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 30000, // 30 seconds
      // Add retry configuration
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true,
      // Add heartbeat configuration
      heartbeatFrequencyMS: 10000, // 10 seconds
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ Connected to MongoDB')
      return mongoose
    }).catch((error) => {
      console.error('❌ MongoDB connection failed:', error.message)
      console.log('💡 To use MongoDB:')
      console.log('   1. Install MongoDB locally, or')
      console.log('   2. Use MongoDB Atlas (cloud) and update MONGODB_URI in .env.local')
      console.log('   3. For now, you can use the in-memory version for testing')
      
      // Reset the promise so it can be retried
      cached.promise = null
      throw error
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default connectDB
