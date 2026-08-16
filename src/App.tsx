import { useEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { Shell } from '@/chrome/Shell';
import { buildState, readScenarioFromUrl } from '@/fixtures/scenarios';
import { Lab } from '@/lab/Lab';
import { Home } from '@/screens/Home';
import { Money } from '@/screens/Money';
import { useStore } from '@/store/store';

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
          <Route path="/" element={<Home />} />
          <Route path="/money" element={<Money />} />
        </Route>

        {/* /lab is a review surface, deliberately outside the chrome. */}
        <Route path="/lab" element={<Lab />} />
        <Route path="/lab/:section" element={<Lab />} />
        {/* Home, Money and /lab exist so far. The rest of the eight land here
            as they are built (§4.1); the catch-all goes with the last of them. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
