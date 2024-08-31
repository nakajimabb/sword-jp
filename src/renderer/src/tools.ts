export const str = (val: unknown) => (val ? String(val) : '');

export const zeroPadding = (num: number, len: number) => {
  return String(num).padStart(len, '0');
};

export function hebrewOrGreek(str: string) {
  const hebrewRegex = /[\u0590-\u05FF]/;
  const greekRegex = /[\u0370-\u03FF\u1F00-\u1FFF]/;

  const containsHebrew = hebrewRegex.test(str);
  const containsGreek = greekRegex.test(str);

  if (containsHebrew && containsGreek) {
    return 'he grc';
  } else if (containsHebrew) {
    return 'he';
  } else if (containsGreek) {
    return 'grc';
  } else {
    return '';
  }
}
