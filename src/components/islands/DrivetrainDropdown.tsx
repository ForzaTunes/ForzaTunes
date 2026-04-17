import { useEffect, useRef, useState } from "react";
import DrivetrainPills from "./DrivetrainPills";

type Drivetrain = "FWD" | "RWD" | "AWD";

interface DrivetrainDropdownProps {
  selected: Drivetrain[];
  onApply: (next: Drivetrain[]) => void;
  buttonClassName: string;
  panelAlign?: "left" | "right";
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 text-gray-400 transition-transform shrink-0 ${
        open ? "rotate-180" : ""
      }`}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="5 8 10 13 15 8" />
    </svg>
  );
}

function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  const s1 = [...a].sort();
  const s2 = [...b].sort();
  return s1.every((v, i) => v === s2[i]);
}

function buildButtonLabel(selected: Drivetrain[]): string {
  if (selected.length === 0) return "All Drivetrains";
  if (selected.length === 1) return selected[0];
  return selected.join(", ");
}

export default function DrivetrainDropdown({
  selected,
  onApply,
  buttonClassName,
  panelAlign = "left",
}: DrivetrainDropdownProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Drivetrain[]>(selected);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(selected);
  }, [selected]);

  function commitIfChanged() {
    if (!arraysEqual(draft, selected)) onApply(draft);
  }

  function closeAndCommit() {
    commitIfChanged();
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    function handleMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        closeAndCommit();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDraft(selected);
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, draft, selected]);

  const isActive = selected.length > 0;
  const label = buildButtonLabel(selected);

  return (
    <div className="relative flex" ref={rootRef}>
      <button
        type="button"
        onClick={() => {
          if (open) closeAndCommit();
          else setOpen(true);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Filter by drivetrain"
        className={buttonClassName}
      >
        <span
          className={`truncate ${isActive ? "text-white" : "text-gray-300"}`}
        >
          {label}
        </span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div
          className={`absolute top-full z-20 mt-1 bg-gray-900 border border-gray-700 shadow-xl p-3 ${
            panelAlign === "right" ? "right-0" : "left-0"
          }`}
        >
          <DrivetrainPills selected={draft} onChange={setDraft} />
          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-700">
            <button
              type="button"
              onClick={() => setDraft([])}
              disabled={draft.length === 0}
              className="text-xs uppercase tracking-widest text-gray-400 hover:text-accent-300 disabled:opacity-40 disabled:hover:text-gray-400 transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={closeAndCommit}
              className="px-3 py-1 text-xs uppercase tracking-widest font-heading font-bold bg-accent-600 hover:bg-accent-500 text-white transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
