export interface ShareCodeValidationResult {
  valid: boolean;
  error?: string;
  normalized: string;
}

export class ShareCodeValidator {
  validate(
    shareCode: string,
    shareCodeLength: number,
  ): ShareCodeValidationResult {
    if (!shareCode || typeof shareCode !== "string") {
      return { valid: false, error: "Share code is required", normalized: "" };
    }

    const normalized = shareCode.replace(/[\s\-]/g, "");

    if (normalized.length === 0) {
      return { valid: false, error: "Share code is required", normalized: "" };
    }

    if (!/^\d+$/.test(normalized)) {
      return {
        valid: false,
        error: "Share code must contain only digits",
        normalized,
      };
    }

    if (normalized.length !== shareCodeLength) {
      return {
        valid: false,
        error: `Share code must be exactly ${shareCodeLength} digits`,
        normalized,
      };
    }

    return { valid: true, normalized };
  }
}
