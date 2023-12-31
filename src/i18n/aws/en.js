export default {
  PLACEHOLDER: {
    '001': 'Search AMI name',
    '002': 'Please select an AMI',
    '003': 'Enter a search term',
    '004': 'The volume size of type {volumeType} must be at least {limit} GB.',
    '005': 'The volume size cannot be set smaller than the existing volume size. Existing volume size: {size}' + 'GB',
    '006': 'Storage of type {type} cannot exceed {max} IOPS when volume size is {size} GB.',
    '007': 'IOPS of type {type} must be entered between 3000 and 16000.',
    '008': 'Only integers can be entered for the volume size.',
    '009': 'Enabling Cloudwatcher enables detailed monitoring, but incurs additional costs.',
    '010': 'If you need to modify the instance specification, please contact 1:1 or an administrator.',
    '011': 'The exposed VPC network may differ depending on the type of VPC network set when creating the project.',
    '012': 'Please select a VPC.',
    '013': 'No modification history.',
    '014': 'No matching instance found. Please search again.',
    '015': 'No instance was created.',
    '016': 'You can enter a grace period from 1 to 99 days.',
    '017': 'Cancellation of deletion or change of deletion method is not allowed upon approval.',
    '018': 'You cannot delete a project when you set a waiting time for deletion, and you can delete a project after the waiting period is over.',
    '019': 'When the deletion waiting period is set, all costs incurred during the grace period are borne by the user.',
    '020': 'Deleting will remove all EBS associated with the instance.',
    '021': 'Please enter a verification code.',
    '022': 'Please check the verification code again.',
    '023': 'BASTION access information can be viewed after additional authentication is confirmed.',
    '024': 'You can mount Amazon EFS on a Linux instance in the following ways.',
    '025': 'Deleting will remove all contents of EFS.',
    '026': 'Deletion cannot be canceled upon approval of payment.',
    '027': 'Name cannot exceed 256 characters and includes letters, numbers and It must contain only the + - = . _ : / symbol.',
    '028': 'Please enter an EFS name.',
    '029': 'Please select a performance mode according to your intended use of EFS.',
    '030': 'Please select a mode to handle when uploading/downloading files to/from storage.',
    '031': 'Suitable for latency-sensitive cases',
    '032': 'Suitable for heavy-duty cases',
    '033': 'fixed at constant throughput',
    '034': 'Throttling throughput based on filesystem size',
    '035': 'No rules applied. Not allowed for all conditions.',
    '036': 'Enter a security group name (Korean cannot be entered)',
    '037': 'Enter a description of the security group. (Korean cannot be entered)',
    '038': 'No change in number of rules.',
    '039': 'Same rule already exists',
    '040': 'source (CIDR block)',
    '041': 'Please enter a rule description. (optional, not allowed to enter Korean)',
    '042': 'No rules were selected.',
    '043': 'Search for target group name',
    '044': 'The exposed VPC network may differ depending on the type of VPC network set when creating the project.',
    '045': 'Only lowercase letters, uppercase letters, numbers, and hyphens ("-") are allowed, and "-" cannot be used at the beginning or end.',
    '046': 'Register <b>{n}<b /> instances to the following ports.',
    '047': 'Support load balancing for instances within a specific VPC',
    '048': 'Support load balancing for VPC and on-premises resources',
    '049': 'Please select a VPC first.',
    '050': 'Search name',
    '051': 'There are no instances in the selected VPC.',
    '052': 'Search load balancer name',
    '053': 'Request for deletion after {date} days of waiting period for deletion',
    '054': 'Enter the name of the load balancer. (Korean cannot be entered)',
    '055': 'Only lowercase letters, uppercase letters, numbers, and hyphens ("-") are allowed, and "-" cannot be used at the beginning or end.',
    '056': 'The registered listener is initialized when the VPC is changed.',
    '057': 'Good for heavy traffic and simple routing',
    '058': 'No target group was created in the selected VPC.',
    '059': 'No changes were made.',
    '060': 'Additional fees are incurred depending on the number of VPC applications.',
    '061': 'If you want to create more than 4 VPCs, please contact us 1:1 after creating the project.',
    '062': '(deleted)',
    '063': 'Caution: When creating a Public Cloud project, the infrastructure environment is automatically configured, so you will be charged when the project is created.',
    '064': 'Not Applicable',
    '065': 'Prohibit root access by default',
    '066': 'Provide read-only access by default',
    '067': 'Anonymous access prohibited',
    '068': 'Enforce in-transit encryption for all clients',
    '069': '30 days have passed since last access',
    '070': 'Switch out of IA',
    '071': 'first time access'
  },
  TEXT: {
    '001': 'Instance basic information',
    '002': 'Instance name',
    '003': 'Select AMI',
    '004': 'Network/Security Group',
    '005': 'Create',
    '006': 'Detailed monitoring',
    '007': 'Review',
    '008': 'Select instance specification',
    '009': 'Select storage',
    '010': 'Next step',
    '011': 'Estimated monthly cost',
    '012': 'Operating System',
    '013': 'Not applicable',
    '014': 'Volume Type',
    '015': 'Root',
    '016': 'Capacity',
    '017': 'Throughput',
    '018': 'Disk name',
    '019': 'Volume Type',
    '020': 'Device',
    '021': 'Volume size',
    '022': 'Throughput (MB/sec)',
    '023': 'Network',
    '024': 'Basic information',
    '025': 'Instance specification',
    '026': 'Inside',
    '027': 'External',
    '028': 'Subnet',
    '029': 'Security group',
    '030': 'Search for security group name',
    '031': 'Inbound Rule',
    '032': 'Outbound rule',
    '033': 'Security group description',
    '034': 'Source',
    '035': 'Previous',
    '036': 'rule description',
    '037': 'total {n} cases',
    '038': 'Additional content',
    '039': 'Deleted contents',
    '040': 'Search instance name',
    '041': 'Out of root',
    '042': 'In progress',
    '043': 'Stop',
    '044': 'Running',
    '045': 'Exiting',
    '046': 'EC2 Application',
    '047': 'instance type',
    '048': 'last modified time',
    '049': 'Universal mode',
    '050': 'Maximum I/O mode',
    '051': 'Burst mode',
    '052': 'Provisioned',
    '053': 'Instance ID',
    '054': 'Creation time',
    '055': '{n} total',
    '056': 'deletion method',
    '057': 'from date of approval',
    '058': 'Delete after days',
    '059': 'Delete immediately after approval of payment',
    '060': 'I agree.',
    '061': 'Caution',
    '062': 'Details',
    '063': 'Monitoring',
    '064': 'Platform Details',
    '065': 'Location',
    '066': 'Access Information',
    '067': 'Confirm',
    '068': 'Check access information',
    '069': 'Authenticate',
    '070': 'Request verification code',
    '071': 'request for authentication number',
    '072': 'access path',
    '073': 'EFS name',
    '074': 'EFS location',
    '075': 'Performance mode',
    '076': 'Throughput mode',
    '077': 'Coverage',
    '078': 'Total size',
    '079': 'Main storage size',
    '080': 'IA storage size',
    '081': 'Search EFS name',
    '082': 'EFS Application',
    '083': 'Available',
    '084': 'connect',
    '085': 'EFS usage',
    '086': 'Request for deletion after {day} days of waiting period for deletion',
    '087': 'modification request',
    '088': 'deletion request',
    '089': 'create request',
    '090': 'EFS Connection',
    '091': 'mount via DNS',
    '092': 'mount via IP',
    '093': 'Use EFS-mounted helpers',
    '094': 'when using NFS client',
    '095': 'EFS lifecycle',
    '096': 'file system policy',
    '097': 'Switch to IA',
    '098': 'Switch out of IA',
    '099': 'file system policy',
    100: 'by default <br>root access is prohibited',
    101: 'by default<br>read-only access only',
    102: 'Anonymous access<br>prohibited',
    103: 'Enforce in-transit encryption for all clients',
    104: 'details',
    105: 'Access Point',
    106: 'Delete EFS',
    107: 'EFS name',
    108: 'EFS Basic Information',
    109: 'EFS Usage',
    110: 'Delete EFS',
    111: 'File Throughput',
    112: 'EFS fix',
    113: 'Currently only {item} can be selected.',
    114: 'Mount target',
    115: 'UTC time display',
    116: 'VPC type',
    117: 'Number of inbound rules',
    118: 'Number of outbound rules',
    119: 'Security group application',
    120: 'VPC All',
    121: 'Security group name',
    122: 'Security group information',
    123: 'Rule',
    124: 'Port range',
    125: 'Custom TCP',
    126: 'Custom UDP',
    127: 'Any TCP',
    128: 'Any UDP',
    129: 'All ICMP',
    130: 'All traffic',
    131: 'Custom',
    132: 'Object',
    133: 'Protocol type',
    134: 'Target group name',
    135: 'Target type',
    136: 'Number of registration targets',
    137: 'Target group application',
    138: 'Instance',
    139: 'Normal',
    140: 'Issue',
    141: 'Unused',
    142: 'Release',
    143: 'Number of targets',
    144: 'To register',
    145: 'Check status',
    146: 'Path',
    147: 'Normal threshold',
    148: 'Abnormal threshold',
    149: 'Number of consecutive health check failures',
    150: 'Timeout',
    151: 'Interval',
    152: 'Linked load balancer',
    153: 'Number of successive status check successes',
    154: 'Target group service port',
    155: 'Number of registration targets',
    156: 'Check target group service status',
    157: 'Health check protocol',
    158: 'Health check path',
    159: 'Set detailed health check properties',
    160: 'Select target',
    161: 'Target group information',
    162: 'Selected target',
    163: 'Port of instance',
    164: 'Register',
    165: 'Number of security groups',
    166: 'Target group type',
    167: 'Status check attribute',
    168: 'Target Group',
    169: 'except',
    170: 'Schema',
    171: 'Failure',
    172: 'Load balancer name',
    173: 'Availability Zone',
    174: 'Number of listeners',
    175: 'Number of target groups',
    176: 'Listener',
    177: 'Load balancer type',
    178: 'DNS name',
    179: 'Basic rule',
    180: 'Request immediate deletion',
    181: 'Status port',
    182: 'Timeout',
    183: 'Success code',
    184: 'EA',
    185: 'Delete security group',
    186: 'Security group details',
    187: 'Modify load balancer',
    188: 'Load Balancer Application',
    189: 'Load Balancer Basic Information',
    190: 'Load balancer type',
    191: 'Network Mapping',
    192: 'listener type',
    193: 'Select target group',
    194: 'service protocol',
    195: 'algorithm',
    196: 'Load Balancer Basic Information',
    197: 'listener/target group',
    198: 'Existing listener',
    199: 'New listener',
    200: 'Storage',
    201: 'Reflect on cart',
    202: 'existing',
    203: 'select security group',
    204: 'before modification',
    205: 'after correction',
    206: 'before change',
    207: 'after change'
  },
  ALERT: {
    '001': 'You cannot apply for the instance type {type} in the selected AMI.',
    '002': 'Failed to search AMI list.',
    '003': 'Are you sure you want to cancel the application?',
    '004': 'Please enter an instance name.',
    '005': 'Please select an instance specification.',
    '006': 'Please check storage.',
    '007': 'Duplicate instance name.<br>Please enter another name.',
    '008': 'There is an ongoing order with the same instance name.',
    '009': 'Estimated cost per month may differ from <br>actual billed.',
    '010': 'Cannot be changed when copying resources.',
    '011': 'Failed to query instance specification.',
    '012': 'Are you sure you want to <br>go to the instance basic information level?<br><span style="font-size: 12px; color: #{color};">* Edits in this step may be reset.< /span>',
    '013': 'Please select a subnet',
    '014': 'Please select a security group.',
    '015': 'Are you sure you want to add the application to your shopping cart?',
    '016': 'Are you sure you want to go to the previous step?',
    '017': 'Are you sure you want to <br>modify the application for instance basic information?<br><span style="color: #{color};">* Click OK to move to the appropriate step.</span>',
    '018': 'Are you sure you want to <br>modify the network/security group application?<br><span style="color: #{color};">* Click OK to move to the appropriate step.</span>',
    '019': 'Please select a service start date.',
    '020': 'You cannot apply.<br>For more information, please contact the administrator or 1:1 inquiry<br>.',
    '021': 'EC2 resource inquiry failed.',
    '022': 'The detailed EC2 resource inquiry failed.',
    '023': 'Failed to search Bastion data.',
    '024': 'Authentication in progress. Are you sure you want to cancel and close the popup?',
    '025': 'Please use after registering your e-mail.',
    '026': 'History inquiry failed.',
    '027': 'Are you sure you want to <br>modify the application for EFS basic information?<br><span style="color: #d95252;">* Click OK to move to the appropriate step.</span>',
    '028': 'Are you sure you want to add {req} to your shopping cart?',
    '029': 'Failed to reflect shopping cart.',
    '030': 'Please enter an EFS name.',
    '031': 'Please check your EFS name.',
    '032': 'A resource with the same EFS name exists in the current project.',
    '033': 'There is an ongoing order with the same EFS name.',
    '034': 'Added to cart.',
    '035': 'Failed to retrieve resource history.',
    '036': 'Are you sure you want to delete the rule?',
    '037': 'A resource with the same security group name exists in the current project.',
    '038': 'Please enter a security group name.',
    '039': 'Cannot enter Korean characters for security group name.',
    '040': 'Please enter a security group description.',
    '041': 'You cannot enter Korean in the security group description.',
    '042': 'Please enter the port range according to the rules.<br>Range (0-65535) or <br> One port between 0 and 65535',
    '043': 'Please check the rules.',
    '044': 'Are you sure you want to <br>modify the application for basic security group information?<br><span style="color: #d95252;">* Click OK to move to the appropriate step.</span>',
    '045': 'Enter the name of the target group (Korean cannot be entered)',
    '046': 'Out of the port input range.<br>For the port, only numbers between 1 and 65535 can be entered.',
    '047': 'VPC inquiry failed.',
    '048': 'Instance lookup failed.',
    '049': 'Please enter a path to check status.',
    '050': 'Please check the IP format.',
    '051': 'The same IP cannot be entered.',
    '052': 'IP can be entered within the IP band of the selected VPC<br><br><p style="color: #d95252;">IP band of the selected VPC: {cidr}</p>',
    '053': 'Please check the target group name.',
    '054': 'Please select a VPC.',
    '055': 'Please enter a target group name.',
    '056': 'Please check the target group name.<br>You can only enter English letters, numbers, and hyphens (-).',
    '057': 'A target group created with the same name exists.',
    '058': 'There is an ongoing order with the same group name.',
    '059': 'Please select a target type.',
    '060': 'Please select a destination',
    '061': 'Please enter the destination IP.',
    '062': 'Are you sure you want to <br>modify the application for the target group\'s basic information?<br><span style="color: #d95252;">* Click OK to move to the appropriate step.</span>',
    '063': 'NLB lookup failed.',
    '064': 'Are you sure you want to cancel the edit?',
    '065': 'Please register at least one listener.',
    '066': 'Please check the port of the listener.',
    '067': 'Please check the port range.<br>Only numbers between 1-65535 can be entered.',
    '068': 'A duplicate port exists on the listener.',
    '069': 'There is a listener that does not select a target group.',
    '070': 'Please enter a load balancer name.',
    '071': 'Please check the load balancer name.',
    '072': 'Please check the name of the load balancer.<br>Only English letters, numbers, and hyphens (-) can be entered.',
    '073': 'A resource with the same load balancer name exists.',
    '074': 'There is an ongoing order with the same load balancer name.',
    '075': 'The target group search failed.',
    '076': 'The target group detailed search failed.',
    '077': 'Please select a target group.',
    '078': 'Are you sure you want to<br>edit {message}?<br><span style="color: #d95252;">* Click OK to go to the next step.</span>',
    '079': 'This project is not the correct type.',
    '080': 'The selected role does not exist.<br>Please select it again.',
    '081': 'The selected operator does not exist.<br>Please select again.',
    '082': 'The selected region requires<br>registration of bastion ami image or<br>setting of instance type.<br>Please contact the administrator.',
    '083': 'The selected region<br>requires two default zone settings.<br>Please contact your administrator.',
    '084': 'The selected region requires<br>ami init script configuration<br>Please contact your administrator.',
    '085': 'You need to set the vpc cidr option.<br>Please contact your administrator.',
    '086': 'The project cannot be created<br>in the selected region.<br>Please contact your administrator.',
    '087': 'Estimated monthly charges may differ from <br>actual charges.',
    '088': 'After running the simulation of the selected resource,<br>we will notify you in advance of whether you can apply.',
    '089': 'Are you sure you want to change the resource?'
  },
  operate: 'Operate',
  development: 'Development',
  staging: 'Staging',
  month_price: 'Estimated Monthly Cost',
  simulation_status: 'Simulation Status',
  instance: 'Instance',
  instance_name: 'Instance Name',
  os: 'Operating System',
  instance_spec: 'Instance Spec',
  memory_gib: 'Memory (GiB)',
  network_performance: 'Network Performance',
  detail_monitor: 'Detail Monitoring',
  root: 'root',
  all: 'all',
  volume_type: 'Volume Type',
  device: 'Device',
  volume_size: 'Volume Size',
  iops: 'IOPS',
  amount: 'Throughput (MB/sec)',
  rule_desc: 'Rule Description',
  source: 'Source',
  EFS_name: 'EFS name',
  general_purpose: 'General mode',
  file_process_amount: 'File throughput',
  provisioned: 'Provisioned',
  filesystem_policy: 'Filesystem Policy',
  data_lifecycle: 'data lifecycle',
  ia_swap: 'IA switch',
  security_group_info: 'Security Group Information',
  security_name: 'security Group Name',
  detail: 'Application Details',
  protocol_type: 'Protocol Type',
  port_range: 'Port Range',
  targetGroup: 'Target Group',
  targetGroupInfo: 'Target group information',
  basicInfo: 'Basic Information',
  targetGroupName: 'Target Group Name',
  targetGroupType: 'Target Group Type',
  targetGroupServicePort: 'Target Group Service Port',
  targetGetServiceStatus: 'Check Target Group Service Status',
  statusProtocol: 'Status Protocol',
  statusRoute: 'Status Route',
  statusAttribute: 'Status Check Attribute',
  timeover: 'timeout',
  normalExp: 'normal threshold',
  abnormalExp: 'abnormal threshold',
  interval: 'interval',
  second: 'seconds',
  successTimes: 'Number of successive successive status checks',
  failTimes: 'Number of consecutive health check failures',
  loadbalancerInfo: 'Load Balancer Basic Information',
  loadbalancerName: 'load balancer name',
  loadbalancerType: 'Load balancer type',
  loadbalancerGroup: 'Listener/target group',
  loadbalancerListener: 'Listener',

  STATUS: {
    fold: 'Fold',
    open: 'Open',
    active: 'Activate',
    deactive: 'Inactivate',
    external: 'External',
    internal: 'Internal'
  },

  COL: {
    selectRegion: 'Select Region',
    vpcType: 'VPC connection type',
    vpcSelect: 'VPC Select',
    manager: 'Operation manager'
  }
}
