import type { CpeakRequest as Request } from "cpeak";
import keys from "../config/keys.js";

export interface Util {
  getClientIp(req: Request): string | null;
}

/**
 * Resolve the real client IP address.
 *
 * By default we trust only `socket.remoteAddress` — the address of the peer we
 * actually accepted the connection from. `x-forwarded-for` is client-spoofable
 * unless a trusted proxy (load balancer, Cloudflare, etc.) overwrites it, so it
 * is only consulted when TRUST_PROXY=true is set.
 */
function getClientIp(req: Request): string | null {
  if (keys.trustProxy) {
    const forwarded = req.headers["x-forwarded-for"];
    const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const ip = raw ? raw.split(",")[0].trim() : "";
    if (ip) return ip;
  }

  return req.socket.remoteAddress || null;
}

const util: Util = {
  getClientIp,
};

export default util;