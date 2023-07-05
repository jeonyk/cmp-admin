/**
  * 파일명 : BillingModule.js
  * 파일 기능 : [구상관리 > 프로젝트 관리 > 자원운용] 자원 조회 API 모음
  * 작성자 : 김예담
  * 최종 작성일 : 2021-11-12
  * License By Shinsegae I&C
 **/
import API from '@sd-fe/cmp-core'
/**
 * API : VM(Compute) 자원 조회
 */
export const getVmList = async (params) => {
  try {
    const data = await API.compute.getVms(params)
    const computeData = []

    if (data) {
      data.forEach(item => {
        if (item.era) return

        const vm = {
          ...item,
          workType: 'COMPUTE',
          resourceType: 'GENERAL',
          resourceId: item.vmUuid,
          resourceName: item.computeName
        }

        if (vm.market) {
          vm.itsmName = vm.market.itsmName
          // vm.osType = vm.market.reqInfo?.osType
          // vm.osBit = vm.market.reqInfo?.osBit
          // vm.osName = vm.market.reqInfo?.osName
        }

        computeData.push(vm)
      })
    }
    return computeData
  } catch (error) {
    console.error(error)
    return []
  }
}

/**
 * API : VM(Compute) 자원 조회 - 미등록
 */
export const getUnregistersVms = async () => {
  try {
    const data = await API.compute.getUnregistersVms()
    let computeData = []

    if (data) {
      computeData = data.map(item => {
        return {
          ...item,
          workType: 'COMPUTE',
          resourceType: 'UNREGISTERED',

          hostname: item.hostname || item.vmName,
          deleted: item.isDeleted,
          vcpu: item.numVcpus,
          memory: item.memoryCapacityInBytes ? Math.floor((item.memoryCapacityInBytes / 1024 / 1024 / 1024)) : 0,
          resourceId: item.vmUuid,
          resourceName: item.computeName
        }
      })
    }
    return computeData
  } catch (error) {
    console.error(error)
    return []
  }
}

/**
 * API : Storage 자원 조회
 */
export const getVolumeGroups = async (params) => {
  try {
    const data = await API.compute.getVolumeGroupsList(params)
    let storageData = []

    if (data) {
      storageData = data.map(item => {
        return {
          ...item,
          workType: 'STORAGE',
          resourceType: 'GENERAL',
          resourceId: item.vgUuid,
          resourceName: item.vgName
        }
      })
    }
    return storageData
  } catch (error) {
    console.error(error)
    return []
  }
}
/**
 * API : Storage 자원 조회 - 미등록
 */
export const getUnregistersVolumeGroups = async () => {
  try {
    const data = await API.compute.getUnregistersVolumeGroups()
    let storageData = []

    if (data) {
      storageData = data.map(item => {
        return {
          ...item,
          workType: 'STORAGE',
          resourceType: 'UNREGISTERED',
          resourceId: item.vgUuid,
          resourceName: item.vgName
        }
      })
    }
    return storageData
  } catch (error) {
    console.error(error)
    return []
  }
}

/**
 * API : L4 자원 조회 (ALL)
 */
export const getAllVrserver = async (params) => {
  try {
    const data = await API.network.getAllVrserver(params)
    let vrserverData = []

    if (data?.vrserverList) {
      vrserverData = data.vrserverList.map(row => {
        return {
          ...row,
          port: row?.port ? parseInt(row.port) : null,
          workType: 'NETWORK_L4',
          resourceType: row.projectIdx ? 'GENERAL' : 'UNREGISTERED',
          resourceId: row.vrserverIdx,
          frontNetIdx: row.vrserverIdx.toString(),
          resourceName: row.vrserverName
        }
      })
    }
    return vrserverData
  } catch (error) {
    console.error(error)
    return []
  }
}
/**
 * API : L4 자원 조회 - 기등록
 */
export const getVrserver = async (params) => {
  try {
    const data = await API.network.getVrserver(params)
    let vrserverData = []

    if (data) {
      vrserverData = data.filter(item => item.isDone && !item.deleteData)
        .map(row => {
          return {
            ...row,
            workType: 'NETWORK_L4',
            resourceType: 'GENERAL',
            resourceId: row.vrserverIdx,
            resourceName: row.vrserverName
          }
        })
    }
    return vrserverData
  } catch (error) {
    console.error(error)
    return []
  }
}
/**
 * API : L4 자원 조회 - 미등록
 */
export const getUnregistersVrserver = async () => {
  try {
    const data = await API.network.getUnregistersVrserver()
    let vrserverData = []

    if (data) {
      vrserverData = data.map(item => {
        return {
          ...item,
          workType: 'NETWORK_L4',
          resourceType: 'UNREGISTERED',
          resourceId: item.vrserverIdx,
          resourceName: item.vrserverName
        }
      })
    }
    return vrserverData
  } catch (error) {
    console.error(error)
    return []
  }
}

/**
 * API : L7 자원 조회 (ALL)
 */
export const getAllCsvrserver = async (params) => {
  try {
    const data = await API.network.getAllCsvrserver(params)
    let csvrserverData = []

    if (data?.csVrserverList) {
      csvrserverData = data.csVrserverList.map(row => {
        return {
          ...row,
          port: row?.port ? parseInt(row.port) : null,
          workType: 'NETWORK_L7',
          resourceType: row.projectIdx ? 'GENERAL' : 'UNREGISTERED',
          resourceId: row.csVrserverIdx,
          frontNetIdx: row.csVrserverIdx.toString(),
          resourceName: row.csVrserverName
        }
      })
    }
    return csvrserverData
  } catch (error) {
    console.error(error)
    return []
  }
}
/**
 * API : L7 자원 조회 - 기등록
 */
export const getCsvrserver = async (params) => {
  try {
    const data = await API.network.getCsvrserver(params)
    let csvrserverData = []

    if (data) {
      csvrserverData = data.filter(item => item.isDone && !item.deleteData)
        .map(row => {
          return {
            ...row,
            workType: 'NETWORK_L7',
            resourceType: 'GENERAL',
            resourceId: row.csVrserverIdx,
            resourceName: row.csVrserverName
          }
        })
    }
    return csvrserverData
  } catch (error) {
    console.error(error)
    return []
  }
}
/**
 * API : L7 자원 조회 - 미등록
 */
export const getUnregistersCsvrserver = async () => {
  try {
    const data = await API.network.getUnregistersCsvrserver()
    let csvrserverData = []

    if (data) {
      csvrserverData = data.map(item => {
        return {
          ...item,
          workType: 'NETWORK_L7',
          resourceType: 'UNREGISTERED',
          resourceId: item.csVrserverIdx,
          resourceName: item.csVrserverName
        }
      })
    }
    return csvrserverData
  } catch (error) {
    console.error(error)
    return []
  }
}

/**
 * API : 보안그룹 자원 조회
 */
export const getSgGroup = async (params) => {
  try {
    const data = await API.network.getPolicyGroups(params)
    let securityData = []

    if (data) {
      securityData = data.filter(item => item.isDone && !item.deleteData)
        .map(row => {
          return {
            ...row,
            workType: 'SECURITY',
            resourceType: 'GENERAL',
            resourceId: row.securityGroupIdx,
            resourceName: row.securityGroupName
          }
        })
    }
    return securityData
  } catch (error) {
    console.error(error)
    return []
  }
}
/**
 * API : 보안그룹 자원 조회 - 미등록
 */
export const getUnregistersgroup = async () => {
  try {
    const data = await API.network.getUnregistersgroup()
    let securityData = []

    if (data) {
      securityData = data.map(item => {
        return {
          ...item,
          workType: 'SECURITY',
          resourceType: 'UNREGISTERED',
          resourceId: item.securityGroupIdx,
          resourceName: item.securityGroupName
        }
      })
    }
    return securityData
  } catch (error) {
    console.error(error)
    return []
  }
}

/**
 * API : 데이터베이스 자원 조회
 */
export const getDatabasesSimple = async (params) => {
  try {
    const data = await API.database.getDatabasesSimple(params)
    let databaseData = []

    if (data) {
      databaseData = data.map(item => {
        const engineObj = {
          engineType: item?.reqInfo?.engineType || item?.eraDbInfo?.engineType || null,
          engineVersion: item?.reqInfo?.engineVersion || item?.eraDbInfo?.engineVersion || '',
          nodeType: item?.reqInfo?.topology || item?.eraDbInfo?.nodeType || null
        }

        const dbSize = item?.reqInfo?.dbSizeByte || item?.eraDbInfo?.dbSizeByte || 0

        return {
          ...item,
          workType: 'DATABASE',
          resourceType: 'GENERAL',
          resourceId: item.databaseUuid,
          resourceName: item.databaseName,
          appTaskUser: item?.reqInfo?.appTaskUser,
          createTime: item?.reqInfo?.createTime,
          engineType: item?.reqInfo?.engineType,
          engineVersion: item?.reqInfo?.engineVersion,
          engineInfo: engineObj.engineType
            ? `${engineObj.engineType} ${engineObj.engineVersion} (${engineObj.nodeType ? engineObj.nodeType : '-'})`
            : '',
          topology: item?.reqInfo?.topology,
          osName: item?.reqInfo?.osName,
          osInfo: `${item?.reqInfo?.osName ? item.reqInfo.osName : ''}${item?.reqInfo?.osType || ''}${item?.reqInfo?.osVersion || ''}${item?.reqInfo?.osPlatform || ''}`,
          networkList: item?.reqInfo?.networkList,
          networkCateKey: item?.reqInfo?.networkList?.length ? item.reqInfo.networkList[0].cateKey : '',
          reqIdx: item?.reqInfo?.appTaskUser[0]?.reqIdx,
          dbSize: dbSize ? `${dbSize / 1024 / 1024 / 1024} GB` : '0 Bytes'
        }
      })
    }
    return databaseData
  } catch (error) {
    console.error(error)
    return []
  }
}
/**
* API : 데이터베이스 자원 조회 - 미등록
*/
export const getUnregistersDatabase = async () => {
  try {
    const data = await API.database.getUnregistersDatabase()
    let databaseData = []

    if (data) {
      databaseData = data.map(item => {
        const engineObj = {
          engineType: item?.reqInfo?.engineType || item?.eraDbInfo?.engineType || null,
          engineVersion: item?.reqInfo?.engineVersion || item?.eraDbInfo?.engineVersion || '',
          nodeType: item?.reqInfo?.topology || item?.eraDbInfo?.nodeType || null
        }

        const dbSize = item?.reqInfo?.dbSizeByte || item?.eraDbInfo?.dbSizeByte || 0

        return {
          ...item,
          workType: 'DATABASE',
          resourceType: 'UNREGISTERED',
          resourceId: item.databaseUuid,
          resourceName: item.eraDbInfo.databaseName,
          engineInfo: engineObj.engineType
            ? `${engineObj.engineType} ${engineObj.engineVersion} (${engineObj.nodeType ? engineObj.nodeType : '-'})`
            : '',
          dbSize: dbSize ? `${dbSize / 1024 / 1024 / 1024} GB` : '0 Bytes'
        }
      })
    }
    return databaseData
  } catch (error) {
    console.error(error)
    return []
  }
}
