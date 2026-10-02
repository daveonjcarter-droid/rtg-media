import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BunnyLogo } from "../../components/BunnyLogo";
import { PixelBunny } from "../../components/PixelBunny";
import { naomiDiscovery } from "../../data/naomi";
import { sceneDefaults } from "../../data/scenes";
import { useScene } from "../../state/scene";

export default function Login() {
  const { state, dispatch } = useScene();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");

  const enter = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return; // double taps ignored
    setBusy(true);
    window.setTimeout(() => {
      dispatch({ type: "LOGIN" });
      navigate(state.naomiMode ? "/portal/network" : "/portal");
    }, sceneDefaults.loginDelay);
  };

  return (
    <div className="login dark grain">
      <Link to="/" className="login__back mono">← LUMA</Link>
      <div className="login__inner">
        <BunnyLogo size="xl" mood={busy ? "alert" : "idle"} />
        <form className="login__form" onSubmit={enter}>
          <label className="field">
            <span className="mono">OPERATOR ID</span>
            <input value={id} onChange={(e) => setId(e.target.value.toUpperCase())} autoComplete="off" spellCheck={false} placeholder={state.naomiMode ? naomiDiscovery.mockCredentialHint : ""} disabled={busy} />
          </label>
          <label className="field">
            <span className="mono">PASSWORD</span>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="off" disabled={busy} />
          </label>
          <button className="btn btn--accent btn--xl" type="submit" disabled={busy}>
            {busy ? "VERIFYING" : "ENTER"}
          </button>
          <div className="login__status mono">
            {busy ? (
              <span className="login__run"><PixelBunny mood="run" size={28} /> <span>ESTABLISHING PRIVATE SESSION</span></span>
            ) : (
              <span>PRIVATE ACCESS // VERIFIED USERS ONLY</span>
            )}
          </div>
        </form>
      </div>
      <div className="login__foot mono dim">LUMA SECURE GATEWAY · NODE 04 · ALL SESSIONS ARE PRIVATE</div>
    </div>
  );
}
