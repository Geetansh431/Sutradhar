import { useEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router';
import { Shell } from '@/chrome/Shell';
import { buildState, readScenarioFromUrl } from '@/fixtures/scenarios';
import { Lab } from '@/lab/Lab';
import { Canvas } from '@/screens/Canvas';
import { FirmMemory } from '@/screens/FirmMemory';
import { Home } from '@/screens/Home';
import { Money } from '@/screens/Money';
import { Onboarding } from '@/screens/Onboarding';
import { People } from '@/screens/People';
import { Projects } from '@/screens/Projects';
import { ProjectWorkspaceRoute } from '@/screens/ProjectWorkspace';
import { useStore } from '@/store/store';

/**
 * A firm that has ingested nothing belongs in onboarding — the demo's 0:30
 * beat — rather than looking at an empty Home.
 *
 * The `?s=` query is carried across, because it is what seeds the store: a
 * redirect that dropped it would silently reseed the demo as `live` on the next
 * refresh, showing the wrong firm at the opening.
 */
function OnboardingGate() {
  const step = useStore((s) => s.onboarding.step);
  const { search } = useLocation();
  return step === 'seed' ? <Navigate to={`/onboarding${search}`} replace /> : <Home />;
}

/**
 * Seeds the store from `?s=`. State is in memory and resets on refresh — this is
 * the whole of our persistence story (CLAUDE.md, "scenarios, not persistence").
 */
function useScenario() {
  const reset = useStore((s) => s.reset);
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    reset(buildState(readScenarioFromUrl()));
  }, [reset]);
}

export function App() {
  useScenario();

  return (
    <BrowserRouter>
      <Routes>
        {/* Screens render inside the shell — rail, topbar, ask bar. */}
        <Route element={<Shell />}>
          <Route path="/" element={<OnboardingGate />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<ProjectWorkspaceRoute />} />
          <Route path="/money" element={<Money />} />
          <Route path="/people" element={<People />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/memory" element={<FirmMemory />} />
          <Route path="/canvas" element={<Canvas />} />
          <Route path="/canvas/:questionId" element={<Canvas />} />
        </Route>

        {/* /lab is a review surface, deliberately outside the chrome. */}
        <Route path="/lab" element={<Lab />} />
        <Route path="/lab/:section" element={<Lab />} />
        {/* Home, Money, Canvas, Onboarding and /lab exist so far. The rest of
            the eight land here as they are built (§4.1). */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
