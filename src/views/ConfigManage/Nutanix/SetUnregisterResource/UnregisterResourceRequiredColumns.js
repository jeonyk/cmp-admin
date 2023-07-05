// * 미등록 자원 이관 시 필수 코어 데이터 정보
// * 참고: https://www.figma.com/file/pa5IgOdP0v8gmTC3exxxpn/CMP-2%EB%8B%A8%EA%B3%84_share?node-id=4319%3A21086

export const COMPUTE = [
  { binding: 'projectId', header: '프로젝트 IDX' }, //
  { binding: 'manageGroupIdx', header: '운영그룹' },
  { binding: 'imageId', header: '이미지' },
  { binding: 'chargeDate', header: '과금 시작일' }
]
export const STORAGE = [
  { binding: 'projectIdx', header: '프로젝트 IDX' },
  { binding: 'storageName', header: 'Volume 그룹명' },
  // { binding: 'hostname', header: 'VM(Host)명' },
  { binding: 'manageGroupIdx', header: '운영그룹' },
  { binding: 'chargeDate', header: '과금 시작일' }
]
export const DATABASE = [
  { binding: 'projectIdx', header: '프로젝트 IDX' },
  { binding: 'databaseName', header: '자원 명' },
  { binding: 'manageGroupIdx', header: '운영그룹' },
  { binding: 'cateId', header: '네트워크 카테고리' },
  { binding: 'chargeDate', header: '과금 시작일' }
]
export const FILE_SERVER = [
  { binding: 'projectIdx', header: '프로젝트 IDX' },
  { binding: 'shareName', header: 'Share 이름' },
  { binding: 'cateId', header: '네트워크 카테고리' },
  { binding: 'chargeDate', header: '과금 시작일' }
]

export const VM = [
  { binding: 'projectId', header: '프로젝트 IDX' }, //
  { binding: 'manageGroupIdx', header: '운영그룹' },
  { binding: 'imageId', header: '이미지' },
  // { binding: 'cateIdx', header: '네트워크 > 네트워크 카테고리' }, // 분기 처리로 따로 validation
  { binding: 'chargeDate', header: '과금 시작일' }
]
export const VSAN_ISCSI = [
  { binding: 'projectIdx', header: '프로젝트 IDX' },
  { binding: 'manageGroupIdx', header: '운영그룹' },
  { binding: 'connectIdx', header: 'vCenter' },
  { binding: 'clusterId', header: '클러스터' },
  { binding: 'alias', header: '별칭' },
  { binding: 'cateIdx', header: '네트워크 카테고리' },
  { binding: 'chargeDate', header: '과금 시작일' }
]

export const NETWORK_SWITCH = [
  { binding: 'projectIdx', header: '프로젝트 IDX' },
  { binding: 'resourceName', header: '로드밸런스 명' },
  { binding: 'ipCategoryIdx', header: '네트워크 카테고리' },
  { binding: 'chargeDate', header: '과금 시작일' }
]
export const SECURITY = [
  { binding: 'securityGroupName', header: '보안그룹 명' },
  { binding: 'projectIdx', header: '프로젝트 IDX' },
  { binding: 'ipCategoryIdx', header: '네트워크 카테고리' },
  // { binding: 'policyIdxs', header: '정책' },
  { binding: 'chargeDate', header: '과금 시작일' }
]
