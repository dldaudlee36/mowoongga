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
      const renderCollection = ({ result, heading, key, itemLabel, emptyMessage, errorPrefix, idKey, stateGroup }) => {
        const container = document.createElement('div');
        addHeading(container, heading);

        if (result?.status === 'loading') {
          addLine(container, '불러오는 중...');
        } else if (result?.status === 'error') {
          const errorMessage = result.error?.message || '확인 불가';
          const timedOut = /timeout|timed out|시간 초과/i.test(String(errorMessage));
          const timeoutNote = timedOut && !/시간 초과/i.test(String(errorMessage)) ? ' (시간 초과)' : '';
          addLine(container, `${errorPrefix}: ${errorMessage}${timeoutNote}`);
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
        const timedOut = /timeout|timed out|시간 초과/i.test(String(errorMessage));
        const timeoutNote = timedOut && !/시간 초과/i.test(String(errorMessage)) ? ' (시간 초과)' : '';
        addLine(sessionContainer, `세션 정보를 불러오지 못했습니다: ${errorMessage}${timeoutNote}`);
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
        ];
        const safeDiagnosticText = diagnosticFields
          .map(([label, value]) => `${label}: ${displayValue(value)}`)
          .join('\n');
        for (const [label, value] of diagnosticFields) {
          addLine(diagnosticsContainer, `${label}: ${displayValue(value)}`);
        }
        addLine(diagnosticsContainer, '도움 요청에 쓰도록 복사하는 정보입니다');
        const copyButton = document.createElement('button');
        copyButton.setAttribute('type', 'button');
        copyButton.setAttribute('aria-label', '도움정보 복사');
        copyButton.textContent = '도움정보 복사';
        copyButton.addEventListener('click', () => {
          if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            try {
              Promise.resolve(navigator.clipboard.writeText(safeDiagnosticText)).catch(() => {});
            } catch {
              // 클립보드에 접근할 수 없는 경우에도 화면 동작을 중단하지 않습니다.
            }
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
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
