export default {
// VPC
  vpcId: 'VPC ID',
  vpcBasicInfo: 'VPC Basic Info',
  vpcConnectionStatus: 'VPC Connection Status',
  vpcNetType: 'VPC Type',
  vpcNetCategory: 'VPC Category',
  vpcBand: 'VPC Band',
  vpcName: 'VPC Name',
  vpcTag: 'VPC Tag',
  vpcBandSetting: 'VPC Band Setting',
  vpcCountInUse: 'VPC Count In Use',
  remainingVpcCount: 'Remaining VPC Count',
  addVpcBandwidth: 'Add VPC Bandwidth',
  updateVpcBandwidth: 'Change VPC Bandwidth',
  bandwitdhType: 'Bandwidth Type',
  connectedVpc: 'Connected VPC',
  connectedVpcInfo: 'Connected VPC Info',

  // Subnet
  subnetConnectionInfo: 'Subnet Connection Info',
  subnetId: 'Subnet ID',
  subnetName: 'Subnet Name',
  subnetTag: 'Subnet Tag',
  subnetBand: 'Subnet Band',
  subnetStatus: 'Subnet Status',
  subnetCategory: 'Subnet Category',
  subnetBaiscInfo: 'Subnet Basic Info',
  subnetCount: 'Subnet Count',
  subSubnetCount: 'Subnet Count',
  connectedSubnetCount: 'Connected Subnet Count',
  explicitConnectionSubnet: 'Explicit Connection Subnet',

  // Target Group
  targetGroup: 'Target Group',
  targetgroupName: 'Target Group Name',
  targetgroupType: 'Target Group Type',
  targetgroupServicePort: 'Target Group Service Port',
  healthCheckPath: 'Health Check Path',
  healthCheckProtocol: 'Health Check Protocol',
  healthCheckAttribute: 'Health Check Attribute',
  consecutiveHealthCheckSuccesses: 'Consecutive Health Check Successes',
  consecutiveHealthCheckFailures: 'Consecutive Health Check Failures',

  // Load Balancer
  loadbalancerName: 'Load Balancer Name',
  loadbalancerType: 'Load Balancer Type',

  // Target Group words
  healthyThreshold: 'Healthy Threshold',
  unhealthyThreshold: 'Unhealthy Threshold',
  timeout: 'Timeout',
  interval: 'Interval',

  // Routing Table
  routingId: 'Routing ID',
  routingTag: 'Routing Tag',
  routingTableId: 'Routing Table ID',
  routingTableName: 'Routing Table Name',
  routingTable: 'Routing Table',
  routingCategory: 'Routing Category',
  routingInfo: 'Routing Info',

  // Internet Gateway
  internetGatewayId: 'Internet Gateway Id',
  internetGatewayName: 'Internet Gateway Name',
  internetGWId: 'Internet G/W ID',
  internetGWName: 'Internet G/W Name',

  // NAT Gateway
  natGatewayId: 'NAT Gateway ID',
  natGWName: 'NAT G/W Name',
  natGatewayName: 'NAT Gateway Name',

  // Security > Network
  networkAclId: 'Network ACL ID',
  networkAclName: 'Network ACL Name',
  networkAclTag: 'Network ACL Tag',

  // Security > Security Group
  securitygroup: 'Security Group',
  securityGroupId: 'Security Group ID',
  securityGroupName: 'Security Group Name',
  securityGroupInfo: 'Security Group Info',
  securityGroupDescription: 'Security Group Desc',
  groupName: 'Group Name',

  networkInterfaceId: 'Network Interface ID',

  inboundRuleCount: 'Inbound Rule Count',
  outboundRuleCount: 'Outbound Rule Count',

  region: 'Region',
  regionInfo: 'Region Info',
  availabilityZone: 'Availability Zone',
  availabilityZoneInfo: 'Availability Zone Info',
  availabilityZoneSelect: 'Availability Zone Options',

  connectionType: 'Connection Type',

  availableIpCount: 'Available IP Count',
  setupNetworkAcl: 'Setup Network Acl',
  networkAcl: 'Network ACL',

  projectLocation: 'Project Location',
  cannotFindConnectedVpc: 'VPC Not Found',
  communicationMethod: 'Method',
  description: 'Desc',
  source: 'Source',
  hasNoSecuritygroup: 'Securty Group does not exist',

  efsName: 'EFS Name',
  hostName: 'HOST name',

  '001': 'No Subnet Data',
  '002': 'No Registered Data',
  '003': 'VPC already exists',
  '004': 'This is an unregistered IP.<br>Please contact the administrator.',
  '005': 'There is no affiliate information for the IP band.<br>Please contact the administrator.',
  '006': 'Only the IP address of the same affiliate is available for the origin and destination.',
  '007': 'Invalid IP.',

  // 인증서
  certifConnect: 'Connect Certification',
  certifDelete: 'Disconnect Certification',
  DoCertifDisconnect: 'Are you sure you want to disconnect?',
  certifConnectSuccess: 'Certificate Connection Success',
  certifName: 'Certificate Name',
  certification: 'Certification',
  expirDate: 'Expiry Date',
  connectedLbName: 'Connected Load Balance Name',
  certifDownload: 'Download Certificate',
  certifList: 'Select Certificate List',
  certifUpload: 'Upload Certificate',
  beforeUploadCert: 'Attached Certificate',
  sslCert: 'SSL Certification',
  issuer: 'Issuer',

  // 로드벨런스
  switchEquipName: 'Switch Device Name',
  manualManagement: 'Manual Management',

  // 방화벽 장비관리
  fireEquipName: 'Firewall device name',
  // 네트워크 카테고리
  netcate6000: 'There is a lower category.',
  netcate02: 'Category Name',
  datacenterAdd: 'Datacenter registration',
  datacenterSelect: 'Select a datacenter',
  envSet: 'Environment Variable Setting',
  netcateNamePh: 'Please enter the category name',
  netcateCode: 'Please enter the code name',
  netcateInfoModify: 'Network Category Modification',

  // 환경변수 설정
  envName: 'Variable Name',
  envValue: 'Variable Value',
  isCypto: 'Encryption',
  envNamePh: 'Input variable name',
  envValuePh: 'Input variable value',
  envDescriptPh: 'Input note',
  areYouAddEnv: 'Would you like to add environment variables?',
  areYouUpdateEnv: 'Would you like to change the environment variable?',

  // IP 관리
  ipIsAutoSync: 'Automatic Synchronization',
  privateMesh: 'Private network',
  publicMesh: 'Public network',
  ipAutoSyncNoti: '※ In the case of private networks, IP may be duplicated, and IP IP in CMP does not progress.',
  doChangeSyncRadio: 'When changing, the contents below will be initialized.<br/>Do you still want to change?',
  manageTypeVlan: 'Management type - VLAN (VLAN ID, Range)',
  manageTypeRange: 'Management Type - Range',
  manageShortTypeVlan: 'Management Type - VLAN',
  manageShortTypeRange: 'Management Type - Range',

  // 서버 정보 추가 (모달)
  selectCreatedService: 'Select created service',
  placeServerName: 'Enter server name',
  addServerInformation: 'Add server information',

  // 서비스
  FailedToCallService: 'Failed to load service.<br /> Please contact the administrator.',
  PleaseSelectASwitchDeviceFirst: 'PleaseSelectASwitchDeviceFirst:',

  // 기타
  firstNetcate: "Please select a 'network category' first",
  firstBothProjectNct: "Please select 'project' and 'network category' first"
}
