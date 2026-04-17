import { useCallback, useMemo, useState } from "react";
import type { CarOption } from "./CarPicker";
import CarCard from "./CarCard";
import DrivetrainToggle from "./DrivetrainToggle";
import TuneTypeButtons from "./TuneTypeButtons";
import InGameClassPill from "./InGameClassPill";
import { classFromPi } from "./classFromPi";
import { useDraft } from "./useDraft";
import type { ClassRange, Drivetrain } from "../../lib/models";

export interface TuneFormProps {
  gameSlug: string;
  tuneTypes: Array<{ value: string; label: string }>;
  classRanges: ClassRange[];
  carsByMake: Record<string, CarOption[]>;
  piRange: { min: number; max: number };
  shareCodeLength: number;
  trackFieldLabel: string;
  trackFieldHint: string | null;
  serverError: string | null;
}

interface DraftState {
  shareCode: string;
  carId: number | "";
  title: string;
  description: string;
  tuneType: string;
  piRating: number | "";
  drivetrain: Drivetrain | "";
  trackName: string;
  showTrack: boolean;
}

function formatShareCode(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const groups: string[] = [];
  for (let i = 0; i < digits.length; i += 3) {
    groups.push(digits.slice(i, i + 3));
  }
  return groups.join(" ");
}

const inputClasses =
  "w-full bg-gray-800 border border-gray-700 px-3 py-2 text-white placeholder-gray-500 focus:border-accent-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500";
const labelClasses = "block text-sm font-semibold text-white mb-1.5";
const hintClasses = "text-xs text-gray-500 mt-1";
const errorTextClasses = "text-red-400 text-xs mt-1";

export default function TuneForm(props: TuneFormProps) {
  const [shareCode, setShareCode] = useState("");
  const [carId, setCarId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tuneType, setTuneType] = useState(props.tuneTypes[0]?.value ?? "");
  const [piRating, setPiRating] = useState<number | "">("");
  const [drivetrain, setDrivetrain] = useState<Drivetrain | "">("");
  const [trackName, setTrackName] = useState("");
  const [showTrack, setShowTrack] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const draftState: DraftState = {
    shareCode,
    carId,
    title,
    description,
    tuneType,
    piRating,
    drivetrain,
    trackName,
    showTrack,
  };

  const restoreDraft = useCallback((snapshot: Partial<DraftState>) => {
    if (snapshot.shareCode !== undefined) setShareCode(snapshot.shareCode);
    if (snapshot.carId !== undefined) setCarId(snapshot.carId);
    if (snapshot.title !== undefined) setTitle(snapshot.title);
    if (snapshot.description !== undefined) setDescription(snapshot.description);
    if (snapshot.tuneType) setTuneType(snapshot.tuneType);
    if (snapshot.piRating !== undefined) setPiRating(snapshot.piRating);
    if (snapshot.drivetrain !== undefined) setDrivetrain(snapshot.drivetrain);
    if (snapshot.trackName !== undefined) setTrackName(snapshot.trackName);
    if (snapshot.showTrack !== undefined) setShowTrack(snapshot.showTrack);
  }, []);

  const draft = useDraft<DraftState>(
    `forzatunes:draft:${props.gameSlug}`,
    draftState,
    restoreDraft,
  );

  const derivedClass = useMemo(() => {
    if (piRating === "" || !Number.isFinite(Number(piRating))) return null;
    return classFromPi(props.classRanges, Number(piRating));
  }, [piRating, props.classRanges]);

  function handleShareCodeChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, props.shareCodeLength);
    setShareCode(formatShareCode(digits));
  }

  function handleCarSelect(id: number) {
    setCarId(id || "");
  }

  function validateForm(): Record<string, string> {
    const errs: Record<string, string> = {};

    if (!carId) {
      errs.carId = "Please pick a car to get started";
    }
    const digits = shareCode.replace(/\D/g, "");
    if (digits.length !== props.shareCodeLength) {
      errs.shareCode = `Share code must be exactly ${props.shareCodeLength} digits`;
    }
    if (!title.trim() || title.trim().length > 100) {
      errs.title = "Title is required and must be 100 characters or fewer";
    }
    if (description.length > 2000) {
      errs.description = "Description must be 2000 characters or fewer";
    }
    if (!tuneType) {
      errs.tuneType = "Please select a tune type";
    }
    if (!drivetrain) {
      errs.drivetrain = "Please pick a drivetrain";
    }
    const pi = Number(piRating);
    if (
      !piRating ||
      isNaN(pi) ||
      pi < props.piRange.min ||
      pi > props.piRange.max
    ) {
      errs.piRating = `PI rating must be between ${props.piRange.min} and ${props.piRange.max}`;
    } else if (!derivedClass) {
      errs.piRating = `PI ${pi} does not map to any class for this game`;
    }
    if (trackName.length > 100) {
      errs.trackName = "Track name must be 100 characters or fewer";
    }

    return errs;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      e.preventDefault();
      setErrors(validationErrors);
      const firstKey = Object.keys(validationErrors)[0];
      document
        .getElementById(`field-${firstKey}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    draft.clear();
    setSubmitting(true);
  }

  return (
    <form method="POST" onSubmit={handleSubmit}>
      {props.serverError && (
        <div
          role="alert"
          className="bg-red-900/30 border border-red-700 p-3 text-red-300 text-sm mb-6"
        >
          {props.serverError}
        </div>
      )}

      <input
        type="hidden"
        name="shareCode"
        value={shareCode.replace(/\s/g, "")}
      />
      <input type="hidden" name="carId" value={carId} />
      <input type="hidden" name="piRating" value={piRating} />
      <input type="hidden" name="tuneType" value={tuneType} />
      <input type="hidden" name="drivetrain" value={drivetrain} />
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="description" value={description} />
      <input type="hidden" name="trackName" value={showTrack ? trackName : ""} />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,420px)_1fr] gap-6 lg:gap-10 items-start">
        <div className="lg:sticky lg:top-4" id="field-carId">
          <CarCard
            carsByMake={props.carsByMake}
            selectedCarId={carId}
            onSelect={handleCarSelect}
            error={errors.carId}
          />
        </div>

        <div className="space-y-4">
          <div id="field-title">
            <label className={labelClasses} htmlFor="title-input">
              Title
            </label>
            <input
              id="title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="e.g. Scalpel @ Road S1"
              className={inputClasses}
            />
            {errors.title && <p className={errorTextClasses}>{errors.title}</p>}
          </div>

          <div id="field-shareCode">
            <label className={labelClasses} htmlFor="share-code-input">
              Share Code
            </label>
            <input
              id="share-code-input"
              type="text"
              value={shareCode}
              onChange={(e) => handleShareCodeChange(e.target.value)}
              placeholder={`${"123 ".repeat(Math.ceil(props.shareCodeLength / 3)).trim()}`}
              className={`${inputClasses} font-mono tracking-[0.15em]`}
              inputMode="numeric"
              autoComplete="off"
            />
            {errors.shareCode && (
              <p className={errorTextClasses}>{errors.shareCode}</p>
            )}
          </div>

          <div id="field-description">
            <label className={labelClasses} htmlFor="description-input">
              Description{" "}
              <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <textarea
              id="description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="What's this tune for? Grip? Launch? Stability?"
              className={inputClasses}
            />
            {errors.description && (
              <p className={errorTextClasses}>{errors.description}</p>
            )}
          </div>

          <div id="field-tuneType">
            <label className={labelClasses}>Tune Type</label>
            <TuneTypeButtons
              options={props.tuneTypes}
              value={tuneType}
              onChange={setTuneType}
            />
            {errors.tuneType && (
              <p className={errorTextClasses}>{errors.tuneType}</p>
            )}
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-5 items-start">
            <div id="field-drivetrain">
              <label className={labelClasses}>Drivetrain</label>
              <DrivetrainToggle value={drivetrain} onChange={setDrivetrain} />
              {errors.drivetrain && (
                <p className={errorTextClasses}>{errors.drivetrain}</p>
              )}
            </div>

            <div id="field-piRating">
              <label className={labelClasses} htmlFor="pi-input">
                PI Rating
              </label>
              <InGameClassPill
                editable
                id="pi-input"
                carClass={derivedClass}
                piRating={piRating}
                onChange={setPiRating}
                min={props.piRange.min}
                max={props.piRange.max}
                size="lg"
              />
              {errors.piRating && (
                <p className={errorTextClasses}>{errors.piRating}</p>
              )}
            </div>
          </div>

          <div id="field-trackName">
            {showTrack ? (
              <>
                <label className={labelClasses} htmlFor="track-input">
                  {props.trackFieldLabel}
                </label>
                <div className="flex items-stretch gap-2">
                  <input
                    id="track-input"
                    type="text"
                    value={trackName}
                    onChange={(e) => setTrackName(e.target.value)}
                    maxLength={100}
                    placeholder={
                      props.trackFieldHint ?? "e.g. Maple Valley, Tokyo touge"
                    }
                    className={inputClasses}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowTrack(false);
                      setTrackName("");
                    }}
                    aria-label="Remove event field"
                    className="px-3 bg-gray-900 border border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-200 text-sm"
                  >
                    ✕
                  </button>
                </div>
                {errors.trackName && (
                  <p className={errorTextClasses}>{errors.trackName}</p>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowTrack(true)}
                className="px-3 py-1.5 text-[11px] font-semibold tracking-wide uppercase border border-gray-700 bg-gray-900 text-gray-400 hover:bg-gray-800 hover:border-gray-600 hover:text-gray-200 transition-colors"
              >
                + Add {props.trackFieldLabel.replace(/\s*\(optional\)\s*/i, "")}
              </button>
            )}
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-accent-600 px-4 py-2.5 text-sm font-semibold tracking-wide uppercase text-white hover:bg-accent-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none"
            >
              {submitting ? "Submitting..." : "Submit Tune"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
