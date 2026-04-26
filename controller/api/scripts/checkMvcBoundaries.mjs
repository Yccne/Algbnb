import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const controllerApiRoot = path.join(repoRoot, 'controller', 'api');
const modelApiRoot = path.join(repoRoot, 'model', 'api');
const viewRoot = path.join(repoRoot, 'view');

const listFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.name === 'node_modules' || entry.name === 'dist') return [];
    if (entry.isDirectory()) return listFiles(fullPath);
    return entry.isFile() && /\.(js|jsx|mjs|cjs)$/.test(entry.name) ? [fullPath] : [];
  });
};

const read = (file) => fs.readFileSync(file, 'utf8');
const relative = (file) => path.relative(repoRoot, file).replaceAll(path.sep, '/');
const isUnder = (file, dir) => path.relative(dir, file).split(path.sep)[0] !== '..' && !path.isAbsolute(path.relative(dir, file));

const files = {
  controller: [
    ...listFiles(path.join(controllerApiRoot, 'controllers')),
    ...listFiles(path.join(controllerApiRoot, 'middlewares')),
    ...listFiles(path.join(controllerApiRoot, 'routes')),
    path.join(controllerApiRoot, 'index.js'),
  ].filter((file) => fs.existsSync(file)),
  model: [
    ...listFiles(path.join(modelApiRoot, 'config')),
    ...listFiles(path.join(modelApiRoot, 'models')),
    ...listFiles(path.join(modelApiRoot, 'repositories')),
    ...listFiles(path.join(modelApiRoot, 'services')),
    ...listFiles(path.join(modelApiRoot, 'utils')),
    ...listFiles(path.join(modelApiRoot, 'validators')),
    path.join(modelApiRoot, 'db.js'),
  ].filter((file) => fs.existsSync(file)),
  view: listFiles(viewRoot),
};

const obsoleteRootDirs = ['apps', 'packages', 'rout'].filter((dir) => fs.existsSync(path.join(repoRoot, dir)));
const violations = obsoleteRootDirs.map((dir) => `Dossier racine obsolete encore present: ${dir}`);

const addPatternViolations = ({ label, targetFiles, patterns, allow = () => false }) => {
  for (const file of targetFiles) {
    if (allow(file)) continue;
    const source = read(file);
    for (const pattern of patterns) {
      if (pattern.test(source)) {
        violations.push(`${label}: ${relative(file)} (${pattern})`);
      }
    }
  }
};

addPatternViolations({
  label: 'Aucun SQL applicatif hors model/api/repositories',
  targetFiles: [...files.controller, ...files.model],
  patterns: [/\bSELECT\b/i, /\bINSERT\s+INTO\b/i, /\bUPDATE\s+\w+/i, /\bDELETE\s+FROM\b/i],
  allow: (file) =>
    isUnder(file, path.join(modelApiRoot, 'repositories')) ||
    file === path.join(modelApiRoot, 'db.js'),
});

addPatternViolations({
  label: 'Aucun acces DB direct hors model/api/repositories',
  targetFiles: [...files.controller, ...files.model],
  patterns: [
    /\bdb\.query\b/,
    /\bdb\.getClient\b/,
    /require\(['"][^'"]*\/db['"]\)/,
    /from ['"][^'"]*\/db['"]/,
  ],
  allow: (file) =>
    isUnder(file, path.join(modelApiRoot, 'repositories')) ||
    file === path.join(modelApiRoot, 'db.js'),
});

addPatternViolations({
  label: 'Aucun req/res/next dans model',
  targetFiles: files.model,
  patterns: [/\breq\./, /\bres\./, /\bnext\(/],
});

addPatternViolations({
  label: 'La view ne doit pas importer model directement',
  targetFiles: files.view,
  patterns: [/from ['"][^'"]*model\/api/i, /require\(['"][^'"]*model\/api/i],
});

if (violations.length > 0) {
  console.error('[mvc] Violations detectees:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exitCode = 1;
} else {
  console.log('[mvc] Architecture Model/View/Controller respectee.');
}
