import { useEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { buildState, readScenarioFromUrl } from '@/fixtures/scenarios';
import { Lab } from '@/lab/Lab';
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
        <Route path="/lab" element={<Lab />} />
        <Route path="/lab/:section" element={<Lab />} />
        {/* Only /lab exists so far. The eight destinations land here as they are
            built (spec §4.1), and this catch-all goes with the last of them. */}
        <Route path="*" element={<Navigate to="/lab" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
