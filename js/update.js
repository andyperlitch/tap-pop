const POLL_MS = 60_000;
const DISMISS_KEY = 'tap-pop-dismissed-version';
const RELOAD_KEY = 'tap-pop-reloading';

function currentMetaVersion() {
  const el = document.querySelector('meta[name="app-version"]');
  return el?.getAttribute('content') || 'DEV';
}

function dismissedVersion() {
  try {
    return localStorage.getItem(DISMISS_KEY) || '';
  } catch {
    return '';
  }
}

function setDismissed(version) {
  try {
    localStorage.setItem(DISMISS_KEY, version);
  } catch {
    /* ignore */
  }
}

function showToast(version, onRefresh) {
  if (!version || version === dismissedVersion()) return;
  const toast = document.getElementById('update-toast');
  if (!toast) return;
  toast.hidden = false;
  toast.dataset.version = version;
  const refresh = toast.querySelector('[data-update-refresh]');
  const dismiss = toast.querySelector('[data-update-dismiss]');
  refresh.onclick = () => onRefresh();
  dismiss.onclick = () => {
    setDismissed(version);
    toast.hidden = true;
  };
}

async function fetchRemoteVersion() {
  const url = new URL('./version.json', document.baseURI);
  url.searchParams.set('_', String(Date.now()));
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('version fetch failed');
  const data = await res.json();
  return String(data.version || '');
}

export function initUpdatePrompt() {
  const localVersion = currentMetaVersion();
  let waitingWorker = null;
  let userAskedRefresh = false;
  let reloadArmed = false;

  function reloadOnce() {
    if (reloadArmed) return;
    reloadArmed = true;
    try {
      sessionStorage.setItem(RELOAD_KEY, '1');
    } catch {
      /* ignore */
    }
    location.reload();
  }

  function activateWaiting() {
    userAskedRefresh = true;
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      return;
    }
    reloadOnce();
  }

  function offer(version) {
    if (!version || version === localVersion) return;
    showToast(version, activateWaiting);
  }

  try {
    sessionStorage.removeItem(RELOAD_KEY);
  } catch {
    /* ignore */
  }

  navigator.serviceWorker?.addEventListener('controllerchange', () => {
    if (userAskedRefresh) reloadOnce();
  });

  async function checkVersionJson() {
    try {
      return await fetchRemoteVersion();
    } catch {
      return '';
    }
  }

  async function checkServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;
      await reg.update();
      if (reg.waiting) waitingWorker = reg.waiting;
    } catch {
      /* ignore */
    }
  }

  function watchRegistration(reg) {
    if (!reg) return;
    if (reg.waiting && navigator.serviceWorker.controller) waitingWorker = reg.waiting;
    reg.addEventListener('updatefound', () => {
      const worker = reg.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          waitingWorker = worker;
          checkAll();
        }
      });
    });
  }

  async function checkAll() {
    const [remote] = await Promise.all([checkVersionJson(), checkServiceWorker()]);
    if (remote && remote !== localVersion) offer(remote);
    else if (waitingWorker && navigator.serviceWorker.controller) offer(`${localVersion}-pending`);
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(watchRegistration).catch(() => {});
  }

  checkAll();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkAll();
  });
  window.addEventListener('focus', checkAll);
  setInterval(checkAll, POLL_MS);
}
