import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "local_dev_secret";

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.status(200).json({ user: decoded });
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
