export const isEnabled = (
  feature: string | string[],
  features: string[]
): boolean => {
  if (features.length === 0) {
    return false;
  }
  const array = Array.isArray(feature) ? feature : [feature];
  return array.every((x) => features.includes(x));
};
