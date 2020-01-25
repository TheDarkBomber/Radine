const RParser = require('./parser.js');
const makeJS = require('./jsf.js').makeJS;
const toCPS = require('./jsf.js').toCPS;
const optimiseAST = require('./jsf.js').optimiseAST;

const { compile } = require('nexe');
const invocation = require('path').resolve('.') + "\\";

// var ithis;

/*
var Stacklen;
function Execute(f, args) {
  while (true) try {
      Stacklen = 200;
      return f.apply(null, args);
  } catch(ex) {
      if (ex instanceof Continuation)
          f = ex.f, args = ex.args;
      else throw ex;
  }
}

function Continuation(f, args) {
  this.f = f;
  this.args = args;
}

function Shield(args, f) {
  if (--Stacklen < 0) throw new Continuation(f, args);
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

class Interpreter {
  constructor(code) {
    this.code = code;
    this.ast = new RParser.Parser(new RParser.TStream(new RParser.CStream(code))).parseKern();
    ithis = this;
  }

  evaluate(exp, env, callback) {
    // let Shield = ithis.shield;
    Shield(ithis.evaluate, arguments);
    switch(exp.type) {
      case "numerical":
      case "string":
      case "boolean":
        callback(exp.value);
        return;
      case "variable":
        callback(env.get(exp.value));
        return;
      case "assign":
        if(exp.left.type != "variable") throw new Error("Cannot assign to " + JSON.stringify(exp.left));
        ithis.evaluate(exp.right, env, function CC(right){
          Shield(CC, arguments);
          callback(env.set(exp.left.value, right));
        });
        return;
      case "binary":
        ithis.evaluate(exp.left, env, function CC(left){
          Shield(CC, arguments);
          ithis.evaluate(exp.right, env, function CC(right){
            Shield(CC, arguments);
            callback(ithis.applyOp(exp.operator, left, right));
          });
        });
        return;
      case "function":
        callback(ithis.makeFunction(exp, env));
        return;
      case "if":
        ithis.evaluate(exp.cond, env, function CC(cond){
          Shield(CC, arguments);
          if(cond !== false) ithis.evaluate(exp.then, env, callback);
          else if(exp.else) ithis.evaluate(exp.else, env, callback);
          else callback(false);
        });
        return;
      case "block":
        (function loop(last, i){
          Shield(loop, arguments);
          if (i < exp.block.length) ithis.evaluate(exp.block[i], env, function CC(val){
              Shield(CC, arguments);
              loop(val, i + 1);
          }); else {
              callback(last);
          }
        })(false, 0);
        return;
      case "call":
        ithis.evaluate(exp.method, env, function CC(method){
          Shield(CC, arguments);
          (function loop(args, i){
              Shield(loop, arguments);
              if (i < exp.args.length) ithis.evaluate(exp.args[i], env, function CC(arg){
                  Shield(CC, arguments);
                  args[i + 1] = arg;
                  loop(args, i + 1);
              }); else {
                  method.apply(null, args);
              }
          })([ callback ], 0);
        });
        return;
      case "local":
        (function loop(env, i){
            Shield(loop, arguments);
            if (i < exp.vars.length) {
                var v = exp.vars[i];
                if (v.def) ithis.evaluate(v.def, env, function CC(value){
                    Shield(CC, arguments);
                    var scope = env.extend();
                    scope.def(v.name, value);
                    loop(scope, i + 1);
                }); else {
                    var scope = env.extend();
                    scope.def(v.name, false);
                    loop(scope, i + 1);
                }
            } else {
                ithis.evaluate(exp.body, env, callback);
            }
        })(env, 0);
        return;
      default:
        throw new Error(`Type ${exp.type} is not implemented in the interpreter`);
    }
  }

  applyOp(op, a, b) {
    function num(x) {
      if (typeof x != "number") throw new Error("Expected number but got " + x);
      return x;
    }

    function div(x) {
      if(num(x) == 0) throw new Error("Cannot divide by zero");
      return x;
    }

    switch (op) {
      case "+"  : return num(a) + num(b);
      case "-"  : return num(a) - num(b);
      case "*"  : return num(a) * num(b);
      case "/"  : return num(a) / div(b);
      case "%"  : return num(a) % div(b);
      case "&&" : return a !== false && b;
      case "||" : return a !== false ? a : b;
      case "<"  : return num(a) < num(b);
      case ">"  : return num(a) > num(b);
      case "<=" : return num(a) <= num(b);
      case ">=" : return num(a) >= num(b);
      case "==" : return a === b;
      case "!=" : return a !== b;
    }
    throw new Error("Cannot apply operator " + op);
  }

  makeFunction(exp, env) {
    if (exp.name) {
      env = env.extend();
      env.def(exp.name, madeFunction);
    }
    function madeFunction(callback) {
      let names = exp.vars;
      let scope = env.extend();
      for(let i = 0; i < names.length; ++i) {
        scope.def(names[i], i + 1 < arguments.length ? arguments[i + 1] : false);
      }
      return ithis.evaluate(exp.body, scope, callback);
    }
    return madeFunction;
  }

  primeEvaluate(env, callback) {
    Execute(ithis.evaluate, [ithis.ast, env, callback]);
  }
}
*/

var yargs = require('yargs').options({
  'input': {
    alias: 'i',
    demandOption: true,
    describe: 'Path to input Radine file. Do not include .rdn extension.',
    type: 'string'
  }, 'output': {
    alias: 'o',
    describe: 'Name of output executable. Do not include the extension nor filepath.',
    type: 'string'
  }, 'icon': {
    default: __dirname + "\\" + 'radine.ico',
    describe: 'Icon to apply to file if possible.',
    type: 'string'
  }
}).help().argv;

if(!yargs.output) yargs.output = yargs.input.split("/")[-1];

var input = invocation + "out.js";
if (yargs.input.startsWith("./")) {
  let a = yargs.input.substring(2);
  yargs.input = invocation + a;
}
var data = require('fs').readFileSync(yargs.input + ".rdn").toString();
//console.log(y);
// var Evaluation = new Interpreter(y);
/*

var globalEnv = new Environment();
var util = require("util");

globalEnv.def("print", function(callback, txt){
  console.log(txt);
  callback(false);
});

globalEnv.def("write", function(callback, txt){
  process.stdout.write(txt.toString());
  callback(false);
});

globalEnv.def("HALT", function(k){});

globalEnv.def("wait", function(k, milliseconds){
  setTimeout(function(){
    Execute(k, [ false ]);
  }, milliseconds);
});

globalEnv.def("carbon", function(k, f){
    f(k, function CC(discarded, ret){
        k(ret);
    });
});

/*
print = function(txt) {
  console.log(txt);
};
*/

var settings = {
  input: input,
  ico: yargs.icon,
  build: true,
  name: yargs.output,
  loglevel: 'info'
};

console.log("Generating AST");
var AST = new RParser.Parser(new RParser.TStream(new RParser.CStream(data))).parseKern();
// require('fs').writeFileSync("./ast.json", JSON.stringify(AST));
console.log("Transforming AST");
var CPS = toCPS(AST, function(x){return x});
// require('fs').writeFileSync("./cps.json", JSON.stringify(CPS));
var optC = optimiseAST(CPS)
console.log("Transpiling to JS");
var newc = makeJS(optC);
newc = "Execute(" + newc + ", [function(r){}]);";
newc = require('./jsf.js').predefine(__dirname + "\\" + 'primitives-minified.js', newc);
require('fs').writeFileSync("./out.js", newc);

console.log("Compiling JS via Nexe");
compile(settings).then(() => { console.log("Radine application compiled!") });



// require('fs').writeFileSync("./ast.json", JSON.stringify(optC));
/*
Evaluation.primeEvaluate(globalEnv, function(result){
  console.log("Return:", result);
});
*/
