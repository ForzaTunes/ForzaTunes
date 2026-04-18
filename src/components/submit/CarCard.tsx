import { useEffect, useMemo, useRef, useState } from "react";
import type { CarOption } from "./CarPicker";
import { CarImageUrlResolver } from "../../lib/utils/carImage";

interface CarCardProps {
  carsByMake: Record<string, CarOption[]>;
  selectedCarId: number | "";
  onSelect: (carId: number) => void;
  error?: string;
}

const MAX_VISIBLE = 60;

function findSelected(
  carsByMake: Record<string, CarOption[]>,
  id: number | "",
): CarOption | null {
  if (!id) return null;
  for (const cars of Object.values(carsByMake)) {
    const match = cars.find((c) => c.id === id);
    if (match) return match;
  }
  return null;
}

export default function CarCard(props: CarCardProps) {
  const selectedCar = useMemo(
    () => findSelected(props.carsByMake, props.selectedCarId),
    [props.carsByMake, props.selectedCarId],
  );

  if (selectedCar) {
    return (
      <SelectedCarCard
        car={selectedCar}
        onChange={() => props.onSelect(0 as unknown as number)}
      />
    );
  }

  return (
    <EmptyCarCard
      carsByMake={props.carsByMake}
      onSelect={props.onSelect}
      error={props.error}
    />
  );
}

function SelectedCarCard({
  car,
  onChange,
}: {
  car: CarOption;
  onChange: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const resolvedUrl = CarImageUrlResolver.forCar(car, "hero");
  const showImage = resolvedUrl && !imageFailed;

  return (
    <div className="relative overflow-hidden bg-gray-900 border border-gray-700 aspect-[4/3]">
      {showImage ? (
        <img
          src={resolvedUrl}
          alt={`${car.year} ${car.make} ${car.model}`}
          onError={() => setImageFailed(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-7xl font-heading font-bold text-gray-700">
          {car.make.charAt(0)}
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90" />

      <div className="absolute top-0 inset-x-0 p-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-heading font-bold tracking-[0.3em] uppercase text-accent-400">
            {car.make}
          </div>
          <div className="mt-0.5 text-xl sm:text-2xl font-heading font-bold text-white leading-tight uppercase">
            {car.model}
          </div>
        </div>
        <button
          type="button"
          onClick={onChange}
          className="text-xs font-semibold text-gray-300 bg-gray-900/80 hover:bg-gray-800 border border-gray-700 px-2.5 py-1 shrink-0"
        >
          Change car
        </button>
      </div>

      <div className="absolute bottom-0 inset-x-0 p-4 flex items-end justify-between gap-3">
        <div>
          {car.category && (
            <div className="text-xs text-gray-300 uppercase tracking-wider">
              {car.category}
            </div>
          )}
        </div>
        <span className="inline-flex font-heading font-bold text-sm bg-gray-900/90 text-white px-2.5 py-1 border border-gray-700">
          {car.year}
        </span>
      </div>
    </div>
  );
}

function EmptyCarCard({
  carsByMake,
  onSelect,
  error,
}: {
  carsByMake: Record<string, CarOption[]>;
  onSelect: (id: number) => void;
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const totalCars = useMemo(
    () =>
      Object.values(carsByMake).reduce((sum, cars) => sum + cars.length, 0),
    [carsByMake],
  );

  const { groups, flat } = useMemo(() => {
    const q = query.toLowerCase().trim();
    const outGroups: Array<{ make: string; cars: CarOption[] }> = [];
    let count = 0;

    const sortedMakes = Object.keys(carsByMake).sort();
    for (const make of sortedMakes) {
      if (count >= MAX_VISIBLE) break;
      const cars = carsByMake[make] ?? [];
      const matched = q
        ? cars.filter((c) =>
            `${c.year} ${c.make} ${c.model}`.toLowerCase().includes(q),
          )
        : cars;
      if (matched.length > 0) {
        const remaining = MAX_VISIBLE - count;
        const slice = matched.slice(0, remaining);
        outGroups.push({ make, cars: slice });
        count += slice.length;
      }
    }
    return { groups: outGroups, flat: outGroups.flatMap((g) => g.cars) };
  }, [query, carsByMake]);

  useEffect(() => {
    setHighlight(-1);
  }, [query]);

  function scrollToIndex(index: number) {
    if (!listRef.current) return;
    const rows = listRef.current.querySelectorAll("[data-car-row]");
    rows[index]?.scrollIntoView({ block: "nearest" });
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.min(highlight + 1, flat.length - 1);
      setHighlight(next);
      scrollToIndex(next);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = Math.max(highlight - 1, 0);
      setHighlight(prev);
      scrollToIndex(prev);
    } else if (e.key === "Enter") {
      const target = flat[highlight];
      if (target) {
        e.preventDefault();
        onSelect(target.id);
      }
    }
  }

  return (
    <div>
      <div className="relative overflow-hidden bg-gray-900 border border-gray-700 aspect-[4/3] flex items-center justify-center">
        <div className="relative z-10 w-full px-6 text-center">
          <div className="text-xs font-heading font-bold tracking-[0.3em] uppercase text-accent-400">
            Step 1
          </div>
          <h2 className="mt-1 text-xl font-heading font-bold text-white">
            Pick your car
          </h2>
          <div className="relative mt-4 max-w-sm mx-auto">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Search ${totalCars} cars...`}
              className="w-full bg-gray-950/80 backdrop-blur border border-gray-700 pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-accent-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {error && <p className="mt-2 text-red-400 text-xs">{error}</p>}

      {(query.length > 0 || flat.length > 0) && (
        <div
          ref={listRef}
          className="fz-scroll mt-2 max-h-72 overflow-y-auto bg-gray-900 border border-gray-700"
        >
          {groups.length === 0 ? (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">
              No cars match your search
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.make}>
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-3 py-1.5 bg-gray-950 sticky top-0 border-b border-gray-800">
                  {group.make}
                </div>
                {group.cars.map((car) => {
                  const flatIdx = flat.indexOf(car);
                  const isHighlighted = flatIdx === highlight;
                  return (
                    <button
                      key={car.id}
                      type="button"
                      data-car-row
                      onClick={() => onSelect(car.id)}
                      onMouseEnter={() => setHighlight(flatIdx)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                        isHighlighted
                          ? "bg-gray-800"
                          : "hover:bg-gray-800/50"
                      }`}
                    >
                      <span className="text-xs font-mono bg-gray-800 text-gray-300 px-1.5 py-0.5 shrink-0">
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
          {flat.length >= MAX_VISIBLE && (
            <div className="px-3 py-2 text-xs text-gray-600 text-center border-t border-gray-800">
              Type to narrow results...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
