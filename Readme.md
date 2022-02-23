# PIPESCRIPT

pipescript is a functional interpreted dynamically-typed programming language.
<br>
set your syntax for .pipescript as rust in your preferred text editor. <br>
for example in vim,

```vimscript
autocmd BufNewFile,BufRead *.pipescript set syntax=rust
```

# Documentation

### functions

```rust
addNumbers(a b) => add a b;
addNumbers(a b) => {
  return | add a b;
}
```

### conditional flow

```rust
if [eq $a 20]: return "equal";
else if | lt $a 20: return "less than";
else: return "more than";
```
