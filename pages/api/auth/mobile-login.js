// pages/api/auth/mobile-login.js
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "local_dev_secret";

// paprastas user paieškos pavyzdys
async function getUserByEmail(email) {
  if (email === "demo@demo.lt") {
    return {
      id: "1",
      name: "Demo User",
      email,
      passwordHash: await bcrypt.hash("demo123", 10),
    };
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.status(200).json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
}
