import React, { useRef, useEffect, useCallback } from 'react';

/**
 * 21st.dev / Magic UI Touch-Draggable Infinite Marquee
 * 
 * Capabilities:
 * - On Mobile / Tablet (iPhone SE, iPad, Android):
 *   1. Auto-scrolls continuously right-to-left.
 *   2. User can touch and drag/swipe the marquee left or right with 1:1 finger tracking.
 *   3. When the user removes their finger, it automatically continues scrolling from
 *      the exact phase where their finger left it (no jumps, no reset, no sticky pause).
 * - On Laptop / Desktop:
 *   1. Pauses when mouse cursor hovers over it; resumes immediately when cursor leaves.
 *   2. Also supports click-and-drag scrubbing.
 */
export const Marquee = ({
  className = '',
  reverse = false,
  pauseOnHover = true,
  children,
  repeat = 4,
  duration = '35s',
  gap = '1.5rem',
  ...props
}) => {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const firstSetRef = useRef(null);
  const secondSetRef = useRef(null);

  const xRef = useRef(0);
  const cycleWidthRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isHoveredRef = useRef(false);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const lastXRef = useRef(0);
  const isDirectionDecidedRef = useRef(false);
  const isHorizontalDragRef = useRef(false);

  // Parse duration in seconds (e.g. "38s" -> 38, or numeric 38)
  const durationSeconds = typeof duration === 'number' 
    ? duration 
    : parseFloat(duration) || 35;

  // Measure single cycle width (distance between 1st set and 2nd set)
  const measure = useCallback(() => {
    if (firstSetRef.current && secondSetRef.current) {
      const distance = secondSetRef.current.offsetLeft - firstSetRef.current.offsetLeft;
      if (distance > 0) {
        cycleWidthRef.current = distance;
      }
    }
  }, []);

  useEffect(() => {
    measure();

    let ro = null;
    if (typeof window !== 'undefined' && window.ResizeObserver && trackRef.current) {
      ro = new ResizeObserver(() => {
        measure();
      });
      ro.observe(trackRef.current);
    }

    window.addEventListener('resize', measure);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  // Main 60fps/120fps hardware-accelerated RAF animation loop
  useEffect(() => {
    let animId;
    let lastTime = performance.now();

    const tick = (currentTime) => {
      const dt = Math.min(currentTime - lastTime, 100); // cap to 100ms to prevent huge jumps when switching tabs
      lastTime = currentTime;

      const cycle = cycleWidthRef.current;

      // Only auto-scroll when not dragging and not hovered on desktop
      if (!isDraggingRef.current && !isHoveredRef.current && cycle > 0) {
        const speed = cycle / (durationSeconds * 1000); // pixels per ms
        const move = speed * dt;

        if (reverse) {
          xRef.current += move;
        } else {
          xRef.current -= move;
        }

        // Seamless infinite wrap-around
        while (xRef.current <= -cycle) {
          xRef.current += cycle;
        }
        while (xRef.current > 0) {
          xRef.current -= cycle;
        }

        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(${xRef.current}px, 0, 0)`;
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [durationSeconds, reverse]);

  // ==========================================
  // Touch Handlers for Phones & Tablets
  // ==========================================
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    lastXRef.current = touch.clientX;
    isDirectionDecidedRef.current = false;
    isHorizontalDragRef.current = false;
  };

  const handleTouchMove = (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;

    if (!isDirectionDecidedRef.current) {
      const dx = Math.abs(currentX - startXRef.current);
      const dy = Math.abs(currentY - startYRef.current);
      // Wait for 6px of motion to accurately detect user intention
      if (dx > 6 || dy > 6) {
        isDirectionDecidedRef.current = true;
        if (dx >= dy) {
          isHorizontalDragRef.current = true;
          isDraggingRef.current = true;
        } else {
          isHorizontalDragRef.current = false;
          isDraggingRef.current = false;
        }
      }
    }

    if (isHorizontalDragRef.current && isDraggingRef.current) {
      const deltaX = currentX - lastXRef.current;
      lastXRef.current = currentX;

      xRef.current += deltaX;

      const cycle = cycleWidthRef.current;
      if (cycle > 0) {
        while (xRef.current <= -cycle) xRef.current += cycle;
        while (xRef.current > 0) xRef.current -= cycle;
      }

      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${xRef.current}px, 0, 0)`;
      }
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    isDirectionDecidedRef.current = false;
    isHorizontalDragRef.current = false;
    // Auto-scroll resumes immediately from xRef.current in the very next RAF frame!
  };

  // ==========================================
  // Mouse Handlers for Desktop / Laptop
  // ==========================================
  const handleMouseEnter = () => {
    // Only pause on hover if device has a physical mouse pointer (not touch screens)
    if (pauseOnHover && typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      isHoveredRef.current = true;
    }
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    isDraggingRef.current = false;
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Left click only
    e.preventDefault();
    isDraggingRef.current = true;
    lastXRef.current = e.clientX;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;

    xRef.current += deltaX;

    const cycle = cycleWidthRef.current;
    if (cycle > 0) {
      while (xRef.current <= -cycle) xRef.current += cycle;
      while (xRef.current > 0) xRef.current -= cycle;
    }

    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${xRef.current}px, 0, 0)`;
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      {...props}
      style={{
        touchAction: 'pan-y',
        ...props.style,
      }}
      className={`relative overflow-hidden p-2 select-none cursor-grab active:cursor-grabbing ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div
        ref={trackRef}
        style={{
          display: 'flex',
          gap,
          width: 'max-content',
          willChange: 'transform',
        }}
      >
        {Array(repeat)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              ref={i === 0 ? firstSetRef : i === 1 ? secondSetRef : null}
              style={{
                display: 'flex',
                gap,
                flexShrink: 0,
              }}
            >
              {children}
            </div>
          ))}
      </div>
    </div>
  );
};

export default Marquee;
