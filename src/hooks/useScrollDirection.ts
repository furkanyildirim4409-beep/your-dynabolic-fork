import { useState, useEffect } from "react";
type ScrollDirection = "up" | "down" | null;
export const useScrollDirection = ({ threshold = 10, disabled = false } = {}) => {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(null);
  const [isAtTop, setIsAtTop] = useState(true);
  useEffect(() => {
    if (disabled) return;
    let lastScrollY = window.scrollY;
    let ticking = false;
    const update = () => {
      const scrollY = window.scrollY;
      setIsAtTop(scrollY < 10);
      if (Math.abs(scrollY - lastScrollY) > threshold) setScrollDirection(scrollY > lastScrollY ? "down" : "up");
      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };
    const onScroll = () => { if (!ticking) { window.requestAnimationFrame(update); ticking = true; } };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollDirection, threshold, disabled]);
  return { scrollDirection, isAtTop };
};
export default useScrollDirection;