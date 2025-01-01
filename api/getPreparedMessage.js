// api/getPreparedMessage.js

const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required.' });
  }

  const BOT_TOKEN = process.env.TELE_TOKEN;

  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/savePreparedInlineMessage`,
      {
        user_id: user_id,
        result: {
          type: 'article',
          id: 'unique-id-' + Date.now(),
          title: 'Join Tap Mianus!',
          input_message_content: {
            message_text: `Join Tap Mianus using my invite link: https://t.me/tap_mianus_bot?start=r${user_id}`,
          },
          description: 'Tap Mianus is awesome!',
          thumb_url: 'https://shmexicans.vercel.app/images/coinsmall.webp', // Ensure this URL is valid
        },
        allow_user_chats: true,
        allow_bot_chats: false,
        allow_group_chats: false,
        allow_channel_chats: false,
      }
    );

    if (response.data.ok) {
      const preparedMessageId = response.data.result.id;
      return res.status(200).json({ prepared_message_id: preparedMessageId });
    } else {
      return res.status(500).json({ error: 'Failed to prepare message' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};