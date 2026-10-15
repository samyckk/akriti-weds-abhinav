import { useRef } from "react";
import { usePetals, type PetalMode } from "@/hooks/use-petals";

/** Drifting petals over a photo scene. */
export function Petals({ mode }: { mode: Exclude<PetalMode, "burst"> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  usePetals(canvas, mode);
  return <canvas ref={canvas} className="petals" aria-hidden="true" />;
}
