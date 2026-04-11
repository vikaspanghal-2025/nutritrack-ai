// Always use America/Los_Angeles (PST/PDT) for "today"
export function todayPST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  // en-CA gives YYYY-MM-DD format
}

export function formatDateLabel(dateStr: string): string {
  const today = todayPST();
  if (dateStr === today) return 'Today';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
