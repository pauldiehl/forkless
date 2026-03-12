#!/usr/bin/env node

const args = process.argv.slice(2);
let name = 'World';

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--name' && i + 1 < args.length) {
    name = args[i + 1];
    break;
  }
}

// Log greetings in 3 languages
console.log(`Hello, ${name}!`);
console.log(`Hola, ${name}!`);
console.log(`Bonjour, ${name}!`);