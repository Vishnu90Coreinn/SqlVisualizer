interface ErrorPattern {
  pattern: RegExp;
  explanation: string;
}

const PATTERNS: ErrorPattern[] = [
  {
    pattern: /Expected.*FROM|found.*FROM/i,
    explanation: 'Tip: A SELECT statement needs a FROM clause with at least one table name.',
  },
  {
    pattern: /Expected.*SELECT|missing SELECT/i,
    explanation: 'Tip: A query must start with SELECT (or WITH for CTEs).',
  },
  {
    pattern: /Expected.*ON|JOIN.*ON/i,
    explanation: 'Tip: JOIN clauses need an ON condition, e.g. ON a.id = b.a_id.',
  },
  {
    pattern: /unexpected.*\)/i,
    explanation: 'Tip: Check for unmatched parentheses — every ( needs a closing ).',
  },
  {
    pattern: /unexpected.*\(/i,
    explanation: 'Tip: Unexpected opening parenthesis — check your function call syntax.',
  },
  {
    pattern: /Expected.*,|Expected.*\)/i,
    explanation: 'Tip: You may be missing a comma between columns or function arguments.',
  },
  {
    pattern: /unrecognized.*token|unexpected token/i,
    explanation: 'Tip: There\'s an unrecognised character. Check for typos or unsupported syntax in this dialect.',
  },
  {
    pattern: /Expected.*WHERE/i,
    explanation: 'Tip: The WHERE clause goes after the FROM/JOIN clauses.',
  },
  {
    pattern: /Expected.*GROUP|Expected.*ORDER/i,
    explanation: 'Tip: GROUP BY and ORDER BY go after WHERE (if present). Check your clause order.',
  },
  {
    pattern: /Expected.*AS|alias/i,
    explanation: 'Tip: Column aliases use AS, e.g. SELECT count(*) AS total.',
  },
  {
    pattern: /Expected.*end of input|unexpected end/i,
    explanation: 'Tip: The query seems incomplete — you may be missing a closing keyword or parenthesis.',
  },
];

export function explainError(errorMessage: string): string | null {
  for (const { pattern, explanation } of PATTERNS) {
    if (pattern.test(errorMessage)) return explanation;
  }
  return null;
}
