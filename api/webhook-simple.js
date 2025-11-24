// Minimal webhook for testing
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log('✅ Webhook called:', new Date().toISOString());
  console.log('Method:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read body
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks).toString();
    console.log('Body length:', body.length);

    const event = JSON.parse(body);
    console.log('Event type:', event.type);

    return res.status(200).json({ received: true, type: event.type });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
