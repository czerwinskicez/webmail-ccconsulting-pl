import "server-only";
import { isAuthenticated } from "@/lib/auth";

export async function isAuthorizedMutation(request: Request): Promise<boolean> {
  if (!(await isAuthenticated())) return false;
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
