const { MongoClient, ObjectId } = require('mongodb');

async function seedMemberData() {
  const client = new MongoClient('mongodb://localhost:27017/sycamore');
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🌱 Seeding member data...');
    
    // Get all members
    const members = await db.collection('members').find({}).toArray();
    console.log(`Found ${members.length} members`);
    
    for (const member of members) {
      console.log(`Updating member: ${member.firstName} ${member.lastName}`);
      
      // Update member with sample streaks and totals
      await db.collection('members').updateOne(
        { _id: member._id },
        {
          $set: {
            attendanceStreak: Math.floor(Math.random() * 12) + 1, // 1-12 weeks
            totalAttendance: Math.floor(Math.random() * 50) + 10, // 10-60 services
            totalGiving: Math.floor(Math.random() * 5000) + 500, // $500-$5500
            lastActivityDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Within last week
          }
        }
      );
      
      // Create some sample attendance records
      const attendanceCount = Math.floor(Math.random() * 10) + 5; // 5-15 records
      for (let i = 0; i < attendanceCount; i++) {
        const eventDate = new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000)); // Weekly services
        
        await db.collection('attendancerecords').insertOne({
          memberId: member._id.toString(),
          eventId: new ObjectId(), // Dummy event ID
          date: eventDate,
          status: 'present',
          createdAt: eventDate,
          updatedAt: eventDate
        });
      }
      
      // Create some sample giving records
      const givingCount = Math.floor(Math.random() * 5) + 2; // 2-7 records
      for (let i = 0; i < givingCount; i++) {
        const givingDate = new Date(Date.now() - (i * 14 * 24 * 60 * 60 * 1000)); // Bi-weekly giving
        const amount = Math.floor(Math.random() * 200) + 50; // $50-$250
        
        await db.collection('givings').insertOne({
          memberId: member._id.toString(),
          amount: amount,
          category: ['tithe', 'offering', 'missions', 'building_fund'][Math.floor(Math.random() * 4)],
          description: 'Sample donation',
          date: givingDate,
          method: 'online',
          createdAt: givingDate,
          updatedAt: givingDate
        });
      }
    }
    
    console.log('✅ Member data seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await client.close();
  }
}

seedMemberData();
