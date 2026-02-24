const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Event = require('./models/Event');
const User = require('./models/User');
const Registration = require('./models/Registration');

dotenv.config();

const seedTrendingData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected\n');

    // Get all published events
    const events = await Event.find({ status: 'Published' });
    
    if (events.length === 0) {
      console.log('❌ No published events found. Run seedTestData.js first!');
      process.exit(1);
    }

    // Get all participants
    const participants = await User.find({ role: 'participant' });
    
    if (participants.length === 0) {
      console.log('❌ No participants found. Please register some users first!');
      process.exit(1);
    }

    console.log(`Found ${events.length} events and ${participants.length} participants\n`);
    console.log('Creating registrations to generate trending data...\n');

    let registrationCount = 0;

    // Create multiple registrations for each event
    for (const event of events) {
      // Register 3-8 random participants for each event
      const numRegistrations = Math.floor(Math.random() * 6) + 3;
      
      for (let i = 0; i < Math.min(numRegistrations, participants.length); i++) {
        const participant = participants[i];

        // Check if already registered
        const existingReg = await Registration.findOne({
          userId: participant._id,
          eventId: event._id
        });

        if (existingReg) {
          console.log(`  ⏭️  ${participant.firstName} already registered for ${event.eventName}`);
          continue;
        }

        // Create registration
        const registration = await Registration.create({
          userId: participant._id,
          eventId: event._id,
          status: 'Registered',
          ticketId: `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          registrationDate: new Date(),
          paymentStatus: event.registrationFee > 0 ? 'Paid' : 'Free',
          formData: event.eventType === 'Normal' ? { name: participant.firstName } : {}
        });

        registrationCount++;
        console.log(`  ✓ Registered ${participant.firstName} for ${event.eventName}`);
      }
    }

    console.log(`\n✅ Created ${registrationCount} registrations!`);
    console.log('\n🔥 Now refresh the Browse Events page to see trending events!\n');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedTrendingData();
