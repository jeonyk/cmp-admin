export default function columns (root) {
  return [
    // 이벤트, 배치
    { binding: 'alarmCycleTypeMap', header: '유형', width: '0.5*' },
    // 트리거 이름
    { binding: 'name', header: '트리거명' },
    // URL
    { binding: 'url', header: 'URL', width: '1.5*' },
    // Method (GET, POST, ...)
    { binding: 'method', header: 'Method' },
    // Content (조건)
    { binding: 'contentMap', header: 'Content', width: '1.1*' },
    // Macro (key:value)
    { binding: 'macroList', header: 'Macro', sortable: false, filtable: false, customHtml: true, width: '2*' },
    // 기본 수신 대상
    { binding: 'defaultReceiverName', header: '기본 수신 대상' },
    // 액션 (사용 여부 스위치)
    { binding: 'actions', header: '사용 여부', customHtml: true }
  ]
}
