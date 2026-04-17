import { useState, useMemo, useRef, useEffect, useCallback } from "react";

export interface CarOption {
  id: number;
  make: string;
  model: string;
  year: number;
  category?: string | null;
  imageUrl?: string | null;
}

interface CarPickerProps {
  carsByMake: Record<string, CarOption[]>;
  selectedCarId: number | "";
  onSelect: (carId: number, label: string) => void;
  error?: string;
}

const MAX_VISIBLE = 60;

export default function CarPicker({
  carsByMake,
  selectedCarId,
  onSelect,
  error,
}: CarPickerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [selectedLabel, setSelectedLabel] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalCars = useMemo(
    () => Object.values(carsByMake).reduce((sum, cars) => sum + cars.length, 0),
    [carsByMake],
  );

  const filteredGroups = useMemo(() => {
    const q = query.toLowerCase().trim();
    const groups: Array<{ make: string; cars: CarOption[] }> = [];
    let count = 0;

    const sortedMakes = Object.keys(carsByMake).sort();
    for (const make of sortedMakes) {
      if (count >= MAX_VISIBLE) break;
      const cars = carsByMake[make];
      const matched = q
        ? cars.filter((c) =>
            `${c.year} ${c.make} ${c.model}`.toLowerCase().includes(q),
          )
        : cars;
      if (matched.length > 0) {
        const remaining = MAX_VISIBLE - count;
        const slice = matched.slice(0, remaining);
        groups.push({ make, cars: slice });
        count += slice.length;
      }
    }
    return groups;
  }, [query, carsByMake]);

  const flatCars = useMemo(
    () => filteredGroups.flatMap((g) => g.cars),
    [filteredGroups],
  );

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    setHighlightIndex(-1);
  }, [query]);

  const scrollToHighlighted = useCallback((index: number) => {
    if (!listRef.current) return;
    const rows = listRef.current.querySelectorAll("[data-car-row]");
    rows[index]?.scrollIntoView({ block: "nearest" });
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      e.preventDefault();
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.min(highlightIndex + 1, flatCars.length - 1);
      setHighlightIndex(next);
      scrollToHighlighted(next);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = Math.max(highlightIndex - 1, 0);
      setHighlightIndex(prev);
      scrollToHighlighted(prev);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < flatCars.length) {
        selectCar(flatCars[highlightIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  function selectCar(car: CarOption) {
    const label = `${car.year} ${car.make} ${car.model}`;
    setSelectedLabel(label);
    setQuery("");
    setOpen(false);
    onSelect(car.id, label);
  }

  function handleClear() {
    setSelectedLabel("");
    setQuery("");
    onSelect(0 as unknown as number, "");
    inputRef.current?.focus();
    setOpen(true);
  }

  const showingSelected = selectedCarId !== "" && selectedLabel;

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-1">Car</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={showingSelected ? selectedLabel : query}
          onChange={(e) => {
            if (showingSelected) {
              handleClear();
              setQuery(e.target.value);
            } else {
              setQuery(e.target.value);
            }
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            if (!showingSelected) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={`Search ${totalCars} cars...`}
          className={`w-full bg-gray-800 border border-gray-700 pl-9 pr-8 py-2 text-white placeholder-gray-500 focus:border-accent-500 focus:outline-none ${
            showingSelected ? "text-white" : ""
          }`}
        />
        {showingSelected && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}

      {open && (
        <div
          ref={listRef}
          className="fz-scroll absolute z-50 mt-1 w-full max-h-72 overflow-y-auto bg-gray-900 border border-gray-700 shadow-xl"
        >
          {filteredGroups.length === 0 ? (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">
              No cars match your search
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.make}>
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-3 py-1.5 bg-gray-900 sticky top-0 border-b border-gray-800">
                  {group.make}
                </div>
                {group.cars.map((car) => {
                  const flatIdx = flatCars.indexOf(car);
                  const isHighlighted = flatIdx === highlightIndex;
                  const isSelected = car.id === selectedCarId;

                  return (
                    <button
                      key={car.id}
                      type="button"
                      data-car-row
                      onClick={() => selectCar(car)}
                      onMouseEnter={() => setHighlightIndex(flatIdx)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                        isSelected
                          ? "bg-accent-900/30 border-l-2 border-accent-500"
                          : isHighlighted
                            ? "bg-gray-800"
                            : "hover:bg-gray-800/50"
                      }`}
                    >
                      <CarThumbnail car={car} />
                      <span className="text-xs font-mono bg-gray-700 text-gray-300 px-1.5 py-0.5 shrink-0">
                        {car.year}
                      </span>
                      <span className="text-sm text-white truncate">
                        {car.model}
                      </span>
                      {car.category && (
                        <span className="ml-auto text-xs text-gray-500 truncate shrink-0 max-w-[140px]">
                          {car.category}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
          {flatCars.length >= MAX_VISIBLE && (
            <div className="px-3 py-2 text-xs text-gray-600 text-center border-t border-gray-800">
              Type to narrow results...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CarThumbnail({ car }: { car: CarOption }) {
  const [failed, setFailed] = useState(false);

  if (!car.imageUrl || failed) {
    return (
      <div className="w-8 h-8 rounded-sm bg-gray-800 flex items-center justify-center text-xs font-medium text-gray-500 shrink-0">
        {car.make.charAt(0)}
      </div>
    );
  }

  return (
    <img
      src={car.imageUrl}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="w-8 h-8 rounded-sm bg-gray-800 object-cover shrink-0"
    />
  );
}
