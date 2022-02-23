import parser from "./parser.js";
import compile, { compileStrings } from "./compiler.js";
import { createContext, runInNewContext } from "vm";

export default (sourceCode, inputs) => {
  let [scopes, strs, blocks] = parser(sourceCode);
  strs = compileStrings(strs);

  const run = (source, code, context) => {
    try {
      runInNewContext(
        `return__=(()=>{${clearPointer(code, strs)}})()`,
        context
      );
      return context.return__;
    } catch (e) {
      error(e);
    }
  };

  function Context(userFunctions, vars, funcs) {
    const functions = {};
    for (const func of userFunctions) {
      functions[func] = this.call(func);
    }
    return {
      funcs,
      heap: vars,
      pass: (args) => args[0],
      exit: ([a]) => process.exit(a ? a : 0),

      Number: ([a]) => Number(a),
      Array: (arr) => arr,

      // logic
      lt: ([a, b]) => a < b,
      gt: ([a, b]) => a > b,
      eq: ([a, b]) => a === b,
      not: ([a]) => !a,
      ternary: ([a, b, c]) => (a ? b : c),
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
      // array functions
      length: ([a]) => a.length,
      filter: ([a, b]) => a.filter((x) => b([x])),
      map: ([a, b]) => a.map((x) => b([x])),
      reduce: ([a, b, c]) => a.reduce((acc, cur) => c([acc, cur]), b),

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
  const parseArgs = (parameters, args) => {
    const variables = {};
    for (const arg of parameters) {
      variables[arg] = args.shift();
    }
    return variables;
  };
  const compileAnonymousFunctions = (name) => {
    // compile anonymous functions
    for (const func in scopes[name].funcs) {
      const scope = { ...scopes[name].funcs[func] };
      scopes[name].funcs[func] = (args) => {
        return run(
          name,
          compile(scope.code, blocks),
          new Context(
            Object.keys(scopes),
            parseArgs(scope.parameters, args),
            {}
          )
        );
      };
    }
  };
  Context.prototype.call = (name) => {
    return (args) => {
      if (!scopes[name].compiled) {
        scopes[name].code = compile(scopes[name].code, blocks);
        compileAnonymousFunctions(name);
        scopes[name].compiled = true;
      }
      const variables = parseArgs(scopes[name].parameters, args);
      return run(
        name,
        scopes[name].code,
        new Context(Object.keys(scopes), variables, scopes[name].funcs)
      );
    };
  };

  const globalInputs = {};
  for (const i in inputs) globalInputs[`env${i}`] = inputs[i];

  compileAnonymousFunctions("global");
  const globalContext = new Context(
    Object.keys(scopes),
    globalInputs,
    scopes.global.funcs
  );
  if (DEV) log(scopes);
  return run("global", compile(scopes.global.code, blocks), globalContext);
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
