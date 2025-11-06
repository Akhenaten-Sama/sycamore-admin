const { MongoClient } = require('mongodb');

async function checkUserDonations() {
  const MONGODB_URI = "mongodb+srv://admin:SDoupCGoa280Z0S8@cluster0.hbynv28.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const db = client.db();
    
    // Find user by email
    const user = await db.collection('members').findOne({ 
      email: 'olalekanefunkunle2@gmail.com' 
    });
    
    console.log('👤 User found:', user ? {
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      totalGiving: user.totalGiving || 0
    } : 'NOT FOUND');

    if (user) {
      // Find all donations for this user
      const donations = await db.collection('givings').find({ 
        memberId: user._id 
      }).toArray();
      
      console.log(`💰 Found ${donations.length} donations for this user:`);
      
      donations.forEach((donation, index) => {
        console.log(`${index + 1}. ${donation.currency} ${donation.amount} - ${donation.category} - ${donation.method} - ${new Date(donation.date).toLocaleDateString()}`);
      });

      // Calculate stats
      const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
      const currentYear = new Date().getFullYear();
      const yearlyDonations = donations.filter(d => new Date(d.date).getFullYear() === currentYear);
      const yearlyAmount = yearlyDonations.reduce((sum, d) => sum + d.amount, 0);
      
      const currentMonth = new Date().getMonth();
      const monthlyDonations = donations.filter(d => {
        const donationDate = new Date(d.date);
        return donationDate.getFullYear() === currentYear && donationDate.getMonth() === currentMonth;
      });
      const monthlyAmount = monthlyDonations.reduce((sum, d) => sum + d.amount, 0);

      console.log('\n📊 Calculated Stats:');
      console.log(`Total All Time: ${totalAmount}`);
      console.log(`This Year (${currentYear}): ${yearlyAmount}`);
      console.log(`This Month: ${monthlyAmount}`);
      console.log(`Total Donations: ${donations.length}`);
      
      // Check if there are any authentication-related users
      const authUsers = await db.collection('users').find({}).toArray();
      console.log('\n🔐 Auth Users in database:', authUsers.length);
      authUsers.forEach(user => {
        console.log(`- ${user.email} (ID: ${user._id})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkUserDonations();