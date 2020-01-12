# Radine

To compile a .rdn file:
`node index --input [filepath] --output [name]`

[filepath] means no .rdn extension!

[name] means not the filepath!

## Syntax Overview

### Returning values

Like in TI-Basic, in order to write to `Ans` one would put the return "value" at the end of the code. Likewise, in Radine, the return values of expressions are based on the last values of expressions. E.g.

```
doSomething = function(n) {
  n + 1;
};

print(doSomething(6)); // prints 7
```

### Functions

Functions can be defined via either `function` or the synonym `f`. Like in JS, Radine functions can be expressed as an assignment expression. Generally, functions are defined as `<name> = function([arg1], [arg2], [...]) <expression>;`

Example:

```
coolMathsGame = f(x) {
  ((n + 2) / 3);
};

print(coolMathsGame(7)); // prints 3
```

### Blocks

Blocks are formally defined as "a sequence of expressions". Yeah, they're just a special expression for `{ <code> };`, which is used frequently to substitute the one expression that expressions can take for multiple expressions.

