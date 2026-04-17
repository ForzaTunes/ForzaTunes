type PillSize = "sm" | "md" | "lg";

interface BaseProps {
  carClass: string | null;
  size?: PillSize;
  flipped?: boolean;
}

interface DisplayProps extends BaseProps {
  editable?: false;
  piRating: number | null;
}

interface EditableProps extends BaseProps {
  editable: true;
  piRating: number | "";
  onChange: (value: number | "") => void;
  min?: number;
  max?: number;
  id?: string;
}

type InGameClassPillProps = DisplayProps | EditableProps;

const SIZE_CLASSES: Record<PillSize, { letter: string; number: string }> = {
  sm: { letter: "w-7 h-6 text-sm", number: "w-11 h-6 text-xs" },
  md: { letter: "w-9 h-8 text-lg", number: "w-14 h-8 text-sm" },
  lg: { letter: "w-12 h-11 text-2xl", number: "w-20 h-11 text-xl" },
};

export default function InGameClassPill(props: InGameClassPillProps) {
  const size = props.size ?? "md";
  const sizeCls = SIZE_CLASSES[size];
  const { carClass } = props;
  const piRating = props.piRating;
  const hasPi = piRating !== null && piRating !== "";

  const wrapperClasses =
    "inline-flex font-heading font-bold uppercase tabular-nums text-white border border-gray-700 divide-x divide-gray-700 overflow-hidden";

  const letterBg = carClass ? `var(--fz-class-${carClass})` : undefined;
  const letterFg = carClass
    ? `var(--fz-class-${carClass}-fg, #ffffff)`
    : undefined;
  const letterStyle = carClass
    ? { backgroundColor: letterBg, color: letterFg }
    : undefined;
  const letterClasses = `${sizeCls.letter} flex items-center justify-center ${
    carClass ? "" : "bg-gray-700 text-gray-400"
  }`;

  const numberClasses = `${sizeCls.number} bg-gray-900 flex items-center justify-center ${
    hasPi ? "text-white" : "text-gray-500"
  }`;

  if (props.editable) {
    return (
      <span
        className={wrapperClasses}
        aria-label={
          carClass && hasPi
            ? `Class ${carClass}, PI ${piRating}`
            : "Enter PI rating"
        }
      >
        <span className={letterClasses} style={letterStyle}>
          {carClass ?? "—"}
        </span>
        <input
          id={props.id}
          type="number"
          value={piRating ?? ""}
          min={props.min}
          max={props.max}
          placeholder="—"
          inputMode="numeric"
          onChange={(e) =>
            props.onChange(e.target.value ? Number(e.target.value) : "")
          }
          className={`${numberClasses} font-heading font-bold uppercase appearance-none bg-gray-900 border-0 text-center focus:outline-none focus:bg-black focus:ring-2 focus:ring-inset focus:ring-accent-400 placeholder-gray-500 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
        />
      </span>
    );
  }

  const letterNode = (
    <span key="letter" className={letterClasses} style={letterStyle}>
      {carClass ?? "—"}
    </span>
  );
  const numberNode = (
    <span key="number" className={numberClasses}>
      {hasPi ? piRating : "—"}
    </span>
  );

  return (
    <span
      className={wrapperClasses}
      aria-label={
        carClass && hasPi ? `Class ${carClass}, PI ${piRating}` : "PI pending"
      }
    >
      {props.flipped ? (
        <>
          {numberNode}
          {letterNode}
        </>
      ) : (
        <>
          {letterNode}
          {numberNode}
        </>
      )}
    </span>
  );
}
