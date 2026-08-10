import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  // Look for the token in the Authorization header: "Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // Verify the token using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded; // Attach the decoded payload to the request object
    
    next(); // Security passed! Move on to the actual controller function
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};