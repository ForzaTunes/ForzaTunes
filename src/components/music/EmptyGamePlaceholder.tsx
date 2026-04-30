interface EmptyGamePlaceholderProps {
  gameName: string;
}

export default function EmptyGamePlaceholder({ gameName }: EmptyGamePlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-6">
      <svg
        className="w-16 h-16 text-accent-500/40 mb-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"
        />
      </svg>

      <h2 className="text-2xl sm:text-3xl font-heading font-extrabold italic uppercase tracking-wider text-white/80 mb-3">
        Coming Soon
      </h2>

      <p className="text-gray-500 max-w-sm text-sm leading-relaxed">
        The <span className="text-accent-400 font-medium">{gameName}</span> soundtrack
        hasn&apos;t been announced yet. Check back once the radio stations are revealed!
      </p>
    </div>
  );
}
