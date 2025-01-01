const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const BOT_TOKEN = process.env.TELE_TOKEN;

// Endpoint to prepare a message for sharing
app.post('/api/getPreparedMessage', async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    console.error('No user_id provided in the request body.');
    return res.status(400).json({ error: 'user_id is required.' });
  }

  try {
    // Prepare the inline message
    const response = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/savePreparedInlineMessage`,
      {
        user_id: user_id,
        result: {
          type: 'article',
          id: 'unique-id-' + Date.now(), // Ensure unique ID
          title: 'Join Tap Mianus!',
          input_message_content: {
            message_text: `Join Tap Mianus using my invite link: https://t.me/tap_mianus_bot?start=r${user_id}`,
          },
          description: 'Tap Mianus is awesome!',
          thumb_url: 'https://example.com/thumbnail.jpg', // Ensure this URL is valid
        },
        allow_user_chats: true,
        allow_bot_chats: false,
        allow_group_chats: false,
        allow_channel_chats: false,
      }
    );

    console.log('Telegram API Response:', response.data);

    if (response.data.ok) {
      const preparedMessageId = response.data.result.id;
      console.log(`Prepared Message ID: ${preparedMessageId}`);
      res.json({ prepared_message_id: preparedMessageId });
    } else {
      console.error('Error from Telegram API:', response.data);
      res.status(500).json({ error: 'Failed to prepare message' });
    }
  } catch (error) {
    console.error('Error preparing message:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start your server
const PORT = process.env.PORT || 5001; // Choose a suitable port
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
