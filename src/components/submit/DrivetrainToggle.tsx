import type { Drivetrain } from "../../lib/models";

interface DrivetrainToggleProps {
  value: Drivetrain | "";
  onChange: (value: Drivetrain | "") => void;
}

const OPTIONS: { value: Drivetrain; label: string; description: string }[] = [
  { value: "FWD", label: "FWD", description: "Front-wheel drive" },
  { value: "RWD", label: "RWD", description: "Rear-wheel drive" },
  { value: "AWD", label: "AWD", description: "All-wheel drive" },
];

export default function DrivetrainToggle({
  value,
  onChange,
}: DrivetrainToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Drivetrain"
      className="inline-flex border border-gray-700 divide-x divide-gray-700 bg-gray-900"
    >
      {OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.description}
            onClick={() => onChange(option.value)}
            className={`px-5 py-2 text-sm font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 ${
              selected
                ? "bg-accent-600 text-white"
                : "bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
