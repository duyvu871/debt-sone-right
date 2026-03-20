"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type * as React from "react";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

export interface FadeContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  /** Scroll parent; default `window`. */
  container?: Element | string | null;
  blur?: boolean;
  /** Duration in ms if >10, else seconds (React Bits convention). */
  duration?: number;
  ease?: string;
  delay?: number;
  threshold?: number;
  initialOpacity?: number;
  disappearAfter?: number;
  disappearDuration?: number;
  disappearEase?: string;
  onComplete?: () => void;
  onDisappearanceComplete?: () => void;
  /**
   * `scroll` — React Bits default (ScrollTrigger).
   * `mount` — play as soon as the node mounts (good for async / bento panels).
   */
  trigger?: "scroll" | "mount";
  /**
   * When set, enter animation runs on each transition to `true` (e.g. sheet open).
   * When `false`, tweens are cleared and content is shown — use with Radix Dialog open state.
   */
  replayWhenOpen?: boolean;
  /** Initial offset in px for the replay path only (`replayWhenOpen`). */
  fromY?: number;
}

const FadeContent: React.FC<FadeContentProps> = ({
  children,
  container,
  blur = false,
  duration = 1000,
  ease = "power2.out",
  delay = 0,
  threshold = 0.1,
  initialOpacity = 0,
  disappearAfter = 0,
  disappearDuration = 0.5,
  disappearEase = "power2.in",
  onComplete,
  onDisappearanceComplete,
  trigger = "scroll",
  replayWhenOpen,
  fromY = 0,
  className = "",
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null);
  /** `false` = last paint was closed; `true` = open; `null` = never set (treat as closed for rising edge). */
  const prevReplayOpenRef = useRef<boolean | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const getSeconds = (val: number) => (val > 10 ? val / 1000 : val);

    if (replayWhenOpen !== undefined) {
      if (reduce) {
        gsap.set(el, {
          autoAlpha: 1,
          filter: "none",
          y: 0,
          clearProps: "willChange",
        });
        prevReplayOpenRef.current = replayWhenOpen;
        return;
      }

      if (!replayWhenOpen) {
        prevReplayOpenRef.current = false;
        gsap.killTweensOf(el);
        /* Don’t force visible here: Radix exit + inner unmount can flash if we pop opacity mid-close. */
        return;
      }

      const risingEdge = prevReplayOpenRef.current !== true;
      prevReplayOpenRef.current = true;

      if (!risingEdge) {
        gsap.set(el, {
          autoAlpha: 1,
          filter: "none",
          y: 0,
          clearProps: "willChange",
        });
        return;
      }

      gsap.killTweensOf(el);
      gsap.set(el, {
        autoAlpha: initialOpacity,
        filter: blur ? "blur(10px)" : "blur(0px)",
        y: fromY,
        willChange: "opacity, filter, transform",
      });

      const tl = gsap.timeline({
        delay: getSeconds(delay),
        onComplete: () => {
          onComplete?.();
          gsap.set(el, { clearProps: "willChange" });
          if (disappearAfter > 0) {
            gsap.to(el, {
              autoAlpha: initialOpacity,
              filter: blur ? "blur(10px)" : "blur(0px)",
              delay: getSeconds(disappearAfter),
              duration: getSeconds(disappearDuration),
              ease: disappearEase,
              onComplete: () => onDisappearanceComplete?.(),
            });
          }
        },
      });

      tl.to(el, {
        autoAlpha: 1,
        filter: "blur(0px)",
        y: 0,
        duration: getSeconds(duration),
        ease,
      });

      const id = requestAnimationFrame(() => tl.play());
      return () => {
        cancelAnimationFrame(id);
        tl.kill();
        gsap.killTweensOf(el);
      };
    }

    if (reduce) {
      gsap.set(el, { autoAlpha: 1, filter: "none", clearProps: "willChange" });
      return;
    }

    let scrollerTarget: Element | string | null =
      container || document.getElementById("snap-main-container") || null;

    if (typeof scrollerTarget === "string") {
      scrollerTarget = document.querySelector(scrollerTarget);
    }

    const startPct = (1 - threshold) * 100;

    gsap.set(el, {
      autoAlpha: initialOpacity,
      filter: blur ? "blur(10px)" : "blur(0px)",
      willChange: "opacity, filter, transform",
    });

    const tl = gsap.timeline({
      paused: true,
      delay: getSeconds(delay),
      onComplete: () => {
        onComplete?.();
        if (disappearAfter > 0) {
          gsap.to(el, {
            autoAlpha: initialOpacity,
            filter: blur ? "blur(10px)" : "blur(0px)",
            delay: getSeconds(disappearAfter),
            duration: getSeconds(disappearDuration),
            ease: disappearEase,
            onComplete: () => onDisappearanceComplete?.(),
          });
        }
      },
    });

    tl.to(el, {
      autoAlpha: 1,
      filter: "blur(0px)",
      duration: getSeconds(duration),
      ease,
    });

    if (trigger === "mount") {
      const id = requestAnimationFrame(() => tl.play());
      return () => {
        cancelAnimationFrame(id);
        tl.kill();
        gsap.killTweensOf(el);
      };
    }

    const st = ScrollTrigger.create({
      trigger: el,
      scroller: scrollerTarget || window,
      start: `top ${startPct}%`,
      once: true,
      onEnter: () => tl.play(),
    });

    return () => {
      st.kill();
      tl.kill();
      gsap.killTweensOf(el);
    };
  }, [
    blur,
    container,
    delay,
    disappearAfter,
    disappearDuration,
    disappearEase,
    duration,
    ease,
    fromY,
    initialOpacity,
    onComplete,
    onDisappearanceComplete,
    replayWhenOpen,
    threshold,
    trigger,
  ]);

  return (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  );
};

export default FadeContent;
