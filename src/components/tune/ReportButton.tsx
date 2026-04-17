import { useState, useRef, useEffect, useLayoutEffect } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";

interface ReportButtonProps {
  tuneId: number;
  isLoggedIn: boolean;
  variant?: "default" | "icon";
}

const REASONS = [
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "spam", label: "Spam" },
  { value: "wrong_info", label: "Wrong information" },
  { value: "other", label: "Other" },
];

const PANEL_GAP_PX = 8;

export default function ReportButton({ tuneId, isLoggedIn, variant = "default" }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error" | "duplicate">("idle");
  const [mounted, setMounted] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const isIcon = variant === "icon";

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;

    function updatePosition() {
      const btn = buttonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      if (isIcon) {
        setPanelStyle({
          position: "fixed",
          bottom: window.innerHeight - rect.top + PANEL_GAP_PX,
          left: rect.left,
        });
      } else {
        setPanelStyle({
          position: "fixed",
          top: rect.bottom + PANEL_GAP_PX,
          right: window.innerWidth - rect.right,
        });
      }
    }

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, isIcon]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!isLoggedIn) return null;
  if (status === "done") {
    return <span className="text-xs text-gray-500">Reported</span>;
  }

  async function handleSubmit() {
    if (!reason) return;
    setStatus("submitting");

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tuneId, reason, details: details || undefined }),
      });

      if (res.status === 409) {
        setStatus("duplicate");
        return;
      }

      if (!res.ok) {
        setStatus("error");
        return;
      }

      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  const triggerClass = isIcon
    ? "inline-flex items-center text-red-500/40 hover:text-red-500 focus-visible:text-red-500 transition-colors p-1"
    : "inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-200 transition-colors";

  const panel = (
    <div
      ref={panelRef}
      style={panelStyle}
      className="w-72 bg-gray-900 border border-gray-700 shadow-xl z-[100] p-4"
    >
      <h4 className="text-sm font-medium text-white mb-3">Report Tune</h4>

      {status === "duplicate" && (
        <p className="text-xs text-yellow-400 mb-2">You already reported this tune.</p>
      )}
      {status === "error" && (
        <p className="text-xs text-red-400 mb-2">Something went wrong. Try again.</p>
      )}

      <div className="space-y-2 mb-3">
        {REASONS.map((r) => (
          <label key={r.value} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="radio"
              name="report-reason"
              value={r.value}
              checked={reason === r.value}
              onChange={() => setReason(r.value)}
              className="accent-accent-500"
            />
            {r.label}
          </label>
        ))}
      </div>

      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder="Additional details (optional)"
        maxLength={500}
        rows={2}
        className="w-full bg-gray-800 border border-gray-700 text-sm text-gray-300 p-2 resize-none focus:outline-none focus:border-gray-500"
      />

      <div className="flex justify-end gap-2 mt-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!reason || status === "submitting"}
          className="px-3 py-1.5 text-xs bg-red-700 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === "submitting" ? "Submitting..." : "Submit Report"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={triggerClass}
        title="Report this tune"
        aria-label="Report this tune"
      >
        <svg className={isIcon ? "w-5 h-5" : "w-4 h-4"} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 3a1 1 0 0 0-1 1v17a1 1 0 1 0 2 0v-7.382l1.553-.776a6 6 0 0 1 5.4.068l.494.247a8 8 0 0 0 7.199.09l.806-.403A1 1 0 0 0 22 12v-7a1 1 0 0 0-1.447-.894l-.806.403a6 6 0 0 1-5.4-.068l-.494-.247a8 8 0 0 0-7.199-.09L6 4.382V4a1 1 0 0 0-1-1Z" />
        </svg>
        {!isIcon && <span>Report</span>}
      </button>

      {open && mounted && createPortal(panel, document.body)}
    </>
  );
}
