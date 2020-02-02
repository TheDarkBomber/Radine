# Radine

To compile a .rdn file:
`node index --input [filepath] --output [name]`

[filepath] means no .rdn extension!

[name] means not the filepath!

For example:
```
radine --input ./coolRdnPrg
```

`./` refers to the relative path with which `radine` was called.

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

### If

If! Everybody loves If! I don't need to explain much here but the syntax, which is: `if <condition> [then]* <expression> [[else] <expression>]`

\* `then` is optional if the following expression is a block.

### Local

Alright, a local is hard to explain. The name gives it a hint, however. "Local". It's easier to explain if I show the syntax: `local [name] ([assignment1], [assignment2], [...]) <expression>`. Notice it takes assignment expressions (e.g. `i = 0`), and not standard arguments. Essentially, locals are expressions that have local variables that will **not** overshadow other variables. E.g.

```
local (n = "hi) {
  local (n = "bye") {
    print(n); // prints bye
  };
  print(n); // prints hi;
};
```

Of course, you may have noticed the optional `name` value. This is because all locals are a form of **I**mmediately **I**nvoked **F**unction **E**xpressions, or "IIFE" for short. That means it will be evaluated as soon as it is defined (simplification). Which means that the assignment values that locals have can be starting conditions. Which means that we can make loops. Here's a useful example of one!

```
forEach = f(list, m) {
  local (n = length(list)) {
    local loop(i = 0) {
      if i < n then {
        m(list[i], i);
        loop(i + 1);
      };
    };
  };
};
```

This is a function that iterates through an array, and calls a method (an expression which can be called, usually a function) for each value in the input list (array). Here, a named local is used in order to create a loop, which is actually just a for loop. Oh yeah, Radine has no for loops. Here's how to translate:

```js
for(let i = 0; <condition>; ++i) {
  // code
};
```

to

```
local loop(i = 0) {
  if <condition> then {
    // code
    loop(i + 1);
  };
};
```

Yeah, locals are epic.

### Arrays

Arrays are defined, like in JS, as `sample = [[var1], [var2], [...]];`

Not much to explain here, I just wanted to point out that the `push` primitive takes the **value** first, and the array second. Just to avoid some pebkac situations.

### Primitives

These are simple. Functions which are predefined in JS. See `primitives.js`, after the `Shield` function.
