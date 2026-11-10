import { useEffect, useRef } from 'react';
import { useStore, useNow } from './state/store.jsx';
import { useRoute } from './hooks.js';
import { remainingOf } from './lib/timer.js';
import { formatClock } from './lib/time.js';
import { MODE_LABEL } from './lib/defaults.js';
import FocusPage from './pages/FocusPage.jsx';
import InsightsPage from './pages/InsightsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import { IconButton, Button } from './components/ui.jsx';
import { IconChart, IconClock, IconMoon, IconSliders, IconSun, Mark } from './components/Icons.jsx';

const NAV = [
  { route: '', href: '#/', label: 'Focus', icon: IconClock },
  { route: 'insights', href: '#/insights', label: 'Insights', icon: IconChart },
  { route: 'settings', href: '#/settings', label: 'Settings', icon: IconSliders },
];
const PAGE_TITLE = { '': 'Focus', insights: 'Insights', settings: 'Settings' };

function useResolvedTheme(theme) {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', dark ? '#151210' : '#F5EFE3');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
}

export default function App() {
  const { state, actions } = useStore();
  const { timer, settings, toast, undo } = state;
  const route = useRoute();
  const now = useNow(timer.status === 'running', 1000);
  const main = useRef(null);

  useResolvedTheme(settings.theme);

  useEffect(() => { document.documentElement.dataset.mode = timer.mode; }, [timer.mode]);

  useEffect(() => {
    const base = `${PAGE_TITLE[route]} · Slowburn`;
    document.title = timer.status === 'running' ? `${formatClock(remainingOf(timer, now))} · ${MODE_LABEL[timer.mode]}` : base;
  }, [timer, now, route]);

  // Move focus to the page heading on navigation so keyboard and screen-reader users land in the right place.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    main.current?.querySelector('h1')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [route]);

  const dark = document.documentElement.dataset.theme === 'dark';
  const toggleTheme = () => actions.updateSettings({ theme: dark ? 'light' : 'dark' });

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#/" aria-label="Slowburn, home">
          <span className="brand-mark"><Mark /></span>
          Slowburn
        </a>
        <nav className="nav-top" aria-label="Primary">
          {NAV.map(({ route: r, href, label, icon: I }) => (
            <a key={label} href={href} className="nav-link" aria-current={route === r ? 'page' : undefined}><I size={18} />{label}</a>
          ))}
        </nav>
        <IconButton label={dark ? 'Switch to light theme' : 'Switch to dark theme'} onClick={toggleTheme}>
          {dark ? <IconSun /> : <IconMoon />}
        </IconButton>
      </header>

      <main className="main" id="main" ref={main}>
        {route === '' && <h1 className="sr-only" tabIndex={-1}>Focus</h1>}
        {route === '' && <FocusPage />}
        {route === 'insights' && <InsightsPage />}
        {route === 'settings' && <SettingsPage />}
      </main>

      <nav className="nav-bottom" aria-label="Primary">
        {NAV.map(({ route: r, href, label, icon: I }) => (
          <a key={label} href={href} className="nav-link" aria-current={route === r ? 'page' : undefined}><I size={22} />{label}</a>
        ))}
      </nav>

      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div className="toast" key={toast.id} data-testid="toast">
            <span>{toast.text}</span>
            {toast.action && <Button variant="ghost" size="sm" onClick={() => { toast.action.run(); actions.dismissToast(toast.id); }}>{toast.action.label}</Button>}
          </div>
        )}
        {!toast && undo && (
          <div className="toast" data-testid="toast-undo">
            <span>Task deleted.</span>
            <Button variant="ghost" size="sm" onClick={actions.undoRemove}>Undo</Button>
          </div>
        )}
      </div>
    </div>
  );
}
