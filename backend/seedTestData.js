const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const Organizer = require('./models/Organizer');
const Event = require('./models/Event');

dotenv.config();

const seedTestData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected\n');

    // Create test organizer
    console.log('Creating test organizer...');
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('TestOrg@123', salt);

    const organizer = await Organizer.create({
      organizerName: 'Sports Club',
      category: 'Sports',
      description: 'Official Sports Events Organizer',
      contactEmail: 'sportsclub@felicity.com',
      password: hashedPassword,
      contactNumber: '9876543210',
      isApproved: true
    });

    console.log('✓ Organizer created:', organizer.organizerName);
    console.log('  Email:', organizer.contactEmail);
    console.log('  Password: TestOrg@123\n');

    // Create test events
    console.log('Creating test events...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const events = [
      {
        eventName: 'Basketball Tournament',
        eventDescription: 'Annual inter-college basketball championship with exciting prizes',
        eventType: 'Normal',
        eligibility: 'IIIT Students',
        registrationDeadline: tomorrow,
        eventStartDate: nextWeek,
        eventEndDate: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000),
        registrationLimit: 50,
        registrationFee: 100,
        venue: 'Sports Complex',
        organizerId: organizer._id,
        eventTags: ['sports', 'tournament', 'basketball'],
        status: 'Published'
      },
      {
        eventName: 'Cricket Match',
        eventDescription: 'Friendly cricket match - teams of 11 players',
        eventType: 'Normal',
        eligibility: 'All',
        registrationDeadline: tomorrow,
        eventStartDate: new Date(nextWeek.getTime() + 3 * 24 * 60 * 60 * 1000),
        eventEndDate: new Date(nextWeek.getTime() + 3 * 24 * 60 * 60 * 1000),
        registrationLimit: 30,
        registrationFee: 50,
        venue: 'Cricket Ground',
        organizerId: organizer._id,
        eventTags: ['sports', 'cricket'],
        status: 'Published'
      },
      {
        eventName: 'Sports Merchandise',
        eventDescription: 'Official Sports Club T-shirts and jerseys',
        eventType: 'Merchandise',
        eligibility: 'All',
        registrationDeadline: new Date(nextWeek.getTime() + 10 * 24 * 60 * 60 * 1000),
        eventStartDate: nextWeek,
        eventEndDate: new Date(nextWeek.getTime() + 15 * 24 * 60 * 60 * 1000),
        registrationLimit: 100,
        registrationFee: 499,
        venue: 'Online',
        organizerId: organizer._id,
        eventTags: ['merchandise', 'sports'],
        status: 'Published',
        merchandiseDetails: {
          itemDetails: 'T-shirts (S, M, L, XL), Jerseys',
          stockQuantity: 100,
          purchaseLimit: 2
        }
      }
    ];

    const createdEvents = await Event.insertMany(events);
    console.log(`✓ Created ${createdEvents.length} events:\n`);
    
    createdEvents.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.eventName} (${event.status})`);
    });

    console.log('\n' + '='.repeat(50));
    console.log('✅ TEST DATA SEEDED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\n📋 LOGIN CREDENTIALS:\n');
    console.log('Organizer:');
    console.log('  Email: sportsclub@felicity.com');
    console.log('  Password: TestOrg@123');
    console.log('\nAdmin:');
    console.log('  Email: admin@felicity.com');
    console.log('  Password: Admin@123');
    console.log('\n🎯 Now you can:');
    console.log('  1. Login as organizer to manage events');
    console.log('  2. Register as participant to browse and register for events');
    console.log('  3. Login as admin to create more organizers\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    process.exit(1);
  }
};

seedTestData();
