const backgroundColors: string[] = [
  'bg-flexoki-light-ui dark:bg-flexoki-dark-ui',
  'text-flexoki-dark-tx dark:text-flexoki-light-tx bg-flexoki-light-re dark:bg-flexoki-dark-re',
  'text-flexoki-dark-tx dark:text-flexoki-light-tx bg-flexoki-light-or dark:bg-flexoki-dark-or',
  'text-flexoki-dark-tx dark:text-flexoki-light-tx bg-flexoki-light-ye dark:bg-flexoki-dark-ye',
  'text-flexoki-dark-tx dark:text-flexoki-light-tx bg-flexoki-light-gr dark:bg-flexoki-dark-gr',
  'text-flexoki-dark-tx dark:text-flexoki-light-tx bg-flexoki-light-cy dark:bg-flexoki-dark-cy',
  'text-flexoki-dark-tx dark:text-flexoki-light-tx bg-flexoki-light-bl dark:bg-flexoki-dark-bl',
  'text-flexoki-dark-tx dark:text-flexoki-light-tx bg-flexoki-light-pu dark:bg-flexoki-dark-pu',
  'text-flexoki-dark-tx dark:text-flexoki-light-tx bg-flexoki-light-ma dark:bg-flexoki-dark-ma',
];

export const getBackgroundColorByKey = (key: string) => {
  const hash = Array.from(key).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % backgroundColors.length;
  return backgroundColors[index];
};

const categoryBackgroundColors: { [key: string]: string } = {
  crypto: backgroundColors[3]!,
  web: backgroundColors[6]!,
  pwn: backgroundColors[1]!,
  bin: backgroundColors[1]!,
  rev: backgroundColors[7]!,
  forensics: backgroundColors[4]!,
  misc: backgroundColors[2]!,
};

export const getBackgroundColorByCategory = (category: string) => {
  const categoryLowerCased = category.toLowerCase();
  const matchedKey = Object.keys(categoryBackgroundColors).find((key) =>
    categoryLowerCased.includes(key)
  );

  return matchedKey
    ? categoryBackgroundColors[matchedKey]
    : backgroundColors[2];
};
