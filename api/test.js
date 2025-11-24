// Absolute minimal test endpoint
export default function handler(req, res) {
  res.status(200).json({
    working: true,
    method: req.method,
    timestamp: new Date().toISOString()
  });
}
