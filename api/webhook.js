// Ultra minimal webhook - NO imports
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log('✅ Webhook called - NO IMPORTS');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read body without imports
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks).toString();
    const event = JSON.parse(body);

    console.log('Event type:', event.type);
    console.log('Event ID:', event.id);

    return res.status(200).json({
      received: true,
      type: event.type,
      message: 'Webhook working without imports'
    });
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
