import { useState } from "react";

interface FirstTimeGamertagProps {
  onSaved?: (gamertag: string) => void;
}

export default function FirstTimeGamertag({ onSaved }: FirstTimeGamertagProps = {}) {
  const [value, setValue] = useState("");
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

    if (!res.ok) {
      setStatus("idle");
      setError(data.error ?? "Failed to save");
      return;
    }

    onSaved?.(data.forzaGamertag ?? value);
    window.location.reload();
  }

  return (
    <div className="border border-gray-700 bg-gray-900 p-6 max-w-xl">
      <h2 className="text-lg font-heading font-bold text-white">
        Set your Forza gamertag
      </h2>
      <p className="mt-2 text-sm text-gray-400">
        Before you submit a tune, we need the gamertag shown under your tune in
        game. We'll save it to your profile and use it on every tune you submit
        &mdash; you can change it later in your profile.
      </p>
      <form onSubmit={handleSave} className="mt-5 flex flex-col gap-3">
        <label htmlFor="first-gamertag" className="sr-only">
          Forza gamertag
        </label>
        <input
          id="first-gamertag"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={50}
          placeholder="e.g. Bowbi"
          autoFocus
          className="w-full bg-gray-800 border border-gray-700 px-3 py-2 text-white placeholder-gray-500 focus:border-accent-500 focus:outline-none"
        />
        {error && (
          <p role="alert" className="text-xs text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={status === "saving" || value.trim().length < 2}
          className="bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-500 transition-colors disabled:opacity-50"
        >
          {status === "saving" ? "Saving..." : "Save & continue"}
        </button>
      </form>
    </div>
  );
}
