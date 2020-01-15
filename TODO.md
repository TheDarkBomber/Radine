# Radine Todo List

## Exponentiation, roots, and logarithms.

You know, basic things such as 2^4, 2 root 4 (square root of 4), 2 log 4 (log of 4 with base of 2)

Theoretical Usage:

```
mathsIsFun = function(p, a, b) {
  if p == "^" then a^b
  else if p == "root" then a root b
  else if p == "log" then a log b;
};

local loop(p = input("Enter: ")) {
  if (p != "root") || (p != "^") || (p != "log") {
    print("Nope.");
    loop(input("Try again: "));
  }; 
  x = input("a? ");
  y = input("b? ");
  print(mathsIsFun(p, x, y));
};
```

## Regular Expressions

RegEx! Can't live without them. However, I'd like it so that RegEx is only match tested as a binary expression, so `"Hey there, Galaxy" match /[a-z]/i`. I just don't like implementing things as primitives if it can be avoided.

Theoretical Usage:

```
// insert "forEach" function here

filterByRegex = function(list, rx) {
  a = [];
  forEach(list, f(e) {
    if e match rx then push(e, a);
  });
  (a);
};

test = ["12F4", "Z231", "64AE"];
hexOnly = /[0-9][a-z]/i

test = filterByRegex(test, hexOnly);
print(test); // would output "12F4", "64AE"
```

## Arguments keyword

Yes, it returns the arguments its parennt function was called with as an array.

Theoretical Usage:

```
// insert "forEach" function here

print2 = function(x) {
  forEach(arguments, f(e) {
    write(e);
  });
  print("");
};

print2("Hey ", "there, ", "Gal", "ax", "y!"); // would output "Hey there, Galaxy!"
```

## WithCall and CallWith

This is mostly on the esoteric side of things. `with <array of args>, [array of args2], [...] call <method>` and `call <method1>, [method2], [...] with <array of args>`. The former calls a single method multiple times with different arguments. The latter calls multiple methods once with the same arguments. They return an array of values.

Theoretical Usage:

```
sum = f(a, b) a + b;
mul = f(a, b) a * b;
div = f(a, b) a / b;
mod = f(a, b) a % b;

cycle = call sum, mul, div, mod with [2, 2];
print(cycle); // would output "4, 4, 1, 0"

// insert function here that is, to you, a black box (it is named "blackbox")

testOutputs = with [4, 5], [7, 2], [0, 9], [7, 1] call blackbox;
print(testOutputs); // would return "264, 13, 61, 75"
```

## General Namespaces

Simple enough. Things within things. Accessing deeper. `x.y`. `thing.otherThing != otherThing`.

Theoretical Usage:

```
galaxy = namespace {
  what = 264;
};

what = 13;

print(what); // would output "13"
print(galaxy.what); // would output "264"
```
