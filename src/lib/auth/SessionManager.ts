export interface SessionPayload {
  userId: number;
  username: string;
  avatarUrl: string | null;
  exp: number;
}

export interface CookieConfig {
  name: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
}

function base64UrlEncode(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export class SessionManager {
  private secret: string;
  private static readonly ALGORITHM = "AES-GCM";
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;
  private static readonly SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
  static readonly COOKIE_NAME = "ft_session";

  constructor(secret: string) {
    this.secret = secret;
  }

  getCookieConfig(): CookieConfig {
    return {
      name: SessionManager.COOKIE_NAME,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    };
  }

  async createSession(user: {
    id: number;
    username: string;
    avatarUrl: string | null;
  }): Promise<string> {
    const payload: SessionPayload = {
      userId: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      exp: Date.now() + SessionManager.SESSION_DURATION_MS,
    };
    return this.encrypt(JSON.stringify(payload));
  }

  async validateSession(cookieValue: string): Promise<SessionPayload | null> {
    const json = await this.decrypt(cookieValue);
    if (!json) return null;

    try {
      const payload = JSON.parse(json) as SessionPayload;
      if (
        typeof payload.userId !== "number" ||
        !Number.isInteger(payload.userId) ||
        payload.userId < 1
      ) {
        return null;
      }
      if (typeof payload.username !== "string" || payload.username.length === 0) {
        return null;
      }
      if (typeof payload.exp !== "number" || Date.now() > payload.exp) {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }

  private async deriveKey(secret: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      "PBKDF2",
      false,
      ["deriveKey"],
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode("forzatunes-session-salt"),
        iterations: 100_000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: SessionManager.ALGORITHM, length: SessionManager.KEY_LENGTH },
      false,
      ["encrypt", "decrypt"],
    );
  }

  private async encrypt(plaintext: string): Promise<string> {
    const key = await this.deriveKey(this.secret);
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(SessionManager.IV_LENGTH));

    const ciphertext = await crypto.subtle.encrypt(
      { name: SessionManager.ALGORITHM, iv },
      key,
      encoder.encode(plaintext),
    );

    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return base64UrlEncode(combined);
  }

  private async decrypt(ciphertext: string): Promise<string | null> {
    try {
      const key = await this.deriveKey(this.secret);
      const combined = base64UrlDecode(ciphertext);

      if (combined.length < SessionManager.IV_LENGTH + 1) return null;

      const iv = combined.slice(0, SessionManager.IV_LENGTH);
      const encrypted = combined.slice(SessionManager.IV_LENGTH);

      const decrypted = await crypto.subtle.decrypt(
        { name: SessionManager.ALGORITHM, iv },
        key,
        encrypted,
      );

      return new TextDecoder().decode(decrypted);
    } catch {
      return null;
    }
  }
}
