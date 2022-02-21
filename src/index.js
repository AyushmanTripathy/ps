#!/usr/bin/env node

import execute from "./core.js";
import { bold, green, red } from "btss";
import { readFileSync } from "fs";
import { createInterface } from "readline";

globalThis.log = (s) => console.log(s);
globalThis.error = (e) => {
  log(red(`[${e.name}] `) + e.message);
  if (process.env.DEV) log(e);
};
globalThis.DEV = process.env.DEV

init();
function init(path) {
  const { words, options } = parseArgs(process.argv.slice(2));
  if (!words.length) interactive();
  else execute(readFileSync(words[0], "utf-8"));
}

function interactive() {
  log(bold("PIPESCRIPT INTERPRETER"));
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });
  const ask = () => {
    rl.question(green(">>> "), (data) => {
      switch (data.trim()) {
        case "clear":
          console.clear();
          break;
        case "quit":
          process.exit();
          break;
        default:
          execute("log |" + data);
          break;
      }
      ask();
    });
  };
  ask();
}

function parseArgs(args) {
  const options = {};
  const words = [];

  let temp;
  for (const arg of args) {
    if (arg.startsWith("-")) {
      temp = arg.substring(1);
      options[temp] = true;
    } else if (temp) {
      options[temp] = arg;
      temp = null;
    } else {
      words.push(arg);
    }
  }

  return { options, words };
}
