export default (file) => {
  // parse strings
  const strs = [];
  const parseStrings = (quote) => {
    const strings = file.match(
      new RegExp(`${quote}(.||\n)[^${quote}]*${quote}`, "g")
    );
    if (strings) {
      for (const string of strings) {
        file = file.replace(string, `%str${strs.length}%`);
        strs.push(string);
      }
    }
  };
  parseStrings('"');
  parseStrings("'");

  // parse comments
  file = file.replaceAll(/#.*\n/g, "\n");

  // remove abundant new lines
  file = file.replaceAll(/\n\s*\n/g, "\n");

  // replace ; with \n
  file = file.replaceAll(";", "\n");
  file = file.replaceAll("[", "<").replaceAll("]", ">");

  // check indentation
  file = file.split("\n").filter(Boolean);

  let lastIndex = -1;
  let lastTabCount = 0;
  let hash = 0;

  const scopes = {};
  scopes.global = [];
  file[-1] = "";
  file.push("")
  let scopeStack = ["global"];

  for (let line of file) {
    const tabCount = countTabs(line);
    line = file[lastIndex + 1] = line.trim();

    if (tabCount == lastTabCount) {
      // still in current scope
      scopes[last(scopeStack)].push(file[lastIndex]);
    } else if (tabCount > lastTabCount) {
      // into to new scope
      if (file[lastIndex].startsWith("function")) {
        // into a new function
        const declaration = file[lastIndex].split(" ").filter(Boolean);
        const functionName = declaration[1];
        scopeStack.push(functionName);
        scopes[functionName] = [file[lastIndex]];
      } else {
        const declaration = `${file[lastIndex].split(" ",1)[0]}#${hash}`;
        scopes[last(scopeStack)].push(`#${declaration}#`);
        scopeStack.push(declaration)
        scopes[declaration] = [file[lastIndex]];
        hash++;
      }
    } else {
      // out of current scope
      scopes[last(scopeStack)].push(file[lastIndex]);
      scopeStack = scopeStack.slice(0,tabCount - lastTabCount);
    }

    lastIndex++;
    lastTabCount = tabCount;
  }
  scopes.strs__ = strs;
  scopes.global.shift();
  return scopes;
};

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
