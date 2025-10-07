// Script to create sample events
import mongoose from 'mongoose';

// Event Schema
const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  image: { type: String },
  attendees: { type: Number, default: 0 },
  category: { type: String, required: true },
  isRecurring: { type: Boolean, default: false },
  recurringType: { type: String, enum: ['weekly', 'monthly', 'yearly'] },
  recurringDays: [{ type: Number }], // 0-6 for Sunday-Saturday
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);

async function createSampleEvents() {
  try {
    // Connect to MongoDB Atlas
    const mongoUri = 'mongodb+srv://admin:SDoupCGoa280Z0S8@cluster0.hbynv28.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');

    // Clear existing events
    await Event.deleteMany({});
    console.log('Cleared existing events');

    // Sample events
    const sampleEvents = [
      {
        name: "Sunday Worship Service",
        title: "Sunday Worship Service",
        description: "Join us for our weekly worship service filled with praise, worship, and powerful preaching.",
        date: new Date('2025-10-13'), // Next Sunday
        time: "09:00 AM",
        location: "Main Auditorium",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
        attendees: 450,
        category: "Worship",
        isRecurring: true,
        recurringType: "weekly",
        recurringDays: [0] // Sunday
      },
      {
        name: "Wednesday Bible Study",
        title: "Wednesday Bible Study",
        description: "Deep dive into God's word with our midweek Bible study session.",
        date: new Date('2025-10-16'), // Next Wednesday
        time: "07:00 PM",
        location: "Fellowship Hall",
        image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80",
        attendees: 85,
        category: "Study",
        isRecurring: true,
        recurringType: "weekly",
        recurringDays: [3] // Wednesday
      },
      {
        name: "Youth Fellowship",
        title: "Youth Fellowship",
        description: "An exciting time of fellowship, games, and spiritual growth for our young people.",
        date: new Date('2025-10-18'), // Next Friday
        time: "06:00 PM",
        location: "Youth Hall",
        image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80",
        attendees: 120,
        category: "Youth",
        isRecurring: true,
        recurringType: "weekly",
        recurringDays: [5] // Friday
      },
      {
        name: "Community Outreach",
        title: "Community Outreach",
        description: "Join us as we serve our local community with food distribution and prayer.",
        date: new Date('2025-10-21'), // Next Monday
        time: "10:00 AM",
        location: "City Park",
        image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=80",
        attendees: 200,
        category: "Outreach"
      },
      {
        name: "Prayer Meeting",
        title: "Prayer Meeting",
        description: "Come together for corporate prayer and intercession for our church and community.",
        date: new Date('2025-10-15'), // Tuesday
        time: "06:30 PM",
        location: "Prayer Room",
        image: "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=800&q=80",
        attendees: 60,
        category: "Prayer",
        isRecurring: true,
        recurringType: "weekly",
        recurringDays: [2] // Tuesday
      }
    ];

    // Insert sample events
    const createdEvents = await Event.insertMany(sampleEvents);
    console.log(`✅ Created ${createdEvents.length} sample events:`);
    
    createdEvents.forEach(event => {
      console.log(`- ${event.title} on ${event.date.toDateString()} at ${event.time}`);
    });

    console.log('\n📅 Events successfully created in the database!');
    console.log('You can now view them in the mobile app at http://localhost:5174');

  } catch (error) {
    console.error('❌ Error creating sample events:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createSampleEvents();