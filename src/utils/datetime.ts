import { format } from 'date-fns';

/** dd.MM.yyyy HH:mm у локальному часовому поясі браузера. */
export function formatLocalDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return format(date, 'dd.MM.yyyy HH:mm');
}

/** Значення для `<input type="datetime-local">` у локальному часовому поясі браузера. */
export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
