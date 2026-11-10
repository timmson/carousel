/** Возвращает значение query-параметра из URL. */
export function getQueryParam(name: string): string {
  if (typeof location === 'undefined') return '';
  const params = new URLSearchParams(location.search);
  return params.get(name) ?? '';
}
