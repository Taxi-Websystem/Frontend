const COMMON_CAR_COLORS_UA = [
  'Чорний',
  'Білий',
  'Сірий',
  'Синій',
  'Блакитний',
  'Червоний',
  'Бордовий',
  'Зелений',
  'Жовтий',
  'Помаранчевий',
  'Коричневий',
  'Бежевий',
  'Золотистий',
  'Фіолетовий',
  'Рожевий',
  'Пурпуровий',
  'Чорно-Білий',
  'Біло-Чорний'
];

function buildColorVariants(): string[] {
  const variants = COMMON_CAR_COLORS_UA.flatMap((color) => {
    if (color.includes('-')) return [color];
    if (color === 'Чорний' || color === 'Білий') return [color];
    return [color, `Темно-${color}`, `Світло-${color}`];
  });

  return variants.filter((color, index, arr) => arr.indexOf(color) === index);
}

export async function searchCarColorsUa(query: string): Promise<string[]> {
  const trimmed = query.trim().toLocaleLowerCase('uk-UA');
  if (trimmed.length < 2) return [];

  const allColors = buildColorVariants();

  const starts = allColors.filter((color) =>
    color.toLocaleLowerCase('uk-UA').startsWith(trimmed)
  );

  const contains = allColors.filter(
    (color) =>
      !starts.includes(color) && color.toLocaleLowerCase('uk-UA').includes(trimmed)
  );

  return [...starts, ...contains].slice(0, 12);
}
