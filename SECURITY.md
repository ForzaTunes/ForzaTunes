# Security Policy

## Supported Versions

ForzaTunes is deployed as a single rolling release from the `main` branch.
Only the currently deployed version at https://forzatunes.com is supported
for security updates.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues,
pull requests, or discussions.**

If you believe you have found a security vulnerability in ForzaTunes, report
it privately using one of the following:

- **GitHub Security Advisories** — preferred. Use the
  [Security tab](https://github.com/forzatunes/forzatunes/security/advisories/new)
  on the repository and click "Report a vulnerability". This keeps the report
  private until a fix is ready.
- **Email** — send a description to the maintainer listed in
  [CODEOWNERS](./.github/CODEOWNERS). Please use a clear subject like
  "ForzaTunes security report".

Include, if possible:

- A description of the issue and its impact.
- Steps to reproduce (URL, payload, expected vs actual behaviour).
- Whether the issue is exploitable anonymously or requires an account.
- Your name / handle for credit, or a note if you'd prefer to stay anonymous.

## Scope

In scope:

- The code in this repository.
- The production deployment at https://forzatunes.com (session handling,
  OAuth flow, tune submission, star/report endpoints, profile pages).

Out of scope:

- Third-party services (Cloudflare, Discord, GitHub) — report those to the
  respective vendors.
- Denial-of-service, volumetric attacks, or automated scanner output without
  a concrete exploit.
- Social engineering of contributors or users.
- Findings that require a compromised client or rooted device.

## Response Expectations

This is a community-run open-source project maintained by volunteers. We
will aim to:

- Acknowledge receipt within 72 hours.
- Provide an initial assessment within 7 days.
- Release a fix for confirmed issues as quickly as practical, and credit the
  reporter in the release notes unless they prefer otherwise.

Thank you for helping keep ForzaTunes and its users safe.
