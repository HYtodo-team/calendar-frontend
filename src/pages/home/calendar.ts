import type { EventSummary } from '../../types/api';

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function localDate(value: string): Date { return new Date(`${value}T12:00:00`); }
export function monthDays(month: string): string[] {
  const first = localDate(`${month}-01`);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0, 12);
  const count = Math.ceil((first.getDay() + last.getDate()) / 7) * 7;
  return Array.from({ length: count }, (_, i) => dateKey(new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay() + i, 12)));
}
export function shiftMonth(month: string, offset: number): string {
  const d = localDate(`${month}-01`);
  return dateKey(new Date(d.getFullYear(), d.getMonth() + offset, 1, 12)).slice(0, 7);
}
export function daysUntil(from: string, to: string): number {
  return Math.round((localDate(to).getTime() - localDate(from).getTime()) / 86400000);
}
export function weekSegments(events: EventSummary[], days: string[]) {
  const occupied: number[] = [];
  return events.filter(e => e.startDate < e.endDate && e.startDate <= days[6] && e.endDate >= days[0])
    .map(event => {
      const start = Math.max(0, days.findIndex(d => d >= event.startDate));
      const end = event.endDate >= days[6] ? 6 : days.findIndex(d => d === event.endDate);
      let lane = 0;
      while (occupied[lane] !== undefined && occupied[lane] >= start) lane++;
      occupied[lane] = end;
      return { event, start, end, lane };
    });
}
export function eventTime(event: EventSummary) {
  return event.isAllDay ? '종일' : `${event.startTime?.slice(0, 5)}–${event.endTime?.slice(0, 5)}`;
}
