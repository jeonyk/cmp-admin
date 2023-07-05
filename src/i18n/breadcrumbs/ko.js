export default {
  main: '메인',
  dashboard: '대시보드',
  // 검색
  SEARCH: {
    ResourceTagSearch: '자원 태그 검색'
  },
  // 업무
  TASK: {
    title: '업무',
    todo: '할 일',
    done: '한 일',
    pay: '결재함',
    document: '보고서 작성'
  },
  // 서비스 카탈로그
  SC: {
    title: '서비스 카탈로그',
    mp: '마켓플레이스',
    installProgram: '설치프로그램',
    install: '설치프로그램 관리',
    instance: '인스턴스 타입',
    mpDetail: '마켓플레이스 상세',
    ami: 'AMI 이미지 관리',
    instanceType: '인스턴스 유형 관리',
    ebs: 'EBS 유형 관리'
  },
  // 구성관리
  MANAGE: {
    title: '구성관리',
    lac: '랙 실장도',
    pool: '자원풀그룹(CLUSTER)',
    datacenter: '데이터센터',
    physical: '물리서버(HOST)',
    // 자원관리
    resource: '자원관리',
    resDetail: '자원 상세',
    project: '프로젝트 관리',
    manageProject: '프로젝트',
    resourceOperation: '자원 운용',
    resourceOperationBasket: '이관 장바구니',
    service: '서비스',
    certification: 'SSL 인증서 관리'
  },
  // 미터링
  METER: {
    title: '미터링',
    status: '서버 현황',
    license: 'S/W 라이선스',
    product: '제품'
  },
  // 빌링
  BILL: {
    title: '빌링',
    dashboard: '대시보드',
    status: '과금 현황',
    arrange: '과금 배치',
    // 모델
    MODEL: {
      title: '모델',
      bill: '과금 모델',
      dist: '배부 모델',
      server: '서버별 보정 모델',
      compensation: '관계사별 보정 모델',
      regist: '등록'
    }
  },
  // 어드민 관리
  ADMIN: {
    ref: '자료실 관리',
    PKG: {
      main: 'CMP 패키지 관리',
      mainExternal: 'CMP 패키지 관리 (대외)',
      ssg: '신세계',
      license: '라이선스 관리',
      version: 'CMP 버전 관리',
      module: '모듈 관리',
      moduleVersion: '모듈 버전 관리'
    },
    title: '어드민 관리',
    // 계정 관리
    ACC: {
      title: '계정 관리',
      user: '사용자 계정',
      manager: '운영 관리자 계정',
      ad: 'AD 계정'
    },
    // 조직 관리
    ORG: {
      title: '조직 관리',
      orgp: '조직-프로젝트',
      orga: '조직-계정'
    },
    role: '역할 관리',
    roleDetail: '역할 상세',
    // 공지사항
    NOTICE: {
      title: '공지사항',
      detail: '상세 조회',
      reg: '등록'
    },
    // 1:1문의
    IND: {
      title: '1:1문의',
      detail: '상세 조회'
    },
    // 뉴스 관리
    NEWS: '뉴스 관리',
    FAQ: {
      detail: '상세 조회'
    },
    workflow: 'Workflow 관리',
    integratedWorkManagement: '통합 업무 관리',
    integratedWorkManagementTemplate: '템플릿 등록',
    dynamicMetaData: '동적 메타데이터 관리',
    // 환경설정
    CONF: {
      title: '환경설정',
      proj: '프로젝트',
      // 네트워크 카테고리
      networkCate: '네트워크 카테고리 관리',
      // 코드 관리
      CODE: {
        title: '코드 관리',
        defType: '타입 정의',
        defCode: '코드 정의'
      },
      // 뉴타닉스 설정
      NUTA: {
        title: '뉴타닉스 설정'
      },
      MONIT: {
        title: '모니터링 환경설정',
        monit: '모니터링 설정',
        monitServer: '모니터링 서버 설정'
      },
      sto: '경유지 관리',
      netEquip: '네트워크 장비 정보',
      switch: '스위치 장비 정보',
      firewallEquip: '방화벽 장비 정보',
      vdom: '방화벽 VDOM 정보',
      alarm: '알람 서버 설정',
      logging: '로깅 서버 설정',
      jdbc: '인사/조직 연동 설정',
      itsm: 'ITSM 연동 설정',
      itAutomation: 'IT Automation 연동',
      approval: '결재 설정',
      general: '일반 설정',
      setManualManagement: '수기관리여부(미지원장비)'

    },
    log: 'CMP 로그 다운로드',
    access: 'CMP 접근 기록',
    audit: 'CMP 접근 기록',
    linkSetting: '연동 설정',
    siteManaging: '사이트 관리'
  },
  PROFILE: {
    title: '프로파일 관리',
    reg: '등록'
  },
  // AWS 관련
  AWS: {
    network: '네트워크',
    subnet: '서브넷',
    routingTable: '라우팅 테이블',
    internetGateway: '인터넷 게이트웨이',
    natGateway: 'NAT 게이트웨이',
    security: '보안',
    networkAcl: '네트워크 ACL',
    securityGroup: '보안 그룹',
    targetGroup: '대상 그룹',
    albRules: 'ALB 규칙',
    set: '환경설정',
    setAws: 'AWS 환경설정',
    syncAccVpc: '동기화 계정 및 VPC 관리',
    configRegion: '리전별 가용 영역 설정',
    monitoring: '모니터링 설정'
  },
  // 뉴타닉스 관련
  VMware: {
    configVmware: 'VMware 설정',
    configVmwareCenter: 'vCenter',
    configVmwareEsxi: 'ESXi'
  }
}
