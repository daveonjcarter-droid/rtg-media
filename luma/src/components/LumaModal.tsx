import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

// In Performance Mode (`locked`), backdrop clicks and Escape are ignored so an actor can't dismiss it by accident.
export function LumaModal({ open, onClose, locked, children, wide }: { open: boolean; onClose: () => void; locked?: boolean; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open || locked) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, locked, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="modal" onClick={() => !locked && onClose()}>
      <div className={`modal__box ${wide ? "modal__box--wide" : ""}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>,
    document.body,
  );
}
