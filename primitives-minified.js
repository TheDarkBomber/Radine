var Stacklen,\u03c0\u03c3,\u03c0_PSTACK=[],\u03c0_PINVOC=1E3;function Execute(a,b){for(;;)try{return Stacklen=200,a.apply(null,b)}catch(c){c instanceof Continuation?(a=c.f,b=c.args):(console.log("RUNTIME ERROR\nCode: "+c.name+"\nMessage: "+c.message+"\n"),process.exit(1))}}function Continuation(a,b){this.f=a;this.args=b}function Shield(a,b){if(0>--Stacklen)throw new Continuation(b,a);}function GotoPStack(a){a(function(a){\u03c0_PSTACK.pop()(a)})}
function \u03c7_Parallel(a,b){var c=0,d=[],e=0;b(function(){0==e&&a(!1)},function(b,f){c++;if(0>=\u03c0_PINVOC)setTimeout(function(){c--;Execute(pcall,[b,f])},5);else{\u03c0_PINVOC--;var g=e++;f(function(b){\u03c0_PINVOC++;c--;d[g]=b;0==c&&Execute(a,[d])});b(!1)}})}print=function(a,b){console.log(b);a(!1)};write=function(a,b){process.stdout.write(""+b);a(!1)};length=function(a,b){a(b.length)};push=function(a,b,c){c.push(b);a(!1)};\u03b3_continue=function(a,b){b(a,function(b,d){a(d)})};
wait=function(a,b){setTimeout(function(){Execute(a,[!1])},b)};exception=function(a,b,c){a=Error(b);a.name=void 0===c?"Program-thrown":c;throw a;};halt=function(a){};input=function(a,b){var c=require("readline").createInterface({input:process.stdin,output:process.stdout});c.question(b.toString(),function(b){c.close();Execute(a,[b])})};
