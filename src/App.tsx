import { useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router';
import { Shell } from '@/chrome/Shell';
import { buildState, readScenarioFromUrl } from '@/fixtures/scenarios';
import { Lab } from '@/lab/Lab';
import { Calendar } from '@/screens/Calendar';
import { Canvas } from '@/screens/Canvas';
import { Files } from '@/screens/Files';
import { FirmMemory } from '@/screens/FirmMemory';
import { Home } from '@/screens/Home';
import { Money } from '@/screens/Money';
import { Onboarding } from '@/screens/Onboarding';
import { People } from '@/screens/People';
import { Projects } from '@/screens/Projects';
import { ProjectWorkspaceRoute } from '@/screens/ProjectWorkspace';
import { Settings } from '@/screens/Settings';
import { type OnboardingStep, useStore } from '@/store/store';

/**
 * A firm that has ingested nothing belongs in onboarding — the demo's 0:30
 * beat — rather than looking at an empty Home.
 *
 * The `?s=` query is carried across, because it is what seeds the store: a
 * redirect that dropped it would silently reseed the demo as `live` on the next
 * refresh, showing the wrong firm at the opening.
 */
/**
 * Whether a firm at this step belongs in onboarding.
 *
 * Exported so the gate's rule can be tested directly: `renderToStaticMarkup`
 * does not follow a `Navigate`, so a routing test cannot observe the decision.
 */
export const belongsInOnboarding = (step: OnboardingStep): boolean => step === 'seed';

function OnboardingGate() {
  const step = useStore((s) => s.onboarding.step);
  const { search } = useLocation();
  return belongsInOnboarding(step) ? <Navigate to={`/onboarding${search}`} replace /> : <Home />;
}

/**
 * Seeds the store from `?s=`. State is in memory and resets on refresh — this is
 * the whole of our persistence story (CLAUDE.md, "scenarios, not persistence").
 */
function useScenario() {
  const reset = useStore((s) => s.reset);
  const seeded = useRef(false);

  // Seeded during render, not in an effect. The store's initial `step` is
  // 'seed', and `OnboardingGate` reads it on the *first* render — so seeding
  // afterwards meant `/?s=live` redirected to onboarding and `replace` made it
  // stick, showing the opening beat when the demo asked for the mid-demo firm.
  if (!seeded.current) {
    seeded.current = true;
    reset(buildState(readScenarioFromUrl()));
  }
}

/**
 * The route table, without a router around it.
 *
 * Separated so `App.test.tsx` can mount it inside a `MemoryRouter` at any path
 * and assert that every rail destination reaches its own screen — the "no dead
 * ends" bar. A test that duplicated this list could not catch a deleted route.
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* Screens render inside the shell — rail, topbar, ask bar. */}
      <Route element={<Shell />}>
        <Route path="/" element={<OnboardingGate />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:projectId" element={<ProjectWorkspaceRoute />} />
        <Route path="/money" element={<Money />} />
        <Route path="/people" element={<People />} />
        <Route path="/files" element={<Files />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/memory" element={<FirmMemory />} />
        <Route path="/canvas" element={<Canvas />} />
        <Route path="/canvas/:questionId" element={<Canvas />} />
      </Route>

      {/* /lab is a review surface, deliberately outside the chrome. */}
      <Route path="/lab" element={<Lab />} />
      <Route path="/lab/:section" element={<Lab />} />
      {/* Every destination in §4.1 now exists; this catches typos only. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  useScenario();

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
