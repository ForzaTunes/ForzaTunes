export interface AuthTokens {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken?: string;
  scope: string;
}

export interface ProviderProfile {
  providerId: string;
  username: string;
  avatarUrl: string | null;
}

export interface AuthProvider {
  getAuthUrl(state: string): string;
  exchangeCode(code: string): Promise<AuthTokens>;
  getUserProfile(accessToken: string): Promise<ProviderProfile>;
}
