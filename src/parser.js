export default (file) => {
  // parse strings
  const strs = [];
  const parseStrings = (quote) => {
    file = parseRegex(
      file,
      new RegExp(`${quote}(.||\n)[^${quote}]*${quote}`, "g"),
      (string) => {
        strs.push(string);
        return `%str${strs.length - 1}%`;
      }
    );
  };
  parseStrings('"');
  parseStrings("'");

  // parse comments
  file = file.replaceAll(/#.*\n/g, "\n");
  // replace , with \s
  file = file.replaceAll(",", " ");
  file = file.replaceAll("[", "<").replaceAll("]", ">");
  // collapse new lines
  file = file.replaceAll("\n", "");
  // remove abundant \s
  file = parseRegex(file, "  ", () => " ");

  const scopes = [];
  const scopeStack = [0];
  scopes[0] = "";

  let hash_no = 0;
  const hash = () => {
    hash_no++;
    return hash_no;
  };
  const add = (s) => (scopes[last(scopeStack)] += s);

  for (const s of file) {
    if (s == "{") {
      const hash_code = hash();
      scopes[hash_code] = "";
      add(hash_code + "#");
      scopeStack.push(hash_code);
    } else if (s == "}") scopeStack.pop();
    else add(s);
  }

  const functions = {};
  // parse functions
  const parseFunctions = (code) => {
    const parameters = code
      .match(/\((.||\n)[^\(\)]*\)/g)[0]
      .slice(1, -1)
      .split(" ")
      .filter(Boolean);

    code = code.split("=>", 2)[1];
    if (code.includes("#")) code = scopes[code.trim().slice(0, -1)].trim();
    else code = "return |" + code;

    return {
      code,
      parameters,
    };
  };

  // name functions
  const parseNamedFunctions = (code) => {
    const name = code.split("(", 1)[0];
    functions[name] = parseFunctions(code, name);
    return "";
  };

  functions.global = {
    code: parseRegex(
      scopes[0],
      /[a-z1-9_]+\((.||\n)[^\(\)]*\)\s*=>\s*([1-9]+#|(.|\n)[^;]*;)/gi,
      parseNamedFunctions
    ),
    parameters: [],
  };

  for (const key in functions) {
    functions[key].funcs = {};
    functions[key].code = parseRegex(
      functions[key].code,
      /\((.||\n)[^\(\)]*\)\s*=>\s*([1-9]+#|(.|\n)[^;]*;)/gi,
      (code) => {
        const hash_name = `func${hash()}`;
        functions[key].funcs[hash_name] = parseFunctions(code, hash_name);
        return `funcs.${hash_name}${code.includes(";") ? ";" : ""}`;
      }
    );
  }
  return [functions,strs,scopes];
};

function parseRegex(file, regex, callback) {
  const matches = file.match(regex);
  if (matches) {
    for (const match of matches) {
      file = file.replace(match, callback(match));
    }
  } else return file;
  return parseRegex(file, regex, callback);
}

function countTabs(line) {
  let tabCount = 0;
  while (line.startsWith("  ")) {
    line = line.slice(2);
    tabCount++;
  }
  return tabCount;
}

function last(arr) {
  return arr[arr.length - 1];
}
