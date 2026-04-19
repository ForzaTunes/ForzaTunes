interface StarBurstOverlayProps {
  active: boolean;
}

interface BurstParticle {
  x: number;
  y: number;
  delay: number;
}

const PARTICLES: BurstParticle[] = [
  { x: -22, y: -18, delay: 0 },
  { x: 0, y: -28, delay: 30 },
  { x: 22, y: -18, delay: 60 },
  { x: -22, y: 14, delay: 90 },
  { x: 0, y: 24, delay: 50 },
  { x: 22, y: 14, delay: 20 },
];

const PARTICLE_COLOR = "#facc15";
const HALO_COLOR_RGB = "250, 204, 21";

function ParticleStar() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill={PARTICLE_COLOR}
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function StarBurstOverlay({ active }: StarBurstOverlayProps) {
  if (!active) return null;

  return (
    <span
      aria-hidden="true"
      className="absolute pointer-events-none"
      style={{
        right: "22px",
        top: "50%",
        width: "1px",
        height: "1px",
        transform: "translate(50%, -50%)",
      }}
    >
      <span
        className="fz-star-halo absolute"
        style={{
          left: "50%",
          top: "50%",
          width: "44px",
          height: "44px",
          marginLeft: "-22px",
          marginTop: "-22px",
          borderRadius: "9999px",
          background: `radial-gradient(circle, rgba(${HALO_COLOR_RGB}, 0.55) 0%, rgba(${HALO_COLOR_RGB}, 0) 70%)`,
        }}
      />
      {PARTICLES.map((particle, index) => (
        <span
          key={index}
          className="fz-star-particle absolute"
          style={{
            left: "50%",
            top: "50%",
            marginLeft: "-6px",
            marginTop: "-6px",
            animationDelay: `${particle.delay}ms`,
            ["--fz-particle-translate" as never]: `translate(${particle.x}px, ${particle.y}px)`,
          }}
        >
          <ParticleStar />
        </span>
      ))}
    </span>
  );
}
