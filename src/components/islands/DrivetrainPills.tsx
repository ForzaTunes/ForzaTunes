type Drivetrain = "FWD" | "RWD" | "AWD";

const ALL_DRIVETRAINS: Drivetrain[] = ["FWD", "RWD", "AWD"];

interface DrivetrainPillsProps {
  selected: Drivetrain[];
  onChange: (next: Drivetrain[]) => void;
  className?: string;
}

export default function DrivetrainPills({
  selected,
  onChange,
  className,
}: DrivetrainPillsProps) {
  const allMode = selected.length === 0;

  function toggle(value: Drivetrain) {
    const isOn = selected.includes(value);
    const next = isOn
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(next);
  }

  return (
    <div
      role="group"
      aria-label="Filter by drivetrain"
      className={`inline-flex items-center gap-1.5 ${className ?? ""}`}
    >
      {ALL_DRIVETRAINS.map((value) => {
        const explicitlySelected = selected.includes(value);
        const showActive = allMode || explicitlySelected;
        return (
          <button
            key={value}
            type="button"
            onClick={() => toggle(value)}
            aria-pressed={explicitlySelected}
            className={`font-heading font-bold text-xs uppercase tracking-wider px-2 py-1 border transition-colors ${
              showActive
                ? `border-accent-500 bg-accent-600 text-white ${
                    allMode ? "opacity-85" : ""
                  }`
                : "border-gray-700 bg-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-600"
            }`}
          >
            {value}
          </button>
        );
      })}
    </div>
  );
}
