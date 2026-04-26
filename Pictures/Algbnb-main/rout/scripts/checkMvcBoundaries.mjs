import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const listFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(fullPath);
    return entry.isFile() && entry.name.endsWith('.js') ? [fullPath] : [];
  });
};

const read = (file) => fs.readFileSync(file, 'utf8');
const relative = (file) => path.relative(root, file).replaceAll(path.sep, '/');

const checks = [
  {
    label: 'Aucun acces DB direct dans routes/controllers/services/utils',
    files: [
      ...listFiles(path.join(root, 'routes')),
      ...listFiles(path.join(root, 'controllers')),
      ...listFiles(path.join(root, 'services')),
      ...listFiles(path.join(root, 'utils')),
    ],
    patterns: [
      /\bdb\.query\b/,
      /\bdb\.getClient\b/,
      /require\(['"]\.\.\/db['"]\)/,
      /from ['"]\.\.\/db['"]/,
      /\.query\(/,
    ],
  },
  {
    label: 'Aucun req/res dans services/repositories',
    files: [...listFiles(path.join(root, 'services')), ...listFiles(path.join(root, 'repositories'))],
    patterns: [/\breq\./, /\bres\./, /\bnext\(/],
  },
  {
    label: 'Aucun SQL applicatif hors repositories',
    files: [
      ...listFiles(path.join(root, 'routes')),
      ...listFiles(path.join(root, 'controllers')),
      ...listFiles(path.join(root, 'services')),
      ...listFiles(path.join(root, 'utils')),
      ...listFiles(path.join(root, 'validators')),
      ...listFiles(path.join(root, 'middlewares')),
      ...listFiles(path.join(root, 'config')),
    ],
    patterns: [/\bSELECT\b/i, /\bINSERT\s+INTO\b/i, /\bUPDATE\s+\w+/i, /\bDELETE\s+FROM\b/i],
  },
];

const violations = [];
for (const check of checks) {
  for (const file of check.files) {
    const source = read(file);
    for (const pattern of check.patterns) {
      if (pattern.test(source)) {
        violations.push(`${check.label}: ${relative(file)} (${pattern})`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error('[mvc] Violations detectees:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exitCode = 1;
} else {
  console.log('[mvc] Frontieres MVC respectees.');
}
