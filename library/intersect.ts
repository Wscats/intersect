/**
 * Compute the intersection of two arrays using a Set for O(n+m) performance.
 */
export default function intersect<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b);
  return a.filter((x) => setB.has(x));
}