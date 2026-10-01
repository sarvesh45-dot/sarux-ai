export interface CalculatorParams {
  expression: string;
}

export interface CalculatorResult {
  success: boolean;
  expression: string;
  result?: number;
  formatted?: string;
  error?: string;
}

type TokenType = 'NUMBER' | 'OP' | 'LPAREN' | 'RPAREN' | 'FUNC' | 'COMMA';

interface Token {
  type: TokenType;
  value: string;
}

const SUPPORTED_FUNCTIONS: Record<string, (...args: number[]) => number> = {
  sqrt: (x: number) => {
    if (x < 0) throw new Error('Square root of negative number is undefined in real numbers');
    return Math.sqrt(x);
  },
  cbrt: (x: number) => Math.cbrt(x),
  sin: (x: number) => Math.sin(x),
  cos: (x: number) => Math.cos(x),
  tan: (x: number) => Math.tan(x),
  abs: (x: number) => Math.abs(x),
  round: (x: number) => Math.round(x),
  floor: (x: number) => Math.floor(x),
  ceil: (x: number) => Math.ceil(x),
  log: (x: number) => {
    if (x <= 0) throw new Error('Logarithm of non-positive number is undefined');
    return Math.log10(x);
  },
  ln: (x: number) => {
    if (x <= 0) throw new Error('Natural logarithm of non-positive number is undefined');
    return Math.log(x);
  },
  pow: (x: number, y: number) => Math.pow(x, y),
};

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
};

/**
 * Tokenizes a mathematical expression safely without using eval.
 */
function tokenize(rawExpr: string): Token[] {
  let expr = rawExpr
    .replace(/\s+/g, ' ')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\^/g, '**')
    .trim();

  // Handle phrases like "X% of Y" -> "(X / 100) * Y"
  expr = expr.replace(/(\d+(?:\.\d+)?)\s*%\s*(?:of|\*)\s*(\d+(?:\.\d+)?)/gi, '($1 / 100) * $2');

  // Handle trailing percentages like "25%" -> "(25 / 100)"
  expr = expr.replace(/(\d+(?:\.\d+)?)\s*%/g, '($1 / 100)');

  // Handle words like "squared" -> "** 2", "cubed" -> "** 3"
  expr = expr.replace(/\bsquared\b/gi, '** 2');
  expr = expr.replace(/\bcubed\b/gi, '** 3');

  const tokens: Token[] = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Number (integer, float, or scientific notation e.g. 1e5)
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(expr[i + 1] || ''))) {
      let numStr = '';
      while (i < expr.length && /[0-9.]/.test(expr[i])) {
        numStr += expr[i];
        i++;
      }
      if (i < expr.length && (expr[i] === 'e' || expr[i] === 'E') && /[0-9+-]/.test(expr[i + 1] || '')) {
        numStr += expr[i];
        i++;
        if (expr[i] === '+' || expr[i] === '-') {
          numStr += expr[i];
          i++;
        }
        while (i < expr.length && /[0-9]/.test(expr[i])) {
          numStr += expr[i];
          i++;
        }
      }
      tokens.push({ type: 'NUMBER', value: numStr });
      continue;
    }

    // Identifiers (functions or constants)
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = '';
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
        ident += expr[i];
        i++;
      }
      const lower = ident.toLowerCase();

      if (CONSTANTS[lower] !== undefined) {
        tokens.push({ type: 'NUMBER', value: String(CONSTANTS[lower]) });
      } else if (SUPPORTED_FUNCTIONS[lower] !== undefined) {
        tokens.push({ type: 'FUNC', value: lower });
      } else {
        throw new Error(`Unsupported identifier or variable: "${ident}". Only safe math operations are permitted.`);
      }
      continue;
    }

    // Two-character operators (** for power)
    if (ch === '*' && expr[i + 1] === '*') {
      tokens.push({ type: 'OP', value: '**' });
      i += 2;
      continue;
    }

    // Single-character operators
    if ('+-*/%'.includes(ch)) {
      tokens.push({ type: 'OP', value: ch });
      i++;
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    if (ch === ',') {
      tokens.push({ type: 'COMMA', value: ',' });
      i++;
      continue;
    }

    throw new Error(`Invalid or dangerous character in mathematical expression: "${ch}"`);
  }

  return tokens;
}

/**
 * Recursive descent parser evaluating token stream safely.
 */
class ExpressionParser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  parse(): number {
    if (this.tokens.length === 0) {
      throw new Error('Empty expression');
    }
    const result = this.parseExpression();
    if (this.pos < this.tokens.length) {
      throw new Error(`Unexpected token at end of expression: "${this.peek()?.value}"`);
    }
    return result;
  }

  // expr = term (( '+' | '-' ) term)*
  private parseExpression(): number {
    let value = this.parseTerm();

    while (this.pos < this.tokens.length) {
      const token = this.peek();
      if (!token || token.type !== 'OP' || (token.value !== '+' && token.value !== '-')) {
        break;
      }
      this.consume();
      const nextTerm = this.parseTerm();
      if (token.value === '+') {
        value += nextTerm;
      } else {
        value -= nextTerm;
      }
    }

    return value;
  }

  // term = power (( '*' | '/' | '%' ) power)*
  private parseTerm(): number {
    let value = this.parsePower();

    while (this.pos < this.tokens.length) {
      const token = this.peek();
      if (!token || token.type !== 'OP' || (token.value !== '*' && token.value !== '/' && token.value !== '%')) {
        break;
      }
      this.consume();
      const nextFactor = this.parsePower();
      if (token.value === '*') {
        value *= nextFactor;
      } else if (token.value === '/') {
        if (nextFactor === 0) {
          throw new Error('Division by zero');
        }
        value /= nextFactor;
      } else if (token.value === '%') {
        if (nextFactor === 0) {
          throw new Error('Modulo by zero');
        }
        value %= nextFactor;
      }
    }

    return value;
  }

  // power = unary ( '**' power )? (right-associative)
  private parsePower(): number {
    let base = this.parseUnary();

    if (this.pos < this.tokens.length) {
      const token = this.peek();
      if (token && token.type === 'OP' && token.value === '**') {
        this.consume();
        const exponent = this.parsePower();
        base = Math.pow(base, exponent);
      }
    }

    return base;
  }

  // unary = ('+' | '-')? factor
  private parseUnary(): number {
    const token = this.peek();
    if (token && token.type === 'OP' && (token.value === '+' || token.value === '-')) {
      this.consume();
      const factor = this.parseUnary();
      return token.value === '-' ? -factor : factor;
    }
    return this.parseFactor();
  }

  // factor = NUMBER | LPAREN expr RPAREN | FUNC LPAREN argList RPAREN
  private parseFactor(): number {
    const token = this.peek();
    if (!token) {
      throw new Error('Unexpected end of mathematical expression');
    }

    if (token.type === 'NUMBER') {
      this.consume();
      const val = parseFloat(token.value);
      if (Number.isNaN(val)) {
        throw new Error(`Invalid number: "${token.value}"`);
      }
      return val;
    }

    if (token.type === 'FUNC') {
      this.consume();
      const funcName = token.value;
      const fn = SUPPORTED_FUNCTIONS[funcName];
      if (!fn) {
        throw new Error(`Unknown function: "${funcName}"`);
      }

      const lparen = this.peek();
      if (!lparen || lparen.type !== 'LPAREN') {
        throw new Error(`Expected "(" after function "${funcName}"`);
      }
      this.consume();

      const args: number[] = [];
      if (this.peek()?.type !== 'RPAREN') {
        while (true) {
          args.push(this.parseExpression());
          const next = this.peek();
          if (next && next.type === 'COMMA') {
            this.consume();
          } else {
            break;
          }
        }
      }

      const rparen = this.peek();
      if (!rparen || rparen.type !== 'RPAREN') {
        throw new Error(`Expected ")" to close function call "${funcName}"`);
      }
      this.consume();

      return fn(...args);
    }

    if (token.type === 'LPAREN') {
      this.consume();
      const val = this.parseExpression();
      const rparen = this.peek();
      if (!rparen || rparen.type !== 'RPAREN') {
        throw new Error('Mismatched parentheses: missing closing ")"');
      }
      this.consume();
      return val;
    }

    throw new Error(`Unexpected token in calculation: "${token.value}"`);
  }
}

/**
 * Safely computes arithmetic or scientific expression without eval().
 */
export function calculate(params: CalculatorParams): CalculatorResult {
  if (!params || typeof params.expression !== 'string' || !params.expression.trim()) {
    return {
      success: false,
      expression: '',
      error: 'Please provide a mathematical expression to calculate.',
    };
  }

  const raw = params.expression.trim();

  try {
    const tokens = tokenize(raw);
    const parser = new ExpressionParser(tokens);
    const rawResult = parser.parse();

    // Round small floating-point artifacts like 0.1 + 0.2 = 0.30000000000000004
    const result = Math.abs(rawResult - Math.round(rawResult)) < 1e-12
      ? Math.round(rawResult)
      : parseFloat(rawResult.toFixed(8));

    return {
      success: true,
      expression: raw,
      result,
      formatted: `${raw} = ${result}`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      expression: raw,
      error: message,
    };
  }
}
