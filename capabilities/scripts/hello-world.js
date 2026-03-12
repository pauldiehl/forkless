#!/usr/bin/env node

// Hello World capability
// Usage: node hello-world.js --name Paul

const args = process.argv.slice(2);
const nameIdx = args.indexOf('--name');
const name = nameIdx !== -1 && args[nameIdx + 1] ? args[nameIdx + 1] : 'World';

const greetings = [
  { lang: 'English', text: `Hello, ${name}!` },
  { lang: 'Spanish', text: `¡Hola, ${name}!` },
  { lang: 'Japanese', text: `こんにちは、${name}！` }
];

for (const g of greetings) {
  console.log(`[${g.lang}] ${g.text}`);
}
