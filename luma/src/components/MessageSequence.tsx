import { useEffect, useState } from "react";
import type { SequenceStep } from "../data/types";

// Plays a scripted sequence deterministically: same steps, same timing, every take.
// Change `runKey` to replay from the start.
export function MessageSequence({ steps, runKey = 0, onDone, children }: { steps: SequenceStep[]; runKey?: number | string; onDone?: () => void; children?: (stepIndex: number) => React.ReactNode }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    setI(0);
  }, [runKey]);

  useEffect(() => {
    if (i >= steps.length - 1) {
      onDone?.();
      return;
    }
    const t = window.setTimeout(() => setI((n) => n + 1), steps[i].ms);
    return () => window.clearTimeout(t);
  }, [i, runKey, steps]);

  // Lines accumulate; dots show only while they are the current step.
  const shown = steps.slice(0, i + 1);
  return (
    <div className="seq" key={runKey}>
      {shown.map((s, idx) =>
        s.kind === "dots" ? (
          idx === i ? <Dots key={idx} /> : null
        ) : (
          <div key={idx} className={`seq__line seq__line--${s.size ?? "lg"} display`}>{s.text}</div>
        ),
      )}
      {children?.(i)}
    </div>
  );
}

export function Dots() {
  return (
    <div className="dots" aria-label="waiting">
      <i /><i /><i />
    </div>
  );
}
