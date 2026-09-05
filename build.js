#!/usr/bin/env node
// build.js — concatenates src/ files into index.html
// Usage: node build.js
const fs   = require('fs');
const path = require('path');

const ROOT  = __dirname;
const SRC   = path.join(ROOT, 'src');
const OUT   = path.join(ROOT, 'index.html');
const SHELL = path.join(SRC, 'shell.html');

function readDir(dir) {
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.css') || f.endsWith('.js'))
    .sort()
    .map(f => fs.readFileSync(path.join(dir, f), 'utf8'));
}

const css = readDir(path.join(SRC, 'css')).join('\n');
const js  = readDir(path.join(SRC, 'js')).join('\n');
const shell = fs.readFileSync(SHELL, 'utf8');

const html = shell
  .replace('<!--CSS-->', css)
  .replace('<!--JS-->',  js);

fs.writeFileSync(OUT, html, 'utf8');
console.log(`Built index.html (${(html.length / 1024).toFixed(1)} KB)`);
