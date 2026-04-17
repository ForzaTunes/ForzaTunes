interface TuneTypeOption {
  value: string;
  label: string;
}

interface TuneTypeButtonsProps {
  options: TuneTypeOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function TuneTypeButtons({
  options,
  value,
  onChange,
}: TuneTypeButtonsProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Tune type"
      className="flex flex-wrap gap-1.5"
    >
      {options.map((option) => {
        const selected = value === option.value;
        const shortLabel = option.label.replace(/\s*Racing\s*/i, "").trim();
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            title={option.label}
            onClick={() => onChange(option.value)}
            className={`px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 ${
              selected
                ? "bg-accent-600 border-accent-500 text-white"
                : "bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-800 hover:border-gray-600 hover:text-gray-200"
            }`}
          >
            {shortLabel}
          </button>
        );
      })}
    </div>
  );
}
