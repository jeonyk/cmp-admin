import API from '@sd-fe/cmp-core'
import XLSX from 'xlsx'
import { uniqBy, maxBy, groupBy } from 'lodash'

/**
 * SheetJS > 시트를 생성 후 리턴합니다.
 * @param {Array} sheetData 시트에 뿌려줄 데이터
 * @param {Object, Array} sheetHeader 시트 헤더 바인딩 정보
 * @param {Array} mergeHeaderData 시트 헤더 머징 정보
 * @return sheet
 */
export const createSheet = (sheetData, sheetHeader, mergeHeaderData) => {
  if (!sheetData) return null

  const ws = XLSX.utils.json_to_sheet(sheetData, { header: [''] })
  const range = XLSX.utils.decode_range(ws['!ref'])
  // 헤더 정보 세팅

  if (Array.isArray(sheetHeader)) {
    // sheetHeader: [ {col: "B", row: 1, reqKey: "vmUuid", displayName: "VM UUID(*)", ... }] 의 형태

    sheetHeader.forEach((headerList, idx) => {
      headerList.forEach(h => {
        const address = h.col + h.row
        if (ws[address]) {
          ws[address].v = h.displayName || h.reqKey.toUpperCase()
        }
      })
    })
  } else {
    for (let c = range.s.c; c <= range.e.c; ++c) {
      // sheetHeader: { vmUuid: "VM UUID(*)", ... } 의 형태

      const address = XLSX.utils.encode_col(c) + '1' // <-- first row, column number c
      if (!ws[address]) continue

      ws[address].v = sheetHeader[ws[address].v] || ws[address].v.toUpperCase()
    }
  }
  if (mergeHeaderData) ws['!merges'] = mergeHeaderData

  return ws
}

/**
 * 작성 방법 시트 추가
 * @param {Object} wb 엑셀 파일
 * @param {Array} excelColumns 시트 컬럼 정보 (sample 정보 포함)
 * @param {Array} mergeHeaderData 헤더가 머지되었을 경우, 해당 정보
 */
export const setDataSampleSheet = (wb, excelColumns, mergeHeaderData) => {
  const sampleRowInfo = {}
  let headerData = []

  const removedFailMessageColumns = excelColumns.filter(col => col.bindingKey !== 'failMessage') // '실패 사유' 헤더 정보가 같이 넘어올 때를 대비
  const columns = uniqBy(removedFailMessageColumns, 'col')
  const groupedColumns = groupBy(excelColumns, 'row')
  headerData = Object.values(groupedColumns)

  columns.forEach(col => {
    if (col.sample) sampleRowInfo[col.reqKey] = col.sample
    else sampleRowInfo[col.reqKey] = ''
    // { imageId: '이미지', cateIdx: '네트워크 카테고리', ... } 의 형태로 변환
    // headerData[col.reqKey] = col.displayName
  })
  const resultSampleList = [sampleRowInfo]

  // 헤더 머징이 있는 경우
  const maxHeaderRow = maxBy(excelColumns, 'row').row
  for (let i = 1; i < maxHeaderRow; i++) {
    const obj = {}
    columns.forEach(col => {
      obj[col.reqKey] = ''
    })
    resultSampleList.unshift(obj)
  }

  const sampleSheet = createSheet(resultSampleList, headerData, mergeHeaderData)
  if (sampleSheet) XLSX.utils.book_append_sheet(wb, sampleSheet, '작성 방법')
}

/**
 * 프로젝트 목록 시트 추가
 * @param {Object} wb 엑셀 파일
 * @param {Array} projectList 프로젝트 목록 데이터
 */
export const setProjectListSheet = (wb, projectList, moduleType = 'NX') => {
  const resultProjects = []
  projectList.forEach(project => {
    const { companyName, groupName, projectName, projectIdx } = project
    if (project.moduleType === moduleType) {
      resultProjects.push({
        companyName, groupName, projectName, projectIdx
      })
    }
  })
  const projectHeader = {
    companyName: '관계사',
    groupName: '조직',
    projectName: '프로젝트',
    projectIdx: '프로젝트 IDX'
  }
  const projectSheet = createSheet(resultProjects, projectHeader)
  if (projectSheet) XLSX.utils.book_append_sheet(wb, projectSheet, '프로젝트 목록')
}

// 네트워크 카테고리 목록 시트 추가
export const setNetworkCategorySheet = async (wb) => {
  try {
    const data = await API.network.getNetworkCategory() || []
    const networkCategoryList = data.map(cate => ({
      codeValue: cate.codeValue,
      cateKey: cate.cateKey,
      ipCategoryIdx: cate.ipCategoryIdx
    }))

    const cateHeader = {
      codeValue: '네트워크 카테고리 명',
      cateKey: '네트워크 카테고리 KEY',
      ipCategoryIdx: '네트워크 카테고리 IDX'
    }
    const cateSheet = createSheet(networkCategoryList, cateHeader)
    if (cateSheet) XLSX.utils.book_append_sheet(wb, cateSheet, '네트워크 카테고리 목록')
  } catch (error) { throw new Error(error) }
}

// 그룹(그룹 - 그룹IDX) 목록 시트 추가
export const setGroupNameDepthSheet = async (wb) => {
  try {
    const data = await API.iam.getGroupNameDepth() || []

    const cateHeader = {
      groupName: '그룹 명',
      lineage: '그룹 상세',
      groupIdx: '그룹 IDX'
    }
    const cateSheet = createSheet(data, cateHeader)
    if (cateSheet) XLSX.utils.book_append_sheet(wb, cateSheet, '그룹 목록')
  } catch (error) { throw new Error(error) }
}

// 운영그룹
export const setManageGroupSheet = async (wb, moduleType = 'NX', operatingGroupType = 'COMPUTE') => {
  try {
    const { data } = await API.billing.getOperationGroup({
      moduleType,
      operatingGroupType
    }) || []

    const manageGroupList = data.map(group => ({
      operatingGroupName: group.operatingGroupName,
      operatingGroupIdx: group.operatingGroupIdx
    }))

    const manageGroupHeader = {
      operatingGroupName: '운영그룹 이름',
      operatingGroupIdx: '운영그룹 IDX'
    }
    const manageGroupSheet = createSheet(manageGroupList, manageGroupHeader)
    if (manageGroupSheet) XLSX.utils.book_append_sheet(wb, manageGroupSheet, '운영그룹 목록')
  } catch (error) { throw new Error(error) }
}

// 설치프로그램 목록
export const setInstallProgramSheet = async (wb) => {
  try {
    const data = await API.sw.getUsableInstallList({ onlyUsable: true }) || []
    const installList = data.map(sw => ({
      name: sw.name,
      osType: sw.osType,
      version: sw.version,
      versionId: sw.versionId
    }))
    installList.sort((a, b) => a.name - b.name)

    const installHeader = {
      name: 'S/W 라이선스 명',
      osType: '운영체제 유형',
      version: '버전',
      versionId: 'VERSION ID'
    }

    const installSheet = createSheet(installList, installHeader)
    if (installSheet) XLSX.utils.book_append_sheet(wb, installSheet, '설치 프로그램 목록')
  } catch (error) { throw new Error(error) }
}
// S/W 라이선스 목록
export const setSWLicenseSheet = async (wb) => {
  try {
    const data = await API.metering.getSWLicense() || []

    const swList = data.map(sw => ({
      name: sw.name,
      osSystem: sw.osSystem,
      osType: sw.osType,
      version: sw.version,
      swIdx: sw.swIdx
    }))
    swList.sort((a, b) => a.name - b.name)
    const swHeader = {
      name: 'S/W 라이선스 명',
      osSystem: '운영체제 유형',
      osType: '운영체제 구분',
      version: '버전',
      swIdx: 'SW IDX'
    }

    const swLicenseSheet = createSheet(swList, swHeader)
    if (swLicenseSheet) XLSX.utils.book_append_sheet(wb, swLicenseSheet, 'S⁄W 라이선스 목록')
  } catch (error) { throw new Error(error) }
}

// [NX] OS 이미지 목록
export const setNXImageSheet = async (wb) => {
  try {
    const data = await API.compute.getImages({ isManage: true }) || []
    const imageList = data.map(img => ({
      osName: img.osName,
      osDesc: img.osDesc,
      osType: img.osType,
      osBit: img.osBit,
      userImageIdx: img.userImageIdx
    }))

    const imageHeader = {
      osName: '이미지 이름',
      osDesc: '설명',
      osType: 'OS 구분',
      osBit: 'OS Bit',
      userImageIdx: 'OS 이미지 IDX'
    }
    const imageSheet = createSheet(imageList, imageHeader)
    if (imageSheet) XLSX.utils.book_append_sheet(wb, imageSheet, 'OS 이미지 목록')
  } catch (error) { throw new Error(error) }
}

// [VMware] OS 이미지 목록
export const setVMwareImageSheet = async (wb) => {
  try {
    const data = await API.vmware.image.getVMwareImageList({ isDisplay: true }) || []
    const imageList = data.map(img => ({
      userImageName: img.userImageName,
      osSystem: img.osSystem,
      osType: img.osType,
      osBit: img.osBit,
      userImageIdx: img.userImageIdx
    }))

    const imageHeader = {
      userImageName: '이미지 이름',
      osSystem: 'OS 유형',
      osType: 'OS 구분',
      osBit: 'OS Bit',
      userImageIdx: 'OS 이미지 IDX'
    }
    const imageSheet = createSheet(imageList, imageHeader)
    if (imageSheet) XLSX.utils.book_append_sheet(wb, imageSheet, 'OS 이미지 목록')
  } catch (error) { throw new Error(error) }
}

// [VMware] 네트워크 목록
export const setVMwareNetowkrInfoSheet = async (wb) => {
  try {
    const data = await API.vmware.network.getVmwareNetworkList() || []
    const networkList = data.map(net => ({
      hostname: net.hostname,
      hostUuid: net.hostUuid,
      name: net.name,
      networkId: net.networkId
    }))

    const networkHeader = {
      hostname: 'ESXi 명',
      hostUuid: 'hostUuid',
      name: '네트워크 명',
      networkId: '유닛 넘버'
    }
    const networkSheet = createSheet(networkList, networkHeader)
    if (networkSheet) XLSX.utils.book_append_sheet(wb, networkSheet, 'ESXi - 네트워크 정보')
  } catch (error) { throw new Error(error) }
}

// [VMware] vCenter + 클러스터 목록
export const setVMwareClusterSheet = async (wb) => {
  try {
    const data = await API.vmware.cluster.getVmwCluster() || []
    const clusterList = data.map(cl => ({
      connectName: cl.connectName,
      connectIdx: cl.connectIdx,
      clusterId: cl.clusterId,
      clusterName: cl.clusterName
    }))

    const clusterHeader = {
      connectName: 'vCenter 명',
      connectIdx: 'CONNECT IDX',
      clusterId: '클러스터 ID',
      clusterName: '클러스터 명'
    }
    const clusterSheet = createSheet(clusterList, clusterHeader)
    if (clusterSheet) XLSX.utils.book_append_sheet(wb, clusterSheet, 'vCenter - 클러스터 목록')
  } catch (error) { throw new Error(error) }
}

// [Network] 사용 가능한 미등록 방화벽 목록
export const setUsablePolicySheet = async (wb, usablePolicyList) => {
  try {
    const data = usablePolicyList || []
    const policyList = data.map(pl => ({
      policyName: pl.policyName,
      vdomId: pl.vdomId,
      srcAddress: pl.srcAddress,
      dstAddress: pl.dstAddress,
      comment: pl.comment,
      policyIdx: pl.policyIdx
    }))

    const policyHeader = {
      policyIdx: '정책 IDX',
      policyName: '정책명',
      vdomId: 'VDOM',
      srcAddress: '출발지',
      dstAddress: '목적지',
      comment: '설명'
    }
    const clusterSheet = createSheet(policyList, policyHeader)
    if (clusterSheet) XLSX.utils.book_append_sheet(wb, clusterSheet, '미등록 정책 목록')
  } catch (error) { throw new Error(error) }
}
