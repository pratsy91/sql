import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const root = 'app/lessons/most-asked-interview-questions';
const dirs = fs.readdirSync(root).filter((d) => fs.statSync(path.join(root, d)).isDirectory());

let parser;
try {
  parser = require('@babel/parser');
} catch {
  console.log('babel parser not installed; skipping parse check');
}

for (const d of dirs) {
  const f = path.join(root, d, 'page.js');
  const src = fs.readFileSync(f, 'utf8');

  // Detect premature close of code={`...`} when next non-ws is SQL keyword
  let i = 0;
  while (true) {
    const start = src.indexOf('code={`', i);
    if (start < 0) break;
    let j = start + 7;
    while (j < src.length) {
      if (src[j] === '\\') {
        j += 2;
        continue;
      }
      if (src[j] === '`') break;
      j++;
    }
    const after = src.slice(j + 1, j + 40).trimStart();
    if (/^(SELECT|UPDATE|FROM|INSERT|DELETE|WHERE|CREATE)/i.test(after)) {
      const line = src.slice(0, start).split('\n').length;
      console.log('NESTED_BACKTICK', f, 'near line', line);
    }
    i = j + 1;
  }

  if (parser) {
    try {
      parser.parse(src, { sourceType: 'module', plugins: ['jsx'] });
      console.log('OK', d);
    } catch (e) {
      console.log('FAIL', d, e.message.split('\n')[0]);
    }
  }
}
