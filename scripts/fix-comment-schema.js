const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.replace(/"/g, '').trim();
    }
  });
}

// MongoDB connection URI
const MONGO_URI = process.env.MONGODB_URI;

async function fixCommentSchema() {
  let client;
  
  try {
    console.log('🔧 Connecting to MongoDB...');
    client = new MongoClient(MONGO_URI);
    await client.connect();
    
    const db = client.db();
    const commentsCollection = db.collection('comments');
    
    console.log('📊 Checking existing comments...');
    const existingComments = await commentsCollection.find({}).toArray();
    console.log(`Found ${existingComments.length} existing comments`);
    
    // Update existing comments to ensure they have valid targetType
    console.log('🔄 Updating existing comments...');
    const updateResult = await commentsCollection.updateMany(
      { targetType: { $nin: ['event', 'blog', 'gallery', 'announcement', 'community_post', 'media'] } },
      { $set: { targetType: 'media' } }
    );
    console.log(`Updated ${updateResult.modifiedCount} comments with invalid targetType`);
    
    // Drop any existing schema validation if it exists
    console.log('🗑️ Removing old schema validation...');
    try {
      await db.runCommand({
        collMod: 'comments',
        validator: {}
      });
      console.log('✅ Removed old validation rules');
    } catch (error) {
      console.log('ℹ️ No existing validation to remove');
    }
    
    // Create new validation schema
    console.log('📝 Creating new schema validation...');
    await db.runCommand({
      collMod: 'comments',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['content', 'authorId', 'targetType', 'targetId'],
          properties: {
            content: {
              bsonType: 'string',
              description: 'Comment content is required'
            },
            authorId: {
              bsonType: 'objectId',
              description: 'Author ID is required'
            },
            targetType: {
              bsonType: 'string',
              enum: ['event', 'blog', 'gallery', 'announcement', 'community_post', 'media'],
              description: 'targetType must be one of the specified values'
            },
            targetId: {
              bsonType: 'objectId',
              description: 'Target ID is required'
            },
            parentCommentId: {
              bsonType: ['objectId', 'null'],
              description: 'Parent comment ID for replies'
            },
            isApproved: {
              bsonType: 'bool',
              description: 'Approval status'
            },
            createdAt: {
              bsonType: 'date',
              description: 'Creation timestamp'
            },
            updatedAt: {
              bsonType: 'date',
              description: 'Update timestamp'
            }
          }
        }
      },
      validationLevel: 'moderate',
      validationAction: 'warn'
    });
    
    console.log('✅ Schema validation updated successfully');
    
    // Test creating a sample comment to verify the schema works
    console.log('🧪 Testing comment creation...');
    const testComment = {
      content: 'Test comment for schema validation',
      authorId: new MongoClient.ObjectId(),
      targetType: 'media',
      targetId: new MongoClient.ObjectId(),
      isApproved: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const insertResult = await commentsCollection.insertOne(testComment);
    console.log(`✅ Test comment created with ID: ${insertResult.insertedId}`);
    
    // Clean up test comment
    await commentsCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('🧹 Test comment cleaned up');
    
    console.log('🎉 Comment schema fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing comment schema:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the fix
if (require.main === module) {
  fixCommentSchema()
    .then(() => {
      console.log('✅ Comment schema fix completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Comment schema fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixCommentSchema };