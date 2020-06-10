var pthis;
var tthis;

class CStream {
  constructor(input) {
    this.input = input;
    this.pos = 0;
    this.line = 1;
    this.col = 0;
  }

  next() {
    var ch = this.input.charAt(this.pos++);
    if (ch == "\n") this.line++, this.col = 0; else this.col++;
    // console.log(ch);
    return ch;
  }

  peek() {
      return this.input.charAt(this.pos);
  }

  peekNext() {
    return this.input.charAt(this.pos + 1);
  }

  eof() {
      return this.peek() == "";
  }

  exeunt(msg) {
      throw new Error("SYNTAX ERROR\n" + msg + " (" + this.line + ":" + this.col + ")");
  }
}

class TStream {
  constructor(input) {
    this.input = input;
    this.current = null;
    this.kw = " if then else function f true false local RAW arguments low indifferent high map declare ";
    this.αn = " root log match ";
    tthis = this;
  }

  readNext() {
    tthis.readWhilst(tthis.whitespace);
    if(tthis.input.eof()) return null;
    var ch = tthis.input.peek();
    if (ch == "/" && tthis.input.peekNext() == "/") {
      tthis.skip();
      return tthis.readNext();
    }
    if(ch == '"') return tthis.readStr();
    if(ch == "|" && tthis.input.peekNext() !== "|") return tthis.readRegex();
    if(tthis.digit(ch)) return tthis.readNum();
    if(tthis.pIdent(ch)) return tthis.readIdent();
    if(tthis.punctuation(ch)) return {
      type: "punctuation",
      value: tthis.input.next()
    };
    if(tthis.op(ch)) return {
      type: "operator",
      value: tthis.readWhilst(tthis.op)
    };
    tthis.input.exeunt("Unexpected character: " + ch);
  }

  keyw(x) {
    return tthis.kw.indexOf(" " + x + " ") >= 0;
  }

  alphaOp(x) {
    return tthis.αn.indexOf(" " + x + " ") >= 0;
  }

  digit(c) {
    return /[0-9]/i.test(c);
  }

  pIdent(c) {
    return /[_a-z]/i.test(c);
  }

  ident(c) {
    return /[_a-z0-9-<>=~#@]/i.test(c);
  }

  regexFlag(c) {
    return "gimsuy".indexOf(c) >= 0;
  }

  op(c) {
    return "+-*/%=&|<>!?^".indexOf(c) >= 0;
  }

  punctuation(c) {
     return ".,:;(){}[]@$#".indexOf(c) >= 0;
  }

  whitespace(c) {
    return " \t\n\r".indexOf(c) >= 0;
  }

  readWhilst(predicate) {
    var s = "";
    while (!tthis.input.eof() && predicate(tthis.input.peek())) s += tthis.input.next();
    return s;
  }

  readNum() {
    var dPoint= false;
    var num = tthis.readWhilst(function(ch) {
      if(ch == ".") {
        if (dPoint) return false;
        dPoint = true;
        return true;
      }
      return tthis.digit(ch);
    });
    return {
      type: "numerical",
      value: parseFloat(num)
    };
  }

  readIdent() {
    var id = tthis.readWhilst(tthis.ident);
    return {
        type: tthis.keyw(id) ? "keyword" : tthis.alphaOp(id) ? "operator" : "variable",
        value: id
    };
  }

  readSKP(end) {
    var SKPd = false;
    var s = "";
    tthis.input.next();
    while(!tthis.input.eof()) {
      var ch = tthis.input.next();
      if (SKPd) {
        s += ch;
        SKPd = false;
      } else if (ch == "\\") {
        SKPd = true;
      } else if (ch == end) {
        break;
      } else {
        s += ch;
      }
    }
    return s;
  }

  readStr() {
    return {
      type: "string",
      value: tthis.readSKP('"')
    };
  }

  readRegex() {
    var rx = tthis.readSKP("|");
    var flags = tthis.readWhilst(tthis.regexFlag);
    return {
      type: "regex",
      value: [rx, flags]
    };
  }

  skip() {
    tthis.readWhilst(function(ch){
      return ch != "\n";
    });
    tthis.input.next();
  }

  peek() {
    return tthis.current || (tthis.current = tthis.readNext());
  }

  next() {
    var t = tthis.current;
    tthis.current = null;
    return t || tthis.readNext();
  }

  eof() {
    return tthis.peek() == null;
  }

  exeunt(msg) {
      tthis.input.exeunt(msg);
  }
}

class Parser {
  constructor(input) {
    this.input = input;
    this.False = { type: "boolean", value: false };
    this.Precedence = {
      "=": 1, "=>": 1,
      "||": 2,
      "&&": 3,
      "match": 4,
      "<=>": 6, "<?": 6, ">?": 6,
      "<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "!=": 7,
      "+": 10, "-": 10,
      "*": 20, "/": 20, "%": 20,
      "^": 30, "root": 30, "log": 30
    };
    pthis = this;
  }

  parseKern() {
    var block = [];
    while(!pthis.input.eof()) {
      block.push(pthis.parseExpression());
      if(!pthis.input.eof()) pthis.skipPunctuation(";");
    }
    return {
      type: "block",
      block: block
    };
  }

  delimited(start, stop, separator, parser) {
    var a = [];
    var first = true;
    pthis.skipPunctuation(start);
    while(!pthis.input.eof()) {
      if (pthis.punctuation(stop)) break;
      if (first) first = false; else pthis.skipPunctuation(separator);
      if (pthis.punctuation(stop)) break;
      a.push(parser());
    }
    pthis.skipPunctuation(stop);
    return a;
  }

  parseBlock() {
    var block = pthis.delimited("{", "}", ";", pthis.parseExpression);
    if(block.length == 0) return pthis.False;
    if(block.length == 1) return block[0];
    return {
      type: "block",
      block: block
    };
  }

  parseAtom() {
    return pthis.expectCall(function(){
      if(pthis.punctuation("(")) {
        pthis.input.next();
        var exp = pthis.parseExpression();
        pthis.skipPunctuation(")");
        return exp;
      }
      if(pthis.op("!")) {
        pthis.input.next();
        return {
          type: "negate",
          body: pthis.parseExpression()
        };
      }
      if(pthis.keyword("arguments")) {
        pthis.input.next();
        return {
          type: "array",
          value: true
        };
      }
      if(pthis.punctuation("[")) return pthis.parseArray();
      if(pthis.punctuation("{")) return pthis.parseBlock();
      if(pthis.punctuation(".")) return pthis.parseSpread();
      if(pthis.keyword("if")) return pthis.parseIf();
      if(pthis.keyword("true") || pthis.keyword("false")) return pthis.parseBoolean();
      if(pthis.keyword("low") || pthis.keyword("indifferent") || pthis.keyword("high")) return pthis.parseTrilean();
      if(pthis.keyword("map")) return pthis.parseMap();
      if(pthis.keyword("local")) return pthis.parseLocal();
      if(pthis.keyword("declare")) return pthis.parseDeclare();
      if(pthis.keyword("function") || pthis.keyword("f")) {
        pthis.input.next();
        return pthis.parseFunction();
      }
      if(pthis.keyword("RAW")) return pthis.parseRAW();
      if(pthis.punctuation("@")) return pthis.parseSLE("@");
      if(pthis.punctuation("$")) return pthis.parseSLE("$");
      if(pthis.punctuation("#")) return pthis.parseSLE("#");
      var t = pthis.input.next();
      if(t.type == "variable" || t.type == "numerical" || t.type == "string" || t.type == "regex") return t;
      pthis.unexpected();
    });
  }

  parseExpression() {
    return pthis.expectCall(function(){
      return pthis.expectBin(pthis.parseAtom(), 0);
    });
  }

  expectCall(expr) {
    expr = expr();
    return pthis.punctuation("(") ? pthis.parseCall(expr) : pthis.punctuation("[") ? pthis.parseIndex(expr) : pthis.punctuation(".") ? pthis.parseDot(expr) : expr;
  }

  parseCall(method) {
    return {
      type: "call",
      method: method,
      args: pthis.delimited("(", ")", ",", pthis.parseExpression)
    };
  }

  parseIndex(list) {
    var dx;
    pthis.skipPunctuation("[");
    dx = pthis.parseExpression();
    pthis.skipPunctuation("]");
    return {
      type: "index",
      list: list,
      index: dx
    };
  }

  parseDot(expr) {
    var dx;
    pthis.skipPunctuation(".");
    dx = pthis.input.next();
    if (dx.type !== "variable") pthis.input.exeunt("Unexpected " + dx.type);
    dx.type = "string";
    return {
      type: "index",
      list: expr,
      index: dx
    };
  }

  parseArray() {
    return {
      type: "array",
      value: pthis.delimited("[", "]", ",", pthis.parseExpression)
    };
  }

  decideAssignment(opSymbol) {
    if (opSymbol.charAt(0) === "=" && opSymbol.charAt(1) !== "=") return true;
    else return false;
  }

  expectBin(left, prec) {
    var t = pthis.op();
    if(t) {
      var oPrec = pthis.Precedence[t.value];
      if(oPrec > prec) {
        pthis.input.next();
        var right = pthis.expectBin(pthis.parseAtom(), oPrec);
        var binary = {
          type: pthis.decideAssignment(t.value) ? "assign" : "binary",
          operator: t.value,
          left: left,
          right: right
        };
        return pthis.expectBin(binary, prec);
      }
    }
    return left;
  }

  punctuation(c) {
    var t = pthis.input.peek();
    return t && t.type == "punctuation" && (!c || t.value == c) && t;
  }

  keyword(c) {
    var t = pthis.input.peek();
    return t && t.type == "keyword" && (!c || t.value == c) && t;
  }

  op(c) {
    var t = pthis.input.peek();
    return t && t.type == "operator" && (!c || t.value == c) && t;
  }

  skipPunctuation(c) {
    if(pthis.punctuation(c)) pthis.input.next();
    else pthis.input.exeunt("Expected punctuation: " + c);
  }

  skipKeyword(c) {
    if(pthis.keyword(c)) pthis.input.next();
    else pthis.input.exeunt("Expected keyword: " + c);
  }

  resKeyword(c) {
    var x = false;
    for(var i = 0; i <= c.length; i++) {
      if(pthis.keyword(c[i])) {
        x = true;
        break;
      }
    }
    if(x) pthis.input.next();
    else pthis.input.exeunt("Expected a keyword from: " + c.toString());
  }

  skipOp(c) {
    if(pthis.op(c)) pthis.input.next();
    else pthis.input.exeunt("Expected operator: " + c);
  }

  unexpected() {
    pthis.input.exeunt("Unexpected token: " + JSON.stringify(pthis.input.peek()));
  }

  parseVarnym() {
    var name = pthis.input.next();
    if(name.type != "variable") pthis.input.exeunt("Expected variable name");
    return name.value;
  }

  parseSpread() {
    pthis.input.next();
    pthis.skipPunctuation(".");
    pthis.skipPunctuation(".");
    return {
      type: "spread",
      value: pthis.parseExpression()
    };
  }

  parseIf() {
    pthis.skipKeyword("if");
    var cond = pthis.parseExpression();
    if(!pthis.punctuation("{")) pthis.skipKeyword("then");
    var then = pthis.parseExpression();
    var retina = {
      type: "if",
      cond: cond,
      then: then
    };
    if(pthis.keyword("else")) {
      pthis.input.next();
      retina.else = pthis.parseExpression();
    }
    return retina;
  }

  parseFunction() {
    var noArgs = false;
    if (pthis.punctuation(":")) {
      noArgs = true;
      pthis.skipPunctuation(":");
    }
    return {
      type: "function",
      name: pthis.input.peek().type == "variable" && !noArgs ? pthis.input.next().value : null,
      vars: !noArgs ? pthis.delimited("(", ")", ",", pthis.parseVarnym) : [],
      body: pthis.parseExpression()
    };
  }

  parseVardef() {
    var name = pthis.parseVarnym(), def;
    if(pthis.op("=")) {
      pthis.input.next();
      def = pthis.parseExpression();
    } else if(pthis.op("=>")) {
      pthis.input.next();
      def = {
        type: "function",
        vars: [],
        body: pthis.parseExpression()
      };
    }
    return { name: name, def: def || pthis.False };
  }

  parseMap() {
    pthis.skipKeyword("map");
    return {
      type: "map",
      vars: pthis.delimited("{", "}", ",", pthis.parseVardef)
    };
  }

  parseLocal() {
    pthis.skipKeyword("local");
    if(pthis.input.peek().type == "variable") {
      var name = pthis.input.next().value;
      var defs = pthis.delimited("(", ")", ",", pthis.parseVardef);
      return {
        type: "call",
        method: {
          type: "function",
          name: name,
          vars: defs.map(function(def){ return def.name }),
          body: pthis.parseExpression()
        },
        args: defs.map(function(def){ return def.def || pthis.False })
      };
    }
    return {
      type: "local",
      vars: pthis.delimited("(", ")", ",", pthis.parseVardef),
      body: pthis.parseExpression()
    };
  }

  parseBoolean() {
    return {
      type: "boolean",
      value: pthis.input.next().value == "true"
    };
  }

  parseTrilean() {
    var t = pthis.input.next().value;
    return {
      type: "trilean",
      value: t === "low" ? -1 : t === "high" ? 1 : 0
    };
  }

  parseSLE(tag) {
    pthis.skipPunctuation(tag);
    var core =  {
      type: "sle",
      tag: tag
    };
    var arg = pthis.parseExpression();
    return {
      type: "call",
      method: core,
      args: [ arg ]
    }
  }

  parseDeclare() {
    pthis.skipKeyword("declare");
    var items;
    var itemsF = [];
    if (pthis.punctuation(":")) {
      pthis.skipPunctuation(":");
      items = [ pthis.parseVarnym() ];
    } else items = pthis.delimited("[", "]", ",", pthis.parseVarnym);
    items.forEach(e => {
      itemsF.push({
        type: "assign",
        operator: "=",
        left: {
          type: "variable",
          value: e
        },
        right: pthis.False
      });
    });
    return {
      type: "block",
      block: itemsF
    };
  }

  parseRAW() {
    pthis.skipKeyword("RAW");
    if (pthis.input.peek().type != "string") pthis.input.exeunt("RAW only accepts raw strings as input");
    return {
      type: "raw",
      code: pthis.input.next().value
    };
  }
}

module.exports = {
  CStream: CStream,
  TStream: TStream,
  Parser: Parser
}
