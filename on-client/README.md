# 내 보안 Agent 시작 틀 0.2.11

이 보안 Agent는 회사 직원이 자기 로그인 상태, 업무 앱 접속 결과, 최근 접속 기록과 보안 경보를 보는 보안 앱입니다. 13단계부터 22단계까지 이 프로젝트 하나로 화면을 채워 가며 완성합니다. 처음이라면 docs/GETTING_STARTED_STUDENT.md부터 읽습니다. 무엇을 왜 만드는지와 단계별 순서가 그 문서에 있습니다.

이 시작 틀을 받은 것만으로 단계를 통과하지 않습니다. 단계마다 docs/STUDENT_PROMPTS.md의 안내를 수업용 AI에 붙여 넣어 student/extension.mjs를 고치고, 화면에서 확인하고, 커밋한 뒤 ALEPH에 제출합니다. 제출하면 서버가 그 커밋의 코드를 받아 AI가 단계 과제 기준으로 읽고 판정합니다. 코드를 실행해서 판정하지 않습니다.

## 주요 구성 요소와 역할

- **브라우저 (UI)**: `public/index.html`, `public/app.js`, `student/extension.mjs`. 직원이 사용하는 웹 화면이며 학생 확장 함수(`renderIdentity`부터 `renderVulnerabilities`까지 8개 함수)를 통해 신원·기기·세션, 업무 앱 접속 판정, 보안 기록, 알림, AI 연결, 설명, 조치, 취약점 정보를 표시합니다.
- **앱 서버**: `src/server.mjs`. 로컬 HTTP 서버로 `ON_PORT`가 없으면 기본 포트 `5189`(`http://127.0.0.1:5189`)에서 실행되며 정적 파일 서빙 및 클라이언트와 백엔드 API 간의 중계를 담당합니다.
- **기존 접속·XDR 서버 (SDP 엔진)**: `src/engine/sdp-host.mjs`, `src/actions/sdp-action-engine.mjs`. 사용자 접속 판정(허용·거부·추가 확인), XDR 보안 경보 저장, 조치 집행의 원천 시스템입니다.
- **CLCO 수업용 AI 게이트웨이**: `src/ai/service.mjs`, `vendor/clco-http.mjs`. AI 연결 점검 및 사건 설명 요청을 중계하며, AI 공급사 원본 키를 안전하게 관리합니다.

## 켜기

`package.json`의 `engines.node`는 정확히 `24.19.0`을 지정합니다. 실행 도구 및 문제 해결 안내는 Node.js 22~24 범위를 안내합니다. `docs/NEW_ENVIRONMENT_RUN_LOG.md`에 기록된 환경은 `v24.20.0`으로, 22~24 범위에는 들지만 package.json의 지정 버전과 정확히 같지는 않습니다. 이 기록은 `24.19.0` 환경에서 실행했다는 증거가 아닙니다. 프로젝트에 외부 npm 의존성은 없습니다.

이 폴더의 PowerShell에서 아래를 실행하고 PC 브라우저로 http://127.0.0.1:5189 를 엽니다. 자세한 켜기·끄기·다시 켜기는 docs/STUDENT_LAUNCH_GUIDE.md에 있습니다.

    powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1

`npm start`도 같은 서버를 켭니다. 기본 실행은 실제 회사 시스템(기존 엔진)에 연결되지 않은 상태입니다. `npm run demo`는 **예제 자료**로 화면을 보여 줄 뿐이며 실제 연결이나 성취가 아닙니다. `npm run check`는 `student/extension.mjs`의 문법만 확인합니다.

## 새 환경 실행 기록과 기준 버전

- 학생이 작성한 새 환경 절차와 관찰 기록은 [docs/NEW_ENVIRONMENT_RUN_LOG.md](docs/NEW_ENVIRONMENT_RUN_LOG.md)에 있습니다. 그 기록의 로컬 demo 결과는 예제 자료이며 실서버 연결 결과가 아닙니다. 실제 SDP/XDR·AI 연결과 19단계 실행은 확인 불가(UNV)로 구분합니다.
- 학생 설명서와 설치·실행·백업·복원 계획은 [docs/STUDENT_GUIDE.md](docs/STUDENT_GUIDE.md)를 참고합니다.
- `docs/FINAL_PRODUCT_GUIDE.md`는 기준 명세의 시작 틀을 `0.2.9`로 표기하지만, 현재 프로젝트 `package.json` 버전은 `0.2.11`입니다. 번호가 다르며, 현재 프로젝트가 0.2.9의 모든 명세와 일치한다고 이 README가 별도로 인증하는 것은 아닙니다.
- 새 환경 기록은 `v0.9-verification`(검증 중)입니다. 19단계 실제 실행 연결과 22단계 동일한 최종 소스의 누적 재현·공식 접수 및 수용을 확인하기 전에는 `v1.0`으로 표시하지 않습니다.

## 지킬 것

- 기존 1~3차 프로젝트와 학생 파일은 지우거나 덮어쓰지 않습니다. 새 폴더에서 시작하거나, 이미 하던 프로젝트를 이어 씁니다.
- AI 열쇠·비밀번호·토큰을 코드, 커밋, 캡처, 도움정보에 넣지 않습니다. 주소나 열쇠를 직접 입력하는 칸도 만들지 않습니다.
- `.env.example`에는 비밀 없는 설정만 있습니다.

## 더 읽을 곳

- 단계별 안내와 AI에 붙여 넣을 문장: `docs/STUDENT_PROMPTS.md`
- 단계별 확인 항목: `docs/CURRICULUM.json`, `docs/IMPLEMENTATION_CONTRACT.md`
- 오류 코드별 해결: `docs/CONNECTION_TROUBLESHOOT.md`
- 시작 틀 업데이트(내 파일 보존): `docs/STARTER_UPDATE.md`
- 실제 회사 시스템(SDP)·앱 안 AI 연결은 담당자가 따로 안내할 때만 씁니다: `docs/SDP_HOST_CONNECTION.md`, `docs/AI_SETUP_GUIDE.md`. 이 연결은 앱을 처음 켜고 13~16단계 화면을 만들거나 공식 AI 코드 판정을 받기 위한 전제 조건은 아닙니다. 다만 17단계 이후의 실제 연결과 새 환경 재현은 해당 단계의 기준에 따라 따로 확인합니다.
