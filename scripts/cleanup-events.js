// Script to clean up duplicate events and check the current state
import mongoose from 'mongoose';

// Event Schema (matching the one in the app)
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
  isRecurringInstance: { type: Boolean, default: false },
  originalEventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);

async function analyzeAndCleanEvents() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = 'mongodb+srv://admin:SDoupCGoa280Z0S8@cluster0.hbynv28.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all events
    const allEvents = await Event.find({}).sort({ createdAt: 1 });
    console.log(`\n📊 Total events in database: ${allEvents.length}`);

    // Group by name to find duplicates
    const eventGroups = {};
    allEvents.forEach(event => {
      if (!eventGroups[event.name]) {
        eventGroups[event.name] = [];
      }
      eventGroups[event.name].push(event);
    });

    console.log('\n📋 Events by name:');
    for (const [name, events] of Object.entries(eventGroups)) {
      console.log(`- ${name}: ${events.length} instances`);
      if (events.length > 10) {
        console.log(`  ⚠️  Too many instances! This should be handled as recurring.`);
      }
    }

    // Find base recurring events (not instances)
    const baseEvents = allEvents.filter(event => !event.isRecurringInstance);
    const recurringInstances = allEvents.filter(event => event.isRecurringInstance);

    console.log(`\n🔄 Recurring Events Analysis:`);
    console.log(`- Base events: ${baseEvents.length}`);
    console.log(`- Recurring instances: ${recurringInstances.length}`);

    // Show which events are marked as recurring
    const recurringEvents = baseEvents.filter(event => event.isRecurring);
    console.log(`\n✨ Base recurring events:`);
    recurringEvents.forEach(event => {
      console.log(`- ${event.name} (${event.recurringType}) - Date: ${event.date.toDateString()}`);
    });

    // Clean up strategy
    console.log(`\n🧹 CLEANUP STRATEGY:`);
    console.log(`1. Keep only BASE recurring events (${recurringEvents.length} events)`);
    console.log(`2. Delete all recurring instances (${recurringInstances.length} events)`);
    console.log(`3. Delete duplicate base events, keeping only the oldest for each name`);

    // Find duplicates to clean
    const toDelete = [];
    for (const [name, events] of Object.entries(eventGroups)) {
      if (events.length > 1) {
        // Keep only the first (oldest) base event for each name
        const baseEventsForName = events.filter(e => !e.isRecurringInstance);
        if (baseEventsForName.length > 1) {
          const toKeep = baseEventsForName[0]; // Keep the oldest
          const duplicates = baseEventsForName.slice(1);
          toDelete.push(...duplicates);
          console.log(`- Will delete ${duplicates.length} duplicate base events for "${name}"`);
        }
      }
    }

    // Add all recurring instances to deletion list
    toDelete.push(...recurringInstances);

    console.log(`\n📊 CLEANUP SUMMARY:`);
    console.log(`- Total events to delete: ${toDelete.length}`);
    console.log(`- Recurring instances to delete: ${recurringInstances.length}`);
    console.log(`- Duplicate base events to delete: ${toDelete.length - recurringInstances.length}`);
    console.log(`- Events to keep: ${allEvents.length - toDelete.length}`);

    // Perform the cleanup
    if (toDelete.length > 0) {
      console.log(`\n🗑️  Performing cleanup...`);
      const deleteIds = toDelete.map(e => e._id);
      const result = await Event.deleteMany({ _id: { $in: deleteIds } });
      console.log(`✅ Deleted ${result.deletedCount} events`);
    }

    // Verify the cleanup
    const remainingEvents = await Event.find({});
    console.log(`\n✅ CLEANUP COMPLETE:`);
    console.log(`- Remaining events: ${remainingEvents.length}`);
    
    console.log(`\n📋 Remaining events:`);
    remainingEvents.forEach(event => {
      console.log(`- ${event.name} - ${event.date.toDateString()} ${event.isRecurring ? '(Recurring: ' + event.recurringType + ')' : ''}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

analyzeAndCleanEvents();