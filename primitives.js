var Stacklen;
var πσ;
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

halt = function(k){};

input = function(k, prompt) {
  let rl = require('readline').createInterface({input: process.stdin, output: process.stdout});
  rl.question(prompt.toString(), function(response){
    Execute(k, [ response ]);
    rl.close();
  });
};
