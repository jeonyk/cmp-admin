import Vue from 'vue'
const $v = Vue.prototype.$v
/**
 * ip데이터를 세팅 (Excel 추출, sorting을 위함)
 */
export const setIpsData = ips => {
  if (!ips?.length) return ''
  if (ips.length === 1) return ips[0]
  else {
    let ipsList = ''
    for (let i = 1; i < ips.length; i++) ipsList += ips[i] + ', '
    return ipsList
  }
}

// 데이터 공통 가공
const setOsName = ({ osName, osBit }) => osName ? `${osName} (${osBit})` : '-' // OS/OS 버전
const setVcpu = x => `${x} Core` // vCPU
const setMemory = x => `${x} GB` // 메모리
const setInstallProgramList = items => (items && items.length) ? items.map(item => { return item.softwareName }) : [] // 설치프로그램
const setRootDiskSize = x => `${x || 0} GB` // RootDisk / DB Size
const setNetworkArea = networkList => networkList?.length ? networkList[0].cateKey : '-'
const convertDate = date => this.$options.filters.date(date, 'YYYY.MM.DD')
const setDiskValue = items => { // 크기 (신청 용량)
  if (!items) return { size: 0, count: 0 }

  let size = 0
  items.forEach(item => (size += item.diskSize))
  const count = items.length

  return { size, count }
}
const setDiskSize = x => x ? `${x || 0} GB` : '-' // 크기 (신청 용량) - display용
const setConnectedVms = items => (items && items.length) ? items.map(item => { return item.hostname }) : [] // 연결 호스트명
const setFilterVmList = items => items.filter(item => !item.deleted)
const setVms = vms => vms ? (vms[0]) + ((vms.length - 1) > 0 ? ` 외 ${vms.length - 1}` : '') : '-' // 연결 호스트명 - display용
const setEngineInfo = ({ engineType, version, engineVersion, topology }) => `${engineType} / ${version || engineVersion} / ${topology}` // DB Engine
const setOsInfo = ({ osName, osVersion, osPlatform }) => `${osName} / ${osVersion} / ${osPlatform}` // OS
const setMaxSizeGiB = x => `${x} GB`

/**
 * COMPUTE 데이터 가공
 * @param {Object} p basketData
 * @returns p
 */
export const setOrderDataCOMPUTE = p => {
  // 이전 사용
  p.orderData.externalDiskCount = 0
  p.orderData.externalDiskUsage = 0

  if (p.orderData.guestOsVersion) {
    const guestOsVersion = this.$options.filters.guestOsVersion(p.orderData.guestOsVersion)
    p.orderData.osType = guestOsVersion.osType
    p.orderData.osBit = guestOsVersion.osBit
    p.orderData.osName = guestOsVersion.osName
  }

  // ExternalDisk 계산
  if (p.orderData.externalDiskList) {
    const externalDiskList = p.orderData.externalDiskList.filter(disk => !disk.deleted)
    const exDiskList = []

    for (let j = 0; j < externalDiskList.length; j++) {
      const exDisks = externalDiskList[j]

      // OVA 일 때만 제외
      if (p.service === 'OVA') {
        if (exDisks.adapterType === 'SCSI' && exDisks.deviceIndex === 0) continue
      }
      if (exDisks.diskSize) p.orderData.externalDiskUsage += externalDiskList[j].diskSize

      p.orderData.externalDiskCount += 1
      exDiskList.push(exDisks)
    }
    p.orderData.externalDiskList = [...exDiskList]
  }

  // 설치프로그램 목록
  if (p.orderData.installProgramList) {
    p.orderData.installPrograms = setInstallProgramList(p.orderData.installProgramList)
  }

  // 네트워크 카테고리
  p.orderData.networkArea = setNetworkArea(p.orderData.networkList)
  p.orderData.ipLabel = p.orderData.ips ? setIpsData(p.orderData.ips) : '-'

  if (p.createTime) p.createTimeTemp = this.$options.filters.dateSimple(p.createTime)

  // 새로운 UI ticket 용 ✅ ================
  const { hostname, osName, osBit, vcpu, memory, rootDiskSize, installProgramList, userAppIdx, ipLabel, externalDiskList, externalDiskUsage, externalDiskCount, networkArea, beforeData: before } = p.orderData
  // const byte = this.$options.filter.byte // 단위 변환

  let beforeData = null
  if (before) {
    beforeData = {
      vcpu: setVcpu(before.vcpu), // vCPU
      memory: setMemory(before.memory), // 메모리
      installPrograms: before.installProgramList, // 설치프로그램
      rootDiskSize: setRootDiskSize(before.rootDiskSize), // RootDisk
      networkArea: setNetworkArea(before.networkList),
      externalDiskUsage: before.externalDiskList // ExternalDisk
    }
  }

  p.orderDataForTicket = {
    name: hostname, // 호스트명
    osName: setOsName({ osName, osBit }), // OS/OS 버전
    vcpu: setVcpu(vcpu), // vCPU
    memory: setMemory(memory), // 메모리
    rootDiskSize: setRootDiskSize(rootDiskSize), // RootDisk
    installPrograms: installProgramList, // 설치프로그램
    ipLabel: `${ipLabel}`, // IP
    networkArea, // 네트워크 카테고리
    externalDiskUsage: externalDiskList, // ExternalDisk
    isMP: !!userAppIdx, // MP 에서 생성된 자원인지 확인
    externalDiskUsageForPDF: `${externalDiskUsage} GB (${externalDiskCount} EA)`, // ExternalDisk (PDF 다운로드용)
    installProgramsForPDF: `${installProgramList ? installProgramList.length : 0} EA`, // 설치프로그램 (PDF 다운로드용)
    beforeData
  }

  return p
}

/**
 * SECURITY 데이터 가공
 * @param {Object} p basketData
 * @returns p
 */
export const setOrderDataSECURITY = p => {
  if (p.createTime) p.createTimeTemp = this.$options.filters.dateSimple(p.createTime)

  // 새로운 UI ticket 용 ✅ ================
  const { securityGroupName, startTime, endTime } = p.orderData

  p.orderDataForTicket = {
    name: securityGroupName, // 보안 그룹명
    startTime: convertDate(startTime), // 시작일
    endTime: convertDate(endTime) // 종료일
  }

  return p
}

/**
 * NETWORK_L4 데이터 가공
 * @param {Object} p basketData
 * @returns p
 */
export const setOrderDataNETWORKL4 = p => {
  if (p.createTime) p.createTimeTemp = this.$options.filters.dateSimple(p.createTime)

  // 새로운 UI ticket 용 ✅ ================
  const { vrserverName, ip, port, protocolType, method, beforeData = null } = p.orderData

  p.orderDataForTicket = {
    name: vrserverName, // 로드밸런스명
    ip, // 가상 IP
    port, // 포트
    protocolType, // 프로토콜
    method, // 방식
    beforeData
  }
  return p
}

/**
 * NETWORK_L4 데이터 가공
 * @param {Object} p basketData
 * @returns p
 */
export const setOrderDataNETWORKL7 = p => {
  if (p.createTime) p.createTimeTemp = this.$options.filters.dateSimple(p.createTime)

  // 새로운 UI ticket 용 ✅ ================
  const { csVrserverName, ip, port, protocolType, method } = p.orderData

  p.orderDataForTicket = {
    name: csVrserverName, // 로드밸런스명
    ip, // 가상 IP
    port, // 포트
    protocolType, // 프로토콜
    method // 방식
  }

  return p
}

/**
 * STORAGE 데이터 가공
 * @param {Object} p basketData
 * @returns p
 */
export const setOrderDataSTORAGE = p => {
  const { size, count } = setDiskValue(p.orderData.diskList)

  // 연결 호스트 정보 세팅
  if (p.orderData.vmList) {
    p.orderData.connectedVms = setConnectedVms(p.orderData.vmList)
    p.orderData.filterVmList = setFilterVmList(p.orderData.vmList)
  }
  // 크기 (신청 용량) 정보 세팅
  p.orderData.diskSize = size
  p.orderData.diskCount = count

  if (p.createTime) p.createTimeTemp = this.$options.filters.dateSimple(p.createTime)

  // 새로운 UI ticket 용 ✅ ================
  const { storageName, connectedVms, diskSize, diskCount, beforeData: before } = p.orderData

  // [변경] 자원일 경우, 변경 전 데이터를 가져옵니다. 그 외 자원인 경우는 null
  let beforeData = null
  if (before) {
    const { size, count } = setDiskValue(before.diskList)
    const connectedVms = setConnectedVms(before.vms)

    beforeData = {
      connectedVms: setVms(connectedVms), // 연결 호스트명
      diskSize: setDiskSize(size), // 크기 (신청 용량)
      diskCount: count // 수량
    }
  }

  p.orderDataForTicket = {
    name: storageName, // Volume 그룹명
    connectedVms: setVms(connectedVms), // 연결 호스트명
    diskSize: setDiskSize(diskSize), // 크기 (신청 용량)
    diskCount, // 수량
    beforeData
  }

  return p
}

/**
 * DATABASE 데이터 가공
 * @param {Object} p basketData
 * @returns p
 */
export const setOrderDataDATABASE = p => {
  if (p.createTime) p.createTimeTemp = this.$options.filters.dateSimple(p.createTime)

  // 새로운 UI ticket 용 ✅ ================
  const { hostname, port, vcpu, memory, rootDiskSize, osName, osVersion, osPlatform, networkList, engineType, version, engineVersion, topology, ip, beforeData: before } = p.orderData

  // [변경] 자원일 경우, 변경 전 데이터를 가져옵니다. 그 외 자원인 경우는 null
  let beforeData = null
  if (before) {
    beforeData = {
      engineInfo: setEngineInfo({ // DB Engine
        engineType: before.engineType,
        version: before.version,
        engineVersion: before.engineVersion,
        topology: before.topology
      }),
      vcpu: setVcpu(before.vcpu),
      rootDiskSize: setRootDiskSize(before.rootDiskSize),
      osInfo: setOsInfo({ osName: before.osName, osVersion: before.osVersion, osPlatform: before.osPlatform })
    }
  }

  p.orderDataForTicket = {
    name: hostname, // 호스트명
    engineInfo: setEngineInfo({ engineType, version, engineVersion, topology }), // DB ENGINE
    vcpu: setVcpu(vcpu), // vCPU
    memory: setMemory(memory), // 메모리
    rootDiskSize: setRootDiskSize(rootDiskSize), // DB Size
    osInfo: setOsInfo({ osName, osVersion, osPlatform }), // OS
    ip: `${ip || '-'} (${networkList?.length ? networkList[0]?.cateKey : '-'})`, // IP
    port, // 포트
    beforeData
  }

  return p
}

/**
 * MARKET 데이터 가공
 * @param {Object} p basketData
 * @returns p
 */
export const setOrderDataMARKET = p => {
  // 설치프로그램 목록
  if (p.orderData.installProgramList) {
    p.orderData.installPrograms = setInstallProgramList(p.orderData.installProgramList)
  }

  if (p.createTime) p.createTimeTemp = this.$options.filters.dateSimple(p.createTime)

  let extDiskSum = 0
  let extDiskCnt = 0

  p.orderData.externalDiskList.forEach(data => {
    extDiskSum = extDiskSum + data.diskSize
    extDiskCnt = extDiskCnt + 1
  })
  p.orderData.extDiskSum = extDiskSum
  p.orderData.extDiskCnt = extDiskCnt
  p.osVersion = p.orderData.osName

  // 네트워크 카테고리
  p.orderData.networkArea = setNetworkArea(p.orderData.networkList)

  // 새로운 UI ticket 용 ✅ ================
  const { hostname, osName, osBit, vcpu, memory, rootDiskSize, installProgramList, pgName, nics, externalDiskList, networkArea, beforeData: before } = p.orderData

  // [변경] 자원일 경우, 변경 전 데이터를 가져옵니다. 그 외 자원인 경우는 null
  let beforeData = null
  if (before) {
    beforeData = {
      vcpu: setVcpu(before.vcpu), // vCPU
      memory: setMemory(before.memory), // 메모리
      installPrograms: before.installProgramList, // 설치프로그램
      rootDiskSize: setRootDiskSize(before.rootDiskSize), // RootDisk
      networkArea: setNetworkArea(before.networkList),
      externalDiskUsage: `${before.externalDiskUsage || 0} GB (${before.externalDiskCount} EA)` // ExternalDisk
    }
  }

  p.orderDataForTicket = {
    name: hostname, // 호스트명
    osName: setOsName({ osName, osBit }), // OS/OS 버전
    vcpu: setVcpu(vcpu), // vCPU
    memory: setMemory(memory), // 메모리
    rootDiskSize: setRootDiskSize(rootDiskSize), // RootDisk
    installPrograms: installProgramList, // 설치프로그램
    ipLabel: `${nics ? nics[0]?.ipAddress : '-'}`, // IP
    networkArea, // 네트워크 카테고리
    appliation: pgName,
    externalDiskUsage: externalDiskList, // ExternalDisk
    installProgramsForPDF: `${installProgramList ? installProgramList.length : 0} EA`, // 설치프로그램 (PDF 다운로드용)
    externalDiskUsageForPDF: extDiskSum ? `${extDiskSum} GB (${extDiskCnt} EA)` : '-', // ExternalDisk (PDF 다운로드용)
    beforeData
  }
  return p
}

/**
 * FILE_SERVER 데이터 가공
 * @param {Object} p basketData
 * @returns p
 */
export const setOrderDataSHARE = p => {
  // 새로운 UI ticket 용 ✅ ================
  const { shareName, maxSizeGiB, protocolType, mountPath, beforeData: before } = p.orderData

  // [변경] 자원일 경우, 변경 전 데이터를 가져옵니다. 그 외 자원인 경우는 null
  let beforeData = null
  if (before) {
    beforeData = {
      maxSizeGiB: setMaxSizeGiB(before.maxSizeGiB),
      protocolType: before.protocolType,
      mountPath: before.mountPath
    }
  }

  p.orderDataForTicket = {
    name: shareName, // NAS 명
    maxSizeGiB: setMaxSizeGiB(maxSizeGiB), // 최대 용량
    protocolType, // 프로토콜 타입
    mountPath, // 마운트 경로
    beforeData
  }

  return p
}

/**
 * EC2 데이터 가공
 * @param {Object} p basketData
 * @returns p
 */
export const setOrderDataEC2 = p => {
  if (p.createTime) p.createTimeTemp = this.$options.filters.dateSimple(p.createTime)

  const { instanceTypeDto, vpcDto, subnetDto, amazonImageDto } = p.orderData
  if (!instanceTypeDto || !vpcDto || !subnetDto || !amazonImageDto) return false

  const { instanceType, vcpu, memory } = p.orderData?.instanceTypeDto
  const { environment } = p.orderData?.vpcDto
  const { isPublic } = p.orderData?.subnetDto
  // console.log(p.orderData?.blockDeviceMapping)

  // 스토리지
  const storage = p.orderData?.blockDeviceMapping.length - 1

  // VPC (STG 스테이징, DEV 개발, PRD 운영)
  const envType = { STG: $v('스테이징'), DEV: $v('개발'), PRD: $v('운영') }

  // 보안그룹
  const groups = p.orderData?.securityGroupDtoList
  const group = (groups[0]?.groupName) + ((groups.length - 1) > 0 ? ` 외 ${groups.length - 1}` : '')

  p.orderDataForTicket = {
    name: p.orderData.instanceName,
    instanceType: instanceType || '-', // 인스턴스 유형
    vcpu: `${vcpu} Core` || '-', // vCPU
    memory: `${memory} (GiB)` || '-', // 메모리
    storage: '루트' + ((storage > 0) ? ` 외 ${storage}` : ''), // 스토리지
    vpc: envType[environment] || '-', // VPC
    subnet: (isPublic ? '외부' : '내부') || '-', // 서브넷
    group: groups.length ? group : '-', // 보안그룹
    monitoringState: p.orderData.monitoringState ? '활성' : '비활성', // 세부 모니터링
    beforeData: p.orderData.beforeData
  }

  return p
}

/**
 * EFS 데이터 가공
 * @param {Object} p basketData
 * @returns p
 */
export const setOrderDataEFS = p => {
  if (p.createTime) p.createTimeTemp = this.$options.filters.dateSimple(p.createTime)

  const { fileSystemName, environment, isRegion, performanceMode, throughputMode, beforeData: before } = p.orderData

  // VPC (STG 스테이징, DEV 개발, PRD 운영)
  const envType = { STG: $v('스테이징'), DEV: $v('개발'), PRD: $v('운영') }

  // 성능모드
  const perfMode = { generalPurpose: $v('범용모드') }

  // 파일 처리량
  const processMode = { bursting: $v('버스트모드') } // 버스트모드vs프로비저닝됨

  // [변경] 자원일 경우, 변경 전 데이터를 가져옵니다. 그 외 자원인 경우는 null
  let beforeData = null
  if (before) {
    beforeData = {
      name: before.fileSystemName,
      environment: envType[before.environment] || '-', // 위치
      isRegion: before.isRegion ? 'Region' : 'One Zone', // 적용범위 (Region)
      performanceMode: perfMode[before.performanceMode] || '-', // 성능모드
      throughputMode: processMode[throughputMode] || '-' // 파일처리량
    }
  }

  p.orderDataForTicket = {
    name: fileSystemName,
    environment: envType[environment] || '-', // 위치
    isRegion: isRegion ? 'Region' : 'One Zone', // 적용범위 (Region)
    performanceMode: perfMode[performanceMode] || '-', // 성능모드 (performanceMode - 범용모드)
    throughputMode: processMode[throughputMode] || '-', // 파일처리량
    beforeData
  }
  return p
}

/**
 * SECURITY_GROUP 데이터 가공
 * @param {Object} p basketData
 * @returns p
 */
export const setOrderDataSG = p => {
  if (p.createTime) p.createTimeTemp = this.$options.filters.dateSimple(p.createTime)

  const { groupName, description, vpcKor, securityGroupRuleDtoList } = p.orderData

  // 인바운드/아웃바운드 그룹
  const inbound = securityGroupRuleDtoList.filter(({ isEgress }) => !isEgress)
  const outbound = securityGroupRuleDtoList.filter(({ isEgress }) => isEgress)

  const except = (bnd) => bnd.length > 1 ? ` 외 ${bnd.length - 1}` : ''
  const inboundGroup = inbound.length ? `${inbound[0].protocol === '-1' ? '모두' : inbound[0]?.protocol} ${inbound[0]?.ipv4Ranges}${except(inbound)}` : '-'
  const outboundGroup = outbound.length ? `${outbound[0].protocol === '-1' ? '모두' : outbound[0]?.protocol} ${outbound[0]?.ipv4Ranges}${except(outbound)}` : '-'

  // 🟡 아직 변경건 불가능
  // [변경] 자원일 경우, 변경 전 데이터를 가져옵니다. 그 외 자원인 경우는 null
  // let beforeData = null
  // if (before) {
  //   beforeData = {
  //     name: groupName,
  //     description,
  //     vpcKor,
  //     inboundGroup,
  //     outboundGroup
  //   }
  // }

  p.orderDataForTicket = {
    name: groupName,
    description,
    vpcKor,
    inboundGroup,
    outboundGroup,
    beforeData: {}
  }
  return p
}

/**
 * TARGET_GROUP 데이터 가공
 * @param {Object} p basketData
 * @returns p
 */
export const setOrderDataTARGETGROUP = p => {
  if (p.createTime) p.createTimeTemp = this.$options.filters.dateSimple(p.createTime)

  const { targetGroupName, targetType: type, protocol, port, healthCheckPath } = p.orderData

  // 대상그룹 유형
  const targetType = {
    instance: $v('인스턴스'),
    ip: 'IP'
  }[type]

  p.orderDataForTicket = {
    name: targetGroupName,
    targetType,
    servicePort: `${protocol || '-'} : ${port || '-'}`, // 대상그룹 서비스 포트
    healthCheckPath: healthCheckPath || '-' // 상태확인 경로
  }
  return p
}

/**
 * NLB_L4 데이터 가공
 * @param {Object} p basketData
 * @returns p
 */
export const setOrderDataNLB = p => {
  if (p.createTime) p.createTimeTemp = this.$options.filters.dateSimple(p.createTime)

  const { elbName, isPublic, registerListener, vpcRaw } = p.orderData
  // VPC (STG 스테이징, DEV 개발, PRD 운영)
  const envType = { STG: $v('스테이징'), DEV: $v('개발'), PRD: $v('운영') }

  const targetGroups = registerListener?.map(({ port, protocol, targetGroup }) => targetGroup ? targetGroup.targetGroupName : null)
  const groups = targetGroups.length > 1 ? `${targetGroups[0]} 외 ${targetGroups.length - 1}` : targetGroups[0]

  p.orderDataForTicket = {
    name: elbName,
    loadbalancerType: 'Network Load Balancer', // 로드밸런서 종류
    registerListener: targetGroups.length ? groups : '-',
    vpc: envType[vpcRaw.environment] || '-', // VPC
    isPublic: isPublic ? $v('외부') : $v('내부') // 스키마
  }

  return p
}

/**
 * TRANSIT_GATEWAY 데이터 가공
 * @param {Object} p basketData
 * @returns p
 */
export const setOrderDataTGW = p => {
  p.orderDataForTicket = {
    ...p.orderData,
    name: p.orderData.resourceName
  }

  return p
}

/**
 * VM 데이터 가공
 * @param {Object} p basketData
 * @returns p
 */
export const setOrderDataVM = p => {
  // 이전 사용
  p.orderData.externalDiskCount = 0
  p.orderData.externalDiskUsage = 0

  if (p.orderData.guestOsVersion) {
    const guestOsVersion = this.$options.filters.guestOsVersion(p.orderData.guestOsVersion)
    p.orderData.osType = guestOsVersion.osType
    p.orderData.osBit = guestOsVersion.osBit
    p.orderData.osName = guestOsVersion.osName
  }

  // ExternalDisk 계산
  if (p.orderData.externalDiskList) {
    const externalDiskList = p.orderData.externalDiskList.filter(disk => !disk.deleted)
    const exDiskList = []

    for (let j = 0; j < externalDiskList.length; j++) {
      const exDisks = externalDiskList[j]

      // OVA 일 때만 제외
      if (p.service === 'OVA') {
        if (exDisks.adapterType === 'SCSI' && exDisks.deviceIndex === 0) continue
      }
      if (exDisks.diskSize) p.orderData.externalDiskUsage += externalDiskList[j].diskSize

      p.orderData.externalDiskCount += 1
      exDiskList.push(exDisks)
    }
    p.orderData.externalDiskList = [...exDiskList]
  }

  // 설치프로그램 목록
  if (p.orderData.installProgramList) {
    p.orderData.installPrograms = setInstallProgramList(p.orderData.installProgramList)
  }

  // 네트워크 카테고리
  p.orderData.networkArea = setNetworkArea(p.orderData.networkList)
  p.orderData.ipLabel = p.orderData.ips ? setIpsData(p.orderData.ips) : '-'

  if (p.createTime) p.createTimeTemp = this.$options.filters.dateSimple(p.createTime)

  // 새로운 UI ticket 용 ✅ ================
  const { hostname, deployHostname, osName, osBit, vcpu, memory, rootDiskSize, installProgramList, userAppIdx, ipLabel, externalDiskList, externalDiskUsage, externalDiskCount, networkArea, beforeData: before } = p.orderData

  let beforeData = null
  if (before) {
    beforeData = {
      vcpu: setVcpu(before.vcpu), // vCPU
      memory: setMemory(before.memory), // 메모리
      installPrograms: before.installProgramList || [], // 설치프로그램
      rootDiskSize: setRootDiskSize(before.rootDiskSize), // RootDisk
      networkArea: setNetworkArea(before.networkList),
      externalDiskUsage: before.externalDiskUsage || [] // ExternalDisk
    }
  }

  p.orderDataForTicket = {
    name: hostname || deployHostname, // 호스트명
    osName: setOsName({ osName, osBit }), // OS/OS 버전
    vcpu: setVcpu(vcpu), // vCPU
    memory: setMemory(memory), // 메모리
    rootDiskSize: setRootDiskSize(rootDiskSize), // RootDisk
    installPrograms: installProgramList, // 설치프로그램
    ipLabel: `${ipLabel}`, // IP
    networkArea, // 네트워크 카테고리
    externalDiskUsage: externalDiskList, // ExternalDisk
    isMP: !!userAppIdx, // MP 에서 생성된 자원인지 확인
    externalDiskUsageForPDF: `${externalDiskUsage} GB (${externalDiskCount} EA)`, // ExternalDisk (PDF 다운로드용)
    installProgramsForPDF: `${installProgramList ? installProgramList.length : 0} EA`, // 설치프로그램 (PDF 다운로드용)
    beforeData
  }

  return p
}

/**
 * VSAN_ISCSI 데이터 가공
 * @param {Object} p basketData
 * @returns p
 */
export const setOrderDataVSAN = p => {
  const { size, count } = setDiskValue(p.orderData.diskList)

  // 연결 호스트 정보 세팅
  if (p.orderData.vmList) {
    p.orderData.connectedVms = setConnectedVms(p.orderData.vmList)
    p.orderData.filterVmList = setFilterVmList(p.orderData.vmList)
  }
  // 크기 (신청 용량) 정보 세팅
  p.orderData.diskSize = size
  p.orderData.diskCount = count

  if (p.createTime) p.createTimeTemp = this.$options.filters.dateSimple(p.createTime)

  // 새로운 UI ticket 용 ✅ ================
  const { storageName, connectedVms, diskSize, diskCount, beforeData: before } = p.orderData

  // [변경] 자원일 경우, 변경 전 데이터를 가져옵니다. 그 외 자원인 경우는 null
  let beforeData = null
  if (before) {
    const { size, count } = setDiskValue(before.diskList)
    const connectedVms = setConnectedVms(before.vmList)

    beforeData = {
      connectedVms: setVms(connectedVms), // 연결 호스트명
      diskSize: setDiskSize(size), // 크기 (신청 용량)
      diskCount: count // 수량
    }
  }

  p.orderDataForTicket = {
    name: storageName, // Volume 그룹명
    connectedVms: setVms(connectedVms), // 연결 호스트명
    diskSize: setDiskSize(diskSize), // 크기 (신청 용량)
    diskCount, // 수량
    beforeData
  }

  return p
}
