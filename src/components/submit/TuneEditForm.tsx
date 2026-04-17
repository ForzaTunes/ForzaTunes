import { useMemo, useState } from "react";
import { classFromPi } from "./classFromPi";
import DrivetrainToggle from "./DrivetrainToggle";
import TuneTypeButtons from "./TuneTypeButtons";
import InGameClassPill from "./InGameClassPill";
import type { ClassRange, Drivetrain } from "../../lib/models";

export interface TuneEditInitial {
  id: number;
  gameSlug: string;
  title: string;
  description: string | null;
  tuneType: string;
  piRating: number;
  drivetrain: Drivetrain | null;
  trackName: string | null;
}

export interface TuneEditFormProps {
  initial: TuneEditInitial;
  tuneTypes: Array<{ value: string; label: string }>;
  classRanges: ClassRange[];
  piRange: { min: number; max: number };
  trackFieldLabel: string;
  trackFieldHint: string | null;
}

const inputClasses =
  "w-full bg-gray-800 border border-gray-700 px-3 py-2 text-white placeholder-gray-500 focus:border-accent-500 focus:outline-none";
const labelClasses = "block text-sm font-semibold text-white mb-1.5";

export default function TuneEditForm(props: TuneEditFormProps) {
  const [title, setTitle] = useState(props.initial.title);
  const [description, setDescription] = useState(
    props.initial.description ?? "",
  );
  const [tuneType, setTuneType] = useState(props.initial.tuneType);
  const [piRating, setPiRating] = useState<number | "">(props.initial.piRating);
  const [drivetrain, setDrivetrain] = useState<Drivetrain | "">(
    props.initial.drivetrain ?? "",
  );
  const [trackName, setTrackName] = useState(props.initial.trackName ?? "");
  const [status, setStatus] = useState<
    "idle" | "saving" | "deleting" | "deleted"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const derivedClass = useMemo(() => {
    if (piRating === "" || !Number.isFinite(Number(piRating))) return null;
    return classFromPi(props.classRanges, Number(piRating));
  }, [piRating, props.classRanges]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus("saving");

    const res = await fetch(`/api/tunes/${props.initial.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        tuneType,
        piRating: Number(piRating),
        drivetrain,
        trackName,
      }),
    });

    if (res.ok) {
      window.location.href = `/${props.initial.gameSlug}/tunes/${props.initial.id}`;
      return;
    }

    setStatus("idle");
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setError(data.error ?? "Failed to save changes.");
  }

  async function handleDelete() {
    if (!confirm("Delete this tune permanently? This cannot be undone.")) return;
    setError(null);
    setStatus("deleting");

    const res = await fetch(`/api/tunes/${props.initial.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      setStatus("deleted");
      window.location.href = `/${props.initial.gameSlug}/tunes/`;
      return;
    }

    setStatus("idle");
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setError(data.error ?? "Failed to delete tune.");
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {error && (
        <div
          role="alert"
          className="bg-red-900/30 border border-red-700 p-3 text-red-300 text-sm"
        >
          {error}
        </div>
      )}

      <div>
        <label className={labelClasses} htmlFor="edit-title">Title</label>
        <input
          id="edit-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          className={inputClasses}
        />
      </div>

      <div>
        <label className={labelClasses} htmlFor="edit-desc">Description</label>
        <textarea
          id="edit-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={4}
          className={inputClasses}
        />
      </div>

      <div>
        <label className={labelClasses}>Tune Type</label>
        <TuneTypeButtons
          options={props.tuneTypes}
          value={tuneType}
          onChange={setTuneType}
        />
      </div>

      <div>
        <label className={labelClasses}>Drivetrain</label>
        <DrivetrainToggle value={drivetrain} onChange={setDrivetrain} />
      </div>

      <div>
        <label className={labelClasses} htmlFor="edit-pi">PI Rating</label>
        <InGameClassPill
          editable
          id="edit-pi"
          carClass={derivedClass}
          piRating={piRating}
          onChange={setPiRating}
          min={props.piRange.min}
          max={props.piRange.max}
          size="lg"
        />
      </div>

      <div>
        <label className={labelClasses} htmlFor="edit-track">
          {props.trackFieldLabel}
        </label>
        <input
          id="edit-track"
          type="text"
          value={trackName}
          onChange={(e) => setTrackName(e.target.value)}
          maxLength={100}
          placeholder={props.trackFieldHint ?? ""}
          className={inputClasses}
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={status !== "idle"}
          className="text-sm text-red-400 hover:text-red-300 underline disabled:opacity-50"
        >
          {status === "deleting" ? "Deleting..." : "Delete tune"}
        </button>
        <div className="flex gap-3">
          <a
            href={`/${props.initial.gameSlug}/tunes/${props.initial.id}`}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white"
          >
            Cancel
          </a>
          <button
            type="submit"
            disabled={status !== "idle"}
            className="bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-500 transition-colors disabled:opacity-50"
          >
            {status === "saving" ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
