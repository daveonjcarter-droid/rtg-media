import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useScene } from "../state/scene";
import { Navigation } from "./Navigation";
import { Toast } from "./Toast";

// The back wall of the company: same brand, colder and denser.
export function PortalLayout() {
  const { state } = useScene();
  const location = useLocation();
  if (!state.loggedIn) return <Navigate to="/access" replace />;
  const bare = location.pathname === "/portal/complete";
  return (
    <div className={`portal dark grain ${bare ? "portal--bare" : ""}`}>
      {!bare && <Navigation />}
      <main className="portal__main" key={location.pathname}>
        <Outlet />
      </main>
      {state.flashKey > 0 && <div className="flash" key={`flash${state.flashKey}`} />}
      <Toast />
    </div>
  );
}
