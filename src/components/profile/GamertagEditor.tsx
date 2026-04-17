import { useState } from "react";

interface GamertagEditorProps {
  initial: string | null;
}

export default function GamertagEditor({ initial }: GamertagEditorProps) {
  const [value, setValue] = useState(initial ?? "");
  const [editing, setEditing] = useState(initial === null);
  const [saved, setSaved] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("saving");

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ forzaGamertag: value }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      forzaGamertag?: string;
    };

    setStatus("idle");

    if (!res.ok) {
      setError(data.error ?? "Failed to save");
      return;
    }

    setSaved(data.forzaGamertag ?? value);
    setEditing(false);
  }

  if (!editing && saved) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>
          Forza gamertag:{" "}
          <span className="text-white font-medium">{saved}</span>
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-accent-400 hover:text-accent-300 underline"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-wrap items-center gap-2">
      <label htmlFor="forza-gamertag" className="text-sm text-gray-400">
        Forza gamertag:
      </label>
      <input
        id="forza-gamertag"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={50}
        placeholder="Your in-game gamertag"
        autoFocus
        className="bg-gray-800 border border-gray-700 px-2 py-1 text-sm text-white focus:border-accent-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === "saving"}
        className="bg-accent-600 px-3 py-1 text-xs font-semibold text-white hover:bg-accent-500 transition-colors disabled:opacity-50"
      >
        {status === "saving" ? "Saving..." : "Save"}
      </button>
      {saved && (
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setValue(saved);
            setError(null);
          }}
          className="text-xs text-gray-400 hover:text-gray-200"
        >
          Cancel
        </button>
      )}
      {error && (
        <p role="alert" className="w-full text-xs text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}
