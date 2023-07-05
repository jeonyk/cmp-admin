export default {
  // VPC
  vpcId: 'VPC ID',
  vpcBasicInfo: 'VPC 기본 정보',
  vpcConnectionStatus: 'VPC 연결 상태',
  vpcNetType: 'VPC 망 종류',
  vpcNetCategory: 'VPC 망 분류',
  vpcBand: 'VPC 대역',
  vpcName: 'VPC 명',
  vpcTag: 'VPC 별칭',
  vpcBandSetting: 'VPC 대역 설정',
  vpcCountInUse: '사용중인 VPC 대역 수',
  remainingVpcCount: '잔여 VPC 수',
  addVpcBandwidth: 'VPC 대역 추가',
  updateVpcBandwidth: 'VPC 대역 변경',
  bandwitdhType: '대역 종류',
  connectedVpc: '연결된 VPC',
  connectedVpcInfo: '연결된 VPC 정보',

  // Subnet
  subnetConnectionInfo: '서브넷 연결 정보',
  subnetId: '서브넷 ID',
  subnetName: '서브넷 명',
  subnetTag: '서브넷 별칭',
  subnetBand: '서브넷 대역',
  subnetStatus: '서브넷 상태',
  subnetCategory: '서브넷 분류',
  subnetBaiscInfo: '서브넷 기본 정보',
  subnetCount: '서브넷 개수',
  subSubnetCount: '하위 서브넷 개수',
  connectedSubnetCount: '연결된 서브넷 수',
  explicitConnectionSubnet: '명시적 연결 서브넷',

  // Target Group
  targetGroup: '대상 그룹',
  targetgroupName: '대상그룹 이름',
  targetgroupType: '대상그룹 유형',
  targetgroupServicePort: '대상그룹 서비스 포트',
  healthCheckPath: '상태 확인 경로',
  healthCheckProtocol: '상태 확인 프로토콜',
  healthCheckAttribute: '상태 확인 속성',
  consecutiveHealthCheckSuccesses: '연속 상태 확인 성공 횟수',
  consecutiveHealthCheckFailures: '연속 상태 확인 실패 횟수',

  // Load Balancer
  loadbalancerName: '로드밸런서 이름',
  loadbalancerType: '로드밸런서 종류',

  // Target Group words
  healthyThreshold: '정상 임계값',
  unhealthyThreshold: '비정상 임계값',
  timeout: '시간초과',
  interval: '간격',

  // Routing Table
  routingId: '라우팅 ID',
  routingTag: '라우팅 별칭',
  routingTableId: '라우팅 테이블 ID',
  routingTableName: '라우팅 테이블 명',
  routingTable: '라우팅 테이블',
  routingCategory: '라우팅 분류',
  routingInfo: '라우팅 정보',

  // Internet Gateway
  internetGatewayId: '인터넷 게이트웨이 ID',
  internetGatewayName: '인터넷 게이트웨이 명',
  internetGWId: '인터넷 G/W ID',
  internetGWName: '인터넷 G/W 명',

  // NAT Gateway
  natGatewayId: 'NAT Gateway ID',
  natGWName: 'NAT G/W 명',
  natGatewayName: 'NAT Gateway Name',

  // Security > Network ACL
  networkAclId: '네트워크 ACL ID',
  networkAclName: '네트워크 ACL 명',
  networkAclTag: '네트워크 ACL 별칭',

  // Security > Security Group
  securitygroup: '보안그룹',
  securityGroupId: '보안그룹 ID',
  securityGroupName: '보안그룹 명',
  securityGroupInfo: '보안그룹 정보',
  securityGroupDescription: '보안그룹 설명',
  groupName: '그룹 이름',

  networkInterfaceId: '네트워크 인터페이스 ID',

  inboundRuleCount: '인바운드 규칙 수',
  outboundRuleCount: '아웃바운드 규칙 수',

  region: '리전',
  regionInfo: '리전 정보',
  availabilityZone: '가용영역',
  availabilityZoneInfo: '가용영역 정보',
  availabilityZoneSelect: '가용영역 선택',

  connectionType: '연결 유형',

  availableIpCount: '사용 가능 IP 수',
  networkAcl: 'Network ACL',
  setupNetworkAcl: '설정된 네트워크 ACL',

  projectLocation: '프로젝트 위치',
  cannotFindConnectedVpc: '연결된 VPC 를 찾을 수 없습니다',
  communicationMethod: '통신방법',
  description: '설명',
  source: '소스',
  hasNoSecuritygroup: '보안그룹이 없습니다',
  efsName: 'EFS 이름',
  hostName: 'HOST 명',

  '001': '서브넷 정보를 찾을 수 없습니다',
  '002': '등록된 정보를 찾을 수 없습니다',
  '003': '이미 존재하는 VPC 정보입니다',
  '004': '미등록된 IP입니다.<br>관리자 문의 부탁드립니다.',
  '005': '해당 IP 대역은 관계사 정보가 없습니다.<br>관리자 문의 부탁드립니다.',
  '006': '출발지,목적지는 같은 관계사의 ip만 가능합니다.',
  '007': '사용할 수 없는 ip입니다.',

  // 인증서
  certifConnect: '인증서 연결',
  certifDelete: '인증서 해제',
  DoCertifDisconnect: '연결을 해제 하시겠습니까?',
  certifConnectSuccess: '인증서 연결 성공',
  certifName: '인증서 명',
  certification: '인증서',
  expirDate: '만료일자',
  connectedLbName: '연결된 로드밸런스명',
  certifDownload: '인증서 다운로드',
  certifList: '인증서 목록 선택',
  certifUpload: '인증서 업로드',
  beforeUploadCert: '첨부된 인증서',
  sslCert: 'SSL 인증서',
  issuer: '발행기관',

  // 로드벨런스
  switchEquipName: '스위치 장비명',
  manualManagement: '수기관리',

  // 방화벽 장비관리
  fireEquipName: '방화벽 장비명',

  // 네트워크 카테고리
  netcate6000: '하위 카테고리가 존재합니다.',
  netcate01: '네트워크 카테고리 정보',
  netcate02: '카테고리 명',
  datacenterAdd: '데이터센터 등록',
  datacenterSelect: '데이터센터 선택',
  envSet: '환경변수 설정',
  netcateNamePh: '카테고리 명을 입력해주세요',
  netcateCode: '코드 명을 입력해주세요',
  netcateInfoModify: '네트워크 카테고리 정보 수정',

  // 환경변수 설정
  envName: '변수명',
  envValue: '변수값',
  isCypto: '암호화 여부',
  envNamePh: '변수명 입력',
  envValuePh: '변수값 입력',
  envDescriptPh: '비고 입력',
  areYouAddEnv: '환경변수를 추가하시겠습니까?',
  areYouUpdateEnv: '환경변수를 변경하시겠습니까?',

  // IP 관리대장
  ipIsAutoSync: '자동 동기화 여부',
  privateMesh: '사설망',
  publicMesh: '공인망',
  ipAutoSyncNoti: '※ 사설망의 경우 IP 가 중복될 수 있으며, CMP 내 IP 동기화를 진행하지 않습니다.',
  doChangeSyncRadio: '변경 시 아래 작성하신 내용이 초기화됩니다.<br/>그래도 변경 하시겠습니까?',
  manageTypeVlan: '관리 타입 - VLAN (VLAN ID, Range)',
  manageTypeRange: '관리 타입 - 대역 (Range)',
  manageShortTypeVlan: '관리 타입 - VLAN',
  manageShortTypeRange: '관리 타입 - 대역',

  // 서버 정보 추가 (모달)
  selectCreatedService: '생성된 서비스 선택',
  placeServerName: '서버명 입력',
  addServerInformation: '서버 정보 추가',

  // 서비스
  FailedToCallService: '서비스를 불러오지 못하였습니다.<br /> 관리자에게 문의해주세요.',
  PleaseSelectASwitchDeviceFirst: '스위치 장비를 먼저 선택해 주세요',

  // 기타
  firstNetcate: "'네트워크 카테고리'를 먼저 선택해 주세요",
  firstBothProjectNct: "'프로젝트' 및 '네트워크 카테고리' 먼저 선택해 주세요",
  testShowErr: '값을 확인해 주세요.'
}
