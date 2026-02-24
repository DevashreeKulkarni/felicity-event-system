const axios = require('axios');

/**
 * Send Discord notification when a user registers for an event
 */
const sendDiscordNotification = async (webhookUrl, eventData, participantData) => {
  if (!webhookUrl) {
    console.log('No Discord webhook URL provided');
    return;
  }

  try {
    const embed = {
      title: '🎉 New Event Registration!',
      color: 0x6B46C1, // Purple color
      fields: [
        {
          name: '📅 Event',
          value: eventData.eventName,
          inline: false
        },
        {
          name: '👤 Participant',
          value: `${participantData.firstName} ${participantData.lastName}`,
          inline: true
        },
        {
          name: '📧 Email',
          value: participantData.email,
          inline: true
        },
        {
          name: '🎫 Ticket ID',
          value: participantData.ticketId,
          inline: false
        },
        {
          name: '💰 Fee',
          value: `₹${eventData.registrationFee || 0}`,
          inline: true
        },
        {
          name: '📊 Total Registrations',
          value: `${eventData.currentRegistrations || 1}`,
          inline: true
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Felicity Event Management System'
      }
    };

    await axios.post(webhookUrl, {
      embeds: [embed]
    });

    console.log('Discord notification sent successfully');
  } catch (error) {
    console.error('Discord notification error:', error.message);
    // Don't throw error - webhook failure shouldn't break registration
  }
};

module.exports = {
  sendDiscordNotification
};
