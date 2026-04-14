import tls from "node:tls";
import { Agent, type buildConnector } from "undici";

/**
 * Creates an undici Agent whose every outbound TCP/TLS connection is pinned to
 * a pre-validated IP address. `hostname` is preserved for:
 *   - TLS SNI, so the peer certificate is validated against the correct name.
 *   - The HTTP `Host` header (set by undici from the URL, not the connect hook).
 *
 * Pinning eliminates the TOCTOU window exploited by DNS-rebinding attacks:
 * once `resolveAndCheckPrivateIP` validates the IP, no second DNS lookup ever
 * happens — the socket opens directly against the returned IP.
 */
export function createPinnedAgent(ip: string, hostname: string): Agent {
  const connect: buildConnector.connector = (opts, cb) => {
    const port = Number.parseInt(opts.port, 10) || 443;
    const socket = tls.connect({
      host: ip, // TCP target: pre-validated IP, not the URL's hostname
      port,
      servername: opts.servername ?? hostname, // SNI: original hostname
    });
    socket.once("secureConnect", () => cb(null, socket));
    socket.once("error", (err) => cb(err as Error, null));
  };

  return new Agent({ connect });
}
