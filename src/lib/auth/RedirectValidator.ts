export class RedirectValidator {
  private static readonly DEFAULT_SAFE = "/";

  isSafeReturnUrl(value: unknown): boolean {
    if (typeof value !== "string") return false;
    if (value.length === 0 || value.length > 512) return false;
    if (!value.startsWith("/")) return false;
    if (value.startsWith("//")) return false;
    if (value.startsWith("/\\")) return false;
    if (value.includes("\\")) return false;
    if (value.includes("\u0000")) return false;
    return true;
  }

  sanitize(value: unknown): string {
    return this.isSafeReturnUrl(value)
      ? (value as string)
      : RedirectValidator.DEFAULT_SAFE;
  }
}
