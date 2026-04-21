import { useEffect, useMemo, useRef } from "react";

interface Star {
  x: number; // %
  y: number; // %
  size: number; // px
  opacity: number;
  twinkleDelay: number;
  twinkleDuration: number;
}

// Pseudo-random with fixed seed for deterministic positions
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function genLayer(count: number, sizeRange: [number, number], opacityRange: [number, number], seed: number): Star[] {
  const rnd = seeded(seed);
  return Array.from({ length: count }, () => ({
    x: rnd() * 100,
    y: rnd() * 100,
    size: sizeRange[0] + rnd() * (sizeRange[1] - sizeRange[0]),
    opacity: opacityRange[0] + rnd() * (opacityRange[1] - opacityRange[0]),
    twinkleDelay: rnd() * 6,
    twinkleDuration: 3 + rnd() * 4,
  }));
}

interface Props {
  visible: boolean;
}

const StarfieldParallax = ({ visible }: Props) => {
  const farRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const nearRef = useRef<HTMLDivElement>(null);

  const farStars = useMemo(() => genLayer(160, [0.6, 1.2], [0.25, 0.55], 7), []);
  const midStars = useMemo(() => genLayer(80, [1.2, 2], [0.4, 0.75], 23), []);
  const nearStars = useMemo(() => genLayer(35, [2, 3.2], [0.7, 1], 91), []);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      raf = 0;
      const y = window.scrollY;
      if (farRef.current) farRef.current.style.transform = `translate3d(0, ${y * -0.05}px, 0)`;
      if (midRef.current) midRef.current.style.transform = `translate3d(0, ${y * -0.15}px, 0)`;
      if (nearRef.current) nearRef.current.style.transform = `translate3d(0, ${y * -0.35}px, 0)`;
    };
    const handler = () => {
      if (raf) return;
      raf = requestAnimationFrame(onScroll);
    };
    onScroll();
    window.addEventListener("scroll", handler, { passive: true });
    return () => {
      window.removeEventListener("scroll", handler);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const renderLayer = (stars: Star[], ref: React.RefObject<HTMLDivElement>, withGlow = false) => (
    <div
      ref={ref}
      className="absolute inset-0 will-change-transform"
      style={{ height: "200vh", top: "-50vh" }}
    >
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-foreground"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.opacity,
            boxShadow: withGlow ? `0 0 ${s.size * 2}px hsl(var(--primary) / 0.6)` : undefined,
            animation: `sf-twinkle ${s.twinkleDuration}s ease-in-out ${s.twinkleDelay}s infinite`,
          }}
        />
      ))}
    </div>
  );

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{
        zIndex: 1,
        opacity: visible ? 1 : 0,
        transition: "opacity 800ms ease-out",
      }}
    >
      <style>{`
        @keyframes sf-twinkle {
          0%, 100% { opacity: var(--o, 1); }
          50% { opacity: 0.25; }
        }
      `}</style>
      {renderLayer(farStars, farRef)}
      {renderLayer(midStars, midRef)}
      {renderLayer(nearStars, nearRef, true)}
    </div>
  );
};

export default StarfieldParallax;