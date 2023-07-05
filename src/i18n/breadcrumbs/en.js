export default {
  main: 'Main',
  dashboard: 'Dashboard',
  // 검색
  SEARCH: {
    ResourceTagSearch: 'Resource Tag Search'
  },
  // 업무
  TASK: {
    title: 'Task',
    todo: 'To do',
    done: 'Work done',
    pay: 'Approval Box',
    document: 'Document'
  },
  // 서비스 카탈로그
  SC: {
    title: 'Service Catalog',
    mp: 'Marketplace',
    installProgram: 'InstallProgram',
    install: 'InstallProgram Management',
    instance: 'Instance Type',
    mpDetail: 'Marketplace Detail',
    ami: 'AMI image management',
    instanceType: 'Instance Type Management',
    ebs: 'EBS Type Management'
  },
  // 구성관리
  MANAGE: {
    title: 'Configuration Management',
    lac: 'Rack Mounting Diagram',
    pool: 'Resource Pool Group(CLUSTER)',
    datacenter: 'Datacenter',
    physical: 'Physical Server (HOST)',
    // 자원관리
    resource: 'Resource Management',
    resDetail: 'Resource Detail',
    project: 'Project Management',
    manageProject: 'Project',
    resourceOperation: 'Resource Management',
    resourceOperationBasket: 'Transfer Basket',
    service: 'Service',
    certification: 'SSL Certificate Management'
  },
  // 미터링
  METER: {
    title: 'Metering',
    status: 'Server Status',
    license: 'S/W License',
    product: 'Product'
  },
  // 빌링
  BILL: {
    title: 'Billing',
    dashboard: 'Dashboard',
    status: 'Billing Status',
    arrange: 'Billing Arrangement',
    // 모델
    MODEL: {
      title: 'Model',
      bill: 'Billing Model',
      dist: 'Distribution Model',
      server: 'Server-specific calibration model',
      compensation: 'Compensation model for each affiliate',
      regist: 'Regist'
    }
  },
  // 어드민 관리
  ADMIN: {
    ref: 'Reference Room Management',
    PKG: {
      main: 'CMP Package',
      mainExternal: 'CMP Package (External)',
      ssg: 'SSG',
      license: 'License Management',
      version: 'CMP Version Management',
      module: 'Module Management',
      moduleVersion: 'Module Version Management'
    },
    title: 'Admin Management',
    // 계정 관리
    ACC: {
      title: 'Account Management',
      user: 'User Account',
      manager: 'Operations Manager Account',
      ad: 'AD Account'
    },
    // 조직 관리
    ORG: {
      title: 'Organization Management',
      orgp: 'Organization-Project',
      orga: 'Organization-Account'
    },
    role: 'Role Management',
    roleDetail: 'Role Detail',
    // 공지사항
    NOTICE: {
      title: 'Notice',
      detail: 'Detailed inquiry',
      reg: 'Registration'
    },
    // 1:1문의
    IND: {
      title: '1:1 inquiry',
      detail: 'Detailed inquiry'
    },
    // 뉴스 관리
    NEWS: 'News Management',
    FAQ: {
      detail: 'Detailed inquiry'
    },
    workflow: 'Work Flow Management',
    integratedWorkManagement: 'Integrated Work Management',
    integratedWorkManagementTemplate: 'Add Template',
    dynamicMetaData: 'Dynamic Meta Data Management',
    // 환경설정
    CONF: {
      title: 'Preferences',
      proj: 'Project',
      // 네트워크 카테고리
      networkCate: 'Network Category Management',
      // 코드 관리
      CODE: {
        title: 'Code Management',
        defType: 'Type Definition',
        defCode: 'Code Definition'
      },
      MONIT: {
        title: ' Config Monitoring',
        monit: 'Setting Monitoring',
        monitServer: 'Setting Monitoring Server'
      },
      // 뉴타닉스 설정
      NUTA: {
        title: 'Nutanix Settings'
      },
      sto: 'Stopover Management',
      netEquip: 'Network Device Information',
      switch: 'Switch Equipment Information',
      vdom: 'Firewall VDOM Information',
      alarm: 'Alram Server Settings',
      monitor: 'Monitoring Server Setting',
      logging: 'Logging Server Setting',
      jdbc: 'Setting JDBC Connection',
      itsm: 'Setting ITSM Connection',
      itAutomation: 'Setting IT Automation',
      approval: 'Approval Settings',
      general: 'General Settings'
    },
    log: 'CMP Log Download',
    access: 'CMP Access Record',
    audit: 'CMP Audit',
    linkSetting: 'Link Setting',
    siteManaging: 'Site Managing'
  },
  PROFILE: {
    title: 'Profile Management',
    reg: 'Registration'
  },
  // AWS 관련
  AWS: {
    network: 'Network',
    subnet: 'Subnet',
    routingTable: 'Routing Table',
    internetGateway: 'Internet Gateway',
    natGateway: 'NAT Gateway',
    security: 'Security',
    networkAcl: 'Network ACL',
    securityGroup: 'Security Group',
    targetGroup: 'Target Group',
    albRules: 'ALB Rules',
    set: 'Preferences',
    setAws: 'AWS Setting',
    syncAccVpc: 'Group Account & VPC Management',
    configRegion: 'Regional Availability Zone Settings',
    monitoring: 'Monitoring Setting'
  },
  // 뉴타닉스 관련
  VMware: {
    configVmware: 'VMware 설정',
    configVmwareCenter: 'vCenter',
    configVmwareEsxi: 'ESXi'
  }
}
