import { useCallback, useEffect, useRef, useState } from "react";

export type MusicState = "idle" | "playing" | "muted";

/** Fades are stepped rather than animated so they can be interrupted by the opposite action at any moment. */
const FADE_STEP_MS = 40;
const MUTE_FADE_SECS = 0.4;

/**
 * The wedding tune, looped in the background and kept entirely client-side.
 * `start` must run inside the guest's tap or key press: phones only allow sound to begin there.
 */
export function useMusic(src: string) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const timer = useRef<number | null>(null);
  const muted = useRef(false);
  const [state, setState] = useState<MusicState>("idle");

  const stopFade = useCallback(() => {
    if (timer.current !== null) window.clearInterval(timer.current);
    timer.current = null;
  }, []);

  /** Ramps the element's volume to `target` over `secs`, starting from wherever it happens to be. */
  const fadeTo = useCallback(
    (el: HTMLAudioElement, target: number, secs: number) => {
      const from = el.volume;
      if (Math.abs(from - target) < 0.01) return;
      stopFade();
      const ms = Math.max(0, secs) * 1000;
      if (ms < FADE_STEP_MS) {
        el.volume = target;
        return;
      }
      const started = performance.now();
      timer.current = window.setInterval(() => {
        const step = Math.min(1, (performance.now() - started) / ms);
        el.volume = Math.min(1, Math.max(0, from + (target - from) * step));
        if (step >= 1) stopFade();
      }, FADE_STEP_MS);
    },
    [stopFade],
  );

  useEffect(
    () => () => {
      stopFade();
      audio.current?.pause();
    },
    [stopFade],
  );

  /** Begins playing now; the volume rises from silence over `riseSec`, starting after `delaySec`. */
  const start = useCallback(
    (delaySec = 0, riseSec = 2.1) => {
      if (audio.current) return;
      const el = new Audio(src);
      el.loop = true;
      el.preload = "auto";
      el.volume = 0;
      audio.current = el;
      muted.current = false;
      setState("playing");
      void el.play().then(
        () => window.setTimeout(() => fadeTo(el, 1, riseSec), Math.max(0, delaySec) * 1000),
        () => setState("idle"),
      );
    },
    [src, fadeTo],
  );

  /** Mutes or unmutes with a short fade; starts the music if it has not begun yet. */
  const toggle = useCallback(() => {
    const el = audio.current;
    if (!el) {
      start(0, 0.6);
      return;
    }
    muted.current = !muted.current;
    if (muted.current) {
      fadeTo(el, 0, MUTE_FADE_SECS);
      // pause once silent so the audio hardware can sleep, keeping the playhead where it was
      window.setTimeout(
        () => {
          if (muted.current) el.pause();
        },
        MUTE_FADE_SECS * 1000 + 50,
      );
      setState("muted");
    } else {
      stopFade();
      void el.play().then(
        () => fadeTo(el, 1, MUTE_FADE_SECS),
        () => undefined,
      );
      setState("playing");
    }
  }, [start, fadeTo, stopFade]);

  return { state, start, toggle };
}
