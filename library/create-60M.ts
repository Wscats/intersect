/**
 * Generate a 60M random number dataset and write to a text file.
 * Uses stream backpressure handling for efficient writing.
 */
import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_PATH = path.resolve(__dirname, '../database/data-60M.txt');
const TOTAL_LINES = 600000;
const MAX_VALUE = 60000000;

const writer = fs.createWriteStream(OUTPUT_PATH, { highWaterMark: 1 });

/** Write random numbers to the output file using stream backpressure. */
function writeSixtyMillionTimes(writer: fs.WriteStream): void {
  let remaining = TOTAL_LINES;

  const write = (): void => {
    let ok = true;
    do {
      remaining--;
      const data = Buffer.from(`${Math.floor(Math.random() * MAX_VALUE)}\n`);
      if (remaining === 0) {
        writer.write(data);
      } else {
        ok = writer.write(data);
      }
    } while (remaining > 0 && ok);

    if (remaining > 0) {
      writer.once('drain', write);
    }
  };

  write();
}

writeSixtyMillionTimes(writer);