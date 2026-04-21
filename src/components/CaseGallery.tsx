import { useEffect, useRef, useState } from "react";

interface Props {
  images: string[];
  alt: string;
}

const CaseGallery = ({ images, alt }: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {images.map((src, i) => {
        // Make every 3rd image full bleed for editorial rhythm
        const fullBleed = i % 3 === 2;
        return (
          <GalleryItem
            key={`${src}-${i}`}
            src={src}
            alt={`${alt} — imagen ${i + 1}`}
            fullBleed={fullBleed}
            delay={i * 80}
          />
        );
      })}
    </div>
  );
};

const GalleryItem = ({
  src,
  alt,
  fullBleed,
  delay,
}: {
  src: string;
  alt: string;
  fullBleed: boolean;
  delay: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden bg-surface ${
        fullBleed ? "md:col-span-2 aspect-[21/9]" : "aspect-[4/3]"
      }`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transition: `opacity 800ms ease-out ${delay}ms, transform 800ms ease-out ${delay}ms`,
      }}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.45) 100%)",
        }}
      />
    </div>
  );
};

export default CaseGallery;
