import { format } from 'sql-formatter';

const DIALECT_MAP: Record<string, string> = {
  PostgreSQL: 'postgresql',
  MySQL: 'mysql',
  TransactSQL: 'tsql',
  Sqlite: 'sqlite',
  BigQuery: 'bigquery',
  Snowflake: 'snowflake',
};

export function formatSql(sql: string, database: string): string {
  try {
    return format(sql, {
      language: (DIALECT_MAP[database] ?? 'sql') as any,
      tabWidth: 2,
      keywordCase: 'upper',
      linesBetweenQueries: 2,
    });
  } catch {
    return sql; // return unchanged if formatting fails
  }
}
