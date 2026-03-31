/**
 * Intersect - Main entry point.
 * Reads the 3M dataset, then processes the 60M dataset to find intersections.
 */
import readSmallData from './library/data-3M';
import processLargeData from './library/data-60M';

(async (): Promise<void> => {
  const smallData = await readSmallData();
  const result = await processLargeData(smallData);
  console.log(result);
})();