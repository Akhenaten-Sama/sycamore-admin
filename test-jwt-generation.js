const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');

async function testJWTGeneration() {
  const MONGODB_URI = "mongodb+srv://admin:SDoupCGoa280Z0S8@cluster0.hbynv28.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
  const client = new MongoClient(MONGODB_URI);
  const JWT_SECRET = process.env.JWT_SECRET || 'sycamore-church-secret-key';

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const db = client.db();
    
    // Find the user
    const user = await db.collection('users').findOne({ 
      email: 'olalekanefunkunle2@gmail.com' 
    }).populate ? await db.collection('users').findOne({ 
      email: 'olalekanefunkunle2@gmail.com' 
    }) : await db.collection('users').aggregate([
      { $match: { email: 'olalekanefunkunle2@gmail.com' } },
      {
        $lookup: {
          from: 'members',
          localField: 'memberId',
          foreignField: '_id',
          as: 'memberDetails'
        }
      }
    ]).toArray();

    console.log('🔍 User lookup result:', Array.isArray(user) ? user[0] : user);

    // Simulate the JWT creation like in the mobile login API
    const userData = Array.isArray(user) ? user[0] : user;
    
    if (userData) {
      const tokenPayload = {
        userId: userData._id,
        memberId: userData.memberId,
        email: userData.email,
        role: userData.role,
        permissions: userData.permissions || []
      };

      console.log('\n🎫 Token Payload:', tokenPayload);

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
      console.log('\n🔐 Generated JWT Token:', token);

      // Verify the token
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('\n✅ Decoded Token:', decoded);

      // Test the donations query with this memberId
      const donations = await db.collection('givings').find({ 
        memberId: new ObjectId(decoded.memberId) 
      }).toArray();

      console.log(`\n💰 Donations query with token memberId (${decoded.memberId}):`, donations.length);
      if (donations.length > 0) {
        console.log('First donation:', {
          amount: donations[0].amount,
          currency: donations[0].currency,
          date: donations[0].createdAt,
          memberId: donations[0].memberId
        });
      }

      // Test stats calculation
      const stats = await db.collection('givings').aggregate([
        { $match: { memberId: new ObjectId(decoded.memberId) } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            donationCount: { $sum: 1 },
            averageAmount: { $avg: '$amount' }
          }
        }
      ]).toArray();

      console.log('\n📊 Stats calculation:', stats[0] || 'No stats');

    } else {
      console.log('❌ User not found for JWT generation');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testJWTGeneration();