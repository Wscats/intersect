/**
 * Read the 3M dataset line by line from a text file.
 * @returns Array of strings, one per line.
 */
import * as fs from 'fs';
import * as readline from 'readline';

export default function readSmallData(): Promise<string[]> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: fs.createReadStream('./database/data-3M.txt'),
      crlfDelay: Infinity,
    });
    const lines: string[] = [];
    rl.on('line', (line: string) => {
      lines.push(line);
    });
    rl.on('close', () => {
      resolve(lines);
    });
  });
}
