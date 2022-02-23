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
globalThis.DEV = process.env.DEV;

init();
function init(path) {
  const { words, options } = parseArgs(process.argv.slice(2));
  for (const option in options) {
    switch (option) {
      case "h":
        return help();
      case "-dev":
        DEV = options[option];
        break;
    }
  }
  if (!words.length) interactive(words.slice(1));
  else execute(readFileSync(words[0], "utf-8"), words.slice(1));
}

function interactive(inputs) {
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
  for (let arg of args) {
    if (arg.startsWith("-")) {
      temp = arg.substring(1);
      options[temp] = true;
    } else if (temp) {
      if (arg == "false") arg = false;
      options[temp] = arg;
      temp = null;
    } else {
      words.push(arg);
    }
  }

  return { options, words };
}

function help() {
  return log(readFileSync(new URL("../help.txt", import.meta.url), "utf-8"));
}
