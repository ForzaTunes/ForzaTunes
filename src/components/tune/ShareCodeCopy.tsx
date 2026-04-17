import { useState } from "react";

interface ShareCodeCopyProps {
  code: string;
  size?: "sm" | "lg";
}

function formatCode(code: string): string {
  return code
    .replace(/\D/g, "")
    .replace(/(.{3})/g, "$1 ")
    .trim();
}

function CopyIcon({ className }: { className: string }) {
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
      <rect x="9" y="9" width="11" height="11" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
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

export default function ShareCodeCopy({ code, size = "sm" }: ShareCodeCopyProps) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const rawCode = code.replace(/\D/g, "");
  const formatted = formatCode(code);

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setFailed(false);
    try {
      await navigator.clipboard.writeText(rawCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setFailed(true);
      setTimeout(() => setFailed(false), 1500);
    }
  }

  const sizeClasses =
    size === "lg"
      ? "text-3xl px-6 py-3 gap-3 w-full justify-between"
      : "text-sm px-2 py-0.5 gap-2";
  const iconSize = size === "lg" ? "h-6 w-6" : "h-4 w-4";
  const iconColor = copied
    ? "text-green-400"
    : failed
    ? "text-red-400"
    : "text-gray-500";
  const statusLabel = copied ? "Copied" : failed ? "Copy failed" : "Copy";

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`${statusLabel} share code ${formatted}`}
      className={`inline-flex items-center font-mono tracking-widest bg-gray-800 text-accent-400 hover:bg-gray-700 transition-colors focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none ${sizeClasses}`}
    >
      <span>{formatted}</span>
      <span className={iconColor}>
        {copied ? (
          <CheckIcon className={iconSize} />
        ) : failed ? (
          <XIcon className={iconSize} />
        ) : (
          <CopyIcon className={iconSize} />
        )}
      </span>
    </button>
  );
}
