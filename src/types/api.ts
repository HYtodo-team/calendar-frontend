export type IsoDate = string;
export type IsoTime = string;

export interface FieldError {
  field: string;
  reason: string;
}

export interface ApiError {
  status: number | null;
  errorCode: string;
  message: string;
  fieldErrors: FieldError[];
  timestamp: string | null;
  originalError: unknown;
}

export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// 재설정 API의 경로는 명세에 있으며 본문 필드는 서버와 합의할 연동 계약이다.
export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface UserResponse {
  id: number;
  email: string;
  nickname: string;
  createdAt: string;
}

export interface TodoResponse {
  id: number;
  content: string;
  isCompleted: boolean;
  event: { id: number; title: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface TodoCreateRequest {
  content: string;
  eventId?: number | null;
}

export interface TodoUpdateRequest {
  content?: string;
  eventId?: number | null;
}

export interface EventSummary {
  id: number;
  title: string;
  startDate: IsoDate;
  endDate: IsoDate;
  startTime: IsoTime | null;
  endTime: IsoTime | null;
  isAllDay: boolean;
  isImportant: boolean;
}

export interface MonthlyEventSummary extends EventSummary {
  location: string | null;
}

export interface EventDetailResponse extends MonthlyEventSummary {
  memo: string | null;
  todos: TodoResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface EventCreateRequest {
  title: string;
  startDate: IsoDate;
  endDate: IsoDate;
  isAllDay: boolean;
  startTime?: IsoTime | null;
  endTime?: IsoTime | null;
  location?: string | null;
  memo?: string | null;
  isImportant: boolean;
}

export type EventUpdateRequest = Partial<EventCreateRequest>;

export interface DailyNoteResponse {
  id: number | null;
  noteDate: IsoDate;
  content: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface TimetableResponse {
  id: number;
  title: string;
  semester: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimetableRequest {
  title?: string;
  semester?: string;
}

export interface TimetableEntryResponse {
  id: number;
  dayOfWeek: number;
  startTime: IsoTime;
  endTime: IsoTime;
  title: string;
  location: string | null;
  memo: string | null;
  color: string | null;
}

export interface TimetableDetailResponse extends TimetableResponse {
  entries: TimetableEntryResponse[];
}

export interface TimetableEntryRequest {
  dayOfWeek: number;
  startTime: IsoTime;
  endTime: IsoTime;
  title: string;
  location?: string | null;
  memo?: string | null;
  color?: string | null;
}

export type TimetableEntryUpdateRequest = Partial<TimetableEntryRequest>;

export interface CalendarDateResponse {
  date: IsoDate;
  events: EventSummary[];
  dailyNote: DailyNoteResponse;
}

export interface DashboardSummaryResponse {
  todayEventCount: number;
  incompleteTodoCount: number;
  upcomingEvents: EventSummary[];
}
