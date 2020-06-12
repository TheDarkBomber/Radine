var Stacklen;
var πσ;
var π_PSTACK = [];
var π_PINVOC = 1000;
function Execute(f, args) {
  while (true) try {
      Stacklen = 200;
      return f.apply(null, args);
  } catch(ex) {
      if (ex instanceof Continuation)
          f = ex.f, args = ex.args;
      else {
        console.log(`RUNTIME ERROR\nCode: ${ex.name}\nMessage: ${ex.message}\n`);
        process.exit(1);
      };
  }
}

function Continuation(f, args) {
  this.f = f;
  this.args = args;
}

function Shield(args, f) {
  if (--Stacklen < 0) throw new Continuation(f, args);
}

function GotoPStack(f) {
  f(function π_GOTO(r){
    π_PSTACK.pop()(r);
  });
}

function χ_Parallel(π_Pk, πf) {
  var πn = 0, πresult = [], πi = 0;
  πf(function(){ if (πi == 0) π_Pk(false) }, χ_doParallel);
  function χ_doParallel(π_PK, π_CH){
    πn++;
    if (π_PINVOC <= 0) {
      setTimeout(function(){
        πn--;
        Execute(pcall, [ π_PK, π_CH ]);
      }, 5);
    } else {
      π_PINVOC--;
      var index = πi++;
      π_CH(function(chunk){
        π_PINVOC++;
        πn--;
        πresult[index] = chunk;
        if (πn == 0) Execute(π_Pk, [ πresult ]);
      });
      π_PK(false);
    }
  };
}

print = function(k, txt) {
  console.log(txt);
  k(false);
};

write = function(k, txt) {
  process.stdout.write(`${txt}`);
  k(false);
};

length = function(k, list) {
  k(list.length);
};

push = function(k, pr, pe) {
  pe.push(pr);
  k(false);
};

// This primitive will be discontinued by next official release.
γ_continue = function(k, f) {
  f(k, function CC(σ, ret){
    k(ret);
  });
};

wait = function(k, t) {
  setTimeout(function(){
    Execute(k, [ false ]);
  }, t);
};

exception = function(k, msg, code = "Program-thrown") {
  var err = new Error(msg);
  err.name = code;
  throw err;
  k(false);
};

halt = function(k){};

input = function(k, prompt) {
  let rl = require('readline').createInterface({input: process.stdin, output: process.stdout});
  rl.question(prompt.toString(), function(response){
    rl.close();
    Execute(k, [ response ]);
  });
};
