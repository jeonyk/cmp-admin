export default function columns (root) {
  return [
    // 이벤트, 배치
    { binding: 'alarmCycleTypeMap', header: root.$v('유형'), width: '0.5*' },
    // 유형이 배치시 주기 (daily, weakly, ...)
    { binding: 'alarmBatchCycleText', header: root.$v('배치주기') },
    // 지정된 트리거 (텍스트)
    { binding: 'triggerName', header: root.$v('트리거'), width: '1.2*' },
    // SMS, Email, Kakao Biz, ...
    { binding: 'alarmTypeMap', header: root.$v('발송 시스템') },
    // 기본적으로 수신하는 대상
    { binding: 'triggerRaw.defaultReceiverName', header: root.$v('기본 수신 대상') },
    // 추가 수신 대상
    { binding: 'receiverDisplayName', header: root.$v('수신 대상'), filtable: false, sortable: false, customHtml: true, width: '1.25*' },
    // 액션 (On-Off, 이력 보기 등)
    { binding: 'actions', header: ' ', customHtml: true, width: '0.5*', filtable: false, sortable: false }
  ]
}
