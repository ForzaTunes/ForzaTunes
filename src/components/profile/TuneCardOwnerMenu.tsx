import { useEffect, useRef, useState } from "react";

interface TuneCardOwnerMenuProps {
  tuneId: number;
  gameSlug: string;
  tuneTitle: string;
}

export default function TuneCardOwnerMenu({
  tuneId,
  gameSlug,
  tuneTitle,
}: TuneCardOwnerMenuProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function stop(e: React.MouseEvent | React.KeyboardEvent) {
    e.stopPropagation();
    e.preventDefault();
  }

  function toggle(e: React.MouseEvent) {
    stop(e);
    setOpen((v) => !v);
    setError(null);
  }

  async function handleDelete(e: React.MouseEvent) {
    stop(e);
    if (deleting) return;
    const confirmed = window.confirm(
      `Delete "${tuneTitle}"? This action cannot be undone.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tunes/${tuneId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to delete tune");
        setDeleting(false);
        return;
      }
      window.location.reload();
    } catch {
      setError("Network error. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${tuneTitle}`}
        className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="4" cy="10" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="16" cy="10" r="1.5" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 bottom-full mb-1 min-w-[9rem] bg-gray-900 border border-gray-700 shadow-xl z-30"
        >
          <a
            href={`/${gameSlug}/tunes/${tuneId}/edit`}
            role="menuitem"
            onClick={(e) => e.stopPropagation()}
            className="block px-3 py-2 text-sm font-heading uppercase tracking-wider text-gray-200 hover:bg-gray-800 transition-colors"
          >
            Edit
          </a>
          <button
            type="button"
            role="menuitem"
            onClick={handleDelete}
            disabled={deleting}
            className="block w-full text-left px-3 py-2 text-sm font-heading uppercase tracking-wider text-red-400 hover:bg-red-900/40 disabled:opacity-50 transition-colors"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
          {error && (
            <p
              role="alert"
              className="px-3 py-2 text-[11px] text-red-400 border-t border-gray-700"
            >
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
