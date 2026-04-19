import { useEffect, useRef, useState } from "react";
import StarBurstOverlay from "./StarBurstOverlay";

const BURST_DURATION_MS = 650;

interface StarButtonProps {
  tuneId: number;
  initialStarred: boolean;
  initialCount: number;
  isLoggedIn: boolean;
  variant?: "default" | "pill";
}

function StarFilledIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function StarOutlineIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function StarButton({
  tuneId,
  initialStarred,
  initialCount,
  isLoggedIn,
  variant = "default",
}: StarButtonProps) {
  const [starred, setStarred] = useState(initialStarred);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  const [bursting, setBursting] = useState(false);
  const burstTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
    };
  }, []);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      const currentPath = encodeURIComponent(window.location.pathname);
      window.location.href = `/auth/login?redirect=${currentPath}`;
      return;
    }

    if (pending) return;

    const previousStarred = starred;
    const previousCount = count;
    setStarred(!starred);
    setCount(starred ? count - 1 : count + 1);
    setPending(true);

    if (!previousStarred) {
      if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
      setBursting(true);
      burstTimeoutRef.current = setTimeout(
        () => setBursting(false),
        BURST_DURATION_MS,
      );
    }

    try {
      const response = await fetch("/api/stars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tuneId }),
      });

      if (!response.ok) {
        setStarred(previousStarred);
        setCount(previousCount);
        return;
      }

      const data: { starred: boolean; starCount: number } =
        await response.json();
      setStarred(data.starred);
      setCount(data.starCount);
    } catch {
      setStarred(previousStarred);
      setCount(previousCount);
    } finally {
      setPending(false);
    }
  }

  const ariaLabel = starred
    ? "Unstar this tune"
    : "Star this tune to save it for later";
  const tooltip = starred
    ? "Unstar this tune"
    : "Star this tune to save it for later";

  if (variant === "pill") {
    const starsWord = count === 1 ? "STAR" : "STARS";

    const frameClasses = starred
      ? "border-gray-700 divide-gray-700 hover:border-accent-500"
      : "border-accent-500 divide-accent-500/40 hover:border-accent-400";

    const iconChipClasses = starred
      ? "bg-gray-900 text-yellow-400"
      : "bg-accent-500/15 text-accent-300";

    return (
      <span className="relative inline-flex">
        <button
          onClick={handleClick}
          disabled={pending}
          aria-label={ariaLabel}
          title={tooltip}
          className={`inline-flex items-stretch text-sm font-heading font-bold uppercase tracking-widest border divide-x transition-colors ${frameClasses} ${
            pending ? "cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          <span className="px-3 py-1.5 bg-gray-950/60 flex items-center gap-1.5">
            <span className={starred ? "text-accent-400" : "text-white"}>
              {count}
            </span>
            <span className="text-gray-300">{starsWord}</span>
          </span>
          <span className={`px-3 py-1.5 flex items-center ${iconChipClasses}`}>
            <span className={bursting ? "fz-star-pop" : "inline-flex"}>
              {starred ? (
                <StarFilledIcon className="w-5 h-5" />
              ) : (
                <StarOutlineIcon className="w-5 h-5" />
              )}
            </span>
          </span>
        </button>
        <StarBurstOverlay active={bursting} />
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-sm transition-colors duration-150 ${
        pending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${
        starred
          ? "text-yellow-400 hover:text-yellow-300"
          : "text-gray-400 hover:text-yellow-400"
      }`}
    >
      {starred ? (
        <StarFilledIcon className="w-5 h-5" />
      ) : (
        <StarOutlineIcon className="w-5 h-5" />
      )}
      <span>{count}</span>
    </button>
  );
}
