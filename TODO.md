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
  mathsIsFun(p, x, y);
};
```
