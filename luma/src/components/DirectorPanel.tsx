import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { operators } from "../data/operators";
import { scenePresets, type ScenePreset } from "../data/scenes";
import type { OperatorStatus } from "../data/types";
import { initialState, money, useScene, type SceneState } from "../state/scene";

const STATUSES: OperatorStatus[] = ["ONLINE", "OFFLINE", "IN FIELD", "AVAILABLE", "CONTRACT ACTIVE", "SUSPENDED"];
const LAST_PRESET = "luma-prop-last-preset";

/** Turn a preset into a clean deterministic state + route. */
export function usePresetLoader() {
  const { dispatch } = useScene();
  const navigate = useNavigate();
  return useCallback(
    (p: ScenePreset) => {
      const base = initialState();
      const keep: Partial<SceneState> = { ...p.patch } as Partial<SceneState>;
      if (p.patch?.contractStatus === "ACTIVE") {
        keep.activeContractId = base.scriptedContractId;
        keep.statusOverrides = { cross: "CONTRACT ACTIVE" };
      }
      dispatch({ type: "RESET", keep });
      try {
        localStorage.setItem(LAST_PRESET, p.id);
      } catch {
        /* ignore */
      }
      navigate(p.path.replace(":scripted", base.scriptedContractId));
    },
    [dispatch, navigate],
  );
}

export function DirectorPanel({ openInitially = false }: { openInitially?: boolean }) {
  const { state, dispatch } = useScene();
  const [open, setOpen] = useState(openInitially);
  const [opId, setOpId] = useState("cross");
  const [payoutDraft, setPayoutDraft] = useState(String(state.payout));
  const loadPreset = usePresetLoader();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setPayoutDraft(String(state.payout)), [state.payout]);

  const resetScene = useCallback(() => {
    // Prefer the preset matching the current screen, then the last preset used, then a soft reset in place.
    const path = location.pathname;
    const match =
      scenePresets.find((p) => p.path.replace(":scripted", state.scriptedContractId) === path && !!p.patch?.naomiMode === state.naomiMode) ??
      scenePresets.find((p) => {
        try {
          return p.id === localStorage.getItem(LAST_PRESET);
        } catch {
          return false;
        }
      });
    if (match) loadPreset(match);
    else {
      dispatch({ type: "RESET", keep: { loggedIn: state.loggedIn, naomiMode: state.naomiMode } });
      navigate(path);
    }
  }, [location.pathname, state.scriptedContractId, state.naomiMode, state.loggedIn, loadPreset, dispatch, navigate]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el && ((el.tagName === "INPUT" && (el as HTMLInputElement).type !== "checkbox") || el.tagName === "TEXTAREA" || el.tagName === "SELECT");
      if (typing) return;
      if (e.shiftKey && e.key.toLowerCase() === "d") setOpen((o) => !o);
      if (e.shiftKey && e.key.toLowerCase() === "r") resetScene();
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [resetScene]);

  const currentOpStatus = state.statusOverrides[opId] ?? operators.find((o) => o.id === opId)?.status ?? "ONLINE";

  return (
    <>
      <button
        className={`dgear ${state.performanceMode ? "dgear--quiet" : ""} ${open ? "is-open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Director Mode"
        title="Director Mode (Shift+D)"
      >
        <svg viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
          <path d="M7 1h2v2h2v1h1v1h1v2h2v2h-2v2h-1v1h-1v1H9v2H7v-2H5v-1H4v-1H3V9H1V7h2V5h1V4h1V3h2zM7 6v1H6v2h1v1h2V9h1V7H9V6z" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <aside className="director" role="dialog" aria-label="Director Mode">
          <div className="director__head">
            <span>DIRECTOR MODE</span>
            <button onClick={() => setOpen(false)}>CLOSE ✕</button>
          </div>

          <div className="director__row director__row--split">
            <button className="dbtn dbtn--primary" onClick={resetScene}>↺ RESET SCENE</button>
            <button className="dbtn" onClick={() => loadPreset(scenePresets[0])}>RESET ALL</button>
          </div>
          <label className="dtoggle">
            <input type="checkbox" checked={state.performanceMode} onChange={(e) => dispatch({ type: "PATCH", patch: { performanceMode: e.target.checked } })} />
            <span>PERFORMANCE MODE {state.performanceMode ? "ON — off-script taps are ignored" : "OFF — free exploration"}</span>
          </label>

          <h4>JUMP TO SCREEN</h4>
          <div className="director__grid">
            {scenePresets.map((p) => (
              <button key={p.id} className={`dbtn ${p.patch?.naomiMode ? "dbtn--naomi" : ""}`} onClick={() => loadPreset(p)}>
                {p.label}
              </button>
            ))}
          </div>

          <h4>CONTRACT &amp; PAYOUT</h4>
          <div className="director__row">
            <span className="dlabel">SCRIPTED CONTRACT</span>
            <select value={state.scriptedContractId} onChange={(e) => dispatch({ type: "SET_SCRIPTED_CONTRACT", id: e.target.value })}>
              {state.contracts.map((c) => (
                <option key={c.id} value={c.id}>{c.subject} — {c.city}</option>
              ))}
            </select>
          </div>
          <div className="director__row">
            <span className="dlabel">PAYOUT</span>
            <input
              inputMode="numeric"
              value={payoutDraft}
              onChange={(e) => setPayoutDraft(e.target.value.replace(/[^0-9]/g, ""))}
              onBlur={() => payoutDraft && dispatch({ type: "PATCH", patch: { payout: Number(payoutDraft) } })}
              onKeyDown={(e) => e.key === "Enter" && payoutDraft && dispatch({ type: "PATCH", patch: { payout: Number(payoutDraft) } })}
            />
            <span className="dvalue">{money(state.payout)}</span>
          </div>
          <div className="director__row director__row--chips">
            {[150000, 225000, 300000, 500000].map((v) => (
              <button key={v} className="dchip" onClick={() => dispatch({ type: "PATCH", patch: { payout: v } })}>{money(v)}</button>
            ))}
          </div>

          <h4>TRIGGERS</h4>
          <div className="director__grid director__grid--3">
            <button className="dbtn" onClick={() => dispatch({ type: "TRIGGER_CONTRACT" })}>NEW CONTRACT</button>
            <button className="dbtn" onClick={() => dispatch({ type: "TRIGGER_MESSAGE" })}>MESSAGE</button>
            <button className="dbtn" onClick={() => dispatch({ type: "TRIGGER_PAYMENT" })}>PAYMENT</button>
          </div>

          <h4>CROSS RANKING</h4>
          <div className="director__row">
            <button className="dchip" onClick={() => dispatch({ type: "PATCH", patch: { crossStanding: Math.max(1, state.crossStanding - 1) } })}>▲ UP</button>
            <span className="dvalue dvalue--big">#{String(state.crossStanding).padStart(2, "0")}</span>
            <button className="dchip" onClick={() => dispatch({ type: "PATCH", patch: { crossStanding: Math.min(operators.length, state.crossStanding + 1) } })}>▼ DOWN</button>
          </div>

          <h4>OPERATOR STATUS</h4>
          <div className="director__row">
            <select value={opId} onChange={(e) => setOpId(e.target.value)}>
              {operators.map((o) => (
                <option key={o.id} value={o.id}>{o.codename}</option>
              ))}
            </select>
            <select value={currentOpStatus} onChange={(e) => dispatch({ type: "SET_STATUS", id: opId, status: e.target.value as OperatorStatus })}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <h4>ANIMATION</h4>
          <div className="director__row director__row--split">
            <button className="dbtn" onClick={() => dispatch({ type: "RESTART_ANIM" })}>RESTART ANIMATIONS</button>
            <button className="dbtn" onClick={() => dispatch({ type: "PATCH", patch: { bunnyAlert: state.bunnyAlert + 1 } })}>BUNNY: EARS UP</button>
          </div>

          <p className="director__foot">
            Shift+D toggle panel · Shift+R reset scene · URL: <code>?director</code> · <code>?scene=active</code> · <code>?reset</code>
          </p>
        </aside>
      )}
    </>
  );
}
