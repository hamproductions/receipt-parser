import { parse } from 'csv-parse/browser/esm/sync';
import { Table } from './ui/table';

export function CSVTable({ csv }: { csv: string }) {
  const [header, ...body] = parse(csv) as string[][];

  return (
    <Table.Root size="sm">
      <Table.Head>
        <Table.Row>
          {header.map((h, idx) => (
            <Table.Header key={idx}>{h}</Table.Header>
          ))}
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {body.map((row, idx) => {
          return (
            <Table.Row key={idx}>
              {row.map((h, idx) => (
                <Table.Cell key={idx}>{h}</Table.Cell>
              ))}
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
