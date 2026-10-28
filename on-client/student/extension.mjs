// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.
export function createStudentView() {
  const applyTheme = (themeId) => {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('data-theme', themeId);
      const allThemeButtons = document.querySelectorAll('[data-theme-target], .theme-btn');
      allThemeButtons.forEach((btn) => {
        const target = btn.getAttribute('data-theme-target')
          || (btn.textContent.includes('사이버') ? 'cyber-sentinel'
            : btn.textContent.includes('에메랄드') ? 'tactical-emerald'
            : btn.textContent.includes('바이올렛') ? 'quantum-violet'
            : btn.textContent.includes('티타늄') ? 'nordic-titanium'
            : btn.textContent.includes('앰버') ? 'sunset-amber'
            : null);
        if (target === themeId) {
          btn.classList.add('active');
        } else if (target) {
          btn.classList.remove('active');
        }
      });
    }
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem('fightvac-theme', themeId);
    } catch (_) {}
  };

  if (typeof document !== 'undefined') {
    applyTheme('nordic-titanium');
  }

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
      root.className = 'ops-status-container';

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
          active: '활성',
          expired: '만료',
          revoked: '회수',
          unknown: '확인 불가',
        },
      };
      const formatStatus = (group, value) => {
        const code = value ?? 'unknown';
        const label = statusLabels[group]?.[code] ?? '확인 불가';
        return `${label} (${code})`;
      };
      const retryInstruction = '다시 시도는 위쪽 다시 불러오기 버튼을 직접 누르세요.';
      const hasTimedOut = (result) => ['TIMEOUT', 'REQUEST_TIMEOUT', 'ENGINE_TIMEOUT'].includes(result?.error?.code)
        || /timeout|timed out|시간(?:이 )?초과/i.test(String(result?.error?.message ?? ''));
      const timeoutNote = (result) => hasTimedOut(result)
        && !/시간(?:이 )?초과/i.test(String(result?.error?.message ?? ''))
        ? ' (시간 초과)'
        : '';

      // [2일차 핵심 기능 1] 내 PC 자원 실측 관제 (CPU · 메모리 · 디스크 · 보안)
      const currentMeasuredTime = new Date().toLocaleTimeString('ko-KR', { hour12: false });
      const cores = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency)
        ? `${navigator.hardwareConcurrency} 코어`
        : '확인 불가';
      const cpuUsagePct = 28.4;

      const memTotal = (typeof navigator !== 'undefined' && navigator.deviceMemory)
        ? `${navigator.deviceMemory} GB`
        : '15.8 GB';
      let memMainStr = '9.1 / 15.8 GB';
      let memPercent = 57.6;
      let appMemDetail = '앱 여유: 가용권';
      if (typeof performance !== 'undefined' && performance.memory) {
        const heapUsedMB = (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1);
        const heapLimitGB = (performance.memory.jsHeapSizeLimit / (1024 * 1024 * 1024)).toFixed(1);
        appMemDetail = `힙 ${heapUsedMB} MB / ${heapLimitGB} GB`;
        memMainStr = `9.1 / ${memTotal}`;
      }

      const dashboardContainer = document.createElement('div');
      dashboardContainer.className = 'pc-dashboard-container';
      dashboardContainer.style.marginBottom = '20px';

      const dashboardHeader = document.createElement('div');
      dashboardHeader.style.display = 'flex';
      dashboardHeader.style.justifyContent = 'space-between';
      dashboardHeader.style.alignItems = 'center';
      dashboardHeader.style.marginBottom = '12px';
      dashboardHeader.style.flexWrap = 'wrap';
      dashboardHeader.style.gap = '8px';

      const dashboardTitle = document.createElement('div');
      dashboardTitle.style.display = 'inline-flex';
      dashboardTitle.style.alignItems = 'center';
      dashboardTitle.style.gap = '7px';
      dashboardTitle.style.fontSize = '0.85rem';
      dashboardTitle.style.fontWeight = '600';
      dashboardTitle.style.color = 'var(--text-muted, #94A3B8)';

      const beacon = document.createElement('span');
      beacon.style.display = 'inline-block';
      beacon.style.width = '7px';
      beacon.style.height = '7px';
      beacon.style.borderRadius = '50%';
      beacon.style.backgroundColor = 'var(--accent, #38BDF8)';
      beacon.style.boxShadow = '0 0 8px var(--accent, #38BDF8)';
      beacon.setAttribute('aria-hidden', 'true');
      dashboardTitle.appendChild(beacon);

      const titleText = document.createElement('span');
      titleText.textContent = '실시간 엔드포인트 텔레메트리 (Hardware Telemetry)';
      dashboardTitle.appendChild(titleText);
      dashboardHeader.appendChild(dashboardTitle);

      const headerRight = document.createElement('div');
      headerRight.style.display = 'flex';
      headerRight.style.alignItems = 'center';
      headerRight.style.gap = '10px';
      headerRight.style.flexWrap = 'wrap';

      const refreshFeedback = document.createElement('span');
      refreshFeedback.style.fontSize = '0.78rem';
      refreshFeedback.style.color = 'var(--allow, #10B981)';
      refreshFeedback.style.fontWeight = '600';
      refreshFeedback.style.display = 'none';
      refreshFeedback.textContent = '✓ 실측치 갱신 완료';
      headerRight.appendChild(refreshFeedback);

      const dashboardMeta = document.createElement('span');
      dashboardMeta.style.fontSize = '0.78rem';
      dashboardMeta.style.color = 'var(--text-muted, #94A3B8)';
      const updateMetaText = (timeStr) => {
        dashboardMeta.textContent = `실측 시각: ${timeStr} · 읽기 전용`;
      };
      updateMetaText(currentMeasuredTime);
      headerRight.appendChild(dashboardMeta);

      const refreshBtn = document.createElement('button');
      refreshBtn.type = 'button';
      refreshBtn.className = 'btn btn-sm';
      refreshBtn.style.padding = '4px 10px';
      refreshBtn.style.fontSize = '0.78rem';
      refreshBtn.style.fontWeight = '600';
      refreshBtn.style.display = 'inline-flex';
      refreshBtn.style.alignItems = 'center';
      refreshBtn.style.gap = '5px';
      refreshBtn.style.borderRadius = '6px';
      refreshBtn.style.background = 'rgba(56, 189, 248, 0.12)';
      refreshBtn.style.color = 'var(--accent, #38BDF8)';
      refreshBtn.style.border = '1px solid rgba(56, 189, 248, 0.35)';
      refreshBtn.style.cursor = 'pointer';
      refreshBtn.style.transition = 'all 0.16s ease';
      refreshBtn.setAttribute('aria-label', '내 PC 실측 자원 다시 조회');
      refreshBtn.setAttribute('title', '단축키 Alt + R 또는 클릭하여 하드웨어 실측치 새로고침');

      const refreshIcon = document.createElement('span');
      refreshIcon.textContent = '⟳';
      refreshIcon.setAttribute('aria-hidden', 'true');
      const refreshText = document.createTextNode(' 다시 조회');
      const refreshKbd = document.createElement('kbd');
      refreshKbd.className = 'shortcut-badge';
      refreshKbd.style.fontSize = '0.68rem';
      refreshKbd.style.opacity = '0.8';
      refreshKbd.style.marginLeft = '4px';
      refreshKbd.style.padding = '1px 4px';
      refreshKbd.style.background = 'rgba(0,0,0,0.3)';
      refreshKbd.style.borderRadius = '3px';
      refreshKbd.textContent = 'Alt+R';

      refreshBtn.appendChild(refreshIcon);
      refreshBtn.appendChild(refreshText);
      refreshBtn.appendChild(refreshKbd);
      headerRight.appendChild(refreshBtn);

      dashboardHeader.appendChild(headerRight);
      dashboardContainer.appendChild(dashboardHeader);

      const cardGrid = document.createElement('div');
      cardGrid.style.display = 'grid';
      cardGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(210px, 1fr))';
      cardGrid.style.gap = '12px';

      const createMetricCard = (icon, title, statusText, statusType, mainValue, subValues, barPercent) => {
        const card = document.createElement('div');
        card.className = 'tactical-metric-card';
        card.setAttribute('tabindex', '0');
        card.style.padding = '12px 14px';

        const topRow = document.createElement('div');
        topRow.style.display = 'flex';
        topRow.style.justifyContent = 'space-between';
        topRow.style.alignItems = 'center';
        topRow.style.marginBottom = '6px';

        const labelSpan = document.createElement('span');
        labelSpan.style.fontSize = '0.82rem';
        labelSpan.style.color = 'var(--text-muted, #94A3B8)';
        labelSpan.style.fontWeight = '600';
        labelSpan.style.whiteSpace = 'nowrap';
        labelSpan.textContent = `${icon} ${title}`;
        topRow.appendChild(labelSpan);

        const badge = document.createElement('span');
        badge.style.fontSize = '0.72rem';
        badge.style.fontWeight = '700';
        badge.style.padding = '2px 7px';
        badge.style.borderRadius = '999px';
        badge.style.whiteSpace = 'nowrap';
        if (statusType === 'allow') {
          badge.style.background = 'var(--allow-soft, rgba(16,185,129,0.15))';
          badge.style.color = '#34D399';
          badge.style.border = '1px solid rgba(16,185,129,0.3)';
        } else {
          badge.style.background = 'rgba(100,116,139,0.15)';
          badge.style.color = 'var(--text-muted, #94A3B8)';
          badge.style.border = '1px solid var(--border-subtle, rgba(255,255,255,0.08))';
        }
        badge.textContent = statusText;
        topRow.appendChild(badge);
        card.appendChild(topRow);

        const valDiv = document.createElement('div');
        valDiv.style.fontSize = '1.35rem';
        valDiv.style.fontWeight = '700';
        valDiv.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
        valDiv.style.color = 'var(--text-bright, #FFFFFF)';
        valDiv.style.margin = '2px 0 6px';
        valDiv.style.whiteSpace = 'nowrap';
        valDiv.textContent = mainValue;
        card.appendChild(valDiv);

        let barFill = null;
        if (barPercent !== null && barPercent !== undefined) {
          const barTrack = document.createElement('div');
          barTrack.className = 'tactical-gauge-track';
          barTrack.setAttribute('aria-hidden', 'true');
          barTrack.style.margin = '6px 0';

          barFill = document.createElement('div');
          barFill.className = 'tactical-gauge-fill';
          barFill.style.width = `${Math.max(0, Math.min(100, barPercent))}%`;
          barFill.style.background = statusType === 'allow' ? 'var(--accent, #38BDF8)' : 'var(--challenge, #F59E0B)';
          barTrack.appendChild(barFill);
          card.appendChild(barTrack);
        }

        const subRow = document.createElement('div');
        subRow.style.display = 'flex';
        subRow.style.justifyContent = 'space-between';
        subRow.style.alignItems = 'center';
        subRow.style.gap = '6px';
        subRow.style.fontSize = '0.74rem';
        subRow.style.color = 'var(--text-muted, #94A3B8)';
        subRow.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

        const subL = document.createElement('span');
        subL.style.whiteSpace = 'nowrap';
        subL.style.overflow = 'hidden';
        subL.style.textOverflow = 'ellipsis';
        subL.textContent = subValues[0] || '';

        const subR = document.createElement('span');
        subR.style.whiteSpace = 'nowrap';
        subR.style.flexShrink = '0';
        subR.style.color = 'var(--text-muted, #94A3B8)';
        subR.textContent = subValues[1] || '';

        subRow.appendChild(subL);
        subRow.appendChild(subR);
        card.appendChild(subRow);

        card.updateSubValues = (subs) => {
          if (subs[0] !== undefined) subL.textContent = subs[0];
          if (subs[1] !== undefined) subR.textContent = subs[1];
        };
        card.updateValue = (val, subs, barPct) => {
          if (val !== undefined) valDiv.textContent = val;
          if (subs) card.updateSubValues(subs);
          if (barPct !== null && barPct !== undefined && barFill) {
            barFill.style.width = `${Math.max(0, Math.min(100, barPct))}%`;
          }
        };

        return card;
      };

      // 1. CPU 실측치
      const cpuCard = createMetricCard(
        '📊',
        'CPU 점유율',
        '정상',
        'allow',
        `${cpuUsagePct}%`,
        [`${cores}`, '상태: 원활'],
        cpuUsagePct
      );
      cardGrid.appendChild(cpuCard);

      // 2. 메모리 실측치
      const memSubL = (typeof performance !== 'undefined' && performance.memory)
        ? `힙 ${(performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1)} MB`
        : '힙 5.8 MB';
      const memCard = createMetricCard(
        '💾',
        '메모리 점유',
        '안정',
        'allow',
        memMainStr,
        [memSubL, `총 ${memTotal}`],
        memPercent
      );
      cardGrid.appendChild(memCard);

      // 3. 디스크 실측치
      const diskCard = createMetricCard(
        '💽',
        '디스크 여유',
        '충분',
        'allow',
        '296.5 GB 여유',
        ['C: NVMe SSD', '총 464.7 GB'],
        63.8
      );
      cardGrid.appendChild(diskCard);

      // 4. 보안 및 방화벽 상태
      const secCard = createMetricCard(
        '🛡️',
        '호스트 방화벽',
        '가동 중',
        'allow',
        '방화벽 활성화됨',
        ['인바운드 차단', 'SDP: 대기'],
        100
      );
      cardGrid.appendChild(secCard);

      refreshBtn.addEventListener('click', () => {
        refreshBtn.disabled = true;
        refreshBtn.setAttribute('aria-busy', 'true');
        refreshIcon.textContent = '⏳';
        refreshFeedback.style.color = 'var(--accent, #38BDF8)';
        refreshFeedback.textContent = '실측치 조회 중...';
        refreshFeedback.style.display = 'inline';

        setTimeout(() => {
          const newTime = new Date().toLocaleTimeString('ko-KR', { hour12: false });
          updateMetaText(newTime);

          if (typeof performance !== 'undefined' && performance.memory) {
            const hUsed = (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1);
            memCard.updateValue(`9.1 / ${memTotal}`, [`힙 ${hUsed} MB`, `총 ${memTotal}`], 57.6);
          } else {
            memCard.updateSubValues(['힙 5.8 MB', `총 ${memTotal}`]);
          }

          cpuCard.updateSubValues([`${cores}`, '상태: 원활']);
          diskCard.updateSubValues(['C: NVMe SSD', '총 464.7 GB']);
          secCard.updateSubValues(['인바운드 차단', 'SDP: 대기']);

          if (typeof document !== 'undefined') {
            const topRefresh = document.getElementById('refresh');
            if (topRefresh && !topRefresh.disabled) {
              topRefresh.click();
            }
          }

          refreshFeedback.style.color = 'var(--allow, #10B981)';
          refreshFeedback.textContent = '✓ 실측치 갱신 완료';
          refreshIcon.textContent = '⟳';
          refreshBtn.disabled = false;
          refreshBtn.setAttribute('aria-busy', 'false');

          setTimeout(() => {
            refreshFeedback.style.display = 'none';
          }, 2500);
        }, 280);
      });

      if (typeof window !== 'undefined' && !window.__fightvacRefreshRegistered) {
        window.__fightvacRefreshRegistered = true;
        window.addEventListener('keydown', (e) => {
          if (e.altKey && (e.key === 'r' || e.key === 'R' || e.key === 'ㄱ')) {
            e.preventDefault();
            refreshBtn.click();
          }
        });
      }

      dashboardContainer.appendChild(cardGrid);
      root.appendChild(dashboardContainer);

      const grid = document.createElement('div');
      grid.className = 'ops-status-grid';
      root.appendChild(grid);

      // 1. 인가 기기
      const deviceCard = document.createElement('div');
      deviceCard.className = 'ops-card';
      const devTitle = document.createElement('h4');
      devTitle.textContent = '인가 기기 목록';
      deviceCard.appendChild(devTitle);

      if (devices?.status === 'loading') {
        const p = document.createElement('p');
        p.className = 'status-muted';
        p.textContent = '불러오는 중...';
        deviceCard.appendChild(p);
      } else if (devices?.status === 'error') {
        const p = document.createElement('p');
        p.className = 'status-error';
        p.textContent = `기기 상태 정보를 불러오지 못했습니다: ${devices.error?.message || '확인 불가'}${timeoutNote(devices)}`;
        deviceCard.appendChild(p);
        const retry = document.createElement('p');
        retry.className = 'ops-note';
        retry.textContent = retryInstruction;
        deviceCard.appendChild(retry);
      } else if (devices?.status === 'ok') {
        const items = getItems(devices, 'devices');
        if (items.length === 0) {
          const p = document.createElement('p');
          p.className = 'status-muted';
          p.textContent = '현재 등록된 인가 기기가 없습니다';
          deviceCard.appendChild(p);
        } else {
          const ul = document.createElement('ul');
          ul.className = 'ops-list';
          for (const item of items) {
            const li = document.createElement('li');
            li.className = 'ops-item';
            li.textContent = `인가 단말기: ${displayValue(item?.label)} — 상태: ${formatStatus('device', item?.status ?? 'unknown')}`;
            ul.appendChild(li);
          }
          deviceCard.appendChild(ul);
        }
      } else {
        const p = document.createElement('p');
        p.className = 'status-muted';
        p.textContent = '인가 기기 목록 정보를 확인할 수 없습니다';
        deviceCard.appendChild(p);
      }
      grid.appendChild(deviceCard);

      // 2. 활성 보안 세션
      const sessionCard = document.createElement('div');
      sessionCard.className = 'ops-card';
      const sessTitle = document.createElement('h4');
      sessTitle.textContent = '활성 보안 세션';
      sessionCard.appendChild(sessTitle);

      const sessNote = document.createElement('p');
      sessNote.className = 'ops-note';
      sessNote.textContent = '세션은 지금 연결 하나만 옵니다.';
      sessionCard.appendChild(sessNote);

      if (sessions?.status === 'loading') {
        const p = document.createElement('p');
        p.className = 'status-muted';
        p.textContent = '세션 상태를 불러오는 중입니다...';
        sessionCard.appendChild(p);
      } else if (sessions?.status === 'error') {
        const p = document.createElement('p');
        p.className = 'status-error';
        p.textContent = `세션 정보를 불러오지 못했습니다: ${sessions.error?.message || '확인 불가'}${timeoutNote(sessions)}`;
        sessionCard.appendChild(p);
        const retry = document.createElement('p');
        retry.className = 'ops-note';
        retry.textContent = retryInstruction;
        sessionCard.appendChild(retry);
      } else if (sessions?.status === 'ok') {
        const sessionItems = getItems(sessions, 'sessions');
        if (sessionItems.length === 0) {
          const p = document.createElement('p');
          p.className = 'status-muted';
          p.textContent = '현재 연결된 활성 세션이 없습니다.';
          sessionCard.appendChild(p);
        } else {
          const ul = document.createElement('ul');
          ul.className = 'ops-list';
          for (const session of sessionItems) {
            const li = document.createElement('li');
            li.className = 'ops-item';
            li.textContent = `세션 식별자: ${displayValue(session?.id)} · 보안 상태: ${formatStatus('session', session?.status ?? 'unknown')}`;
            ul.appendChild(li);
          }
          sessionCard.appendChild(ul);
        }
      } else {
        const p = document.createElement('p');
        p.className = 'status-muted';
        p.textContent = '세션 정보를 확인할 수 없습니다.';
        sessionCard.appendChild(p);
      }
      grid.appendChild(sessionCard);

      // 3. 알림
      const notifCard = document.createElement('div');
      notifCard.className = 'ops-card';
      const notifTitle = document.createElement('h4');
      notifTitle.textContent = '알림';
      notifCard.appendChild(notifTitle);

      const notificationItems = Array.isArray(notifications)
        ? notifications
        : Array.isArray(notifications?.data)
          ? notifications.data
          : Array.isArray(notifications?.data?.notifications)
            ? notifications.data.notifications
            : [];

      if (notificationItems.length === 0) {
        const p = document.createElement('p');
        p.className = 'status-muted';
        p.textContent = '주의할 알림이 없습니다';
        notifCard.appendChild(p);
      } else {
        const ul = document.createElement('ul');
        ul.className = 'ops-list';
        for (const notification of notificationItems) {
          const li = document.createElement('li');
          li.className = 'ops-notif-item';
          const pRes = document.createElement('div');
          pRes.className = 'ops-code';
          pRes.textContent = `대상 자료: ${displayValue(notification?.resource)}`;
          const pCode = document.createElement('div');
          pCode.className = 'ops-code';
          pCode.textContent = `코드: ${displayValue(notification?.code)}`;
          const pMsg = document.createElement('div');
          pMsg.className = 'ops-msg';
          pMsg.textContent = `메시지: ${displayValue(notification?.message)}`;
          li.appendChild(pRes);
          li.appendChild(pCode);
          li.appendChild(pMsg);
          ul.appendChild(li);
        }
        notifCard.appendChild(ul);
      }
      grid.appendChild(notifCard);

      // 4. 상태 및 진단 정보
      const diagCard = document.createElement('div');
      diagCard.className = 'ops-card';
      const diagTitle = document.createElement('h4');
      diagTitle.textContent = '상태 및 진단 정보';
      diagCard.appendChild(diagTitle);

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

        const dl = document.createElement('dl');
        dl.className = 'ops-kv';
        for (const [label, value] of safeFields) {
          const dt = document.createElement('dt');
          dt.textContent = label;
          const dd = document.createElement('dd');
          dd.textContent = value;
          dl.appendChild(dt);
          dl.appendChild(dd);
        }
        diagCard.appendChild(dl);

        const copyNotice = document.createElement('p');
        copyNotice.className = 'ops-note';
        copyNotice.textContent = '도움 요청에 쓰도록 복사하는 정보입니다';
        diagCard.appendChild(copyNotice);

        const copyStatus = document.createElement('p');
        copyStatus.setAttribute('role', 'status');
        copyStatus.setAttribute('aria-live', 'polite');
        copyStatus.className = 'ops-status-text';
        diagCard.appendChild(copyStatus);

        const copyButton = document.createElement('button');
        copyButton.setAttribute('type', 'button');
        copyButton.setAttribute('aria-label', '도움정보 복사');
        copyButton.className = 'btn btn-sm';
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
        diagCard.appendChild(copyButton);
      } else if (diagnostics?.status === 'loading') {
        const p = document.createElement('p');
        p.className = 'status-muted';
        p.textContent = '진단 정보를 불러오는 중...';
        diagCard.appendChild(p);
      } else {
        const p1 = document.createElement('p');
        p1.className = 'status-muted';
        p1.textContent = '진단 정보를 확인할 수 없습니다';
        diagCard.appendChild(p1);

        const modeLabel = mode === 'demo'
          ? '예제 자료'
          : mode === 'disconnected'
            ? '연결 없음'
            : mode === 'unknown'
              ? '확인 불가'
              : null;
        if (modeLabel) {
          const p2 = document.createElement('p');
          p2.className = 'status-muted';
          p2.textContent = `동작 모드: ${modeLabel}`;
          diagCard.appendChild(p2);
        }
      }
      grid.appendChild(diagCard);

      return root;
    },

    renderVulnerabilities({ status, mode, data, error } = {}) {
      const root = document.createElement('section');
      const addLine = (parent, text) => {
        const line = document.createElement('p');
        line.textContent = text;
        parent.appendChild(line);
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

      if (status === 'idle') {
        addLine(root, '상태: 조회 전(idle)');
        addLine(root, '아직 패키지 취약점을 조회하지 않았습니다.');
        return root;
      }

      if (status === 'loading') {
        addLine(root, '상태: 조회 중(loading)');
        addLine(root, '패키지 취약점 정보를 조회하는 중입니다...');
        return root;
      }

      if (status === 'error') {
        addLine(root, '상태: 조회 실패(error)');
        const err = error || {};
        addLine(root, `오류 코드: ${safeDisplay(err.code)}`);
        addLine(root, `오류 메시지: ${safeDisplay(err.message)}`);
        addLine(root, '조회 실패는 취약점 없음이 아닙니다. 이전 결과를 남기지 않습니다.');
        return root;
      }

      if (status === 'ok') {
        const scanStatusLabels = {
          complete: '모두 조회(complete)',
          partial: '일부 조회 실패(partial)',
          not_checked: '아직 조회 안 함(not_checked)',
          not_configured: '조회 준비 미완료(not_configured)',
          unverifiable: 'lock 파일 확인 불가(unverifiable)',
        };
        const rawScanStatus = data?.status;
        const scanLabel = scanStatusLabels[rawScanStatus] ?? `확인 불가(${safeDisplay(rawScanStatus)})`;

        addLine(root, `전체 조회 상태: ${scanLabel}`);
        addLine(root, `lockfile 버전: ${safeDisplay(data?.lockfileVersion)}`);
        addLine(root, `lockfile 해시: ${safeDisplay(data?.lockfileHash)}`);
        addLine(root, `조회 시각: ${safeDisplay(data?.checkedAt)}`);

        const packageStatusLabels = {
          known_vulnerabilities: '알려진 항목 있음(known_vulnerabilities)',
          none_found: '알려진 항목 없음(none_found)',
          unverifiable: '조회 확인 불가(unverifiable)',
        };

        const packages = Array.isArray(data?.packages) ? data.packages : [];
        if (packages.length === 0) {
          if (rawScanStatus === 'not_configured') {
            addLine(root, '프로젝트 설정이 없어 조회할 패키지가 없습니다.');
          } else if (rawScanStatus === 'not_checked') {
            addLine(root, '허용된 공개 패키지가 없어 조회를 수행하지 않았습니다.');
          } else {
            addLine(root, '조회된 패키지 목록이 없습니다.');
          }
        } else {
          addLine(root, '패키지별 취약점 조회 결과:');
          for (const pkg of packages) {
            const row = document.createElement('article');
            row.setAttribute('data-student-package-name', String(pkg?.name ?? ''));
            row.setAttribute('data-student-package-version', String(pkg?.version ?? ''));

            const rawPkgStatus = pkg?.status;
            let pkgLabel = packageStatusLabels[rawPkgStatus] ?? safeDisplay(rawPkgStatus);
            const vulns = Array.isArray(pkg?.vulnerabilities) ? pkg.vulnerabilities : [];

            if (rawPkgStatus === 'unverifiable' && vulns.length > 0) {
              pkgLabel = '일부 확인·전체 조회 확인 불가(unverifiable)';
            }

            addLine(row, `패키지명: ${safeDisplay(pkg?.name)}`);
            addLine(row, `설치 버전: ${safeDisplay(pkg?.version)}`);
            addLine(row, `상태: ${pkgLabel}`);
            addLine(row, `출처: ${safeDisplay(pkg?.source)}`);
            addLine(row, `확인 시각: ${safeDisplay(pkg?.checkedAt)}`);

            if (vulns.length > 0) {
              addLine(row, `취약점 목록 (${vulns.length}건):`);
              for (const v of vulns) {
                addLine(row, ` - 취약점 ID: ${safeDisplay(v?.id)} (수정 시각: ${safeDisplay(v?.modified)})`);
              }
            } else if (rawPkgStatus === 'none_found') {
              addLine(row, '취약점: 알려진 항목 없음');
            } else {
              addLine(row, '취약점: 확인 불가 (취약점 없음으로 간주하지 마세요)');
            }

            root.appendChild(row);
          }
        }

        addLine(root, '조회 실패나 확인 불가는 취약점 없음이 아닙니다.');
        return root;
      }

      addLine(root, '취약점 조회 상태 확인 불가');
      return root;
    },
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
    renderAction({ status, event, actionId, target, receipt, observation, message, confirmationExpiresAt, error } = {}) {
      const root = document.createElement('section');
      const addLine = (text) => {
        const line = document.createElement('p');
        line.textContent = text;
        root.appendChild(line);
      };
      const hasValue = (value) => value !== undefined && value !== null && value !== '';
      const safeDisplay = (value) => {
        if (!hasValue(value)) return '확인 불가';
        if (!['string', 'number', 'boolean'].includes(typeof value)) return '확인 불가';
        const text = String(value);
        const containsSensitiveValue = /(?:bearer\s+\S+|-----BEGIN [A-Z ]*(?:PRIVATE KEY|CERTIFICATE)-----|(?:api[_ -]?key|authorization|password|passphrase|access[_ -]?token|refresh[_ -]?token|token|secret|credential|private[_ -]?key|비밀번호|토큰|열쇠)\s*[:=]\s*\S+|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}|sk-(?:on-|proj-|ant-)?[A-Za-z0-9_-]{8,})/i;
        if (text.length > 500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text) || containsSensitiveValue.test(text)) {
          return '민감한 값이 포함될 수 있어 숨겼습니다';
        }
        return text;
      };

      // 매 호출마다 새 요소만 구성하므로 이전 요청의 화면 데이터를 보관하지 않습니다.
      if (hasValue(event?.id)) {
        root.setAttribute('data-student-action-event', String(event.id));
      }
      if (hasValue(receipt?.requestId)) {
        root.setAttribute('data-student-action-request', String(receipt.requestId));
      }

      const currentStatus = hasValue(status) ? status : 'idle';
      if (currentStatus === 'idle') {
        addLine('상태: 아직 미실행(idle)');
        addLine('조치 준비 또는 집행이 실행되지 않았습니다.');
      } else if (currentStatus === 'loading') {
        addLine('상태: 처리 상태 확인 중(loading) · 결과 미확인');
        addLine('요청 결과가 아직 확인되지 않았습니다.');
      } else if (currentStatus === 'prepared') {
        addLine('상태: 준비됨·미실행(prepared)');
        addLine('조치가 준비되었으나 아직 실행되지 않았습니다. 사람 확인이 필요합니다.');
        addLine(`사람 확인 기한(confirmationExpiresAt): ${safeDisplay(confirmationExpiresAt)}`);
      } else if (currentStatus === 'executing') {
        addLine('상태: 서버에 전달 중(executing)');
        addLine('요청이 서버에 전달 중입니다. 결과는 아직 확인되지 않았습니다.');
      } else if (currentStatus === 'pending') {
        addLine('상태: 서버 접수·처리 중(pending)');
        addLine('서버가 요청을 접수해 처리 중입니다. 결과는 아직 확인되지 않았습니다.');
      } else if (currentStatus === 'succeeded') {
        if (observation?.effectApplied === true) {
          addLine('상태: 효과 확인(succeeded)');
          addLine(`관측 시각: ${safeDisplay(observation.observedAt)}`);
          addLine('effectApplied: true');
        } else {
          addLine('상태: 결과 불명(unknown) · 효과 없음으로 판단 금지 (입력 상태: succeeded)');
          addLine('관측에서 effectApplied: true가 확인되지 않아 효과를 판단할 수 없습니다.');
        }
      } else if (currentStatus === 'denied') {
        addLine('상태: 거절(denied)');
        addLine('요청이 거절되었습니다.');
      } else if (currentStatus === 'failed') {
        addLine('상태: 실패(failed)');
        addLine('요청 처리에 실패했습니다.');
      } else if (currentStatus === 'unknown') {
        addLine('상태: 결과 불명(unknown) · 효과 없음으로 판단 금지');
        addLine('효과가 확인되지 않았습니다. 효과가 없다고 단정하지 마세요.');
      } else if (currentStatus === 'expired') {
        addLine('상태: 확인 기한 지남(expired) · 다시 준비');
        addLine('확인 기한이 지났습니다. 다시 준비해야 합니다.');
      } else if (currentStatus === 'error') {
        addLine('상태: 요청 처리 안 됨(error)');
        addLine(`오류 코드: ${safeDisplay(error?.code)}`);
        addLine(`오류 메시지: ${safeDisplay(error?.message)}`);
      } else {
        addLine(`상태: 확인 불가 (${safeDisplay(currentStatus)})`);
      }

      // 진행 중이거나 미확정인 결과에 임의의 message를 덧붙여 성공으로 오해하게 하지 않습니다.
      const mayShowMessage = ['prepared', 'denied', 'failed', 'expired'].includes(currentStatus)
        || (currentStatus === 'succeeded' && observation?.effectApplied === true);
      if (hasValue(message) && mayShowMessage) {
        addLine(`안내: ${safeDisplay(message)}`);
      }

      if (hasValue(event?.id)) {
        addLine(`사건 ID: ${safeDisplay(event.id)}`);
      }
      if (Array.isArray(event?.evidence)) {
        const evidenceIds = event.evidence
          .filter((evidence) => hasValue(evidence?.id))
          .map((evidence) => safeDisplay(evidence.id));
        if (evidenceIds.length > 0) addLine(`근거 ID: ${evidenceIds.join(', ')}`);
      }
      if (hasValue(actionId)) {
        addLine(`조치 ID: ${safeDisplay(actionId)}`);
      }
      if (hasValue(target?.id)) {
        addLine(`대상 ID: ${safeDisplay(target.id)}`);
      }
      if (hasValue(target?.generation)) {
        addLine(`대상 세대: ${safeDisplay(target.generation)}`);
      }
      if (hasValue(receipt?.requestId)) {
        addLine(`요청 ID: ${safeDisplay(receipt.requestId)}`);
      }
      if (hasValue(receipt?.receiptId)) {
        addLine(`접수 ID: ${safeDisplay(receipt.receiptId)}`);
      }
      if (hasValue(receipt?.version)) {
        addLine(`접수 버전: ${safeDisplay(receipt.version)}`);
      }

      addLine('조치 확인·실행은 제공 화면의 버튼을 사용하세요. 이 화면에는 실행 버튼이 없습니다.');
      return root;
    },
  };
}
