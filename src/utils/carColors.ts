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

const CAR_COLOR_VARIANTS = buildColorVariants();

function buildColorVariants(): string[] {
  const variants = COMMON_CAR_COLORS_UA.flatMap((color) => {
    if (color.includes('-')) return [color];
    if (color === 'Чорний' || color === 'Білий') return [color];
    return [color, `Темно-${color}`, `Світло-${color}`];
  });

  return variants.filter((color, index, allColors) => allColors.indexOf(color) === index);
}

function matchesColorQuery(color: string, normalizedQuery: string, matchMode: 'starts' | 'contains'): boolean {
  const normalizedColor = color.toLocaleLowerCase('uk-UA');
  return matchMode === 'starts'
    ? normalizedColor.startsWith(normalizedQuery)
    : normalizedColor.includes(normalizedQuery);
}

export async function searchCarColorsUa(query: string): Promise<string[]> {
  const normalizedQuery = query.trim().toLocaleLowerCase('uk-UA');
  if (normalizedQuery.length < 2) return [];

  const startsWithQuery = CAR_COLOR_VARIANTS.filter((color) =>
    matchesColorQuery(color, normalizedQuery, 'starts')
  );

  const containsQuery = CAR_COLOR_VARIANTS.filter(
    (color) =>
      !startsWithQuery.includes(color) && matchesColorQuery(color, normalizedQuery, 'contains')
  );

  return [...startsWithQuery, ...containsQuery].slice(0, 12);
}
