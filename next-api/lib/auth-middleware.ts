import { verifyToken } from "@/lib/jwt";

export function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

export function verifyAuth(request: Request) {
  const token = getBearerToken(request);
  if (!token) return null;
  return verifyToken(token);
}

export function verifyAdminKey(request: Request) {
  const adminKey = request.headers.get("X-Admin-Key");
  const expectedKey = process.env.ADMIN_KEY || "your_admin_key_here";
  return adminKey === expectedKey;
}
