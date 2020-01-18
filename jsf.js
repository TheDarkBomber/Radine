const False = { type: "boolean", value: false };
const True = { type: "boolean", value: true };
function predefine(file, code) {
    return require('fs').readFileSync(file).toString() + '\n' + code;
}

var Gensym = 0;
function gensym(name) {
  if (!name) name = "";
  name = "π_" + name;
  return name + (++Gensym);
}

function makeContinuation(k) {
  var cont = gensym("R");
  return {
    type: "function",
    vars: [ cont ],
    body: k({
      type: "variable",
      value: cont
    })
  };
}

class Environment {
    constructor(parent) {
      this.parent = parent;
      this.vars = Object.create(parent ? parent.vars : null);
    }

    extend() {
      return new Environment(this);
    }

    lookup(name) {
      let scope = this;
      while(scope) {
        if (Object.prototype.hasOwnProperty.call(scope.vars, name)) return scope;
        scope = scope.parent;
      }
    }

    get(name) {
      if(name in this.vars) return this.vars[name];
      throw new Error("Undefined variable " + name);
    }

    set(name, value) {
      let scope = this.lookup(name);
      if(!scope && this.parent) throw new Error("Undefined variable " + name);
      return (scope || this).vars[name] = value;
    }

    def(name, value) {
      return this.vars[name] = value;
    }
}

function makeScope(exp) {
  var global = new Environment();
  exp.env = global;

  (function scope(exp, env){
    switch(exp.type) {
      case "numerical":
      case "string":
      case "regex":
      case "raw":
      case "array":
      case "index":
      case "boolean": break;

      case "variable":
        var s = env.lookup(exp.value);
        if (!s) {
          exp.env = global;
          global.def(exp.value, { refs: [], assigned: 0});
        } else {
          exp.env = s;
        }
        var def = exp.env.get(exp.value);
        def.refs.push(exp);
        exp.def = def;
        break;

      case "assign":
        scope(exp.left, env);
        scope(exp.right, env);
        if (exp.left.type == "variable") exp.left.def.assigned++;
        break;

      case "binary":
        scope(exp.left, env);
        scope(exp.right, env);
        break;

      case "if":
        scope(exp.cond, env);
        scope(exp.then, env);
        if (exp.else) scope(exp.else, env);
        break;

      case "block":
        exp.block.forEach(function(exp){
          scope(exp, env);
        });
        break;

      case "call":
        scope(exp.method, env);
        exp.args.forEach(function(exp){
          scope(exp, env);
        });
        break;

      case "function":
        exp.env = env = env.extend();
        if (exp.name) env.def(exp.name, { refs: [], method: true, assigned: 0 });
        exp.vars.forEach(function(name, i){
          env.def(name, { refs: [], marg: true, assigned: 0, cont: i == 0 });
        });
        if (!exp.locs) exp.locs = [];
        exp.locs.forEach(function(name){
          env.def(name, { refs: [], mloc: true, assigned: 0});
        });
        scope(exp.body, env);
        break;

      case "negate":
        scope(exp.body, env);
        break;

      default:
        throw new Error("Cannot make scope for " + JSON.stringify(exp));
    }
  })(exp, global);
  return exp.env;
}

function sideFX(exp) {
  switch(exp.type) {
    case "call":
    case "raw":
    case "assign": return true;

    case "numerical":
    case "string":
    case "regex":
    case "boolean":
    case "function":
    case "variable": return false;

    case "binary": return sideFX(exp.left) || sideFX(exp.right);

    case "if": return sideFX(exp.cond) || sideFX(exp.then) || (exp.else && sideFX(exp.else));

    case "local":
      for(let i = 0; i < exp.vars.length; ++i) {
        var v = exp.vars[i];
        if (v.def && sideFX(v.def)) return true;
      }
      return sideFX(exp.body);

    case "block":
      for(let i = 0; i < exp.block.length; ++i) {
        if (sideFX(exp.block[i])) return true;
      }
      return false;
  }
  return true;
}

// Input: Radine AST
// Output: Raw JS
function makeJS(exp) {
  return (new Function("π_KERNEL", JS(exp))).toString();

  function JS(exp) {
    switch (exp.type) {
      case "numerical":
      case "string":
      case "boolean": return AtomJS(exp);
      case "regex": return RegexJS(exp);
      case "array": return ArrayJS(exp);
      case "variable": return VarJS(exp);
      case "binary": return BinJS(exp);
      case "assign": return AssignJS(exp);
      case "local": return LocalJS(exp);
      case "function":return FunctionJS(exp);
      case "if": return IfJS(exp);
      case "block": return BlockJS(exp);
      case "call": return CallJS(exp);
      case "index": return IndexJS(exp);
      case "raw": return RawJS(exp);
      case "negate": return NegateJS(exp);
      default:
        throw new Error("Unable to compose JS for " + JSON.stringify(exp));
    }
  }

  function AtomJS(exp) {
    return JSON.stringify(exp.value);
  }

  function ArrayJS(exp) {
    if (exp.value === true) return "Object.values(arguments).slice(1)";
    var a = [];
    exp.value.forEach(function(expr){
      a.push(JS(expr));
    });
    return `[${a}]`;
  }

  function RegexJS(exp) {
    return `/${exp.value[0]}/${exp.value[1]}`;
  }

  function makeVar(name) {
    switch(name) {
      case "while": return "γ_while";
      case "for": return "γ_for";
      case "continue": return "γ_continue";
      case "return": return "γ_return";
      case "try": return "γ_try";
      case "catch": return "γ_catch";
      case "throw": return "γ_throw";
      case "new": return "γ_new";
      case "Shield": return "γ_Shield";
      case "Continuation": return "γ_Continuation";
      case "Execute": return "γ_Execute";
    }
    return name.replace("@", "ΓAT").replace("~", "ΓTD").replace("=", "ΓEQ").replace("<", "ΓLT").replace(">", "ΓGT").replace("-", "ΓHY").replace("#", "ΓHT");
  }
  function VarJS(exp) {
    return makeVar(exp.value);
  }

  function BinJS(exp) {
    var left = JS(exp.left);
    var right = JS(exp.right);
    switch (exp.operator) {
      case "&&":
        if (booleanRes(exp.left)) break;
        return "((" + left + " !== false) && " + right + ")";
      case "||":
        if (booleanRes(exp.left)) break;
        return "((πσ = " +  left + ") !== false ? πσ : " + right + ")";
      case "^":
        return "(" + left + "**" + right + ")";
      case "root":
        return "(" + right + "**" + "(1/" + left + "))";
      case "log":
        return "(" + "Math.log(" + right + ")" + "/ Math.log(" + left + "))";
      case "match":
        return "(" + right + ".test(" + left + "))";
    }
    return "(" + left + exp.operator + right + ")";
  }

  function AssignJS(exp) {
    return BinJS(exp);
  }

  function FunctionJS(exp) {
    var code = "(function ", CC;
    if (!exp.unguarded) {
      CC = exp.name || "π_CC";
      code += makeVar(CC);
    }
    code += "(" + exp.vars.map(makeVar).join(", ") + ") {";
    if (exp.locs && exp.locs.length > 0) {
      code += "var " + exp.locs.join(", ") + ";";
    }
    if (!exp.unguarded) code += "Shield(arguments, " + CC + "); ";

    code += JS(exp.body) + " })";
    return code;
  }

  function LocalJS(exp) {
    if (exp.vars.length == 0) return JS(exp.body);
    let k = {
        type: "call",
        method: {
            type: "function",
            vars: [ exp.vars[0].name ],
            body: {
                type: "local",
                vars: exp.vars.slice(1),
                body: exp.body
            }
        },
        args: [ exp.vars[0].def || False ]
    };
    return "(" + JS(k) + ")";
  }

  function IfJS(exp) {
    return "("
    +      JS(exp.cond) + " !== false"
    +      " ? " + JS(exp.then)
    +      " : " + JS(exp.else || False)
    +  ")";
  }

  function BlockJS(exp) {
    return "(" + exp.block.map(JS).join(", ") + ")";
  }

  function CallJS(exp) {
    return JS(exp.method) + "(" + exp.args.map(JS).join(", ") + ")";
  }

  function IndexJS(exp) {
    return JS(exp.list) + "[" + JS(exp.index) + "]";
  }

  function RawJS(exp) {
    return "(" + exp.code + ")"
  }

  function booleanRes(exp) {
    switch(exp.type) {
      case "boolean":
      case "negate": return true;

      case "if": return booleanRes(exp.then) || (exp.else && booleanRes(exp.else));

      case "binary":
        if (",<,<=,==,!=,>=,>,".indexOf("," + exp.operator + ",") >= 0) return true;
        if (exp.operator == "&&" || exp.operator == "||") return booleanRes(exp.left) && booleanRes(exp.right);
        break;
    }
    return false;
  }

  function NegateJS(exp) {
    if (booleanRes(exp.body)) return "!" + JS(exp.body);
    return "(" +  JS(exp.body) + " === false)";
  }
}

// Input: Radine AST
// Output: Radine AST
function toCPS(exp, k) {
  return cps(exp, k);

  function cps(exp, k) {
    switch(exp.type) {
      case "numerical":
      case "string":
      case "boolean":
      case "raw":
      case "regex":
      case "array":
      case "index":
      case "variable": return cpsAtom(exp, k);


      case "assign":
      case "binary": return cpsBin(exp, k);

      case "local": return cpsLocal(exp, k);
      case "function": return cpsFunction(exp, k);
      case "if": return cpsIf(exp, k);
      case "block": return cpsBlock(exp, k);
      case "call": return cpsCall(exp, k);
      case "negate": return cpsNegate(exp, k);

      default:
        throw new Error("Unable to compose CPS-AST for: " + JSON.stringify(exp));
    }
  }

  function cpsAtom(exp, k) {
    return k(exp);
  }

  function cpsBin(exp, k) {
    return cps(exp.left, function(left){
      return cps(exp.right, function(right){
        return k({
          type: exp.type,
          operator: exp.operator,
          left: left,
          right: right
        });
      });
    });
  }

  function cpsLocal(exp, k) {
    if (exp.vars.length == 0) return cps(exp.body, k);
    return cps({
      type: "call",
      args: [ exp.vars[0].def || False ],
      method: {
        type: "function",
        vars: [ exp.vars[0].name ],
        body: {
          type: "local",
          vars: exp.vars.slice(1),
          body: exp.body
        }
      }
    }, k);
  }

  function cpsFunction(exp, k) {
    var cont = gensym("K");
    var body = cps(exp.body, function(body){
      return {
        type: "call",
        method: {
          type: "variable",
          value: cont
        },
        args: [ body ]
      };
    });
    return k({
      type: "function",
      name: exp.name,
      vars: [ cont ].concat(exp.vars),
      body: body
    });
  }

  function cpsIf(exp, k) {
    return cps(exp.cond, function(cond){
      var cvar = gensym("I");
      var cast = makeContinuation(k);
      k = function(resIf) {
        return {
          type: "call",
          method: {
            type: "variable",
            value: cvar
          },
          args: [ resIf ]
        };
      };
      return {
        type: "call",
        method: {
          type: "function",
          vars: [ cvar ],
          body: {
            type: "if",
            cond: cond,
            then: cps(exp.then, k),
            else: cps(exp.else || False, k)
          }
        },
        args: [ cast ]
      };
    });
  }

  function cpsCall(exp, k) {
    return cps(exp.method, function(method) {
      return (function loop(args, i) {
        if (i == exp.args.length) return {
          type: "call",
          method: method,
          args: args
        };
        return cps(exp.args[i], function(value){
          args[i + 1] = value;
          return loop(args, i + 1);
        });
      })([ makeContinuation(k) ], 0);
    });
  }

  function cpsBlock(exp, k) {
    return (function loop(body){
      if (body.length == 0) return k(False);
      if (body.length == 1) return cps(body[0], k);
      if (!sideFX(body[0])) return loop(body.slice(1));
      return cps(body[0], function(first){
        if (sideFX(first)) return {
          type: "block",
          block: [ first, loop(body.slice(1)) ]
        };
        return loop(body.slice(1));
      });
    })(exp.block);
  }

  function cpsNegate(exp, k) {
    return cps(exp.body, function(body){
      return k({
        type: "negate",
        body: body
      });
    });
  }
}

function optimiseAST(exp) {
  var changes, defun;
  do {
    changes = 0;
    defun = exp;
    makeScope(exp);
    exp = optimise(exp);
  } while(changes);
  makeScope(exp);
  return exp;

  function optimise(exp) {
    if (changes) return exp;
    switch(exp.type) {
      case "numerical":
      case "string":
      case "regex":
      case "boolean":
      case "raw":
      case "array":
      case "index":
      case "variable": return exp;
      case "binary": return optimalBin(exp);
      case "assign": return optimalAssign(exp);
      case "if": return optimalIf(exp);
      case "block": return optimalBlock(exp);
      case "call": return optimalCall(exp);
      case "function": return optimalFunction(exp);
      case "negate": return optimalNegate(exp);
    }
    throw new Error("Unable to optimise " + JSON.stringify(exp));
  }

  function change() {
    ++changes;
  }

  function isConstant(exp) {
    return exp.type == "numerical" || exp.type == "string" || exp.type == "bool";
  }

  function num(exp) {
    if (exp.type != "numerical") throw new Error("Not a number: " + JSON.stringify(exp));
    return exp.value;
  }

  function str(exp) {
    if (exp.type != "string") throw new Error("Not a string: " + JSON.stringify(exp));
    return exp.value;
  }

  function reg(exp) {
    if (exp.type != "regex") throw new Error("Not a regular expression: " + JSON.stringify(exp));
    return exp.value;
  }

  function div(exp) {
    if (num(exp) == 0) throw new Error("It's literally mathematically impossible to divide by zero -_- : " + JSON.stringify(exp));
    return exp.value;
  }

  function optimalBin(exp) {
    exp.left = optimise(exp.left);
    exp.right = optimise(exp.right);
    if (isConstant(exp.left) && isConstant(exp.right)) {
      switch(exp.operator) {
        case "+":
          change();
          return {
            type: "numerical",
            value: num(exp.left) + num(exp.right)
          };
        case "-":
          change();
          return {
            type: "numerical",
            value: num(exp.left) - num(exp.right)
          };
        case "*":
          change();
          return {
            type: "numerical",
            value: num(exp.left) * num(exp.right)
          };
        case "/":
          change();
          return {
            type: "numerical",
            value: num(exp.left) / div(exp.right)
          };
        case "%":
          change();
          return {
            type: "numerical",
            value: num(exp.left) % div(exp.right)
          };
        case "^":
          change();
          return {
            type: "numerical",
            value: num(exp.left) ** num(exp.right)
          };
        case "root":
          change();
          return {
            type: "numerical",
            value: num(exp.right) ** (1 / div(exp.left))
          };
        case "log":
          change();
          return {
            type: "numerical",
            value: Math.log(div(exp.right)) / div(Math.log(div(exp.left)))
          };
        case "<":
          change();
          return {
            type: "boolean",
            value: num(exp.left) < num(exp.right)
          };
        case ">":
          change();
          return {
            type: "boolean",
            value: num(exp.left) > num(exp.right)
          };
        case "<=":
          change();
          return {
            type: "boolean",
            value: num(exp.left) <= num(exp.right)
          };
        case ">=":
          change();
          return {
            type: "boolean",
            value: num(exp.left) >= num(exp.right)
          };
        case "==":
          change();
          if (exp.left.type != exp.right.type) return False;
          return {
            type: "boolean",
            value: exp.left.value === exp.right.value
          };
        case "!=":
          change();
          if (exp.left.type != exp.right.type) return True;
          return {
            type: "boolean",
            value: exp.left.value !== exp.right.value
          };
        case "||":
          change();
          if (exp.left.value !== false) return exp.left;
          return exp.right;
        case "&&":
          change();
          if (exp.left.value !== false) return exp.right;
          return False;
        case "match":
          change();
          return {
            type: "boolean",
            value: (new RegExp(reg(exp.right)[0], reg(exp.right)[1])).test(str(exp.left))
          };
      }
    }
    return exp;
  }

  function optimalAssign(exp) {
    if (exp.left.type == "variable") {
      if (exp.right.type == "variable" && exp.right.def.cont) {
        change();
        exp.left.def.refs.forEach(function(N) {
          N.value = exp.right.value;
        });
        return optimise(exp.right);
      }

      if (!exp.left.def || exp.left.def.refs.length == exp.left.def.assigned && exp.left.env.parent) {
        change();
        return optimise(exp.right);
      }
    }
    exp.left = optimise(exp.left);
    exp.right = optimise(exp.right);
    return exp;
  }

  function optimalIf(exp) {
    exp.cond = optimise(exp.cond);
    exp.then = optimise(exp.then);
    exp.else = optimise(exp.else || False);
    if (isConstant(exp.cond)) {
      change();
      if (exp.cond.value !== false) return exp.then;
      return exp.else;
    }
    return exp;
  }

  function optimalBlock(exp) {
    if (exp.block.length == 0) {
      change();
      return False;
    }

    if (exp.block.length == 1) {
      change();
      return optimise(exp.block[0]);
    }

    if (!sideFX(exp.block[0])) {
      change();
      return optimise({
        type: "block",
        block: exp.block.slice(1)
      });
    }

    if (exp.block.length == 2) return {
      type: "block",
      block: exp.block.map(optimise)
    };

    return optimise({
      type: "block",
      block: [
        exp.block[0],
        {
          type: "block",
          block: exp.block.slice(1)
        }
      ]
    });
  }

  function optimalCall(exp) {
    var method = exp.method;
    if (method.type == "function" && !method.name) {
      if (method.env.parent.parent) return optimalIIFE(exp);
      method.unguarded = true;
    }

    return {
      type: "call",
      method: optimise(method),
      args: exp.args.map(optimise)
    };
  }

  function optimalFunction(f) {
    TCO: if (f.body.type == "call" && f.body.method.type == "variable" && f.body.method.def.assigned == 0 && f.body.method.env.parent && f.vars.indexOf(f.body.method.value) < 0 && f.vars.length == f.body.args.length) {
      for (let i = 0; i < f.vars.length; ++i) {
        var x = f.body.args[i];
        if (x.type != "variable" || x.value != f.vars[i]) break TCO;
      }
      change();
      return optimise(f.body.method);
    }
    f.locs = f.locs.filter(function(name){
      var def = f.env.get(name);
      return def.refs.length > 0;
    });
    var save = defun;
    defun = f;
    f.body = optimise(f.body);
    if (f.body.type == "call") f.unguarded = true;
    defun = save;
    return f;
  }

  function optimalIIFE(exp) {
    change();
    var method = exp.method;
    var argv = exp.args.map(optimise);
    var body = optimise(method.body);
    function rename(name) {
      var sym = name in defun.env.vars ? gensym(name + "ω") : name;
      defun.locs.push(sym);
      defun.env.def(sym, true);
      method.env.get(name).refs.forEach(function(ref){
        ref.value = sym;
      });
      return sym;
    }
    var block = method.vars.map(function(name, i){
      return {
        type: "assign",
        operator: "=",
        left: {
          type: "variable",
          value: rename(name)
        },
        right: argv[i] || False
      };
    });
    method.locs.forEach(rename);
    block.push(body);
    return optimise({
      type: "block",
      block: block
    });
  }

  function optimalNegate(exp) {
    exp.body = optimise(exp.body);
    return exp;
  }
}

module.exports = {
  makeJS,
  toCPS,
  optimiseAST,
  predefine
}
