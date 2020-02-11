# Radine Todo List

Ok, new TODO list!

## Pick Operators

This refers to two operators, `<?` and `>?`. These mean "pick the lesser/greater expression" respectively. E.g.

```rdn
a = input("a? ") * 1;
b = input("b? ") * 1;
write(a >? b);
print(" is the larger number.");
```

## "Explicit" keyword

As you saw above, in order to ensure the user input is a number (which we didn't need to), we had to exploit JavaScript's type fucking. Whilst it's very useful to have implicit types by default, it would also be useful to have explicit type assignment (especially for the different number types). E.g.

```rdn
foo = explicit uint32 473; // define foo to be an unsigned integer of 32 bits (by default it is a signed float)
bar = explicit number input("Enter: "); // define bar to be a signed float; casting the user input to it.
// ...
bar = explicit string bar; // cast bar to a string.
```

This will introduce a new AST type: "explicit".

Typical `explicit` node:
```json
type: "explicit",
vartype: "uint32",
value: {
  type: "numerical",
  value: 473
}
```
