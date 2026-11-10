import { useEffect, useState } from 'react';

const ROUTES = ['', 'insights', 'settings'];

function parse() {
  const r = window.location.hash.replace(/^#\/?/, '').split(/[?#]/)[0];
  return ROUTES.includes(r) ? r : '';
}

export function useRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => setRoute(parse());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function download(filename, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
