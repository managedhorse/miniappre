module.exports = async (req, res) => {
  console.log("Incoming request to /getPreparedMessage");
  console.log("Request method:", req.method);

  res.setHeader('Access-Control-Allow-Origin', 'https://miniappre.vercel.app');
  // etc...

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
        // ...
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