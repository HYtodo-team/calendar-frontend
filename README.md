# calendar-frontend

하이엔드 미니프로젝트팀 HyTodo의 프론트엔드 저장소입니다.

## Tech Stack

- React
- TypeScript

## Getting Started

```powershell
npm install
npm run dev
```

The dev server runs at:

```text
http://127.0.0.1:5173/
```

## Environment Variables

Create `.env` from `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

## Scripts

```powershell
npm run dev
npm run typecheck
npm run build
npm run lint
npm run preview
```

## 인증 화면 (2026-09-18)

| 주소 | 화면 |
| --- | --- |
| `/login` | 이메일 로그인, 로그인 상태 유지, 게스트 진입 |
| `/signup` | 이메일·닉네임·비밀번호 회원가입 |
| `/forgot-password` | 비밀번호 재설정 메일 요청 |
| `/reset-password?token=...` | 메일 링크를 통한 새 비밀번호 설정 |
| `/` | 로그인 후 계정 확인 및 로그아웃용 기본 화면 |

프론트 폼과 API 호출은 구현되어 있습니다. 백엔드에는 가입·로그인 API가 있으며, 실제 로그인 흐름 검증에는 `/users/me`와 브라우저 접속 설정도 필요합니다. 기본 API 주소는 `http://localhost:8080/api/v1`입니다. `.env`에는 `/api/v1`을 제외한 서버 주소를 지정하세요.

‘로그인 상태 유지’를 선택하면 토큰을 `localStorage`, 해제하면 `sessionStorage`에 보관합니다. 비밀번호는 저장하지 않습니다. 새로고침 시 `/users/me`로 사용자 정보를 다시 확인하고, 토큰 만료 및 보호 API의 401 응답 시 로그아웃합니다. 유지 옵션도 명세의 2시간 유효기간을 연장하지 않습니다. 게스트는 현재 실행 중인 앱에서 기본 화면만 이용하며 계정 데이터 API를 호출하지 않습니다.

신규 비밀번호 검증은 명세의 권장 정책인 영문·숫자 포함 8~72자로 적용했습니다. 비밀번호 재설정 API의 본문 필드는 명세에 없어서 `{ email }`, `{ token, password }`로 연결한 상태이며 서버와 확정해야 합니다. 연동 계약과 수정할 파일은 [인증 구현 및 서버 연동 안내](docs/auth-integration-2026-09-18.md)에 정리했습니다. `docs/`는 현재 `.gitignore`에 포함되어 있습니다.

검증 명령은 다음과 같습니다. `npm test`는 현재 Node.js 24.14.1 환경에서 확인했습니다.

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

## 백엔드 응답 규약 반영 · 2026-11-07

사용자 결정에 따라 백엔드 규약을 우선한다. 확인한 소스는 백엔드 `develop`의 `global/response/ApiResponse.java`, `global/exception/ErrorResponse.java`, `domain/user/controller/AuthController.java`다.

- 본문 있는 성공 응답은 `{ success: true, data: ... }`다. `src/api/axios.ts`의 응답 interceptor가 `src/api/response.ts`로 포장을 한 번 해제한다. 각 API 함수에서 읽는 `response.data`는 실제 DTO 또는 배열이다.
- 삭제 성공 204는 본문 없이 처리한다. 객체, 배열, 빈 배열, null payload를 지원하며 포장 구조가 잘못된 성공 응답은 오류로 처리한다.
- 서버 필드 오류는 `{ field, message }`다. 공통 처리에서 화면 내부의 `{ field, reason }`으로 변환해 기존 입력칸 오류·포커스 처리를 사용한다. 실패 응답은 성공 payload처럼 해제하지 않는다.
- 원본 API XLSX `04_JSON_예시!D6`, `D13`의 직접 응답·reason 규칙보다 이 사용자 결정을 우선한다. 원본 명세 파일은 보존한다.

## 백엔드 없이 브라우저 테스트하기

처음 저장소를 받은 뒤 프로젝트 폴더에서 `npm ci`로 의존성을 설치한다. Windows에서는 설치된 Microsoft Edge를 사용한다. macOS와 Linux에서는 최초 한 번 `npx playwright install --with-deps chromium`을 실행한다.

```sh
npm run test:browser
```

테스트가 전용 로컬 서버를 열고 인증 API, 로그인 유지, 입력 오류, 홈, 시간표 시나리오를 순서대로 실행한다. 각 시나리오는 모의 API를 사용한다. 실패하면 해당 시나리오에서 멈추고 오류를 출력하며, 실행한 서버는 종료한다. 단위 테스트는 `npm test`로 실행한다.

시간표 항목 수정 시 장소·메모·색상을 지우면 빈 문자열을 전송한다. 서버는 이를 삭제로 처리하며, null은 기존 값을 유지한다. 장소는 255자까지 입력할 수 있고 시간은 초 단위까지 보존한다. 묶음과 항목의 브라우저 흐름을 모의 API로 검증했으며, 실제 서버·DB 연동은 후속 확인 대상이다.

## 로컬 백엔드와 연결하기

백엔드 실행 후 다음 명령으로 프론트를 시작한다.

```sh
npm run dev:backend
```

이 모드에서는 브라우저가 프론트 주소의 `/api/v1`로 요청하고, Vite가 `http://localhost:8080/api/v1`로 전달한다. Authorization 헤더와 요청 본문도 전달한다. 개발 중 서로 다른 포트로 인한 브라우저 CORS 문제를 피할 수 있다.

백엔드 주소를 바꾸려면 Git에서 제외되는 `.env.backend.local`에 `BACKEND_PROXY_TARGET=http://localhost:다른포트`를 설정한다. 환경 파일 변경 후 개발 서버를 재시작한다. 터미널에 이미 설정된 `VITE_API_BASE_URL`은 환경 파일보다 우선하므로 이 모드를 사용할 때 해제한다.

프록시는 Vite 개발 서버에서만 동작한다. 배포 빌드는 기존 `VITE_API_BASE_URL` 설정을 사용하며, 배포 환경의 API 주소와 CORS 또는 리버스 프록시 설정은 별도로 검증한다.

연동 확인 순서는 회원가입 → 로그인 → 새로고침 후 로그인 유지 → 시간표 저장·재조회 → 독립 투두 완료 → 월간 조회다. 개발자 도구 Network에서 로그인 후 `/api/v1/users/me`의 성공 여부를 확인한다. 이 API가 서버에 준비되어야 홈 진입과 세션 복원을 검증할 수 있다. 날짜 상세·일정 CRUD·메모·대시보드는 해당 API 준비 후 검증한다.
