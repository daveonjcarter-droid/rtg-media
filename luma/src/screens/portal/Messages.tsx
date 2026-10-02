import { useState } from "react";
import { useScene } from "../../state/scene";

export default function Messages() {
  const { state, dispatch } = useScene();
  const [sel, setSel] = useState(state.messages[0]?.id);
  const m = state.messages.find((x) => x.id === sel) ?? state.messages[0];
  return (
    <div className="page">
      <div className="page__head">
        <div className="eyebrow mono">ENCRYPTED // LUMA CHANNELS ONLY</div>
        <h1 className="display page__title">MESSAGES</h1>
      </div>
      <div className="inbox">
        <ul className="inbox__list">
          {state.messages.map((x) => (
            <li key={x.id}>
              <button className={`${x.id === m?.id ? "is-on" : ""} ${x.unread ? "is-unread" : ""}`} onClick={() => { setSel(x.id); dispatch({ type: "READ_MESSAGE", id: x.id }); }}>
                <span className="mono dim">{x.from} · {x.time}</span>
                <span className="inbox__subj">{x.subject}</span>
              </button>
            </li>
          ))}
        </ul>
        {m && (
          <article className="inbox__read">
            <div className="mono dim">{m.from} · {m.time}</div>
            <h2 className="display">{m.subject}</h2>
            <p>{m.body}</p>
            <div className="mono dim inbox__sig">— LUMA. THIS MESSAGE WILL NOT BE REPEATED.</div>
          </article>
        )}
      </div>
    </div>
  );
}
