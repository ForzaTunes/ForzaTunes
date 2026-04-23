import { useState } from "react";

interface ProfileShareButtonProps {
  /** Path to the canonical, publicly-shareable profile URL (e.g. `/u/k3M2pQ1aZv`). */
  publicPath: string;
  /** Display name used in the native share sheet when available. */
  displayName: string;
  /** If true, copy framing tilts to "this is me"; otherwise "check them out". */
  isOwner: boolean;
}

type ShareState = "idle" | "shared" | "copied" | "failed";

const RESET_MS = 1600;

/**
 * Native share is only used on actual mobile devices. Desktop browsers that
 * implement `navigator.share` (e.g. Edge, Safari 16+) open an OS share sheet
 * that is usually worse UX than just copying the link.
 */
function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const uaData = (navigator as Navigator & {
    userAgentData?: { mobile?: boolean };
  }).userAgentData;
  if (uaData && typeof uaData.mobile === "boolean") return uaData.mobile;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function ShareIcon({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function CheckIcon({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function ProfileShareButton({
  publicPath,
  displayName,
  isOwner,
}: ProfileShareButtonProps) {
  const [state, setState] = useState<ShareState>("idle");

  const resolveUrl = (): string => {
    if (typeof window === "undefined") return publicPath;
    return new URL(publicPath, window.location.origin).toString();
  };

  const flash = (next: Exclude<ShareState, "idle">) => {
    setState(next);
    window.setTimeout(() => setState("idle"), RESET_MS);
  };

  const handleClick = async () => {
    const url = resolveUrl();
    const shareData: ShareData = {
      title: `${displayName} on ForzaTunes`,
      text: isOwner
        ? `Check out my tunes on ForzaTunes.`
        : `Check out ${displayName}'s tunes on ForzaTunes.`,
      url,
    };

    if (isMobileDevice() && navigator.share) {
      try {
        await navigator.share(shareData);
        flash("shared");
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      flash("copied");
    } catch {
      flash("failed");
    }
  };

  const label =
    state === "shared"
      ? "Shared"
      : state === "copied"
      ? "Link copied"
      : state === "failed"
      ? "Copy failed"
      : "Share";

  const Icon =
    state === "shared" || state === "copied"
      ? CheckIcon
      : state === "failed"
      ? XIcon
      : ShareIcon;

  const isFeedback = state !== "idle";
  const feedbackTone =
    state === "failed"
      ? "border-red-500/60 text-red-300"
      : "border-accent-500 text-accent-300";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`${label} ${displayName}'s profile`}
      className={`inline-flex items-center gap-2 px-3 h-8 text-xs font-heading font-bold uppercase tracking-widest border bg-gray-900 transition-colors focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none ${
        isFeedback
          ? feedbackTone
          : "border-gray-700 text-gray-300 hover:border-accent-500 hover:text-accent-300"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );
}
