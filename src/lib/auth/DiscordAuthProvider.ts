import type { AuthProvider, AuthTokens, ProviderProfile } from "./AuthProvider";

export class DiscordAuthProvider implements AuthProvider {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  private static readonly AUTH_URL = "https://discord.com/oauth2/authorize";
  private static readonly TOKEN_URL = "https://discord.com/api/oauth2/token";
  private static readonly USER_URL = "https://discord.com/api/users/@me";
  private static readonly CDN_URL = "https://cdn.discordapp.com";

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: "identify",
      state,
    });
    return `${DiscordAuthProvider.AUTH_URL}?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<AuthTokens> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: this.redirectUri,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    const response = await fetch(DiscordAuthProvider.TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Discord token exchange failed (${response.status}): ${errorBody}`,
      );
    }

    const data = (await response.json()) as {
      access_token: string;
      token_type: string;
      expires_in: number;
      refresh_token?: string;
      scope: string;
    };

    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      refreshToken: data.refresh_token,
      scope: data.scope,
    };
  }

  async getUserProfile(accessToken: string): Promise<ProviderProfile> {
    const response = await fetch(DiscordAuthProvider.USER_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Discord user fetch failed (${response.status}): ${errorBody}`,
      );
    }

    const user = (await response.json()) as {
      id: string;
      username: string;
      avatar: string | null;
    };

    return {
      providerId: user.id,
      username: user.username,
      avatarUrl: this.buildAvatarUrl(user.id, user.avatar),
    };
  }

  private buildAvatarUrl(
    userId: string,
    avatarHash: string | null,
  ): string | null {
    if (!avatarHash) return null;
    return `${DiscordAuthProvider.CDN_URL}/avatars/${userId}/${avatarHash}.png`;
  }
}
