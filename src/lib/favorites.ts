/** Max dresses a bride can save for an appointment prep session. */
export const MAX_FAVORITES = 10;

export function sortFavoritesByTitle<T extends { title: string }>(items: T[]): T[] {
  return [...items].sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
  );
}
