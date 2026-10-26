// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.
export function createStudentView() {
  return {
    renderIdentity({ me, devices, sessions } = {}) {
      const root = document.createElement('section');

      const addLine = (text) => {
        const line = document.createElement('p');
        line.textContent = text;
        root.appendChild(line);
      };

      const modeLabels = {
        demo: '예제 자료',
        disconnected: '연결 없음',
        unknown: '확인 불가',
      };
      const addMode = (label, result) => {
        const modeLabel = modeLabels[result?.mode];
        if (modeLabel) addLine(`${label} 동작 모드: ${modeLabel}`);
      };

      if (me?.status === 'loading') {
        addLine('불러오는 중');
      } else if (me?.status === 'error') {
        addLine(`연결 실패: ${me.error?.message || '확인 불가'}`);
      } else if (me?.status === 'ok') {
        const deviceStatusLabels = {
          compliant: '정상',
          noncompliant: '점검 필요',
          unknown: '확인 불가',
        };
        const sessionStatusLabels = {
          active: '사용 중',
          expired: '만료',
          revoked: '취소',
          unknown: '확인 불가',
        };
        const userLabel = me.data?.user?.label ?? '확인 불가';
        const device = me.data?.device;
        const session = me.data?.session;
        const deviceStatusCode = device?.status ?? 'unknown';
        const sessionStatusCode = session?.status ?? 'unknown';

        addLine(`사용자: ${userLabel}`);
        addLine(`기기: ${device?.label ?? '확인 불가'}`);
        addLine(`기기 상태: ${deviceStatusLabels[deviceStatusCode] ?? '확인 불가'} (${deviceStatusCode})`);
        addLine(`세션 상태: ${sessionStatusLabels[sessionStatusCode] ?? '확인 불가'} (${sessionStatusCode})`);
      } else {
        addLine('확인 불가');
      }

      addMode('사용자 정보', me);
      addMode('기기 정보', devices);
      addMode('세션 정보', sessions);

      return root;
    },
    renderDecision({ status, mode, data, error, appId } = {}) {
      const root = document.createElement('section');

      const addLine = (text) => {
        const line = document.createElement('p');
        line.textContent = text;
        root.appendChild(line);
      };

      if (status === 'idle') {
        addLine('앱을 골라 접속을 요청하세요');
      } else if (status === 'loading') {
        addLine('판정 확인 중...');
      } else if (status === 'error') {
        addLine(`요청 실패: ${error?.message || '확인 불가'} (요청/네트워크 실패이며, 서버의 접근 거부(deny) 판정이 아닙니다.)`);
      } else if (status === 'ok') {
        let decisionLabel;
        switch (data?.decision) {
          case 'allow':
            decisionLabel = '허용 (allow)';
            break;
          case 'deny':
            decisionLabel = '거부 (deny)';
            break;
          case 'challenge':
            decisionLabel = '추가 확인 필요 (challenge)';
            break;
          default:
            decisionLabel = '확인 불가 (unknown) — 허용되지 않음 / 판정 불명';
        }

        addLine(`판정: ${decisionLabel}`);
        if (data?.decision === 'challenge') {
          addLine('앱이 추가 확인 절차를 대신하지 않습니다.');
        }
        addLine(`이유: ${data?.reason ?? '확인 불가'}`);
        addLine(`확인 시각: ${data?.checkedAt ?? '확인 불가'}`);
        addLine(`앱 식별자: ${data?.appId ?? appId ?? '확인 불가'}`);
      } else {
        addLine('판정 확인 불가');
      }

      const modeLabel = mode === 'demo'
        ? '예제 자료'
        : mode === 'disconnected'
          ? '연결 없음'
          : mode === 'unknown'
            ? '확인 불가'
            : null;
      if (modeLabel) addLine(`동작 모드: ${modeLabel}`);

      return root;
    },
    renderEvents({ status, mode, data, error } = {}) {
      const root = document.createElement('section');
      const addLine = (parent, text) => {
        const line = document.createElement('p');
        line.textContent = text;
        parent.appendChild(line);
      };

      if (status === 'loading') {
        addLine(root, '기록을 불러오는 중...');
      } else if (status === 'error') {
        addLine(root, `기록을 불러오지 못했습니다: ${error?.message || '확인 불가'}`);
      } else if (status === 'ok') {
        const events = Array.isArray(data) ? [...data] : [];
        if (events.length === 0) {
          addLine(root, '표시할 기록이 없습니다');
        } else {
          events.sort((first, second) => {
            const firstTime = Date.parse(first?.at ?? '');
            const secondTime = Date.parse(second?.at ?? '');
            if (Number.isNaN(firstTime)) return Number.isNaN(secondTime) ? 0 : 1;
            if (Number.isNaN(secondTime)) return -1;
            return secondTime - firstTime;
          });

          const filterBox = document.createElement('div');
          const makeSelect = (label, options) => {
            const select = document.createElement('select');
            select.setAttribute('aria-label', label);
            for (const [value, text] of options) {
              const option = document.createElement('option');
              option.setAttribute('value', value);
              option.textContent = text;
              select.appendChild(option);
            }
            filterBox.appendChild(select);
            return select;
          };

          const kindFilter = makeSelect('기록 종류', [
            ['all', '전체'],
            ['access', '접속'],
            ['xdr', 'XDR 경보'],
          ]);
          const appIds = [...new Set(events
            .map((event) => event?.appId)
            .filter((value) => value !== undefined && value !== null && String(value) !== '')
            .map((value) => String(value)))];
          const appFilter = makeSelect('업무 앱', [
            ['all', '전체'],
            ...appIds.map((id) => [id, id]),
          ]);
          const accessFilter = makeSelect('접속 상태', [
            ['all', '전체'],
            ['allowed', 'allowed'],
            ['denied', 'denied'],
            ['unknown', 'unknown'],
          ]);
          root.appendChild(filterBox);

          const list = document.createElement('div');
          root.appendChild(list);

          const stateLabels = {
            access: {
              allowed: '허용됨',
              denied: '거부됨',
              unknown: '확인 불가',
            },
            session: {
              active: '사용 중',
              expired: '만료',
              revoked: '취소',
              unknown: '확인 불가',
            },
            device: {
              compliant: '정상',
              noncompliant: '점검 필요',
              unknown: '확인 불가',
            },
          };
          const formatState = (group, value) => {
            const code = value ?? 'unknown';
            const label = stateLabels[group]?.[code] ?? '확인 불가';
            return label === '확인 불가' ? `${label}(${code})` : `${label} (${code})`;
          };
          const appendHeading = (parent, text) => {
            const heading = document.createElement('h4');
            heading.textContent = text;
            parent.appendChild(heading);
          };
          const appendDetailList = (parent, title, entries) => {
            appendHeading(parent, title);
            const detailList = document.createElement('ul');
            const items = Array.isArray(entries) ? entries : [];
            if (items.length === 0) {
              const emptyItem = document.createElement('li');
              emptyItem.textContent = '확인 불가';
              detailList.appendChild(emptyItem);
            } else {
              for (const entry of items) {
                const item = document.createElement('li');
                item.textContent = `${entry?.id ?? '확인 불가'}: ${entry?.text ?? '확인 불가'}`;
                detailList.appendChild(item);
              }
            }
            parent.appendChild(detailList);
          };

          const renderList = () => {
            while (list.firstChild) list.removeChild(list.firstChild);
            const visibleEvents = events.filter((event) => {
              const kindMatches = kindFilter.value === 'all' || event?.kind === kindFilter.value;
              const eventAppId = event?.appId === undefined || event?.appId === null ? '' : String(event.appId);
              const appMatches = appFilter.value === 'all' || eventAppId === appFilter.value;
              const accessCode = event?.state?.access ?? 'unknown';
              const accessMatches = accessFilter.value === 'all' || accessCode === accessFilter.value;
              return kindMatches && appMatches && accessMatches;
            });

            if (visibleEvents.length === 0) {
              addLine(list, '선택한 조건에 맞는 기록이 없습니다');
              return;
            }

            for (const event of visibleEvents) {
              const eventId = String(event?.id ?? '확인 불가');
              const row = document.createElement('div');
              row.setAttribute('data-student-event-id', eventId);
              addLine(row, `사건 ID: ${eventId}`);
              addLine(row, `시각: ${event?.at ?? '확인 불가'}`);
              const kindLabel = event?.kind === 'access'
                ? '접속'
                : event?.kind === 'xdr'
                  ? 'XDR 경보'
                  : event?.kind ?? '확인 불가';
              addLine(row, `종류: ${kindLabel}`);
              addLine(row, `업무 앱: ${event?.appId ?? '확인 불가'}`);
              addLine(row, `요약: ${event?.summary ?? '확인 불가'}`);

              const detailButton = document.createElement('button');
              detailButton.setAttribute('type', 'button');
              detailButton.setAttribute('aria-label', `${eventId} 상세`);
              detailButton.textContent = '상세';
              row.appendChild(detailButton);

              const detailBox = document.createElement('div');
              detailBox.setAttribute('data-student-event-detail', eventId);
              detailBox.setAttribute('hidden', '');
              addLine(detailBox, `사건 ID: ${eventId}`);
              addLine(detailBox, `업무 앱: ${event?.appId ?? '확인 불가'}`);
              appendDetailList(detailBox, '근거', event?.evidence);
              appendDetailList(detailBox, '규칙', event?.rules);
              appendHeading(detailBox, '상태');
              addLine(detailBox, `접속: ${formatState('access', event?.state?.access)}`);
              addLine(detailBox, `세션: ${formatState('session', event?.state?.session)}`);
              addLine(detailBox, `기기: ${formatState('device', event?.state?.device)}`);
              const supportedActions = Array.isArray(event?.supportedActions) ? event.supportedActions : [];
              if (supportedActions.length > 0) {
                appendHeading(detailBox, '미지원 조치');
                for (const action of supportedActions) {
                  const actionRow = document.createElement('div');
                  const actionButton = document.createElement('button');
                  actionButton.setAttribute('type', 'button');
                  actionButton.disabled = true;
                  actionButton.textContent = `${String(action)} 미지원`;
                  actionRow.appendChild(actionButton);
                  const actionNotice = document.createElement('span');
                  actionNotice.textContent = '조치 실행 연결은 준비 중입니다. 아직 지원하지 않는 조치입니다.';
                  actionRow.appendChild(actionNotice);
                  detailBox.appendChild(actionRow);
                }
              }
              row.appendChild(detailBox);

              detailButton.addEventListener('click', () => {
                if (detailBox.hasAttribute('hidden')) {
                  detailBox.removeAttribute('hidden');
                } else {
                  detailBox.setAttribute('hidden', '');
                }
              });
              list.appendChild(row);
            }
          };

          kindFilter.addEventListener('change', renderList);
          appFilter.addEventListener('change', renderList);
          accessFilter.addEventListener('change', renderList);
          renderList();
        }
      } else {
        addLine(root, '기록을 확인할 수 없습니다');
      }

      const modeLabel = mode === 'demo'
        ? '예제 자료'
        : mode === 'disconnected'
          ? '연결 없음'
          : mode === 'unknown'
            ? '확인 불가'
            : null;
      if (modeLabel) addLine(root, `동작 모드: ${modeLabel}`);

      return root;
    },
    renderStatus({ devices, sessions, notifications, diagnostics, mode } = {}) {
      const root = document.createElement('section');
      const addLine = (parent, text) => {
        const line = document.createElement('p');
        line.textContent = text;
        parent.appendChild(line);
      };
      const addHeading = (parent, text) => {
        const heading = document.createElement('h3');
        heading.textContent = text;
        parent.appendChild(heading);
      };
      const displayValue = (value) => {
        if (value === undefined || value === null || value === '') return '확인 불가';
        return String(value);
      };
      const getItems = (result, key) => {
        if (Array.isArray(result?.data)) return result.data;
        if (Array.isArray(result?.data?.[key])) return result.data[key];
        return [];
      };
      const statusLabels = {
        device: {
          compliant: '정상',
          noncompliant: '점검 필요',
          unknown: '확인 불가',
        },
        session: {
          active: '사용 중',
          expired: '만료',
          revoked: '취소',
          unknown: '확인 불가',
        },
      };
      const formatStatus = (group, value) => {
        const code = value ?? 'unknown';
        const label = statusLabels[group][code] ?? '확인 불가';
        return `${label} (${code})`;
      };
      const retryInstruction = '다시 시도는 위쪽 다시 불러오기 버튼을 직접 누르세요. 자동으로 다시 요청하지 않습니다.';
      const hasTimedOut = (result) => ['TIMEOUT', 'REQUEST_TIMEOUT', 'ENGINE_TIMEOUT'].includes(result?.error?.code)
        || /timeout|timed out|시간(?:이 )?초과/i.test(String(result?.error?.message ?? ''));
      const timeoutNote = (result) => hasTimedOut(result)
        && !/시간(?:이 )?초과/i.test(String(result?.error?.message ?? ''))
        ? ' (시간 초과)'
        : '';
      const renderCollection = ({ result, heading, key, itemLabel, emptyMessage, errorPrefix, idKey, stateGroup }) => {
        const container = document.createElement('div');
        addHeading(container, heading);

        if (result?.status === 'loading') {
          addLine(container, '불러오는 중...');
        } else if (result?.status === 'error') {
          const errorMessage = result.error?.message || '확인 불가';
          addLine(container, `${errorPrefix}: ${errorMessage}${timeoutNote(result)}`);
          addLine(container, retryInstruction);
        } else if (result?.status === 'ok') {
          const items = getItems(result, key);
          if (items.length === 0) {
            addLine(container, emptyMessage);
          } else {
            for (const item of items) {
              const identifier = displayValue(item?.[idKey]);
              const rawStatus = item?.status ?? 'unknown';
              const label = stateGroup === 'device'
                ? displayValue(item?.label)
                : identifier;
              addLine(container, `${itemLabel}: ${label} — 상태: ${formatStatus(stateGroup, rawStatus)}`);
            }
          }
        } else {
          addLine(container, `${heading} 정보를 확인할 수 없습니다`);
        }

        root.appendChild(container);
      };

      renderCollection({
        result: devices,
        heading: '기기',
        key: 'devices',
        itemLabel: '기기',
        emptyMessage: '등록된 기기가 없습니다',
        errorPrefix: '기기 정보를 불러오지 못했습니다',
        idKey: 'id',
        stateGroup: 'device',
      });

      const sessionContainer = document.createElement('div');
      addHeading(sessionContainer, '세션');
      addLine(sessionContainer, '세션은 현재 연결 하나만 표시되며 지난 세션 목록이 아닙니다');
      if (sessions?.status === 'loading') {
        addLine(sessionContainer, '불러오는 중...');
      } else if (sessions?.status === 'error') {
        const errorMessage = sessions.error?.message || '확인 불가';
        addLine(sessionContainer, `세션 정보를 불러오지 못했습니다: ${errorMessage}${timeoutNote(sessions)}`);
        addLine(sessionContainer, retryInstruction);
      } else if (sessions?.status === 'ok') {
        const sessionItems = getItems(sessions, 'sessions');
        if (sessionItems.length === 0) {
          addLine(sessionContainer, '현재 연결된 세션이 없습니다');
        } else {
          for (const session of sessionItems) {
            const sessionId = displayValue(session?.id);
            addLine(sessionContainer, `세션 ID: ${sessionId} — 상태: ${formatStatus('session', session?.status ?? 'unknown')}`);
          }
        }
      } else {
        addLine(sessionContainer, '세션 정보를 확인할 수 없습니다');
      }
      root.appendChild(sessionContainer);

      const notificationContainer = document.createElement('div');
      addHeading(notificationContainer, '알림');
      const notificationItems = Array.isArray(notifications)
        ? notifications
        : Array.isArray(notifications?.data)
          ? notifications.data
          : Array.isArray(notifications?.data?.notifications)
            ? notifications.data.notifications
            : [];
      if (notificationItems.length === 0) {
        addLine(notificationContainer, '주의할 알림이 없습니다');
      } else {
        for (const notification of notificationItems) {
          addLine(notificationContainer, `대상 자료: ${displayValue(notification?.resource)}`);
          addLine(notificationContainer, `코드: ${displayValue(notification?.code)}`);
          addLine(notificationContainer, `메시지: ${displayValue(notification?.message)}`);
        }
      }
      root.appendChild(notificationContainer);

      const diagnosticsContainer = document.createElement('div');
      addHeading(diagnosticsContainer, '상태 및 진단 정보');
      if (diagnostics?.status === 'ok') {
        const diagnosticData = diagnostics.data ?? diagnostics;
        const diagnosticFields = [
          ['요청 ID', diagnosticData.requestId],
          ['버전', diagnosticData.version],
          ['확인 시각', diagnosticData.checkedAt],
          ['엔진 모드', diagnosticData.engine?.mode],
          ['구성요소', diagnosticData.component],
          ['엔진 코드', diagnosticData.engine?.code],
        ];
        const safeDiagnosticValue = (value) => {
          if (!['string', 'number', 'boolean'].includes(typeof value)) return '확인 불가';
          const text = String(value);
          const looksSensitive = /(?:bearer\s+\S+|sk-(?:on-|proj-|ant-)?[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]*(?:PRIVATE KEY|CERTIFICATE)-----|(?:api[_ -]?key|authorization|password|token|secret|credential|비밀번호|토큰|열쇠)\s*[:=]\s*\S+|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})/i;
          if (text.length > 200 || /[\u0000-\u001f\u007f]/.test(text) || looksSensitive.test(text)) return '확인 불가';
          return text;
        };
        const safeFields = diagnosticFields.map(([label, value]) => [label, safeDiagnosticValue(value)]);
        const safeDiagnosticText = safeFields.map(([label, value]) => `${label}: ${value}`).join('\n');
        for (const [label, value] of safeFields) {
          addLine(diagnosticsContainer, `${label}: ${value}`);
        }
        addLine(diagnosticsContainer, '도움 요청에 쓰도록 복사하는 정보입니다');
        const copyStatus = document.createElement('p');
        copyStatus.setAttribute('role', 'status');
        copyStatus.setAttribute('aria-live', 'polite');
        diagnosticsContainer.appendChild(copyStatus);
        const copyButton = document.createElement('button');
        copyButton.setAttribute('type', 'button');
        copyButton.setAttribute('aria-label', '도움정보 복사');
        copyButton.textContent = '도움정보 복사';
        copyButton.addEventListener('click', async () => {
          copyButton.disabled = true;
          copyStatus.textContent = '도움정보를 복사하는 중...';
          try {
            if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) throw new Error('CLIPBOARD_UNAVAILABLE');
            await navigator.clipboard.writeText(safeDiagnosticText);
            copyStatus.textContent = '도움정보를 클립보드에 복사했습니다.';
          } catch {
            copyStatus.textContent = '클립보드에 복사하지 못했습니다. 브라우저 권한을 확인한 뒤 다시 누르세요.';
          } finally {
            copyButton.disabled = false;
          }
        });
        diagnosticsContainer.appendChild(copyButton);
      } else if (diagnostics?.status === 'loading') {
        addLine(diagnosticsContainer, '진단 정보를 불러오는 중...');
      } else if (diagnostics?.status === 'error') {
        addLine(diagnosticsContainer, '진단 정보를 불러오지 못했습니다');
      } else {
        addLine(diagnosticsContainer, '진단 정보를 확인할 수 없습니다');
      }
      root.appendChild(diagnosticsContainer);

      const modeLabel = mode === 'demo'
        ? '예제 자료'
        : mode === 'disconnected'
          ? '연결 없음'
          : mode === 'unknown'
            ? '확인 불가'
            : null;
      if (modeLabel) addLine(root, `동작 모드: ${modeLabel}`);

      return root;
    },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection({ status, mode, data, error, checkedAt } = {}) {
      const root = document.createElement('section');
      const addLine = (text) => {
        const line = document.createElement('p');
        line.textContent = text;
        root.appendChild(line);
      };
      const safeDisplay = (value) => {
        if (value === undefined || value === null || value === '') return '확인 불가';
        if (!['string', 'number', 'boolean'].includes(typeof value)) return '확인 불가';
        const text = String(value);
        const containsSensitiveValue = /(?:bearer\s+\S+|-----BEGIN [A-Z ]*(?:PRIVATE KEY|CERTIFICATE)-----|(?:api[_ -]?key|authorization|password|passphrase|access[_ -]?token|refresh[_ -]?token|token|secret|credential|private[_ -]?key|비밀번호|토큰|열쇠)\s*[:=]\s*\S+|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}|sk-(?:on-|proj-|ant-)?[A-Za-z0-9_-]{8,})/i;
        if (text.length > 500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text) || containsSensitiveValue.test(text)) {
          return '민감한 값이 포함될 수 있어 숨겼습니다';
        }
        return text;
      };
      const modeLabels = {
        demo: '예제 자료',
        disconnected: '연결 없음',
        unknown: '확인 불가',
      };
      const errorCategories = {
        ON_AI_PROVISIONING_PENDING: '권한 준비 중: 담당자에게 계정 연결과 앱 권한 확인을 요청하세요.',
        ON_AI_AUTHORIZATION_CHANGED: '권한 준비 중: 담당자에게 계정 연결과 앱 권한 확인을 요청하세요.',
        ON_AI_TRANSPORT_PENDING: '권한 준비 중: 담당자에게 계정 연결과 앱 권한 확인을 요청하세요.',
        WB_CLCO_AUTH_REQUIRED: '인증 및 접근 제한: 계정 연결을 다시 확인하고 담당자에게 문의하세요.',
        WB_CLCO_ACCESS_BLOCKED: '인증 및 접근 제한: 계정 연결을 다시 확인하고 담당자에게 문의하세요.',
        WB_CLCO_INVALID_TOKEN: '인증 및 접근 제한: 계정 연결을 다시 확인하고 담당자에게 문의하세요.',
        WB_CLCO_COHORT_BUDGET_EXHAUSTED: '사용량 및 이용 한도: 반의 AI 사용량과 한도를 담당자에게 확인하세요.',
        WB_CLCO_LIMIT_REACHED: '사용량 및 이용 한도: 반의 AI 사용량과 한도를 담당자에게 확인하세요.',
        WB_CLCO_SESSION_CLOSED: '이용 시간 외: 현재 AI 이용 가능 시간을 확인하세요.',
        WB_CLCO_RATE_LIMITED: '요청 제한: 잠시 후 직접 다시 시도하세요.',
        WB_CLCO_TIMEOUT: '시간 초과: AI 요청 시간이 초과되었습니다. 잠시 후 직접 다시 점검하세요.',
        REQUEST_TIMEOUT: '시간 초과: AI 요청 시간이 초과되었습니다. 잠시 후 직접 다시 점검하세요.',
        AI_REQUEST_UNVERIFIED: '네트워크 오류: AI 연결 또는 서버 응답을 확인하지 못했습니다. 네트워크 상태를 확인한 뒤 잠시 후 직접 다시 점검하세요.',
        NETWORK_ERROR: '네트워크 오류: AI 서버 연결을 확인한 뒤 직접 다시 점검하세요.',
        WB_CLCO_NETWORK_ERROR: '네트워크 오류: AI 서버 연결을 확인한 뒤 직접 다시 점검하세요.',
        WB_CLCO_SERVER_UNAVAILABLE: '네트워크 오류: AI 서버 연결을 확인한 뒤 직접 다시 점검하세요.',
        WB_CLCO_CANCELLED: '점검 취소됨: AI 연결 점검이 취소되었습니다. 이전 결과는 현재 결과가 아닙니다.',
        CANCELLED: '점검 취소됨: AI 연결 점검이 취소되었습니다. 이전 결과는 현재 결과가 아닙니다.',
        REQUEST_CANCELLED: '점검 취소됨: AI 연결 점검이 취소되었습니다. 이전 결과는 현재 결과가 아닙니다.',
        ON_AI_MODEL_LIST_EMPTY: '사용 가능한 모델 없음: 담당자에게 허용 모델 설정을 확인하세요.',
        MODEL_NOT_CONFIGURED: '사용 가능한 모델 없음: 담당자에게 허용 모델 설정을 확인하세요.',
      };

      if (status === 'idle') {
        addLine('AI 연결 점검 전');
        addLine('설정값 존재는 이용 권한 확인이 아닙니다.');
      } else if (status === 'loading') {
        addLine('AI 연결 점검 중...');
      } else if (status === 'ok') {
        const authorization = data?.audienceAuthorization;
        const authorizationLabel = authorization === 'test'
          ? '시험 연결 점검(test)'
          : authorization === 'verified'
            ? '앱 권한 확인 후 점검(verified)'
            : '확인 불가';
        const modelCount = Number.isFinite(data?.modelCount) && data.modelCount >= 0
          ? String(data.modelCount)
          : safeDisplay(data?.modelCount);
        addLine(authorizationLabel);
        addLine(`확인된 모델 수: ${modelCount}개`);
        addLine(`점검 시각: ${safeDisplay(checkedAt ?? data?.checkedAt)}`);
        addLine('사건 설명은 아직 실행하지 않았습니다. 모델 목록 응답은 실제 사건 설명의 성공이 아닙니다.');
        addLine('자동으로 다시 점검하지 않습니다. 다시 점검은 사용자가 버튼을 직접 눌러야 합니다.');
      } else if (status === 'error') {
        const code = safeDisplay(error?.code);
        const message = safeDisplay(error?.message);
        addLine(`오류 코드: ${code}`);
        addLine(`오류 메시지: ${message}`);
        addLine(errorCategories[error?.code] ?? 'AI 연결을 확인할 수 없습니다. 잠시 후 다시 시도하세요.');
        addLine('자동으로 다시 시도하지 않습니다. 다시 점검하려면 위쪽 점검 버튼을 직접 누르세요.');
      } else {
        addLine('AI 연결 확인 불가');
      }

      if (modeLabels[mode]) addLine(`동작 모드: ${modeLabels[mode]}`);
      return root;
    },
    renderExplanation({ event, explanation, checkedAt } = {}) {
      const root = document.createElement('section');
      const addLine = (text) => {
        const line = document.createElement('p');
        line.textContent = text;
        root.appendChild(line);
      };

      const safeDisplay = (value) => {
        if (value === undefined || value === null || value === '') return '확인 불가';
        if (!['string', 'number', 'boolean'].includes(typeof value)) return '확인 불가';
        const text = String(value);
        const containsSensitiveValue = /(?:bearer\s+\S+|-----BEGIN [A-Z ]*(?:PRIVATE KEY|CERTIFICATE)-----|(?:api[_ -]?key|authorization|password|passphrase|access[_ -]?token|refresh[_ -]?token|token|secret|credential|private[_ -]?key|비밀번호|토큰|열쇠)\s*[:=]\s*\S+|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}|sk-(?:on-|proj-|ant-)?[A-Za-z0-9_-]{8,})/i;
        if (text.length > 500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text) || containsSensitiveValue.test(text)) {
          return '민감한 값이 포함될 수 있어 숨겼습니다';
        }
        return text;
      };
      const addSafeErrorCode = (candidate) => {
        if (candidate !== undefined && candidate !== null && candidate !== '') {
          addLine(`오류 코드: ${safeDisplay(candidate)}`);
        }
      };

      // 매 호출마다 새 루트를 만들고 이전 결과를 보관하지 않습니다.
      if (!event) {
        addLine('보안 기록에서 기록을 먼저 고르세요.');
        return root;
      }

      if (explanation?.status === 'loading') {
        addLine('AI 설명을 요청하는 중입니다...');
        return root;
      }

      if (explanation?.status === 'error') {
        const error = explanation.error ?? {};
        addLine(`AI 설명 실패: ${safeDisplay(error.code)} - ${safeDisplay(error.message)}`);
        addLine('AI가 이미 실행했다고 답한 설명은 쓸 수 없습니다.');
        addLine('기록은 그대로입니다.');
        return root;
      }

      if (explanation?.status === 'ok') {
        const data = explanation.data;
        if (!data) {
          addLine('AI 설명 자료가 없습니다. 내용을 지어내지 않습니다.');
          addLine('기록은 그대로입니다.');
          return root;
        }

        // 실행되었다고 주장하는 출력은 성공 설명으로 취급하지 않습니다.
        if (data.executed === true || (Array.isArray(data.proposals) && data.proposals.some((proposal) => proposal?.executed === true))) {
          addLine('AI가 이미 실행했다고 답한 설명은 쓸 수 없습니다.');
          addLine('기록은 그대로입니다.');
          return root;
        }

        const eventEvidence = Array.isArray(event.evidence) ? event.evidence : [];
        const evidenceById = new Map(eventEvidence
          .filter((item) => item?.id !== undefined && item?.id !== null)
          .map((item) => [String(item.id), item?.text]));
        const evidenceIds = Array.isArray(data.evidenceIds) ? data.evidenceIds : [];
        const proposalEvidenceIds = Array.isArray(data.proposals)
          ? data.proposals.flatMap((proposal) => Array.isArray(proposal?.evidenceIds) ? proposal.evidenceIds : [])
          : [];
        const referencedEvidenceIds = [...evidenceIds, ...proposalEvidenceIds];
        const missingEvidenceIds = referencedEvidenceIds.filter((id) => id === undefined || id === null || !evidenceById.has(String(id)));

        // 인용이 없거나 기록과 맞지 않으면 설명 내용을 노출하지 않습니다.
        if (evidenceIds.length === 0 || missingEvidenceIds.length > 0) {
          addLine('AI 설명을 쓸 수 없습니다: 근거 ID가 없거나 사건 기록의 근거와 일치하지 않습니다(근거 불일치).');
          addLine('근거가 맞지 않거나 없으면 설명 내용을 지어내지 않습니다.');
          addSafeErrorCode(explanation.error?.code ?? data.error?.code);
          addLine('기록은 그대로입니다.');
          return root;
        }

        // 성공 표식은 이벤트와 모든 근거가 검증된 설명에만 붙입니다.
        root.setAttribute('data-student-explanation-event', String(event.id));
        addLine('AI 설명(참고용)');
        addLine(`사건 ID: ${safeDisplay(event.id)}`);
        addLine(`AI 요약: ${safeDisplay(data.summary)}`);
        addLine('아래 요약은 AI의 참고용 해석이며, 사실 판단은 인용한 근거와 원천 상태를 기준으로 하세요.');
        if (checkedAt || data.checkedAt) {
          addLine(`설명 확인 시각: ${safeDisplay(checkedAt ?? data.checkedAt)}`);
        }

        addLine('인용한 근거:');
        for (const referenceId of evidenceIds) {
          addLine(`근거 ${safeDisplay(referenceId)} — ${safeDisplay(evidenceById.get(String(referenceId)))}`);
        }

        const rules = Array.isArray(event.rules) ? event.rules : [];
        if (rules.length > 0) {
          addLine('현재 규칙:');
          for (const rule of rules) {
            addLine(`규칙 ${safeDisplay(rule?.id)} — ${safeDisplay(rule?.text)}`);
          }
        }

        const stateNames = { access: '접속', session: '세션', device: '기기' };
        const eventState = event.state && typeof event.state === 'object' ? event.state : {};
        const unknownKeys = Object.keys(stateNames).filter((key) => eventState[key] === 'unknown');
        addLine('확인할 수 없는 현재 상태:');
        if (unknownKeys.length === 0) {
          addLine('없음');
        } else {
          for (const key of unknownKeys) {
            addLine(`${stateNames[key]}: 확인 불가(unknown)`);
          }
          addLine('unknown 상태는 정상 또는 안전을 뜻하지 않습니다.');
        }

        const proposals = Array.isArray(data.proposals) ? data.proposals : [];
        const supportedActions = Array.isArray(event.supportedActions) ? event.supportedActions : [];
        addLine('조치 제안:');
        if (proposals.length === 0) {
          if (supportedActions.length === 0) {
            addLine('원천이 지원하는 조치가 없어 제안이 없습니다(정상).');
          } else {
            addLine('AI가 제안한 조치가 없습니다.');
          }
        } else {
          for (const proposal of proposals) {
            addLine(`조치: ${safeDisplay(proposal?.action)} — 이유: ${safeDisplay(proposal?.reason)}`);
            addLine('사람 확인이 필요하며 아직 실행되지 않았습니다.');
          }
        }
        return root;
      }

      addLine('AI 설명 자료가 없습니다.');
      addLine('기록은 그대로입니다.');
      return root;
    },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
