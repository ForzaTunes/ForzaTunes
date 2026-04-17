import { contentFilter } from "./contentFilterInstance";

export interface GamertagValidationResult {
  valid: boolean;
  error?: string;
  normalized?: string;
}

const MIN_LENGTH = 2;
const MAX_LENGTH = 50;
const ALLOWED_PATTERN = /^[A-Za-z0-9 _'#-]+$/;

export class GamertagValidator {
  validate(raw: unknown): GamertagValidationResult {
    if (typeof raw !== "string") {
      return { valid: false, error: "Gamertag is required" };
    }

    const trimmed = raw.trim();

    if (trimmed.length < MIN_LENGTH) {
      return {
        valid: false,
        error: `Gamertag must be at least ${MIN_LENGTH} characters`,
      };
    }

    if (trimmed.length > MAX_LENGTH) {
      return {
        valid: false,
        error: `Gamertag must be ${MAX_LENGTH} characters or fewer`,
      };
    }

    if (!ALLOWED_PATTERN.test(trimmed)) {
      return {
        valid: false,
        error:
          "Gamertag can only contain letters, numbers, spaces, and _ ' # -",
      };
    }

    if (!contentFilter.check(trimmed).clean) {
      return {
        valid: false,
        error: "Gamertag contains inappropriate language",
      };
    }

    return { valid: true, normalized: trimmed };
  }
}
