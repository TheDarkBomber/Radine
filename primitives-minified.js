var Stacklen,\u03c0\u03c3;function Execute(b,a){for(;;)try{return Stacklen=200,b.apply(null,a)}catch(c){if(c instanceof Continuation)b=c.f,a=c.args;else throw c;}}function Continuation(b,a){this.f=b;this.args=a}function Shield(b,a){if(0>--Stacklen)throw new Continuation(a,b);}print=function(b,a){console.log(a);b(!1)};write=function(b,a){process.stdout.write(""+a);b(!1)};length=function(b,a){b(a.length)};push=function(b,a,c){c.push(a);b(!1)};\u03b3_continue=function(b,a){a(b,function(a,d){b(d)})};
wait=function(b,a){setTimeout(function(){Execute(b,[!1])},a)};halt=function(b){};input=function(b,a){var c=require("readline").createInterface({input:process.stdin,output:process.stdout});c.question(a.toString(),function(a){Execute(b,[a]);c.close()})};
