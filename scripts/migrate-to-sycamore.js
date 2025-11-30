const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://admin:SDoupCGoa280Z0S8@cluster0.hbynv28.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function migrateDatabase() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas\n');
    
    const sourceDb = client.db('test');
    const targetDb = client.db('sycamore');
    
    // Get all collections from test database
    const collections = await sourceDb.listCollections().toArray();
    console.log(`📦 Found ${collections.length} collections in 'test' database\n`);
    
    for (const collection of collections) {
      const collName = collection.name;
      
      try {
        console.log(`🔄 Migrating ${collName}...`);
        
        // Get all documents from source collection
        const documents = await sourceDb.collection(collName).find({}).toArray();
        
        if (documents.length === 0) {
          console.log(`   ⏭️  ${collName}: No documents to migrate\n`);
          continue;
        }
        
        // Drop target collection if exists (to avoid duplicates)
        await targetDb.collection(collName).drop().catch(() => {});
        
        // Insert all documents into target collection
        await targetDb.collection(collName).insertMany(documents);
        
        console.log(`   ✅ ${collName}: Migrated ${documents.length} documents\n`);
      } catch (err) {
        console.error(`   ❌ ${collName}: ${err.message}\n`);
      }
    }
    
    console.log('🎉 Migration complete!');
    console.log('\n📋 Summary:');
    console.log('   - All data copied from "test" to "sycamore"');
    console.log('   - Update your .env file to use "sycamore" database');
    console.log('   - After verifying, you can delete "test" database from Atlas UI');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

migrateDatabase();
