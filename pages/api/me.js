import { verifyBearerToken } from "../../lib/auth";

export default async function handler(req, res) {
  // bandome paimti iš JWT
  const user = verifyBearerToken(req.headers.authorization);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return res.status(200).json({
    id: user.sub,
    name: user.name,
    email: user.email,
  });
}
