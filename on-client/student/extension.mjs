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
    renderDecision() { return '학생 구현 대기: 서버의 판정과 이유를 연결하세요.'; },
    renderEvents() { return '학생 구현 대기: 본인 접속·XDR 기록을 연결하세요.'; },
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
