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
  // replace ; with \n
  file = file.replaceAll(";", "\n");
  // replace , with \s
  file = file.replaceAll(",", "s");
  file = file.replaceAll("[", "<").replaceAll("]", ">");

  // remove abundant new lines
  const removeAbundantNewLines = (str) => str.replaceAll(/\n\s*\n/g, "\n");

  // parse functions
  const scopes = {};
  const parseFunctions = (code, name, addReturn) => {
    const parameters = code
      .match(/\((.||\n)[^\(\)]*\)/g)[0]
      .slice(1, -1)
      .split(" ")
      .filter(Boolean);
    if (!code.includes("{")) addReturn = true;
    code = code.split("=>", 2)[1].replaceAll(/[{}]/g, "");
    code = removeAbundantNewLines(code);

    if (addReturn) code = `return | ${code}`;

    scopes[name] = {
      code,
      parameters,
    };
  };

  // name functions
  const parseNamedFunctions = (code) => {
    const name = code.split("(", 1)[0];
    parseFunctions(code, name);
    return ``;
  };

  // anonymous functions
  let hash = 0;
  const parseAnonymousFunctions = (code) => {
    hash++;
    const hash_name = `func${hash}`;
    parseFunctions(code, hash_name);
    return hash_name;
  };

  file = parseRegex(
    file,
    /[a-z1-9_]+\((.||\n)[^\(\)]*\)\s*=>\s*{(.||\n)[^{}]*}/gi,
    parseNamedFunctions
  );
  file = parseRegex(
    file,
    /[a-z1-9_]+\((.||\n)[^\(\)]*\)\s*=>\s.*/gi,
    parseNamedFunctions
  );

  file = parseRegex(
    file,
    /\((.||\n)[^\(\)]*\)\s*=>\s*{(.||\n)[^{}]*}/gi,
    parseAnonymousFunctions
  );
  file = parseRegex(
    file,
    /\((.||\n)[^\(\)]*\)\s*=>\s.*/gi,
    parseAnonymousFunctions
  );

  file = removeAbundantNewLines(file);
  scopes.global = { code: file, parameters: [] };
  scopes.strs__ = strs;
  return scopes;
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
