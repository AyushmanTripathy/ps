import parser from "./parser.js";
import compile from "./compiler.js";
import { createContext, runInNewContext } from "vm";

export default (sourceCode) => {
  const scope = parser(sourceCode);
  scope.global = compile(scope.global, scope);

  const run = (code, context) => {
    try {
      runInNewContext(
        `return__=(()=>{${clearPointer(code, scope.strs__)}})()`,
        context
      );
      return context.return__;
    } catch (e) {
      error(e);
    }
  };

  function Context(userFunctions, vars) {
    const functions = {};
    for (const func of userFunctions) {
      functions[func] = this.call(func);
    }
    return {
      heap: vars,
      pass: (args) => args[0],
      exit: ([a]) => process.exit(a ? a : 0),

      // logic
      lt: ([a, b]) => a < b,
      gt: ([a, b]) => a > b,
      eq: ([a, b]) => a === b,
      not: ([a]) => !a,
      or: (args) => {
        for (const arg of args) {
          if (arg) return true;
        }
        return false;
      },
      and: (args) => {
        for (const arg of args) {
          if (!arg) return false;
        }
        return true;
      },

      // string functions
      repeat: ([a, b]) => a.repeat(b),

      // arithmetic
      add: (args) => args.reduce((acc, cur) => acc + cur),
      subtract: (args) => args.reduce((acc, cur) => acc - cur),
      multiply: (args) => args.reduce((acc, cur) => acc * cur),
      divide: ([a, b]) => a / b,
      pow: ([a, b]) => Math.pow(a, b),
      round: ([a]) => Math.round(a),
      floor: ([a]) => Math.floor(a),
      random: ([a = 0, b = 1]) => a + Math.random() * (b - a),
      ceil: ([a]) => Math.ceil(a),
      rt: ([a, b]) => Math.pow(a, 1 / b),
      sqrt: ([a]) => Math.sqrt(a),

      log: (args) => console.log(args.join(" ")),
      set: ([a, b]) => {
        if (typeof vars[a] == "undefined") vars[a] = b;
        else throw TypeError(`${a} = ${vars[a]}, cannot mutate ${a}.`);
      },
      ...functions,
    };
  }
  Context.prototype.call = (name) => {
    return (args) => {
      if (!scope[name].compiled) {
        const parameters = scope[name]
          .shift()
          .split(" ")
          .filter(Boolean)
          .slice(2);

        const code = compile(scope[name], scope);
        scope[name] = { code, parameters, compiled: true };
      }
      const variables = {};
      for (const arg of scope[name].parameters) {
        variables[arg] = args.shift();
      }
      return run(scope[name].code, new Context(Object.keys(scope), variables));
    };
  };

  const globalContext = new Context(Object.keys(scope), {});
  return run(scope.global, globalContext);
};

function clearPointer(code, strs) {
  const pointers = code.match(/%str[0-9]+%/g);
  if (pointers) {
    for (const pointer of pointers) {
      code = code.replace(pointer, strs[pointer.slice(4, -1)]);
    }
  }
  return code;
}