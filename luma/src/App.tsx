import { useEffect, useRef } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation, useSearchParams } from "react-router-dom";
import { DirectorPanel, usePresetLoader } from "./components/DirectorPanel";
import { PortalLayout } from "./components/PortalLayout";
import { scenePresets } from "./data/scenes";
import ActiveContract from "./screens/portal/ActiveContract";
import Completion from "./screens/portal/Completion";
import ContractDetail from "./screens/portal/ContractDetail";
import Contracts from "./screens/portal/Contracts";
import Dashboard from "./screens/portal/Dashboard";
import Leaderboard from "./screens/portal/Leaderboard";
import Login from "./screens/portal/Login";
import Messages from "./screens/portal/Messages";
import Network from "./screens/portal/Network";
import OperatorProfile from "./screens/portal/OperatorProfile";
import Payments from "./screens/portal/Payments";
import PublicHome from "./screens/public/PublicHome";
import Welcome from "./screens/public/Welcome";
import { SceneProvider, useScene } from "./state/scene";

/** Reads URL controls once: ?director  ?scene=<presetId>  ?reset  ?naomi. Works in the real query or inside the hash. */
function useUrlControls() {
  const [params] = useSearchParams();
  const loadPreset = usePresetLoader();
  const done = useRef(false);
  const all = new URLSearchParams(window.location.search);
  params.forEach((v, k) => all.set(k, v));

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const scene = all.get("scene") ?? (all.has("naomi") ? "naomi" : all.has("reset") ? "public" : null);
    const preset = scenePresets.find((p) => p.id === scene);
    if (preset) loadPreset(preset);
  }, []);

  return all.has("director");
}

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

function Shell() {
  const { state } = useScene();
  const openDirector = useUrlControls();
  return (
    <>
      <ScrollTop />
      {/* animKey remounts every screen: "restart animations" and resets replay identically. */}
      <div key={state.animKey} className="app">
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/access" element={<Login />} />
          <Route path="/naomi" element={<NaomiEntry />} />
          <Route path="/portal" element={<PortalLayout />}>
            <Route index element={state.naomiMode ? <Navigate to="/portal/network" replace /> : <Dashboard />} />
            <Route path="contracts" element={<Contracts />} />
            <Route path="contracts/:id" element={<ContractDetail />} />
            <Route path="active" element={<ActiveContract />} />
            <Route path="complete" element={<Completion />} />
            <Route path="network" element={<Network />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="operators/:id" element={<OperatorProfile />} />
            <Route path="messages" element={<Messages />} />
            <Route path="payments" element={<Payments />} />
            <Route path="*" element={<Navigate to="/portal" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <DirectorPanel openInitially={openDirector} />
    </>
  );
}

/** #/naomi — one-tap entry into the Naomi discovery route (clean state, public homepage). */
function NaomiEntry() {
  const loadPreset = usePresetLoader();
  useEffect(() => {
    loadPreset(scenePresets.find((p) => p.id === "naomi")!);
  }, [loadPreset]);
  return null;
}

export default function App() {
  return (
    <HashRouter>
      <SceneProvider>
        <Shell />
      </SceneProvider>
    </HashRouter>
  );
}
