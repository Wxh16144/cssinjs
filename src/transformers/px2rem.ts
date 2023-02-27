/**
 * respect https://github.com/cuth/postcss-pxtorem
 */
import unitless from '@emotion/unitless';
import type { CSSObject } from '..';
import type { Transformer } from './interface';

interface Options {
  /**
   * The root font size.
   * @default 16
   */
  rootValue?: number;
  /**
   * The decimal numbers to allow the REM units to grow to.
   * @default 5
   */
  precision?: number;
  /**
   * The minimum pixel value to replace.
   * @default 0
   */
  minPixelValue?: number;
  /**
   * Whether to allow px to be converted in media queries.
   * @default false
   */
  mediaQuery?: boolean;
}

const pxRegex = /url\([^)]+\)|var\([^)]+\)|(\d*\.?\d+)px/g;

function toFixed(number: number, precision: number) {
  const multiplier = Math.pow(10, precision + 1),
    wholeNumber = Math.floor(number * multiplier);
  return (Math.round(wholeNumber / 10) * 10) / multiplier;
}

function createPxReplace(rootValue: number, precision: number, addUnitForZero = false) {
  return (m: string, $1: any) => {
    if (!$1) return m;
    const pixels = parseFloat($1);
    const fixedVal = toFixed(pixels / rootValue, precision);
    if (!addUnitForZero && fixedVal === 0) return '0';
    return fixedVal + 'rem';
  };
}

const transform = (options: Options = {}): Transformer => {
  const {
    rootValue = 16,
    precision = 5,
    mediaQuery = false,
  } = options;

  const pxReplace = createPxReplace(rootValue, precision);
  const pxReplaceZero = createPxReplace(rootValue, precision, true);

  const visit = (cssObj: CSSObject): CSSObject => {
    const clone: CSSObject = { ...cssObj };

    Object.entries(cssObj).forEach(([key, value]) => {
      if (typeof value === 'string' && value.includes('px')) {
        const mergedValue = value.trim();
        let newValue = ''

        if (mergedValue.startsWith('calc')) {
          newValue = value.replace(pxRegex, pxReplaceZero);
        } else {
          newValue = value.replace(pxRegex, pxReplace);
        }

        clone[key] = newValue;
      }

      // no unit
      if (!unitless[key] && typeof value === 'number' && value !== 0) {
        clone[key] = `${value}px`.replace(pxRegex, pxReplace);
      }

      // Media queries
      const mergedKey = key.trim();
      if (mergedKey.startsWith('@') && mergedKey.includes('px') && mediaQuery) {
        const newKey = key.replace(pxRegex, pxReplace);

        clone[newKey] = clone[key];
        delete clone[key];
      }
    });

    return clone;
  };

  return { visit };
};

export default transform;
