// api/getPreparedMessage.js

const axios = require('axios');

module.exports = async (req, res) => {
  console.log("Incoming request to /getPreparedMessage");
  console.log("Request method:", req.method);

  res.setHeader('Access-Control-Allow-Origin', 'https://miniappre.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS preflight");
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.error("Method not allowed:", req.method);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { user_id } = req.body;
  console.log("Received user_id:", user_id);

  if (!user_id) {
    console.error("user_id is missing in request body.");
    return res.status(400).json({ error: 'user_id is required.' });
  }

  const BOT_TOKEN = process.env.TELE_TOKEN;
  if (!BOT_TOKEN) {
    console.error("BOT_TOKEN not found in env variables.");
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    // show exactly what we're posting to Telegram's API
    console.log("Posting to Telegram API with user_id:", user_id);
    const response = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/savePreparedInlineMessage`,
      {
        user_id: user_id,
        result: {
          type: 'article',
          id: 'unique-id-' + Date.now(),
          title: 'Join Tap Mianus!',
          input_message_content: {
            message_text: `I'm inviting you to Tap Mianus! Here's the link: https://t.me/TapMianusBot?start=r${user_id}`,
          },
          description: 'Tap Mianus is awesome!',
          thumb_url: 'https://miniappre.vercel.app/coinsmall.webp', // Ensure this URL is valid
        },
        allow_user_chats: true,
        allow_bot_chats: false,
        allow_group_chats: false,
        allow_channel_chats: false,
      }
    );

    console.log("Response from Telegram API:", response.data);

    if (response.data.ok) {
      const preparedMessageId = response.data.result.id;
      console.log("Prepared Message ID from Telegram:", preparedMessageId);
      return res.status(200).json({ prepared_message_id: preparedMessageId });
    } else {
      console.error("Telegram API returned error:", response.data);
      return res.status(500).json({ error: 'Failed to prepare message' });
    }
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: 'Server error' });
  }
};