import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useScene } from "../state/scene";
import { PixelBunny } from "./PixelBunny";

const routeFor = { contract: "/portal/contracts", message: "/portal/messages", payment: "/portal/payments" } as const;

export function Toast() {
  const { state, dispatch } = useScene();
  const navigate = useNavigate();
  const t = state.toast;

  useEffect(() => {
    if (!t) return;
    const h = window.setTimeout(() => dispatch({ type: "DISMISS_TOAST" }), 7000);
    return () => window.clearTimeout(h);
  }, [t, dispatch]);

  if (!t) return null;
  return (
    <button
      key={t.id}
      className={`toast toast--${t.kind}`}
      onClick={() => {
        dispatch({ type: "DISMISS_TOAST" });
        navigate(routeFor[t.kind]);
      }}
    >
      <PixelBunny mood={t.kind === "payment" ? "celebrate" : "alert"} size={40} />
      <span>
        <span className="toast__title display">{t.title}</span>
        <span className="toast__body mono">{t.body}</span>
      </span>
    </button>
  );
}
