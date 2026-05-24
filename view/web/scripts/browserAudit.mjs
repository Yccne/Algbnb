import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const rootDir = path.resolve(import.meta.dirname, '../../..');
const webDir = path.resolve(import.meta.dirname, '..');
const apiDir = path.resolve(rootDir, 'controller/api');
const frontUrl = process.env.FRONT_URL || 'http://127.0.0.1:5173';
const apiUrl = process.env.API_URL || 'http://127.0.0.1:3001/api';
const password = 'QaCodex123!';

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

const command = (name) => (process.platform === 'win32' ? `${name}.cmd` : name);

const log = (message) => console.log(`[web-audit] ${message}`);

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

function spawnTracked(file, args, options = {}) {
  const shell =
    options.shell ?? (process.platform === 'win32' && /\.(cmd|bat)$/i.test(file));
  const child = spawn(file, args, {
    shell,
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
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
    });
    return;
  }
  child.kill();
}

async function waitReachable(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await reachable(url)) return;
    await sleep(500);
  }
  throw new Error(`${url} ne repond pas.`);
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
  if (!found) throw new Error('Chrome/Edge introuvable pour lancer le test web.');
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
  const userDataDir = mkdtempSync(path.join(tmpdir(), 'algbnb-browser-'));
  const debuggingPort = 9333 + Math.floor(Math.random() * 500);
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

  const versionUrl = `http://127.0.0.1:${debuggingPort}/json/version`;
  await waitReachable(versionUrl, 20000);
  const targetsUrl = `http://127.0.0.1:${debuggingPort}/json/list`;
  const targets = await fetch(targetsUrl).then((response) => response.json());
  const pageTarget = targets.find((target) => target.type === 'page') || targets[0];
  if (!pageTarget?.webSocketDebuggerUrl) {
    throw new Error('Onglet Chrome CDP introuvable.');
  }
  const cdp = new CdpClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();

  cdp.on('Network.responseReceived', ({ response }) => {
    if (response?.status >= 500) {
      state.networkProblems.push(`${response.status} ${response.url}`);
    }
  });
  cdp.on('Runtime.exceptionThrown', ({ exceptionDetails }) => {
    state.runtimeErrors.push(exceptionDetails?.text || 'Runtime exception');
  });
  cdp.on('Log.entryAdded', ({ entry }) => {
    const text = String(entry?.text || '');
    if (
      entry?.level === 'error' &&
      !text.includes('favicon') &&
      !text.includes('Failed to load resource')
    ) {
      state.runtimeErrors.push(entry.text);
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

async function goto(cdp, pathOrUrl) {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${frontUrl}${pathOrUrl}`;
  await cdp.send('Page.navigate', { url });
  await waitFor(cdp, () => document.readyState === 'complete');
  await waitFor(cdp, () => document.querySelector('#root')?.children.length > 0);
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

const pageTools = {
  text: () => document.body.innerText,
  url: () => location.href,
  path: () => location.pathname + location.search,
  hasText: (text) => document.body.innerText.includes(text),
  hasMojibake: () => /[ÂÃ]|â[€¢€™]/.test(document.body.innerText),
  localStorageClear: () => localStorage.clear(),
  setPromptResponse: (value) => {
    window.prompt = () => value;
  },
  setFileInputImages: (count = 4) => {
    const input = document.querySelector('input[type="file"]');
    if (!input) throw new Error('Champ photos introuvable.');
    const dataTransfer = new DataTransfer();
    const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13]);
    for (let index = 0; index < count; index += 1) {
      dataTransfer.items.add(new File([pngBytes], `audit-logement-${index + 1}.png`, { type: 'image/png' }));
    }
    Object.defineProperty(input, 'files', { value: dataTransfer.files, configurable: true });
    input.dispatchEvent(new Event('change', { bubbles: true }));
  },
  fillAdminDialogNote: (value) => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) throw new Error('Dialogue admin introuvable.');
    const textareas = [...dialog.querySelectorAll('textarea')];
    const el = textareas.at(-1);
    if (!el) throw new Error('Champ note admin introuvable.');
    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value');
    descriptor?.set ? descriptor.set.call(el, value) : (el.value = value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  },
  submitAdminDialog: () => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) throw new Error('Dialogue admin introuvable.');
    const button = [...dialog.querySelectorAll('button')].find((item) =>
      ['Valider', 'Confirmer'].includes(item.innerText.trim())
    );
    if (!button) throw new Error('Bouton de validation du dialogue admin introuvable.');
    button.click();
  },
  fillPlaceholder: (placeholder, value) => {
    const el = [...document.querySelectorAll('input, textarea')].find((item) => item.placeholder === placeholder);
    if (!el) throw new Error(`Champ introuvable: ${placeholder}`);
    el.focus();
    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value');
    descriptor?.set ? descriptor.set.call(el, value) : (el.value = value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  },
  fillInputAt: (index, value) => {
    const el = [...document.querySelectorAll('input')][index];
    if (!el) throw new Error(`Input index introuvable: ${index}`);
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
    const wanted = Array.isArray(texts) ? texts : [texts];
    const candidates = [...document.querySelectorAll('button, a')].filter((item) =>
      wanted.some((text) => item.innerText.trim().includes(text))
    );
    if (candidates.length === 0) throw new Error(`Bouton/lien introuvable: ${wanted.join(' ou ')}`);
    candidates[0].click();
  },
  clickExactText: (text) => {
    const buttonCandidates = [...document.querySelectorAll('button')].filter((item) => item.innerText.trim() === text);
    const candidates = buttonCandidates.length
      ? buttonCandidates
      : [...document.querySelectorAll('a')].filter((item) => item.innerText.trim() === text);
    if (candidates.length === 0) throw new Error(`Bouton/lien introuvable: ${text}`);
    candidates[0].click();
  },
  clickAdminTab: (text) => {
    const candidates = [...document.querySelectorAll('button.chip, button.tab-button')].filter((item) =>
      item.innerText.trim() === text
    );
    if (candidates.length === 0) throw new Error(`Onglet admin introuvable: ${text}`);
    candidates[0].click();
  },
  clickFirstAdminConversation: () => {
    const candidates = [...document.querySelectorAll('button.conversation-button')];
    if (candidates.length === 0) throw new Error('Conversation admin introuvable.');
    candidates[0].click();
  },
  clickAdminRowAction: (identifier, text) => {
    const row = [...document.querySelectorAll('.admin-row')].find((item) => item.innerText.includes(identifier));
    if (!row) throw new Error(`Ligne admin introuvable: ${identifier}`);
    const button = [...row.querySelectorAll('button')].find((item) => item.innerText.trim().includes(text));
    if (!button) throw new Error(`Action admin introuvable: ${text}`);
    button.click();
  },
  fillAdminSearch: (value) => {
    const input = [...document.querySelectorAll('input')].find((item) =>
      item.placeholder?.includes('Rechercher ID') || item.placeholder?.includes('Rechercher utilisateur')
    );
    if (!input) throw new Error('Recherche admin introuvable.');
    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value');
    descriptor?.set ? descriptor.set.call(input, value) : (input.value = value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  },
  clickAuthTab: (text) => {
    const buttons = [...document.querySelectorAll('button')].filter((item) => item.innerText.trim() === text);
    const button = buttons.find((item) => item.style.flex === '1') || buttons.at(-1);
    if (!button) throw new Error(`Onglet auth introuvable: ${text}`);
    button.click();
  },
  clickSelector: (selector) => {
    const el = document.querySelector(selector);
    if (!el) throw new Error(`Selecteur introuvable: ${selector}`);
    el.click();
  },
  selectFirstLocationSuggestion: (text) => {
    const suggestions = [...document.querySelectorAll('button.location-suggestion-item')].filter((item) =>
      item.innerText.toLowerCase().includes(String(text || '').toLowerCase())
    );
    const suggestion = suggestions[0] || document.querySelector('button.location-suggestion-item');
    if (!suggestion) throw new Error('Suggestion de lieu introuvable.');
    suggestion.click();
  },
  clickLogout: () => {
    const button = document.querySelector('button[aria-label="Se deconnecter"]');
    if (!button) throw new Error('Bouton deconnexion introuvable.');
    button.click();
  },
  submitFirstForm: () => {
    const form = document.querySelector('form');
    if (!form) throw new Error('Formulaire introuvable.');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  },
  setSelectByIndex: (index, value) => {
    const el = [...document.querySelectorAll('select')][index];
    if (!el) throw new Error(`Select index introuvable: ${index}`);
    el.value = value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  },
  firstListingHref: () => {
    const link = [...document.querySelectorAll('a[href^="/logement/"]')].find((item) => item.innerText.trim().length > 0);
    return link?.getAttribute('href') || null;
  },
  qaListingHref: () => {
    const link = [...document.querySelectorAll('a[href^="/logement/"]')].find((item) => item.innerText.includes('[QA]'));
    return link?.getAttribute('href') || null;
  },
  clickFirstFavorite: () => {
    const button =
      document.querySelector('button[aria-label="Ajouter aux favoris"]') ||
      document.querySelector('button[aria-label="Retirer des favoris"]');
    if (!button) throw new Error('Bouton favori introuvable.');
    button.click();
  },
  countCards: () => document.querySelectorAll('a[href^="/logement/"]').length,
  markerCount: () => document.querySelectorAll('.listing-marker').length,
  hasReservationActionButton: () =>
    [...document.querySelectorAll('button')].some((button) => {
      const text = button.innerText.trim();
      return text.includes('Réserver maintenant') || text.includes('Demander à réserver');
    }),
  resultsSearchButtonVisible: () => {
    const button = document.querySelector('button[aria-label="Rechercher les logements"]');
    if (!button) return false;
    const rect = button.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  },
  setDatePickerValues: (arrival, departure) => {
    const inputs = [...document.querySelectorAll('.date-picker-input')];
    if (inputs.length < 2) throw new Error('Date pickers introuvables.');
    [arrival, departure].forEach((value, index) => {
      const el = inputs[index];
      const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value');
      descriptor?.set ? descriptor.set.call(el, value) : (el.value = value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
    });
  },
};

async function call(cdp, tool, ...args) {
  return evaluate(cdp, pageTools[tool], ...args);
}

async function assertNoMojibake(cdp, name) {
  const hasMojibake = await call(cdp, 'hasMojibake');
  if (hasMojibake) {
    const text = await call(cdp, 'text');
    throw new Error(`Caracteres casses visibles sur ${name}: ${text.match(/[^\n]*(?:[ÂÃ]|â[€¢€™])[^\n]*/)?.[0] || 'texte casse'}`);
  }
}

async function login(cdp, email) {
  await goto(cdp, '/connexion');
  await call(cdp, 'fillPlaceholder', 'E-mail ou telephone', email);
  await call(cdp, 'fillPlaceholder', 'Mot de passe', password);
  await call(cdp, 'clickText', 'Se connecter');
  try {
    await waitFor(cdp, () => !location.pathname.includes('/connexion'));
  } catch (error) {
    const currentPath = await call(cdp, 'path');
    const text = await call(cdp, 'text');
    throw new Error(`Connexion impossible pour ${email} sur ${currentPath}: ${text.slice(0, 500)}`);
  }
}

async function logout(cdp) {
  await call(cdp, 'clickLogout');
  await sleep(500);
}

async function main() {
  let apiStarted = false;
  let frontStarted = false;
  let browser;

  try {
    if (!(await reachable(`${apiUrl}/health`))) {
      const apiStartUrl = new URL(apiUrl);
      const apiPort = apiStartUrl.port || '3001';
      const apiHost = apiStartUrl.hostname || '127.0.0.1';
      log(`demarrage API ${apiPort}`);
      spawnTracked('node', ['index.js'], { cwd: apiDir, env: { ...process.env, PORT: apiPort, HOST: apiHost } });
      apiStarted = true;
      await waitReachable(`${apiUrl}/health`, 30000);
    }

    log('nettoyage et preparation donnees QA GEO');
    const resetRun = spawnTracked(command('npm'), ['run', 'qa:reset-geo'], {
      cwd: apiDir,
    });
    await new Promise((resolve, reject) => {
      resetRun.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`qa:reset-geo exit ${code}`))));
    });

    log('preparation donnees QA API');
    const qaRun = spawnTracked(command('npm'), ['run', 'qa:web-api'], {
      cwd: apiDir,
      env: { ...process.env, BASE_URL: apiUrl },
    });
    await new Promise((resolve, reject) => {
      qaRun.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`qa:web-api exit ${code}`))));
    });

    if (!(await reachable(frontUrl))) {
      const frontStartUrl = new URL(frontUrl);
      const frontPort = frontStartUrl.port || '5173';
      const frontHost = frontStartUrl.hostname || '127.0.0.1';
      log(`demarrage front Vite ${frontPort}`);
      spawnTracked(command('npm'), ['run', 'dev', '--', '--host', frontHost, '--port', frontPort, '--strictPort'], {
        cwd: webDir,
        env: { ...process.env, VITE_API_URL: apiUrl },
      });
      frontStarted = true;
      await waitReachable(frontUrl, 30000);
    }

    browser = await openBrowser();
    const { cdp } = browser;

    await step('landing charge sans page blanche', async () => {
      await goto(cdp, '/');
      await call(cdp, 'localStorageClear');
      await goto(cdp, '/');
      await waitFor(cdp, () =>
        document.body.innerText.includes('Logements disponibles') ||
        document.body.innerText.includes('Trouvez un logement')
      );
      await assertNoMojibake(cdp, 'accueil');
    });

    await step('recherche accueil vers resultats', async () => {
      await call(cdp, 'fillInputAt', 0, 'Bejaia');
      await call(cdp, 'fillInputAt', 1, '2026-10-10');
      await call(cdp, 'fillInputAt', 2, '2026-10-13');
      await call(cdp, 'fillInputAt', 3, '2');
      await call(cdp, 'submitFirstForm');
      await waitFor(cdp, () => location.pathname === '/resultats');
      await waitFor(cdp, () => document.body.innerText.includes('logement'));
      await assertNoMojibake(cdp, 'resultats');
      return call(cdp, 'path');
    });

    await step('filtres resultats et fiche logement', async () => {
      await goto(cdp, '/resultats?search=Bejaia');
      await waitFor(cdp, () =>
        Boolean(document.querySelector('input[placeholder="Prix min"]')) &&
        Boolean(document.querySelector('input[placeholder="Prix max"]'))
      );
      await call(cdp, 'fillPlaceholder', 'Prix min', '1000');
      await call(cdp, 'fillPlaceholder', 'Prix max', '9000');
      await sleep(700);
      await goto(cdp, '/resultats?search=Bejaia');
      await waitFor(cdp, () => document.querySelectorAll('a[href^="/logement/"]').length > 0, 30000);
      await assertNoMojibake(cdp, 'resultats filtres');
    });

    await step('recherche resultats bouton ville simple et carte', async () => {
      await goto(cdp, '/resultats');
      await waitFor(cdp, () => Boolean(document.querySelector('input[placeholder="Lieu"]')));
      await call(cdp, 'fillPlaceholder', 'Lieu', 'bejaia');
      await waitFor(cdp, () => {
        const input = [...document.querySelectorAll('input')].find((item) => item.placeholder === 'Lieu');
        return input?.value?.toLowerCase() === 'bejaia';
      });
      await call(cdp, 'clickExactText', 'Rechercher');
      try {
        await waitFor(cdp, () => new URLSearchParams(location.search).get('search')?.toLowerCase() === 'bejaia', 5000);
      } catch {
        await call(cdp, 'submitFirstForm');
        await waitFor(cdp, () => new URLSearchParams(location.search).get('search')?.toLowerCase() === 'bejaia');
      }
      const buttonVisible = await call(cdp, 'resultsSearchButtonVisible');
      if (!buttonVisible) throw new Error('Bouton Rechercher introuvable ou invisible.');
      const mapUrl = new URL(`${apiUrl}/logements/map`);
      mapUrl.searchParams.set('search', 'bejaia');
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
      return `${markerCount} marqueur(s) pour ${apiCount} point(s) API`;
    });

    await step('visiteur redirige pour favori/contact/reservation', async () => {
      await call(cdp, 'localStorageClear');
      await goto(cdp, '/resultats?search=Bejaia');
      const href = (await call(cdp, 'qaListingHref')) || (await call(cdp, 'firstListingHref'));
      if (!href) throw new Error('Aucun logement pour tester la redirection visiteur.');
      await goto(cdp, href);
      await call(cdp, 'clickText', 'Sauvegarder');
      await waitFor(cdp, () => location.pathname.includes('/connexion'));
      await goto(cdp, '/');
      await call(cdp, 'clickText', 'Connexion');
      await waitFor(cdp, () => location.pathname.includes('/connexion'));
    });

    await step('auth erreurs, providers sociaux indisponibles et inscription doublon claire', async () => {
      await call(cdp, 'localStorageClear');
      await goto(cdp, '/connexion');
      await waitFor(cdp, () => Boolean(document.querySelector('input[placeholder="E-mail ou telephone"]')), 25000);
      await call(cdp, 'fillPlaceholder', 'E-mail ou telephone', 'inconnu@algbnb.local');
      await call(cdp, 'fillPlaceholder', 'Mot de passe', 'bad-password');
      await call(cdp, 'clickText', 'Se connecter');
      await waitFor(cdp, () =>
        document.body.innerText.includes('Utilisateur introuvable') ||
        document.body.innerText.includes('Mot de passe incorrect') ||
        document.body.innerText.includes('Identifiant et mot de passe requis')
      );
      await call(cdp, 'clickAuthTab', 'Inscription');
      await waitFor(cdp, () => Boolean(document.querySelector('input[placeholder="Adresse e-mail"]')), 25000);
      await call(cdp, 'fillPlaceholder', 'Nom complet', 'QA Doublon');
      await call(cdp, 'fillPlaceholder', 'Adresse e-mail', qa.traveler);
      await call(cdp, 'fillPlaceholder', 'Telephone', '0599001002');
      await call(cdp, 'fillPlaceholder', 'Mot de passe', password);
      await call(cdp, 'clickText', 'Creer mon compte');
      await waitFor(cdp, () => document.body.innerText.includes('Un compte existe deja') || document.body.innerText.includes('existe deja'));
      await waitFor(cdp, () => document.body.innerText.includes('Continuer avec Google'));
      const text = await call(cdp, 'text');
      if (text.includes('Continuer avec Facebook')) {
        throw new Error('Le bouton Facebook ne doit plus etre visible.');
      }
      await assertNoMojibake(cdp, 'auth');
    });

    await step('mot de passe oublie et page reset', async () => {
      await goto(cdp, '/reset-password?token=qa-token');
      await waitFor(cdp, () => location.pathname === '/reset-password');
      await waitFor(cdp, () => Boolean(document.querySelector('input[placeholder="Nouveau mot de passe"]')), 25000);
      await call(cdp, 'fillPlaceholder', 'Nouveau mot de passe', password);
      await call(cdp, 'fillPlaceholder', 'Confirmer le mot de passe', 'mauvais');
      await call(cdp, 'clickText', 'Mettre a jour le mot de passe');
      await waitFor(cdp, () => document.body.innerText.includes('Les mots de passe ne correspondent pas'));
    });

    await step('connexion voyageur + nav privee', async () => {
      await login(cdp, qa.traveler);
      await goto(cdp, '/favoris');
      await waitFor(cdp, () => document.body.innerText.includes('Favoris'));
      await assertNoMojibake(cdp, 'favoris');
      await goto(cdp, '/reservations');
      await waitFor(cdp, () => document.body.innerText.includes('Voyages'));
      await assertNoMojibake(cdp, 'voyages');
      await goto(cdp, '/notifications');
      await waitFor(cdp, () => document.body.innerText.includes('Notifications'));
      await goto(cdp, '/profil');
      await waitFor(cdp, () => document.body.innerText.includes('qa.codex.voyageur@algbnb.local'));
      await assertNoMojibake(cdp, 'profil');
    });

    await step('favori depuis fiche logement puis page favoris', async () => {
      await goto(cdp, '/resultats?search=Bejaia');
      await waitFor(cdp, () => document.querySelectorAll('a[href^="/logement/"]').length > 0);
      await call(cdp, 'clickFirstFavorite');
      await waitFor(cdp, () => Boolean(document.querySelector('button[aria-label="Retirer des favoris"]')), 25000);
      await sleep(700);
      await goto(cdp, '/favoris');
      await waitFor(cdp, () => document.querySelectorAll('a[href^="/logement/"]').length >= 1);
      return `${await call(cdp, 'countCards')} carte(s)`;
    });

    await step('voyageur voit action reservation sur fiche', async () => {
      await goto(cdp, '/resultats?search=Bejaia');
      await waitFor(cdp, () => document.querySelectorAll('a[href^="/logement/"]').length > 0);
      const href = (await call(cdp, 'qaListingHref')) || (await call(cdp, 'firstListingHref'));
      if (!href) throw new Error('Aucun logement pour verifier le bouton reservation voyageur.');
      await goto(cdp, href);
      await waitFor(cdp, () =>
        [...document.querySelectorAll('button')].some((button) => {
          const text = button.innerText.trim();
          return text.includes('Réserver maintenant') || text.includes('Demander à réserver');
        }),
      25000);
      if (await call(cdp, 'hasText', 'Connecte-toi avec un compte voyageur')) {
        throw new Error('Message non-voyageur affiche a un compte voyageur.');
      }
      await assertNoMojibake(cdp, 'reservation voyageur');
    });

    await step('messages voyageur', async () => {
      await goto(cdp, '/messages');
      await waitFor(
        cdp,
        () =>
          location.pathname === '/messages' &&
          !document.querySelector('.spinner') &&
          (
            document.body.innerText.includes('Messages') ||
            document.body.innerText.includes('Aucune conversation') ||
            document.body.innerText.includes('Ecrivez un message') ||
            document.body.innerText.includes('Connecte-toi')
          ),
        25000
      );
      const text = await call(cdp, 'text');
      if (text.includes('Connecte-toi')) {
        throw new Error(`Messagerie affiche un etat deconnecte: ${text.slice(0, 500)}`);
      }
      await assertNoMojibake(cdp, 'messages');
    });

    await step('deconnexion puis garde hote/admin', async () => {
      await goto(cdp, '/');
      await logout(cdp);
      await goto(cdp, '/creer-annonce');
      await waitFor(cdp, () => location.pathname === '/connexion');
    });

    await step('creation annonce hote invalide puis valide', async () => {
      const waitStage = async (label, predicate, timeoutMs = 15000) => {
        try {
          return await waitFor(cdp, predicate, timeoutMs);
        } catch (error) {
          const text = await call(cdp, 'text');
          throw new Error(`${label}: ${error.message}. Etat page: ${text.slice(0, 900)}`);
        }
      };
      await login(cdp, qa.host);
      await goto(cdp, '/creer-annonce');
      await waitStage('chargement page creation', () => document.body.innerText.includes('Publier l annonce') || document.body.innerText.includes('Connecte-toi'), 25000);
      await call(cdp, 'clickText', 'Publier l annonce');
      await waitStage('validation formulaire vide', () => document.body.innerText.includes('Le titre doit contenir'));
      await call(cdp, 'fillPlaceholder', 'Titre', `[QA GEO WEB] Studio navigateur ${Date.now()}`);
      await call(cdp, 'fillPlaceholder', 'Description detaillee', 'Annonce QA creee depuis le navigateur automatise pour verifier les champs et boutons du formulaire web.');
      await call(cdp, 'fillPlaceholder', 'Rechercher une ville ou une adresse en Algerie', 'Bejaia');
      await waitStage('suggestion geolocalisation', () => document.querySelectorAll('button.location-suggestion-item').length > 0, 20000);
      await call(cdp, 'selectFirstLocationSuggestion', 'Bejaia');
      await waitStage('ville geolocalisee', () => {
        const ville = [...document.querySelectorAll('input')].find((item) => item.placeholder === 'Ville');
        return ville?.value?.length > 0;
      });
      await waitStage('carte creation annonce', () => Boolean(document.querySelector('.listing-location-picker canvas')));
      await call(cdp, 'clickText', 'Placer le marqueur au centre');
      await waitStage('confirmation position carte', () => document.body.innerText.includes('Position exacte placee'), 25000);
      await call(cdp, 'fillPlaceholder', 'Capacite', '2');
      await call(cdp, 'fillPlaceholder', 'Chambres', '1');
      await call(cdp, 'fillPlaceholder', 'Lits', '1');
      await call(cdp, 'fillPlaceholder', 'Salles de bain', '1');
      await call(cdp, 'fillPlaceholder', 'Prix / nuit', '5500');
      await call(cdp, 'setFileInputImages', 4);
      await waitStage('selection photos multiples', () => document.body.innerText.includes('4 nouvelle(s) photo(s)'), 10000);
      await call(cdp, 'clickText', 'Ajouter cette plage');
      await call(cdp, 'clickText', 'Publier l annonce');
      await waitStage('soumission annonce', () => location.pathname === '/dashboard-hote' || document.body.innerText.includes('Erreur') || document.body.innerText.includes('obligatoire'), 20000);
      if ((await call(cdp, 'path')).startsWith('/creer-annonce')) {
        const text = await call(cdp, 'text');
        throw new Error(`Creation annonce bloquee: ${text.slice(0, 700)}`);
      }
      await waitStage('annonce visible dashboard', () => document.body.innerText.includes('[QA GEO WEB]'));
      await assertNoMojibake(cdp, 'dashboard hote');
    });

    await step('dashboard hote boutons principaux', async () => {
      await goto(cdp, '/dashboard-hote');
      await waitFor(cdp, () => document.body.innerText.includes('Mes annonces'));
      await call(cdp, 'clickText', 'Notifications');
      await waitFor(cdp, () => location.pathname === '/notifications');
      await goto(cdp, '/dashboard-hote');
      await waitFor(cdp, () => document.body.innerText.includes('Nouvelle annonce') || document.body.innerText.includes('Ajouter une annonce'));
      await call(cdp, 'clickAnyText', ['Nouvelle annonce', 'Ajouter une annonce']);
      await waitFor(cdp, () => location.pathname === '/creer-annonce');
    });

    await step('hote ne voit pas action reservation sur fiche', async () => {
      await goto(cdp, '/resultats?search=Alger');
      await waitFor(cdp, () => document.querySelectorAll('a[href^="/logement/"]').length > 0, 30000);
      const href = (await call(cdp, 'qaListingHref')) || (await call(cdp, 'firstListingHref'));
      if (!href) throw new Error('Aucun logement pour verifier la fiche cote hote.');
      await goto(cdp, href);
      await waitFor(cdp, () => document.body.innerText.includes('Connecte-toi avec un compte voyageur'), 25000);
      if (await call(cdp, 'hasReservationActionButton')) {
        throw new Error('Un bouton de reservation reste visible pour un hote.');
      }
      await assertNoMojibake(cdp, 'reservation hote bloquee');
    });

    await step('admin charge et protege les stats', async () => {
      await goto(cdp, '/');
      await logout(cdp);
      await login(cdp, qa.admin);
      await goto(cdp, '/reservation/confirmation');
      await waitFor(cdp, () => location.pathname === '/');
      await goto(cdp, '/admin');
      await waitFor(cdp, () => document.body.innerText.includes('Administration') && document.body.innerText.includes('Utilisateurs'));
      const text = await call(cdp, 'text');
      if (text.includes('Santé plateforme') || text.includes('Sante plateforme') || text.includes('À traiter maintenant')) {
        throw new Error('La vue admin contient encore des blocs non retenus pour la soutenance.');
      }
      if (!text.includes('Actions de modération')) {
        throw new Error('Le bloc Actions de moderation est absent de la vue admin.');
      }
      await assertNoMojibake(cdp, 'admin');
    });

    await step('admin onglets moderation complets', async () => {
      await goto(cdp, '/admin');
      await waitFor(cdp, () => document.body.innerText.includes('Administration') && document.body.innerText.includes('Utilisateurs'));
      await call(cdp, 'fillAdminSearch', '');
      const tabsToCheck = [
        {
          label: 'Utilisateurs',
          ready: () =>
            document.body.innerText.includes('qa.codex.voyageur@algbnb.local') &&
            document.body.innerText.includes('Suspendre'),
        },
        {
          label: 'Annonces',
          ready: () =>
            document.body.innerText.includes('Annonce #') &&
            (document.body.innerText.includes('Masquer') || document.body.innerText.includes('Réactiver')),
        },
        {
          label: 'Messages',
          ready: () =>
            document.body.innerText.includes('Sélectionne une conversation') ||
            document.body.innerText.includes('Conversation #'),
        },
        {
          label: 'Avis',
          ready: () =>
            document.body.innerText.includes('Masquer') ||
            document.body.innerText.includes('Aucun avis trouvé'),
        },
        {
          label: 'Litiges',
          ready: () =>
            document.body.innerText.includes('Litige #') ||
            document.body.innerText.includes('Aucun litige trouvé'),
        },
        {
          label: 'Journal',
          ready: () =>
            document.body.innerText.includes('message.visibility') ||
            document.body.innerText.includes('Aucune action journalisée'),
        },
      ];

      for (const { label, ready } of tabsToCheck) {
        await call(cdp, 'clickAdminTab', label);
        await waitFor(cdp, ready);
      }
      await assertNoMojibake(cdp, 'admin onglets');
      return `${tabsToCheck.length} onglet(s) verifies`;
    });

    await step('admin action utilisateur depuis interface', async () => {
      await goto(cdp, '/admin');
      await waitFor(cdp, () => document.body.innerText.includes('Administration') && document.body.innerText.includes('Utilisateurs'));
      await call(cdp, 'clickAdminTab', 'Utilisateurs');
      await call(cdp, 'fillAdminSearch', qa.traveler);
      await waitFor(cdp, () => document.body.innerText.includes('qa.codex.voyageur@algbnb.local'));

      await call(cdp, 'clickAdminRowAction', 'qa.codex.voyageur@algbnb.local', 'Suspendre');
      await waitFor(cdp, () => Boolean(document.querySelector('[role="dialog"]')));
      await call(cdp, 'fillAdminDialogNote', 'QA navigateur suspend compte voyageur.');
      await call(cdp, 'submitAdminDialog');
      await waitFor(cdp, () => document.body.innerText.includes('Réactiver'));

      await call(cdp, 'clickAdminRowAction', 'qa.codex.voyageur@algbnb.local', 'Réactiver');
      await waitFor(cdp, () => Boolean(document.querySelector('[role="dialog"]')));
      await call(cdp, 'fillAdminDialogNote', 'QA navigateur reactive compte voyageur.');
      await call(cdp, 'submitAdminDialog');
      await waitFor(cdp, () => document.body.innerText.includes('Suspendre'));
      await assertNoMojibake(cdp, 'admin action utilisateur');
    });

    await step('admin moderation message depuis interface', async () => {
      await goto(cdp, '/admin');
      await waitFor(cdp, () => document.body.innerText.includes('Administration') && document.body.innerText.includes('Utilisateurs'));
      await call(cdp, 'fillAdminSearch', '');
      await call(cdp, 'clickAdminTab', 'Messages');
      await waitFor(cdp, () => document.body.innerText.includes('Conversation #'));
      await call(cdp, 'clickFirstAdminConversation');
      await waitFor(cdp, () => document.body.innerText.includes('Message #') && document.body.innerText.includes('Masquer'));

      await call(cdp, 'clickText', 'Masquer');
      await waitFor(cdp, () => Boolean(document.querySelector('[role="dialog"]')));
      await call(cdp, 'fillAdminDialogNote', 'QA navigateur masque message.');
      await call(cdp, 'submitAdminDialog');
      await waitFor(cdp, () => document.body.innerText.includes('Restaurer') && document.body.innerText.includes('Masqué'));

      await call(cdp, 'clickText', 'Restaurer');
      await waitFor(cdp, () => Boolean(document.querySelector('[role="dialog"]')));
      await call(cdp, 'fillAdminDialogNote', 'QA navigateur restaure message.');
      await call(cdp, 'submitAdminDialog');
      await waitFor(cdp, () => document.body.innerText.includes('Masquer'));
      await assertNoMojibake(cdp, 'admin moderation message');
    });

    await step('admin moderation avis depuis interface', async () => {
      await goto(cdp, '/admin');
      await waitFor(cdp, () => document.body.innerText.includes('Administration') && document.body.innerText.includes('Utilisateurs'));
      await call(cdp, 'fillAdminSearch', '');
      await call(cdp, 'clickAdminTab', 'Avis');
      await waitFor(cdp, () => document.body.innerText.includes('Masquer'));

      await call(cdp, 'clickText', 'Masquer');
      await waitFor(cdp, () => Boolean(document.querySelector('[role="dialog"]')));
      await call(cdp, 'fillAdminDialogNote', 'QA navigateur masque avis.');
      await call(cdp, 'submitAdminDialog');
      await waitFor(cdp, () => document.body.innerText.includes('Restaurer') && document.body.innerText.includes('Masqué'));

      await call(cdp, 'clickText', 'Restaurer');
      await waitFor(cdp, () => Boolean(document.querySelector('[role="dialog"]')));
      await call(cdp, 'fillAdminDialogNote', 'QA navigateur restaure avis.');
      await call(cdp, 'submitAdminDialog');
      await waitFor(cdp, () => document.body.innerText.includes('Masquer') && document.body.innerText.includes('Visible'));

      await call(cdp, 'clickText', 'Créer un litige');
      await waitFor(cdp, () => Boolean(document.querySelector('[role="dialog"]')));
      await call(cdp, 'fillAdminDialogNote', 'QA navigateur cree litige depuis commentaire.');
      await call(cdp, 'submitAdminDialog');
      await waitFor(cdp, () => !document.querySelector('[role="dialog"]'));
      await assertNoMojibake(cdp, 'admin moderation avis');
    });

    await step('admin resolution litige depuis interface', async () => {
      await goto(cdp, '/admin');
      await waitFor(cdp, () => document.body.innerText.includes('Administration') && document.body.innerText.includes('Utilisateurs'));
      await call(cdp, 'fillAdminSearch', '');
      await call(cdp, 'clickAdminTab', 'Litiges');
      await waitFor(cdp, () => document.body.innerText.includes('Litige #') && document.body.innerText.includes('Résoudre'));

      try {
        await call(cdp, 'clickText', 'Résoudre');
        await waitFor(cdp, () => Boolean(document.querySelector('[role="dialog"]')));
        await call(cdp, 'fillAdminDialogNote', 'QA navigateur resout litige.');
        await call(cdp, 'submitAdminDialog');
      } catch (error) {
        const text = await call(cdp, 'text');
        throw new Error(`${error.message}. Etat litiges: ${text.slice(0, 900)}`);
      }
      await waitFor(cdp, () => document.body.innerText.includes('Résolu'));
      await assertNoMojibake(cdp, 'admin cycle litige');
    });

    await step('pages footer publiques', async () => {
      for (const pathName of ['/confidentialite', '/conditions', '/aide']) {
        await goto(cdp, pathName);
        await waitFor(cdp, () => document.body.innerText.includes('algbnb'));
        await assertNoMojibake(cdp, pathName);
      }
    });

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
        // Chrome peut garder un handle quelques secondes sous Windows; le dossier temp sera nettoye plus tard.
      }
    }
    if (frontStarted || apiStarted) {
      state.children.forEach(killProcessTree);
    }
  }

  const failed = state.checks.filter((item) => !item.ok);
  console.log(JSON.stringify({ total: state.checks.length, failed: failed.length, failedNames: failed.map((item) => item.name) }, null, 2));
  if (failed.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`[web-audit] failed: ${error.message}`);
  process.exitCode = 1;
});
