export default function compile(scope, scopes) {
  // pipescript -> javascript

  // seprate code blocks
  for (let index in scope) scope[index] = compileBlocks(scope[index]);

  let output = "";
  for (let line of scope) {
    if (line[0] === "#") {
      // compile refrences
      line = line.slice(1, -1);
      let declaration = scopes[line].shift();
      if (declaration != "else") {
        const spaceIndex = declaration.indexOf(" ");
        declaration =
          declaration.slice(0, spaceIndex + 1).replace("elseif", "else if") +
          compileBlocks(`(<pass ${declaration.slice(spaceIndex)}>)`);
      }
      output += `${declaration} {${compile(scopes[line], scopes)}}`;
    } else {
      // compile pipes
      line = line.split("|");
      if (line[0].startsWith("return")) {
        output += `${line.shift()} ${compilePipes(line)}\n`;
      } else output += compilePipes(line) + "\n";
    }
  }
  return output.replaceAll("$","heap.")
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
