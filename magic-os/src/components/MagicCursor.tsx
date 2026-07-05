"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useSpring } from "framer-motion";

export default function MagicCursor() {
  const [isMagnetic, setIsMagnetic] = useState(false);
  const [magnetRect, setMagnetRect] = useState<DOMRect | null>(null);
  const [magnetColor, setMagnetColor] = useState("");
  const [magnetRadius, setMagnetRadius] = useState<number | string>(24);

  const mouseX = useSpring(0, { stiffness: 800, damping: 35 });
  const mouseY = useSpring(0, { stiffness: 800, damping: 35 });
  
  const haloX = useSpring(0, { stiffness: 500, damping: 28 });
  const haloY = useSpring(0, { stiffness: 500, damping: 28 });

  const activeTargetRef = useRef<HTMLElement | null>(null);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const updateCursor = () => {
      if (activeTargetRef.current) {
        // 매 프레임마다 요소의 실시간 위치/크기를 다시 계산 (CSS 애니메이션 중에도 완벽하게 추적)
        const rect = activeTargetRef.current.getBoundingClientRect();
        setMagnetRect(rect);
        haloX.set(rect.left + rect.width / 2);
        haloY.set(rect.top + rect.height / 2);
      }
      requestRef.current = requestAnimationFrame(updateCursor);
    };
    requestRef.current = requestAnimationFrame(updateCursor);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [haloX, haloY]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!activeTargetRef.current) {
        haloX.set(e.clientX);
        haloY.set(e.clientY);
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-magnetic]') as HTMLElement;
      if (target) {
        activeTargetRef.current = target;
        setIsMagnetic(true);
        setMagnetColor(target.dataset.magneticColor || "rgba(255,255,255,0.08)");
        setMagnetRadius(target.dataset.magneticRadius || 12);
      } else {
        activeTargetRef.current = null;
        setIsMagnetic(false);
        setMagnetRect(null);
        haloX.set(mouseX.get());
        haloY.set(mouseY.get());
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [mouseX, mouseY, haloX, haloY]);

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[99999] border flex items-center justify-center mix-blend-screen"
        style={{ x: haloX, y: haloY, translateX: "-50%", translateY: "-50%" }}
        animate={{
          width: isMagnetic && magnetRect ? magnetRect.width + 12 : 48,
          height: isMagnetic && magnetRect ? magnetRect.height + 12 : 48,
          borderRadius: isMagnetic ? magnetRadius : "50%",
          backgroundColor: isMagnetic ? magnetColor : "rgba(255,255,255,0)",
          borderColor: isMagnetic ? "rgba(255,255,255,0)" : "rgba(255,255,255,0.2)",
          boxShadow: isMagnetic ? "0 0 20px rgba(255,255,255,0.05)" : "0 0 0px rgba(0,0,0,0)",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      />
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[100000]"
        style={{ x: mouseX, y: mouseY, translateX: "-50%", translateY: "-50%" }}
        animate={{ opacity: isMagnetic ? 0 : 1 }}
      />
    </>
  );
}
