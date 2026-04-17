import type { UserProfile } from "../models";
import type { UserRow } from "./interfaces";

export function mapRowToUserProfile(row: UserRow): UserProfile {
  return {
    id: row.id,
    username: row.username,
    avatarUrl: row.avatar_url,
    forzaGamertag: row.forza_gamertag,
    createdAt: row.created_at,
  };
}
