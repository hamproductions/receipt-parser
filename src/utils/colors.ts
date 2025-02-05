import { padStart } from 'lodash-es';

export const splitRGBW = (color: string) => {
  return [
    parseInt(color.slice(0, 2), 16),
    parseInt(color.slice(2, 4), 16),
    parseInt(color.slice(4, 6), 16),
    parseInt(color.slice(6, 8), 16)
  ];
};

export const colorsToHex = (colorStr: string) => {
  const colors = splitRGBW(colorStr);
  const [r, g, b] = colors;
  // const r = Math.min(255, colors[0] + colors[3]);
  // const g = Math.min(255, colors[1] + colors[3]);
  // const b = Math.min(255, colors[2] + colors[3]);
  return `#${padStart(r.toString(16), 2, '0')}${padStart(g.toString(16), 2, '0')}${padStart(
    b.toString(16),
    2,
    '0'
  )}`;
};
