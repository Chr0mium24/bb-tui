import Table from 'cli-table3';

export interface OutputOptions {
  json?: boolean;
}

export function printTable(headers: string[], rows: (string | number | undefined)[][]): void {
  const table = new Table({ head: headers });
  for (const row of rows) {
    table.push(row.map((c) => (c === undefined ? '-' : String(c))));
  }
  console.log(table.toString());
}

export function printJSON(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function print(data: unknown, headers: string[], rows: (string | number | undefined)[][], opts: OutputOptions): void {
  if (opts.json) {
    printJSON(data);
  } else {
    printTable(headers, rows);
  }
}
