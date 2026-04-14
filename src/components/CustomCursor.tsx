import { useEffect, useRef } from "react";

const CustomCursor = () => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    };

    const animate = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.12;
      pos.current.y += (target.current.y - pos.current.y) * 0.12;

      if (outerRef.current) {
        outerRef.current.style.transform = `translate(${pos.current.x - 20}px, ${pos.current.y - 20}px)`;
      }
      if (innerRef.current) {
        innerRef.current.style.transform = `translate(${target.current.x - 4}px, ${target.current.y - 4}px)`;
      }
      requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMove);
    const raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div
        ref={outerRef}
        className="fixed top-0 left-0 pointer-events-none z-50"
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "1px solid hsla(270, 80%, 60%, 0.4)",
          transition: "width 0.2s, height 0.2s",
          mixBlendMode: "screen",
        }}
      />
      <div
        ref={innerRef}
        className="fixed top-0 left-0 pointer-events-none z-50"
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "hsla(290, 80%, 65%, 0.9)",
          boxShadow: "0 0 12px hsla(290, 80%, 60%, 0.6), 0 0 30px hsla(270, 80%, 50%, 0.3)",
        }}
      />
    </>
  );
};

export default CustomCursor;
