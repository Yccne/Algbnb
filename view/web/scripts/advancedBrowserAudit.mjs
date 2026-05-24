import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const frontUrl = process.env.FRONT_URL || 'http://127.0.0.1:5173';
const apiUrl = process.env.API_URL || 'http://127.0.0.1:3001/api';
const password = 'QaCodex123!';
const presentationOnly = process.argv.includes('--presentation-clean');
const qa = {
  traveler: 'qa.codex.voyageur@algbnb.local',
  host: 'qa.codex.hote@algbnb.local',
  admin: 'qa.codex.admin@algbnb.local',
};

const state = {
  checks: [],
  networkProblems: [],
  runtimeErrors: [],
  children: [],
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function ok(name, detail = '') {
  state.checks.push({ name, ok: true, detail });
  console.log(`[ok] ${name}${detail ? ` - ${detail}` : ''}`);
}

function fail(name, detail) {
  state.checks.push({ name, ok: false, detail });
  console.error(`[fail] ${name}: ${detail}`);
}

async function step(name, fn) {
  try {
    const detail = await fn();
    ok(name, typeof detail === 'string' ? detail : '');
    return detail;
  } catch (error) {
    fail(name, error.message);
    return null;
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

function spawnTracked(file, args, options = {}) {
  const child = spawn(file, args, {
    shell: options.shell ?? (process.platform === 'win32' && /\.(cmd|bat)$/i.test(file)),
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
  state.children.push(child);
  child.stdout.on('data', (chunk) => process.stdout.write(chunk));
  child.stderr.on('data', (chunk) => process.stderr.write(chunk));
  return child;
}

function killProcessTree(child) {
  if (!child || child.killed || !child.pid) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }
  child.kill();
}

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
  if (!found) throw new Error('Chrome/Edge introuvable pour lancer le test web avance.');
  return found;
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.nextId = 1;
    this.pending = new Map();
    this.handlers = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', (event) => {
      const payload = JSON.parse(event.data);
      if (payload.id && this.pending.has(payload.id)) {
        const { resolve, reject } = this.pending.get(payload.id);
        this.pending.delete(payload.id);
        if (payload.error) reject(new Error(payload.error.message));
        else resolve(payload.result);
        return;
      }
      const handlers = this.handlers.get(payload.method) || [];
      handlers.forEach((handler) => handler(payload.params || {}));
    });
  }

  on(method, handler) {
    const handlers = this.handlers.get(method) || [];
    handlers.push(handler);
    this.handlers.set(method, handlers);
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

async function openBrowser() {
  const userDataDir = mkdtempSync(path.join(tmpdir(), 'algbnb-advanced-browser-'));
  const debuggingPort = 9800 + Math.floor(Math.random() * 500);
  const chrome = spawnTracked(findChrome(), [
    `--remote-debugging-port=${debuggingPort}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,1000',
    `${frontUrl}/`,
  ]);

  await waitReachable(`http://127.0.0.1:${debuggingPort}/json/version`, 20000);
  const targets = await fetch(`http://127.0.0.1:${debuggingPort}/json/list`).then((response) => response.json());
  const pageTarget = targets.find((target) => target.type === 'page') || targets[0];
  if (!pageTarget?.webSocketDebuggerUrl) throw new Error('Onglet Chrome CDP introuvable.');

  const cdp = new CdpClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();
  cdp.on('Network.responseReceived', ({ response }) => {
    if (response?.status >= 500) state.networkProblems.push(`${response.status} ${response.url}`);
  });
  cdp.on('Runtime.exceptionThrown', ({ exceptionDetails }) => {
    state.runtimeErrors.push(exceptionDetails?.text || 'Runtime exception');
  });
  cdp.on('Log.entryAdded', ({ entry }) => {
    const text = String(entry?.text || '');
    if (entry?.level === 'error' && !text.includes('favicon') && !text.includes('Failed to load resource')) {
      state.runtimeErrors.push(text);
    }
  });

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');
  await cdp.send('Log.enable');
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

async function waitFor(cdp, predicate, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = '';
  while (Date.now() < deadline) {
    try {
      const value = await evaluate(cdp, predicate);
      if (value) return value;
    } catch (error) {
      lastError = error.message;
    }
    await sleep(300);
  }
  throw new Error(lastError || 'Condition non atteinte dans le navigateur.');
}

async function goto(cdp, pathOrUrl) {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${frontUrl}${pathOrUrl}`;
  await cdp.send('Page.navigate', { url });
  await waitFor(cdp, () => document.readyState === 'complete');
  await waitFor(cdp, () => document.querySelector('#root')?.children.length > 0);
}

const pageTools = {
  text: () => document.body.innerText,
  path: () => location.pathname + location.search,
  clearStorage: () => localStorage.clear(),
  hasMojibake: () => /[Ã‚Ãƒ]|Ã¢[â‚¬Â¢â‚¬â„¢]/.test(document.body.innerText),
  hasReservationActionButton: () =>
    [...document.querySelectorAll('button')].some((button) => {
      const text = button.innerText.trim();
      return text.includes('Réserver maintenant') || text.includes('Demander à réserver');
    }),
  firstAdvancedListingHref: () => {
    const link = [...document.querySelectorAll('a[href^="/logement/"]')].find((item) =>
      item.innerText.includes('[QA ADV] Bejaia Calendrier Bloque')
    );
    return link?.getAttribute('href') || null;
  },
  firstListingHref: () => {
    const link = [...document.querySelectorAll('a[href^="/logement/"]')].find((item) => item.innerText.trim().length > 0);
    return link?.getAttribute('href') || null;
  },
  markerCount: () => document.querySelectorAll('.listing-marker').length,
  fillPlaceholder: (placeholder, value) => {
    const el = [...document.querySelectorAll('input, textarea')].find((item) => item.placeholder === placeholder);
    if (!el) throw new Error(`Champ introuvable: ${placeholder}`);
    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value');
    descriptor?.set ? descriptor.set.call(el, value) : (el.value = value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  },
  clickText: (text) => {
    const candidates = [...document.querySelectorAll('button, a')].filter((item) =>
      item.innerText.trim().includes(text)
    );
    if (candidates.length === 0) throw new Error(`Bouton/lien introuvable: ${text}`);
    candidates[0].click();
  },
  clickAnyText: (texts) => {
    const candidates = [...document.querySelectorAll('button, a')].filter((item) =>
      texts.some((text) => item.innerText.trim().includes(text))
    );
    if (candidates.length === 0) throw new Error(`Bouton/lien introuvable: ${texts.join(' ou ')}`);
    candidates[0].click();
  },
  clickLogout: () => {
    const button = document.querySelector('button[aria-label="Se deconnecter"]');
    if (!button) throw new Error('Bouton deconnexion introuvable.');
    button.click();
  },
  fileInputState: () => {
    const input = document.querySelector('input[type="file"]');
    return input
      ? {
          multiple: input.hasAttribute('multiple'),
          accept: input.getAttribute('accept') || '',
          hasUrlField: [...document.querySelectorAll('input, textarea')].some((item) =>
            /url|http|photo_urls/i.test(`${item.placeholder || ''} ${item.name || ''}`)
          ),
        }
      : null;
  },
  setFileInputImages: (count = 4) => {
    const input = document.querySelector('input[type="file"]');
    if (!input) throw new Error('Champ photos introuvable.');
    const dataTransfer = new DataTransfer();
    const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13]);
    for (let index = 0; index < count; index += 1) {
      dataTransfer.items.add(new File([pngBytes], `audit-avance-${index + 1}.png`, { type: 'image/png' }));
    }
    Object.defineProperty(input, 'files', { value: dataTransfer.files, configurable: true });
    input.dispatchEvent(new Event('change', { bubbles: true }));
  },
};

const call = (cdp, tool, ...args) => evaluate(cdp, pageTools[tool], ...args);

async function assertNoMojibake(cdp, name) {
  if (await call(cdp, 'hasMojibake')) {
    const text = await call(cdp, 'text');
    throw new Error(`Caracteres casses visibles sur ${name}: ${text.match(/[^\n]*(?:[Ã‚Ãƒ]|Ã¢[â‚¬Â¢â‚¬â„¢])[^\n]*/)?.[0] || 'texte casse'}`);
  }
}

async function login(cdp, email) {
  await call(cdp, 'clearStorage').catch(() => {});
  await goto(cdp, '/connexion');
  await call(cdp, 'fillPlaceholder', 'E-mail ou telephone', email);
  await call(cdp, 'fillPlaceholder', 'Mot de passe', password);
  await call(cdp, 'clickText', 'Se connecter');
  await waitFor(cdp, () => !location.pathname.includes('/connexion'));
}

async function logout(cdp) {
  await goto(cdp, '/');
  await call(cdp, 'clickLogout');
  await sleep(500);
}

async function main() {
  let browser;
  try {
    if (!(await reachable(`${apiUrl}/health`))) throw new Error(`API indisponible: ${apiUrl}/health`);
    if (!(await reachable(frontUrl))) throw new Error(`Front indisponible: ${frontUrl}`);

    browser = await openBrowser();
    const { cdp } = browser;

    if (presentationOnly) {
      await step('pages publiques presentation sans traces QA visibles', async () => {
        for (const pathName of ['/', '/confidentialite', '/conditions', '/aide']) {
          await goto(cdp, pathName);
          await waitFor(cdp, () => document.body.innerText.length > 100);
          const text = await call(cdp, 'text');
          if (/\bQA\b|\bDEMO\b|\[QA/i.test(text)) {
            throw new Error(`Trace QA/DEMO visible sur ${pathName}.`);
          }
          await assertNoMojibake(cdp, `presentation ${pathName}`);
        }
      });

      await step('recherches presentation zones algeriennes propres', async () => {
        for (const place of ['Djanet', 'Timimoun', 'Tamanrasset', 'Beni Abbes', 'El Menia', 'El Kseur']) {
          await goto(cdp, `/resultats?search=${encodeURIComponent(place)}`);
          await waitFor(
            cdp,
            () => document.body.innerText.length > 150 && !document.querySelector('.spinner'),
            30000
          );
          const cardCount = await evaluate(cdp, () => document.querySelectorAll('a[href^="/logement/"]').length);
          if (cardCount < 1) {
            const text = await call(cdp, 'text');
            throw new Error(`Aucun logement visible pour ${place}: ${text.slice(0, 500)}`);
          }
          const text = await call(cdp, 'text');
          if (/\bQA\b|\bDEMO\b|\[QA/i.test(text)) {
            throw new Error(`Trace QA/DEMO visible dans la recherche ${place}.`);
          }
          await assertNoMojibake(cdp, `presentation ${place}`);
        }
      });

    } else {
      await step('desktop pages critiques rendent sans erreur', async () => {
      await cdp.send('Emulation.clearDeviceMetricsOverride');
      for (const pathName of ['/', '/resultats?search=Bejaia', '/messages']) {
        if (pathName === '/messages') {
          await login(cdp, qa.traveler);
        } else {
          await goto(cdp, pathName);
        }
        await waitFor(cdp, () => document.body.innerText.length > 100);
        await assertNoMojibake(cdp, `desktop ${pathName}`);
      }
    });

    await step('mobile pages critiques rendent sans chevauchement evident', async () => {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 390,
        height: 844,
        deviceScaleFactor: 1,
        mobile: true,
      });
      for (const pathName of ['/', '/resultats?search=Bejaia', '/dashboard-hote']) {
        if (pathName === '/dashboard-hote') {
          await login(cdp, qa.host);
        } else {
          await goto(cdp, pathName);
        }
        await waitFor(cdp, () => document.body.innerText.length > 100);
        const overflow = await evaluate(
          cdp,
          () => document.scrollingElement.scrollWidth > window.innerWidth + 12
        );
        if (overflow) throw new Error(`Debordement horizontal mobile sur ${pathName}.`);
        await assertNoMojibake(cdp, `mobile ${pathName}`);
      }
      await cdp.send('Emulation.clearDeviceMetricsOverride');
    });

    await step('voyageur voit reservation et erreur locale sans dates', async () => {
      await login(cdp, qa.traveler);
      await goto(cdp, '/resultats?search=QA%20ADV%20Bejaia%20Calendrier');
      await waitFor(cdp, () => document.querySelectorAll('a[href^="/logement/"]').length > 0, 30000);
      const href = (await call(cdp, 'firstAdvancedListingHref')) || (await call(cdp, 'firstListingHref'));
      if (!href) throw new Error('Fiche QA avancee introuvable.');
      await goto(cdp, href);
      await waitFor(cdp, () =>
        [...document.querySelectorAll('button')].some((button) => {
          const text = button.innerText.trim();
          return text.includes('Réserver maintenant') || text.includes('Demander à réserver');
        })
      );
      await call(cdp, 'clickAnyText', ['Réserver maintenant', 'Demander à réserver']);
      await waitFor(cdp, () => document.body.innerText.includes('Selectionne une date arrivee et une date depart'));
      await assertNoMojibake(cdp, 'erreur reservation voyageur');
    });

    await step('hote et admin ne voient jamais action reservation', async () => {
      await login(cdp, qa.host);
      await goto(cdp, '/resultats?search=QA%20ADV%20Bejaia%20Calendrier');
      await waitFor(cdp, () => document.querySelectorAll('a[href^="/logement/"]').length > 0, 30000);
      const href = (await call(cdp, 'firstAdvancedListingHref')) || (await call(cdp, 'firstListingHref'));
      if (!href) throw new Error('Fiche QA avancee introuvable pour roles.');
      await goto(cdp, href);
      await waitFor(cdp, () => document.body.innerText.includes('Connecte-toi avec un compte voyageur'));
      if (await call(cdp, 'hasReservationActionButton')) throw new Error('Bouton reservation visible pour hote.');

      await logout(cdp);
      await login(cdp, qa.admin);
      await goto(cdp, href);
      await waitFor(cdp, () => document.body.innerText.includes('Connecte-toi avec un compte voyageur'));
      if (await call(cdp, 'hasReservationActionButton')) throw new Error('Bouton reservation visible pour admin.');
      await goto(cdp, '/reservation/confirmation');
      await waitFor(cdp, () => location.pathname === '/');
    });

    await step('creation annonce UI photos uniquement fichiers', async () => {
      await login(cdp, qa.host);
      await goto(cdp, '/creer-annonce');
      await waitFor(cdp, () => Boolean(document.querySelector('input[type="file"]')));
      const state = await call(cdp, 'fileInputState');
      if (!state?.multiple) throw new Error('Le champ photo ne permet pas plusieurs fichiers.');
      if (state.hasUrlField) throw new Error('Un champ URL photo est encore visible.');
      if (!state.accept.includes('image')) throw new Error('Le champ photo ne filtre pas les images.');
      await waitFor(cdp, () => document.body.innerText.includes('Ajoute entre 4 et 10 photos'));
      await call(cdp, 'setFileInputImages', 3);
      await waitFor(cdp, () => document.body.innerText.includes('Ajoute au moins 4 photos du logement'));
      await call(cdp, 'setFileInputImages', 4);
      await waitFor(cdp, () => document.body.innerText.includes('4 nouvelle(s) photo(s)'));
      return `multiple=${state.multiple}`;
    });

      await step('recherche geographique avancee et carte coherente', async () => {
      await goto(cdp, '/resultats?search=el%20kser');
      await waitFor(cdp, () => document.querySelectorAll('a[href^="/logement/"]').length > 0, 30000);
      const mapUrl = new URL(`${apiUrl}/logements/map`);
      mapUrl.searchParams.set('search', 'el kser');
      const apiData = await fetch(mapUrl).then((response) => response.json());
      const apiCount = apiData.filter((item) => item.latitude !== null && item.longitude !== null).length;
      let markerCount = await call(cdp, 'markerCount');
      const deadline = Date.now() + 15000;
      while (markerCount !== apiCount && Date.now() < deadline) {
        await sleep(300);
        markerCount = await call(cdp, 'markerCount');
      }
      if (markerCount !== apiCount) {
        throw new Error(`Carte incomplete: ${markerCount} marqueur(s) pour ${apiCount} point(s) API.`);
      }
      return `${markerCount}/${apiCount} marqueurs`;
      });
    }

    if (state.networkProblems.length > 0) {
      throw new Error(`Erreurs reseau 500 detectees: ${state.networkProblems.join(' | ')}`);
    }
    if (state.runtimeErrors.length > 0) {
      throw new Error(`Erreurs runtime navigateur: ${state.runtimeErrors.slice(0, 5).join(' | ')}`);
    }
  } finally {
    browser?.cdp?.close();
    if (browser?.chrome && !browser.chrome.killed) browser.chrome.kill();
    if (browser?.userDataDir) {
      try {
        rmSync(browser.userDataDir, { recursive: true, force: true });
      } catch {
        // Chrome peut garder un handle quelques secondes sous Windows.
      }
    }
    state.children.forEach(killProcessTree);
  }

  const failed = state.checks.filter((item) => !item.ok);
  console.log(JSON.stringify({ total: state.checks.length, failed: failed.length, failedNames: failed.map((item) => item.name) }, null, 2));
  if (failed.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`[advanced-web-audit] failed: ${error.message}`);
  process.exitCode = 1;
});
