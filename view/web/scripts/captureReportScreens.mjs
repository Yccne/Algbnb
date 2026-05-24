import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const frontUrl = process.env.FRONT_URL || 'http://127.0.0.1:5173';
const apiUrl = process.env.API_URL || 'http://127.0.0.1:3001/api';
const reportDir =
  process.env.REPORT_DIR || path.resolve(import.meta.dirname, '../../../../Rapport_de_Algbnb_revu_codex');
const password = 'Demo123!';

const accounts = {
  host: 'hote.demo@algbnb.local',
  traveler: 'voyageur.demo@algbnb.local',
  admin: 'admin.demo@algbnb.local',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  const found = candidates.find((item) => existsSync(item));
  if (!found) throw new Error('Chrome/Edge introuvable pour generer les captures.');
  return found;
}

function killProcessTree(child) {
  if (!child?.pid) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }
  child.kill();
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', (event) => {
      const payload = JSON.parse(event.data);
      if (!payload.id || !this.pending.has(payload.id)) return;
      const { resolve, reject } = this.pending.get(payload.id);
      this.pending.delete(payload.id);
      if (payload.error) reject(new Error(payload.error.message));
      else resolve(payload.result);
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  close() {
    this.ws?.close();
  }
}

async function reachable(url) {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitReachable(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await reachable(url)) return;
    await sleep(500);
  }
  throw new Error(`${url} ne repond pas.`);
}

async function openBrowser() {
  const userDataDir = mkdtempSync(path.join(tmpdir(), 'algbnb-report-captures-'));
  const debuggingPort = 10300 + Math.floor(Math.random() * 500);
  const chrome = spawn(findChrome(), [
    `--remote-debugging-port=${debuggingPort}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,1150',
    `${frontUrl}/`,
  ]);

  await waitReachable(`http://127.0.0.1:${debuggingPort}/json/version`, 20000);
  const targets = await fetch(`http://127.0.0.1:${debuggingPort}/json/list`).then((response) => response.json());
  const pageTarget = targets.find((target) => target.type === 'page') || targets[0];
  if (!pageTarget?.webSocketDebuggerUrl) throw new Error('Onglet Chrome CDP introuvable.');

  const cdp = new CdpClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1150,
    deviceScaleFactor: 1,
    mobile: false,
  });
  return { cdp, chrome, userDataDir };
}

async function evaluate(cdp, fn, ...args) {
  const expression = `(${fn})(...${JSON.stringify(args)})`;
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });
  if (result.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.exception?.description ||
        result.exceptionDetails.exception?.value ||
        result.exceptionDetails.text ||
        'Erreur JS dans la page.'
    );
  }
  return result.result?.value;
}

async function waitFor(cdp, predicate, timeoutMs = 30000, ...args) {
  const deadline = Date.now() + timeoutMs;
  let lastError = '';
  while (Date.now() < deadline) {
    try {
      const value = await evaluate(cdp, predicate, ...args);
      if (value) return value;
    } catch (error) {
      lastError = error.message;
    }
    await sleep(300);
  }
  throw new Error(lastError || 'Condition non atteinte avant capture.');
}

async function goto(cdp, pathOrUrl) {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${frontUrl}${pathOrUrl}`;
  await cdp.send('Page.navigate', { url });
  await waitFor(cdp, () => document.readyState === 'complete');
  await waitFor(cdp, () => document.querySelector('#root')?.children.length > 0);
}

async function login(cdp, email) {
  const response = await fetch(`${apiUrl}/auth/connexion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, mot_de_passe: password }),
  });
  if (!response.ok) throw new Error(`Connexion capture impossible pour ${email}.`);
  const session = await response.json();
  await evaluate(
    cdp,
    ({ token, user }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    session
  );
}

async function logout(cdp) {
  await evaluate(cdp, () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  });
}

async function screenshot(cdp, filename, options = {}) {
  await waitFor(cdp, () => document.body.innerText.length > 80);
  if (options.requireImages) {
    await waitFor(
      cdp,
      (minimum) => {
        const visibleImages = [...document.querySelectorAll('img')].filter((img) => {
          const rect = img.getBoundingClientRect();
          return rect.width > 80 && rect.height > 80 && rect.bottom > 0 && rect.top < window.innerHeight;
        });
        return (
          visibleImages.length >= minimum &&
          visibleImages.slice(0, minimum).every((img) => img.complete && img.naturalWidth > 0)
        );
      },
      30000,
      options.minimumImages || 1
    );
  }
  await sleep(options.delayMs || 500);
  const capture = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
    fromSurface: true,
  });
  const target = path.join(reportDir, filename);
  writeFileSync(target, Buffer.from(capture.data, 'base64'));
  console.log(`[capture] ${filename}`);
}

async function firstListingId(search) {
  const url = new URL(`${apiUrl}/logements`);
  url.searchParams.set('paginated', 'true');
  url.searchParams.set('search', search);
  url.searchParams.set('limit', '1');
  const response = await fetch(url);
  const payload = await response.json();
  const items = Array.isArray(payload.items) ? payload.items : [];
  const item =
    items.find(
      (row) =>
        Array.isArray(row.photos) &&
        row.photos.length >= 4 &&
        row.photos.every((photo) => String(photo).startsWith('/uploads/logements/demo/'))
    ) ||
    items.find((row) => Array.isArray(row.photos) && row.photos.length >= 4) ||
    items[0];
  if (!item?.id) throw new Error(`Aucun logement pour ${search}.`);
  return item.id;
}

function shiftDate(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

async function showPaymentPage(cdp, listingId) {
  const logement = await fetch(`${apiUrl}/logements/${listingId}`).then((response) => response.json());
  const nuits = 3;
  const sousTotal = Number(logement.prix_par_nuit || logement.prix || 0) * nuits;
  const frais = Math.round(sousTotal * 0.12);
  const reservationData = {
    logement,
    dateArrivee: shiftDate(140),
    dateDepart: shiftDate(143),
    voyageurs: 2,
    nuits,
    sousTotal,
    frais,
    total: sousTotal + frais,
    modeReservation: 'instantanee',
  };
  await goto(cdp, '/');
  await evaluate(
    cdp,
    (state) => {
      window.history.pushState({ usr: state, key: 'capture', idx: 1 }, '', '/reservation/confirmation');
      window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    },
    reservationData
  );
  await waitFor(cdp, () => document.body.innerText.includes('DAHABIYA'));
}

async function main() {
  if (!(await reachable(`${apiUrl}/health`))) throw new Error(`API indisponible: ${apiUrl}/health`);
  if (!(await reachable(frontUrl))) throw new Error(`Front indisponible: ${frontUrl}`);

  const bejaiaListingId = await firstListingId('Bejaia');
  let browser;
  try {
    browser = await openBrowser();
    const { cdp } = browser;

    await logout(cdp);
    await goto(cdp, '/connexion');
    await screenshot(cdp, 'interface-connexion-actuelle.png');

    await goto(cdp, '/resultats?search=Bejaia');
    await waitFor(cdp, () => document.querySelectorAll('a[href^="/logement/"]').length > 0);
    await waitFor(cdp, () => document.querySelectorAll('.listing-marker').length > 0);
    await waitFor(
      cdp,
      () =>
        [...document.querySelectorAll('a[href^="/logement/"] img')].some(
          (img) =>
            img.complete &&
            img.naturalWidth > 0 &&
            String(img.getAttribute('src') || '').includes('/uploads/logements/demo/')
        ),
      30000
    );
    await evaluate(cdp, () => {
      const cardWithLocalPhoto = [...document.querySelectorAll('a[href^="/logement/"]')].find((link) =>
        String(link.querySelector('img')?.getAttribute('src') || '').includes('/uploads/logements/demo/')
      );
      cardWithLocalPhoto?.scrollIntoView({ block: 'end' });
    });
    await screenshot(cdp, 'interface-resultats-actuels.png', { delayMs: 700, requireImages: true });

    await goto(cdp, `/logement/${bejaiaListingId}`);
    await waitFor(
      cdp,
      () =>
        [...document.querySelectorAll('img')].some(
          (img) =>
            img.complete &&
            img.naturalWidth > 0 &&
            String(img.getAttribute('src') || '').includes('/uploads/logements/demo/')
        ),
      30000
    );
    await screenshot(cdp, 'interface-detail-logement.png', { delayMs: 700, requireImages: true });

    await login(cdp, accounts.host);
    await goto(cdp, '/creer-annonce');
    await waitFor(cdp, () => document.body.innerText.includes('Ajoute entre 4 et 10 photos'));
    await evaluate(cdp, () => {
      const title = [...document.querySelectorAll('h2')].find((item) => item.innerText.includes('Photos'));
      title?.scrollIntoView({ block: 'center' });
    });
    await screenshot(cdp, 'interface-creation-ccp.png');

    await goto(cdp, '/resultats?search=Timimoun');
    await waitFor(cdp, () => document.querySelectorAll('.listing-marker').length > 0);
    await evaluate(cdp, () => {
      const map = document.querySelector('.maplibregl-map, .listings-map');
      map?.scrollIntoView({ block: 'center' });
    });
    await screenshot(cdp, 'map.png', { delayMs: 1000 });

    await login(cdp, accounts.traveler);
    await goto(cdp, '/reservations');
    await waitFor(cdp, () => document.body.innerText.includes('Voyages'));
    await screenshot(cdp, 'page reservation.png', { requireImages: true });

    await showPaymentPage(cdp, bejaiaListingId);
    await screenshot(cdp, 'interface-paiement-dahabiya.png');

    await login(cdp, accounts.host);
    await goto(cdp, '/dashboard-hote');
    await waitFor(cdp, () => document.body.innerText.includes('Mes annonces'));
    await evaluate(cdp, () => {
      const heading = [...document.querySelectorAll('h2, h3')].find((item) => item.innerText.includes('Mes annonces'));
      heading?.scrollIntoView({ block: 'start' });
    });
    await waitFor(
      cdp,
      () => [...document.querySelectorAll('img')].some((img) => img.complete && img.naturalWidth > 0),
      30000
    );
    await screenshot(cdp, 'interface-dashboard-hote-actuel.png', { requireImages: true });
    await evaluate(cdp, () => {
      const normalize = (value) =>
        String(value || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
      const heading = [...document.querySelectorAll('h2, h3')].find((item) =>
        normalize(item.innerText).includes('Echanges')
      );
      heading?.scrollIntoView({ block: 'start' });
    });
    await waitFor(
      cdp,
      () =>
        document.body.innerText
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .includes('Echanges')
    );
    await screenshot(cdp, 'interface-echanges-hotes.png');

    await login(cdp, accounts.traveler);
    await goto(cdp, '/messages');
    await waitFor(cdp, () => document.body.innerText.includes('Messages'));
    await waitFor(cdp, () => document.querySelectorAll('[style*="cursor: pointer"]').length >= 3);
    await screenshot(cdp, 'interface-messagerie.png');

    await login(cdp, accounts.admin);
    await goto(cdp, '/admin');
    await waitFor(cdp, () => document.body.innerText.includes('Administration'));
    await evaluate(cdp, () => {
      const avisTab = [...document.querySelectorAll('button')].find((button) => button.innerText.trim() === 'Avis');
      avisTab?.click();
    });
    await waitFor(
      cdp,
      () =>
        document.body.innerText.includes('Avis #') ||
        document.body.innerText.includes('Créer un litige') ||
        document.body.innerText.includes('Aucun avis trouvé'),
      15000
    );
    await screenshot(cdp, 'interface-admin-console.png');
  } finally {
    browser?.cdp?.close();
    killProcessTree(browser?.chrome);
    if (browser?.userDataDir) {
      try {
        rmSync(browser.userDataDir, { recursive: true, force: true });
      } catch {
        // Chrome peut garder un handle quelques secondes sous Windows.
      }
    }
  }
}

main().catch((error) => {
  console.error(`[capture] failed: ${error.message}`);
  process.exitCode = 1;
});
