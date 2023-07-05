export default function columns (root) {
  return [
    { binding: 'instanceName', header: '인스턴스 이름', width: '*' },
    { binding: 'state', header: '상태', width: 100, customHtml: true },
    { binding: 'instanceType', header: '인스턴스 유형', width: 150 },
    { binding: 'vcpu', header: 'vCPU', width: 100 },
    { binding: 'memory', header: '메모리', width: 100, customHtml: true },
    { binding: 'storage', header: '스토리지', width: 100, customHtml: true },
    { binding: 'monitoringState', header: '세부 모니터링', width: 100, customHtml: true },
    { binding: 'environment', header: 'VPC', width: 100, customHtml: true },
    { binding: 'isPublic', header: '서브넷', width: 100, customHtml: true },
    { binding: 'firstGroupName', header: '보안그룹', width: 180 },
    { binding: 'modifyDate', header: '마지막 변경 시간', width: 250, customHtml: true }
  ]
}
