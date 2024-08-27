export const str = (val: unknown) => (val ? String(val) : '');

export const zeroPadding = (num: number, len: number) => {
  return String(num).padStart(len, '0');
};
