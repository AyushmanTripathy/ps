import parser from "./parser.js";
import compile from "./compiler.js";
import { readFileSync } from "fs";
import { createContext, runInNewContext } from "vm";

globalThis.log = (s) => console.log(s);

init();
function init() {
  const scope = parser(readFileSync("./test.pipescript", "utf-8"));
  scope.global = compile(scope.global, scope);

  const run = (code, context) => {
    try {
      runInNewContext(
        `return__=(()=>{${clearPointer(code, scope.strs__)}})()`,
        context
      );
      return context.return__;
    } catch (e) {
      log("[ERROR]");
      console.error(e);
    }
  };

  function Context() {
    return {
      pass: (args) => args[0],
      lt: ([a, b]) => a < b,
      gt: ([a, b]) => a > b,
      eq: ([a, b]) => a === b,
      not: ([a]) => !a,
      log: (args) => console.log(args.join(" ")),
      add: (args) => args.reduce((acc, cur) => acc + cur),
      multiply: (args) => args.reduce((acc, cur) => acc * cur),
      set: (args) => {},
      call: (args) => {
        const name = args.shift();
        const context = new Context();
        for (const key of Object.keys(scope)) context[key] = key;

        if (!scope[name].compiled) {
          const parameters = scope[name]
            .shift()
            .split(" ")
            .filter(Boolean)
            .slice(2);

          const code = compile(scope[name], scope);
          scope[name] = { code, parameters, compiled:true };
        }
        for (const arg of scope[name].parameters) {
          context[arg] = args.shift();
        }
        return run(scope[name].code, context);
      },
    };
  }

  const globalContext = new Context();
  for (const key of Object.keys(scope)) globalContext[key] = key;
  run(scope.global, globalContext);
}

function clearPointer(code, strs) {
  const pointers = code.match(/%str[0-9]+%/g);
  if (pointers) {
    for (const pointer of pointers) {
      code = code.replace(pointer, strs[pointer.slice(4, -1)]);
    }
  }
  return code;
}
