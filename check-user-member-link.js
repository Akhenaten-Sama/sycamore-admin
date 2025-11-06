const { MongoClient, ObjectId } = require('mongodb');

async function checkUserMemberLink() {
  const MONGODB_URI = "mongodb+srv://admin:SDoupCGoa280Z0S8@cluster0.hbynv28.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const db = client.db();
    
    // Find member by email
    const member = await db.collection('members').findOne({ 
      email: 'olalekanefunkunle2@gmail.com' 
    });
    
    console.log('👤 Member found:', member ? {
      id: member._id,
      name: `${member.firstName} ${member.lastName}`,
      email: member.email,
      totalGiving: member.totalGiving || 0
    } : 'NOT FOUND');

    // Find user by email
    const user = await db.collection('users').findOne({ 
      email: 'olalekanefunkunle2@gmail.com' 
    });
    
    console.log('🔐 User found:', user ? {
      id: user._id,
      email: user.email,
      memberId: user.memberId,
      role: user.role,
      isActive: user.isActive
    } : 'NOT FOUND');

    // Check if they're linked
    if (member && user) {
      const memberIdStr = member._id.toString();
      const userMemberIdStr = user.memberId ? user.memberId.toString() : null;
      
      console.log('\n🔗 Link Analysis:');
      console.log(`Member ID: ${memberIdStr}`);
      console.log(`User's memberId: ${userMemberIdStr}`);
      console.log(`Linked correctly: ${memberIdStr === userMemberIdStr ? '✅ YES' : '❌ NO'}`);
      
      if (memberIdStr !== userMemberIdStr) {
        console.log('\n🚨 PROBLEM FOUND: User and Member are not properly linked!');
        console.log('💡 Need to fix the user.memberId field');
        
        // Fix the link
        const result = await db.collection('users').updateOne(
          { email: 'olalekanefunkunle2@gmail.com' },
          { $set: { memberId: new ObjectId(memberIdStr) } }
        );
        
        console.log('🔧 Fixed user-member link:', result.modifiedCount > 0 ? '✅ SUCCESS' : '❌ FAILED');
      }
    } else if (member && !user) {
      console.log('\n🚨 PROBLEM: Member exists but no User account found!');
      console.log('💡 Need to create a User account for this member');
    } else if (!member && user) {
      console.log('\n🚨 PROBLEM: User exists but no Member record found!');
      console.log('💡 Need to create a Member record for this user');
    }

    // Check donations again with correct member ID
    if (member) {
      const donations = await db.collection('givings').find({ 
        memberId: member._id 
      }).toArray();
      
      console.log(`\n💰 Donations for member ${member._id}:`, donations.length);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkUserMemberLink();