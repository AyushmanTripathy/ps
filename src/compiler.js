const last = (arr) => arr[arr.length - 1];

export default function compile(scope, blocks) {
  // pipescript -> javascript
  scope = scope.split(";").filter((s) => Boolean(s.trim()));

  // seprate code blocks
  for (let index in scope) scope[index] = compileBlocks(scope[index]);

  let output = "";
  for (let line of scope) {
    line = line.trim();
    if (line.startsWith("if") || line.startsWith("else")) {
      line = line.split(":");
      line[0] = line[0].split("if");
      if (line[0].length == 2) {
        output += `${line[0][0] + "if"}(${compilePipes(
          `pass ${line[0][1]}`.split("|").map((a) => a.trim())
        )})`;
      } else output += "else ";
      line = last(line).trim();
    }
    if (line.match(/^[0-9]*#/g)) {
      output += compile(blocks[line.split("#", 1)[0]], blocks);
      line = line.split("#").slice(1);
      if (line.length > 1) throw "} a semicoloum is expected here.";
    } else {
      // compile pipes
      line = line.split("|").map((a) => a.trim());
      if (line[0].startsWith("return")) {
        output += `${line.shift()} ${compilePipes(line)}\n`;
      } else output += compilePipes(line) + "\n";
    }
  }
  return output.replaceAll("$", "heap.");
}

function compileBlocks(line) {
  const blocks = line.match(/\<(.||\n)[^\<>]*>/g);
  if (blocks) {
    for (const block of blocks) {
      line = line.replace(block, compilePipes(block.slice(1, -1).split("|")));
    }
  } else return line;
  return compileBlocks(line);
}

function compilePipes(line) {
  if (!line.length) return line;
  const statment = line.shift().split(" ").filter(Boolean);
  return `${statment.shift()}([${statment.join(",")}${
    statment.length ? "," : ""
  }${compilePipes(line)}])`;
}

export function compileStrings(strings) {
  for (const i in strings) {
    if ((strings[i][0] == '"') & strings[i].includes("$")) {
      strings[i] = "`" + strings[i].slice(1, -1) + "`";
      const matches = strings[i].match(/\$[a-z0-9_]*/gi);
      if (matches) {
        for (const match of matches)
          strings[i] = strings[i].replace(
            match,
            `\${${match.replace("$", "heap.")}}`
          );
      }
    }
  }
  return strings;
}
