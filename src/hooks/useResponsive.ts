import {
  responsiveScreenWidth,
  responsiveScreenHeight,
  responsiveScreenFontSize,
} from 'react-native-responsive-dimensions';

const parsePercent = (value: string | number): number =>
  typeof value === 'string' ? parseFloat(value) : value;

/** Width percentage helper, e.g. wp('4%') */
export const wp = (percentage: string | number): number =>
  responsiveScreenWidth(parsePercent(percentage));

/** Height percentage helper, e.g. hp('2%') */
export const hp = (percentage: string | number): number =>
  responsiveScreenHeight(parsePercent(percentage));

/** Standard horizontal screen padding used across layouts. */
export const screenPadding = wp(4);

/** Responsive font scale helper based on screen width. */
export function rf(size: number): number {
  return responsiveScreenFontSize(size);
}
