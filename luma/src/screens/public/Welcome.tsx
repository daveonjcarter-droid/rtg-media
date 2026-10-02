import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BunnyLogo } from "../../components/BunnyLogo";
import { PixelBunny } from "../../components/PixelBunny";
import { Portrait } from "../../components/Portrait";
import { onboarding as O } from "../../data/publicSite";

// Mock video player. "Play" advances scripted captions over a poster frame — no real video needed.
export default function Welcome() {
  const [playing, setPlaying] = useState(false);
  const [cap, setCap] = useState(0);
  const [t, setT] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setT((x) => x + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [playing]);

  useEffect(() => {
    if (playing && t > 0 && t % 4 === 0) setCap((c) => Math.min(c + 1, O.captions.length - 1));
  }, [t, playing]);

  const total = 222;
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="pub paper welcome">
      <header className="pub__bar">
        <Link to="/" className="pub__logo"><BunnyLogo size="md" /></Link>
        <span className="mono dim">{O.chapter}</span>
        <Link to="/" className="pub__contact mono">← LUMA.COM</Link>
      </header>

      <h1 className="display welcome__title">{O.title}</h1>

      <div className="player">
        <div className="player__screen" onClick={() => setPlaying((p) => !p)}>
          <div className="player__poster">
            <div className="player__photo"><Portrait seed={52} alt="" /></div>
            <PixelBunny size={160} mood={playing ? "idle" : "alert"} className="player__bunny" />
            <div className="player__brand display">LUMA</div>
          </div>
          {!playing && <button className="player__big mono" aria-label="Play">▶ PLAY</button>}
          {playing && <div className="player__caption">{O.captions[cap]}</div>}
        </div>
        <div className="player__bar mono">
          <button onClick={() => setPlaying((p) => !p)}>{playing ? "❚❚" : "▶"}</button>
          <div className="player__track"><i style={{ width: `${(t / total) * 100}%` }} /></div>
          <span>{fmt(t)} / {O.runtime}</span>
          <span className="dim">CC</span>
          <span className="dim">HD</span>
        </div>
      </div>

      <div className="welcome__grid">
        <div className="welcome__captions">
          {O.captions.slice(0, 2).map((c) => (
            <p key={c} className="welcome__quote">{c}</p>
          ))}
        </div>
        <ul className="welcome__chapters mono">
          {O.sideNotes.map((n) => (
            <li key={n.label}><span className="dim">{n.label}</span>{n.text}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
