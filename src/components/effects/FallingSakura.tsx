import { useEffect, useRef } from "react";

interface Petal {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  wobble: number;
  wobbleSpeed: number;
}

interface FallingSakuraProps {
  petalCount?: number;
  /**
   * Multiplier applied to each petal's base fall velocity.
   * `1` = default drift (≈0.5–0.9px/frame), `0.5` = half speed, `2` = double, etc.
   */
  fallSpeed?: number;
  opacity?: number;
  className?: string;
}

const PETAL_COLORS = ["#FDE8E9", "#F9D7DA", "#F5C6CB", "#F2B5BC"];

function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function createPetal(
  width: number,
  height: number,
  fallSpeed: number,
): Petal {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    size: random(8, 16),
    color:
      PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)] ??
      PETAL_COLORS[0]!,
    speedX: random(-0.3, 0.3),
    speedY: random(0.5, 0.9) * fallSpeed,
    rotation: random(0, Math.PI * 2),
    rotationSpeed: random(0.005, 0.02),
    wobble: random(0, Math.PI * 2),
    wobbleSpeed: random(0.02, 0.05),
  };
}

function drawPetal(ctx: CanvasRenderingContext2D, p: Petal): void {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(
    -p.size / 2,
    -p.size / 3,
    -p.size / 3,
    -p.size,
    0,
    -p.size / 1.5,
  );
  ctx.bezierCurveTo(p.size / 3, -p.size, p.size / 2, -p.size / 3, 0, 0);
  ctx.fillStyle = p.color;
  ctx.fill();
  ctx.restore();
}

function updatePetal(p: Petal, width: number, height: number): void {
  p.x += p.speedX + Math.sin(p.wobble) * 0.2;
  p.y += p.speedY;
  p.rotation += p.rotationSpeed;
  p.wobble += p.wobbleSpeed;
  if (p.x < -p.size) p.x = width + p.size;
  if (p.x > width + p.size) p.x = -p.size;
  if (p.y > height + p.size) {
    p.y = -p.size;
    p.x = Math.random() * width;
  }
}

export default function FallingSakura({
  petalCount = 14,
  fallSpeed = 1,
  opacity = 1,
  className,
}: FallingSakuraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    const sizeCanvas = () => {
      width = canvas.clientWidth || 1;
      height = canvas.clientHeight || 1;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    sizeCanvas();

    const petals: Petal[] = [];
    for (let i = 0; i < petalCount; i++) {
      petals.push(createPetal(width, height, fallSpeed));
    }

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      for (const petal of petals) {
        drawPetal(ctx, petal);
        updatePetal(petal, width, height);
      }
      frame = requestAnimationFrame(animate);
    };
    animate();

    const resizeObserver = new ResizeObserver(() => {
      sizeCanvas();
    });
    resizeObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [petalCount, fallSpeed, opacity]);

  return (
    <canvas
      ref={canvasRef}
      style={{ opacity }}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 w-full h-full ${className ?? ""}`}
    />
  );
}
