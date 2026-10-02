import { Link, useNavigate } from "react-router-dom";
import { BunnyLogo } from "../../components/BunnyLogo";
import { PixelBunny } from "../../components/PixelBunny";
import { Portrait } from "../../components/Portrait";
import { publicSite as P } from "../../data/publicSite";

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

export default function PublicHome() {
  const navigate = useNavigate();
  return (
    <div className="pub paper">
      <header className="pub__bar">
        <Link to="/" className="pub__logo"><BunnyLogo size="md" /></Link>
        <nav className="pub__nav mono">
          {P.nav.map((n) => (
            <button key={n} onClick={() => scrollTo(n.toLowerCase())}>{n}</button>
          ))}
        </nav>
        <button className="pub__contact mono" onClick={() => scrollTo("careers")}>BY REFERRAL ONLY</button>
      </header>

      <section className="hero">
        <div className="hero__copy">
          <div className="eyebrow mono">{P.heroKicker}</div>
          <h1 className="hero__title display">
            {P.heroTitle.map((w, i) => (
              <span key={w} className={`hero__word ${i === 1 ? "hl" : ""}`} style={{ animationDelay: `${i * 90}ms` }}>{w}</span>
            ))}
          </h1>
          <p className="hero__body">{P.heroBody}</p>
          <Link to="/welcome" className="hero__cta mono">
            <span className="hero__play">▶</span> {P.heroCta}
          </Link>
        </div>
        <div className="hero__art">
          <div className="hero__photo halftone-edge">
            <Portrait seed={41} alt="LUMA operator, editorial portrait" />
          </div>
          <div className="hero__bunny">
            <PixelBunny size={150} />
          </div>
          <div className="hero__label mono">FIG. 01 — THE INDEPENDENT PROFESSIONAL</div>
        </div>
      </section>

      <div className="ticker mono">
        <div className="ticker__track">
          {[...P.stats, ...P.stats, ...P.stats].map((s, i) => (
            <span key={i}><b>{s.value}</b> {s.label} <i>◆</i></span>
          ))}
        </div>
      </div>

      <section id="about" className="pub__sec about">
        <div className="sec__num mono">01 / ABOUT</div>
        <h2 className="display sec__title">{P.about.title}</h2>
        <div className="about__cols">
          {P.about.body.map((p) => <p key={p}>{p}</p>)}
        </div>
      </section>

      <section id="services" className="pub__sec">
        <div className="sec__num mono">02 / SERVICES</div>
        <div className="services">
          {P.services.map((s) => (
            <article key={s.code} className="svc">
              <span className="svc__code mono">{s.code}</span>
              <h3 className="display">{s.title}</h3>
              <p>{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="careers" className="pub__sec careers">
        <div className="sec__num mono">03 / CAREERS</div>
        <h2 className="display sec__title">{P.careers.title}</h2>
        <p className="careers__body">{P.careers.body}</p>
        <ul className="roles">
          {P.careers.roles.map((r) => (
            <li key={r.title}><span className="display">{r.title}</span><span className="mono">{r.meta}</span></li>
          ))}
        </ul>
      </section>

      <section id="legal" className="pub__sec legal">
        <div className="sec__num mono">04 / {P.legal.title}</div>
        <p>{P.legal.body}</p>
      </section>

      <footer className="pub__foot">
        <BunnyLogo size="lg" />
        <div className="pub__foot-cols mono">
          <span>GENEVA</span><span>LONDON</span><span>SINGAPORE</span><span>CHICAGO</span>
        </div>
        <div className="pub__foot-legal mono">
          <span>{P.legal.footnote}</span>
          <span className="pub__foot-links">
            <button onClick={() => scrollTo("legal")}>PRIVACY</button>
            <button onClick={() => scrollTo("legal")}>TERMS</button>
            {/* Subtle but discoverable: the door in the back wall. */}
            <button className="pub__access" onClick={() => navigate("/access")}>{P.operatorAccessLabel}</button>
            <button className="pub__foot-bunny" aria-label={P.operatorAccessLabel} onClick={() => navigate("/access")}>
              <PixelBunny size={18} />
            </button>
          </span>
        </div>
      </footer>
    </div>
  );
}
