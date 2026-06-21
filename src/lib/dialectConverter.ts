import { parser } from '../sql/astHelpers';

const DIALECT_MAP: Record<string, string> = {
  PostgreSQL: 'PostgreSQL',
  MySQL: 'MySQL',
  TransactSQL: 'TransactSQL',
  Sqlite: 'Sqlite',
  BigQuery: 'BigQuery',
  Snowflake: 'Snowflake',
};

export interface ConvertResult {
  sql: string;
  warnings: string[];
}

export function convertDialect(sql: string, fromDialect: string, toDialect: string): ConvertResult {
  const warnings: string[] = [];

  if (fromDialect === toDialect) {
    return { sql, warnings: ['Source and target dialect are the same.'] };
  }

  let ast: any;
  try {
    ast = parser.astify(sql.trim(), { database: DIALECT_MAP[fromDialect] } as any);
  } catch (e: any) {
    return { sql, warnings: [`Could not parse SQL as ${fromDialect}: ${e?.message?.split('\n')[0] ?? 'parse error'}`] };
  }

  try {
    const converted = parser.sqlify(ast, { database: DIALECT_MAP[toDialect] } as any);
    // Dialect-specific warnings
    if (toDialect === 'Sqlite' && (sql.toLowerCase().includes('varchar') || sql.toLowerCase().includes('decimal'))) {
      warnings.push('SQLite uses dynamic typing — VARCHAR/DECIMAL become TEXT/NUMERIC.');
    }
    if (toDialect === 'MySQL' && sql.toLowerCase().includes('ilike')) {
      warnings.push('MySQL has no ILIKE — converted to LIKE (case-insensitive by default in MySQL).');
    }
    if (toDialect === 'BigQuery' && sql.toLowerCase().includes('limit') && !sql.toLowerCase().includes('order')) {
      warnings.push('BigQuery requires ORDER BY before LIMIT in most contexts.');
    }
    return { sql: converted, warnings };
  } catch (e: any) {
    return { sql, warnings: [`Could not convert to ${toDialect}: ${e?.message?.split('\n')[0] ?? 'conversion error'}`] };
  }
}
