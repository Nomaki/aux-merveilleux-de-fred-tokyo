// CommonJS format for Vercel serverless
module.exports = async (req, res) => {
  console.log('✅ Webhook hit - CommonJS');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({
    received: true,
    message: 'Webhook working - CommonJS format'
  });
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
