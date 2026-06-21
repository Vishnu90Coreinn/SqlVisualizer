import type { DDLParseResult } from '../sql/ddlParser';

export type TableDiffKind = 'added' | 'removed' | 'modified' | 'unchanged';

export interface ColumnDiff {
  name: string;
  kind: 'added' | 'removed' | 'modified' | 'unchanged';
  before?: string; // data type before
  after?: string;  // data type after
}

export interface TableDiff {
  tableName: string;
  kind: TableDiffKind;
  columnDiffs: ColumnDiff[];
}

export interface SchemaDiffResult {
  tableDiffs: TableDiff[];
  hasChanges: boolean;
}

export function diffSchemas(before: DDLParseResult, after: DDLParseResult): SchemaDiffResult {
  const tableDiffs: TableDiff[] = [];

  const beforeTables = before.tables;
  const afterTables = after.tables;
  const allKeys = new Set([...beforeTables.keys(), ...afterTables.keys()]);

  for (const key of allKeys) {
    const bTable = beforeTables.get(key);
    const aTable = afterTables.get(key);

    if (!bTable && aTable) {
      // Added table
      tableDiffs.push({
        tableName: aTable.name,
        kind: 'added',
        columnDiffs: aTable.columns.map((c) => ({ name: c.name, kind: 'added', after: c.dataType })),
      });
    } else if (bTable && !aTable) {
      // Removed table
      tableDiffs.push({
        tableName: bTable.name,
        kind: 'removed',
        columnDiffs: bTable.columns.map((c) => ({ name: c.name, kind: 'removed', before: c.dataType })),
      });
    } else if (bTable && aTable) {
      // Compare columns
      const columnDiffs: ColumnDiff[] = [];
      const bCols = new Map(bTable.columns.map((c) => [c.name.toLowerCase(), c]));
      const aCols = new Map(aTable.columns.map((c) => [c.name.toLowerCase(), c]));
      const allCols = new Set([...bCols.keys(), ...aCols.keys()]);

      for (const colKey of allCols) {
        const bCol = bCols.get(colKey);
        const aCol = aCols.get(colKey);
        if (!bCol && aCol) {
          columnDiffs.push({ name: aCol.name, kind: 'added', after: aCol.dataType });
        } else if (bCol && !aCol) {
          columnDiffs.push({ name: bCol.name, kind: 'removed', before: bCol.dataType });
        } else if (bCol && aCol) {
          const changed = bCol.dataType !== aCol.dataType ||
            bCol.isPrimaryKey !== aCol.isPrimaryKey ||
            bCol.isNotNull !== aCol.isNotNull ||
            bCol.isUnique !== aCol.isUnique;
          columnDiffs.push({
            name: aCol.name,
            kind: changed ? 'modified' : 'unchanged',
            before: bCol.dataType,
            after: aCol.dataType,
          });
        }
      }

      const tableKind: TableDiffKind = columnDiffs.some((c) => c.kind !== 'unchanged')
        ? 'modified'
        : 'unchanged';

      tableDiffs.push({ tableName: aTable.name, kind: tableKind, columnDiffs });
    }
  }

  return {
    tableDiffs,
    hasChanges: tableDiffs.some((t) => t.kind !== 'unchanged'),
  };
}
