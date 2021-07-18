// Reference: https://github.com/lodash/lodash/blob/master/sampleSize.js

/**
 * Gets `n` random elements at unique keys from `array` up to the
 * size of `array`.
 *
 * @since 4.0.0
 * @category Array
 * @param {Array} array The array to sample.
 * @param {number} [n=1] The number of elements to sample.
 * @returns {Array} Returns the random elements.
 * @example
 *
 * sampleSize([1, 2, 3], 2)
 * // => [3, 1]
 *
 * sampleSize([1, 2, 3], 4)
 * // => [2, 3, 1]
 */
export const sampleSize = <T extends unknown>(array: T[], n: number = array.length): T[] => {
  const length = array.length;

  if (length <= 1) {
    return array;
  }

  const count = n > length ? length : n;
  let index = -1;
  const lastIndex = length - 1;
  const result = [...array];
  while (++index < count) {
    const rand = index + Math.floor(Math.random() * (lastIndex - index + 1));
    const value = result[rand];
    result[rand] = result[index];
    result[index] = value;
  }
  return result.slice(0, count);
};
