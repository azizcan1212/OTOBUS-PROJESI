export function formatDateTime(value: string, locale = 'tr-TR') {
  return new Date(value).toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatHourRange(hourFrom: number | null, hourTo: number | null) {
  if (hourFrom === null || hourTo === null) {
    return 'Tum saatler';
  }

  return `${String(hourFrom).padStart(2, '0')}:00 - ${String(hourTo).padStart(2, '0')}:00`;
}
