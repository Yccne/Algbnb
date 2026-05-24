import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const apiDir = fileURLToPath(new URL('../controller/api/', import.meta.url));
const webDir = fileURLToPath(new URL('../view/web/', import.meta.url));

const command = (name) => (process.platform === 'win32' ? `${name}.cmd` : name);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const run = (label, file, args, options = {}) => {
  console.log(`\n[clean-qa] ${label}`);
  const execFile = process.platform === 'win32' && /\.(cmd|bat)$/i.test(file) ? 'cmd.exe' : file;
  const execArgs =
    process.platform === 'win32' && /\.(cmd|bat)$/i.test(file)
      ? ['/d', '/s', '/c', file, ...args]
      : args;
  execFileSync(execFile, execArgs, {
    cwd: options.cwd || rootDir,
    env: { ...process.env, ...options.env },
    stdio: 'inherit',
  });
};

const killPort = (port) => {
  console.log(`[clean-qa] liberation port ${port}`);
  if (process.platform === 'win32') {
    const script = `
      $pids = Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique;
      foreach ($procId in $pids) {
        if ($procId) { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue }
      }
    `;
    try {
      execFileSync('powershell.exe', ['-NoProfile', '-Command', script], { stdio: 'ignore' });
    } catch {
      // Le port est deja libre ou le process vient de se terminer.
    }
    return;
  }

  try {
    execFileSync('sh', ['-lc', `lsof -ti tcp:${port} | xargs -r kill -9`], { stdio: 'ignore' });
  } catch {
    // Port deja libre.
  }
};

const waitReachable = async (url, label, timeoutMs = 30000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`[clean-qa] ${label} pret`);
        return;
      }
    } catch {
      // Pas encore pret.
    }
    await sleep(500);
  }
  throw new Error(`${label} ne repond pas: ${url}`);
};

const startDetached = (label, file, args, cwd, env = {}) => {
  console.log(`[clean-qa] demarrage ${label}`);
  if (process.platform === 'win32') {
    const quote = (value) => String(value).replace(/'/g, "''");
    const envLines = Object.entries(env)
      .map(([key, value]) => `$env:${key}='${quote(value)}';`)
      .join(' ');
    const argList = args.map((arg) => `'${quote(arg)}'`).join(', ');
    const script = `${envLines} $p = Start-Process -FilePath '${quote(file)}' -ArgumentList @(${argList}) -WorkingDirectory '${quote(cwd)}' -WindowStyle Hidden -PassThru; Write-Output $p.Id`;
    const output = execFileSync('powershell.exe', ['-NoProfile', '-Command', script], {
      encoding: 'utf8',
    }).trim();
    return output || 'inconnu';
  }

  const child = spawn(file, args, {
    cwd,
    env: { ...process.env, ...env },
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.unref();
  return child.pid;
};

const main = async () => {
  killPort(3001);
  killPort(5173);
  await sleep(1000);

  const apiPid = startDetached('API :3001', 'node', ['index.js'], apiDir);
  const webPid = startDetached('front Vite :5173', command('npm'), ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], webDir, {
    VITE_API_URL: 'http://127.0.0.1:3001/api',
  });

  await waitReachable('http://127.0.0.1:3001/api/health', `API pid ${apiPid}`);
  await waitReachable('http://127.0.0.1:5173', `front pid ${webPid}`);

  run('check MVC', command('npm'), ['run', 'check:mvc']);
  run('lint web', command('npm'), ['run', 'lint']);
  run('build web', command('npm'), ['run', 'build']);
  run('QA API principale', command('npm'), ['run', 'qa:web-api']);
  run('audit web principal', command('npm'), ['run', 'audit:web']);
  run('QA API avancee', command('npm'), ['run', 'qa:advanced-api']);
  run('audit web avance', command('npm'), ['run', 'audit:advanced-web']);
  run('nettoyage QA avant presentation', command('npm'), ['run', 'qa:reset-geo'], {
    cwd: apiDir,
    env: { NO_SEED_QA: '1' },
  });
  run('smoke demo web', command('npm'), ['run', 'smoke:web'], { cwd: apiDir });
  run('audit public presentation', command('npm'), ['run', 'audit:presentation-web']);

  console.log('\n[clean-qa] Toutes les suites sont passees. API et front restent lances pour inspection.');
};

main().catch((error) => {
  console.error(`[clean-qa] echec: ${error.message}`);
  process.exitCode = 1;
});
