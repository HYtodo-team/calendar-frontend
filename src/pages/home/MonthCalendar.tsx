import type { EventSummary } from '../../types/api';
import { eventTime, weekSegments } from './calendar';
export default function MonthCalendar({ days, month, today, selected, events, onDate, onEvent }: {
  days: string[]; month: string; today: string; selected: string; events: EventSummary[];
  onDate: (date: string) => void; onEvent: (id: number) => void;
}) {
  return <><div className="p-weekdays">{['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d}>{d}</div>)}</div>
    <div className="p-month">{Array.from({ length: days.length / 7 }, (_, w) => {
      const week = days.slice(w * 7, w * 7 + 7);
      const segments = weekSegments(events, week);
      const lanes = Math.max(0, ...segments.map(s => s.lane + 1));
      return <div className="p-week" key={week[0]}>{week.map(date => {
        const items = events.filter(e => e.startDate === date && e.endDate === date);
        return <div className={`p-day ${date.slice(0, 7) !== month ? 'other' : ''} ${selected === date ? 'selected' : ''}`} key={date}>
          <button className={`p-date ${date === today ? 'today' : ''}`} aria-label={`${date}${date === today ? ' 오늘' : ''}`} aria-pressed={date === selected} onClick={() => onDate(date)}>{Number(date.slice(-2))}</button>
          <div className="p-day-events" style={{ paddingTop: lanes * 27 + 8 }}>{items.slice(0, 3).map(e => <button className={`p-event ${e.isImportant ? 'important' : ''}`} key={e.id} onClick={() => onEvent(e.id)} title={`${eventTime(e)} ${e.title}`}>{e.isImportant ? '★ ' : '• '}{e.isAllDay ? '종일' : e.startTime?.slice(0, 5)} {e.title}</button>)}
            {items.length > 3 && <button className="p-more" onClick={() => onDate(date)}>+{items.length - 3} 더 보기</button>}
          </div><button className="p-cell-target" tabIndex={-1} aria-label={`${date} 상세 보기`} onClick={() => onDate(date)} /></div>;
      })}<div className="p-bars">{segments.map(({ event, start, end, lane }) => <button key={event.id} className={`p-bar ${event.isImportant ? 'important' : ''}`} style={{ gridColumn: `${start + 1} / ${end + 2}`, gridRow: lane + 1, borderRadius: `${event.startDate >= week[0] ? 6 : 0}px ${event.endDate <= week[6] ? 6 : 0}px ${event.endDate <= week[6] ? 6 : 0}px ${event.startDate >= week[0] ? 6 : 0}px` }} title={`${event.title} · ${event.startDate}–${event.endDate}`} onClick={() => onEvent(event.id)}>{event.isImportant && '★ '}{event.title}</button>)}</div></div>;
    })}</div></>;
}
