/**
 * Process the 60M dataset in chunks, computing intersections with the small dataset.
 * Reads the large file as a stream, processing 600 lines at a time.
 */
import { createReadStream, appendFile } from 'fs';
import * as readline from 'readline';
import intersect from './intersect';

/** Append an intersection result to the output file. */
function writeResult(element: string): void {
  appendFile('./result.txt', `${element}\n`, (err) => {
    if (err) {
      console.log('Write failed');
    }
  });
}

/** Chunk size: number of lines to process per batch. */
const CHUNK_SIZE = 600;

/**
 * Stream-process the 60M dataset, finding intersections with smallData.
 * @param smallData - The smaller dataset to intersect against.
 * @returns Promise that resolves when processing is complete.
 */
export default function processLargeData(smallData: string[]): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: createReadStream('./database/data-60M.txt', {
        highWaterMark: 50,
      }),
      crlfDelay: Infinity,
    });

    let lineCount = 0;
    let rawData: string[] = [];

    rl.on('line', (line: string) => {
      rawData.push(line);
      console.log(line, rawData.length);
      lineCount++;

      if (lineCount === CHUNK_SIZE) {
        console.log('Read count:', lineCount);
        console.log('Extracted data:', rawData);

        rl.pause();

        const intersectResult = intersect(rawData, smallData);
        intersectResult.forEach((element) => writeResult(element));

        setTimeout(() => {
          rawData = [];
          lineCount = 0;
          rl.resume();
        }, 0);
      }
    });

    rl.on('close', () => {
      resolve('Done');
    });
  });
}
