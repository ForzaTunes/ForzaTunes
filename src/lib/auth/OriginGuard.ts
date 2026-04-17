export class OriginGuard {
  isSameOriginRequest(request: Request): boolean {
    const requestUrl = new URL(request.url);
    const expectedOrigin = requestUrl.origin;

    const origin = request.headers.get("origin");
    if (origin) {
      return origin === expectedOrigin;
    }

    const referer = request.headers.get("referer");
    if (referer) {
      try {
        return new URL(referer).origin === expectedOrigin;
      } catch {
        return false;
      }
    }

    return false;
  }
}
