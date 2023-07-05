<!--
  * 파일명 : VmDefaultInfoTable.vue
  * 파일 기능 : VMware Compute 자원 기본 정보 Vertical Table (수정, 클론 폼에서 사용)
  * 작성자 : 김예담
  * License By Shinsegae I&C
 -->
<template>
  <vertical-table
    v-if="defaultData"
    class="vm-default-info-table"
    :data="defaultData"
    :columns="columns"
    type="horizontal"
    :use-border-top="false"
  >
    <template #networkInfo>
      <ul v-if="defaultData.networkList && defaultData.networkList.length">
        <li
          v-for="(net, netIdx) in defaultData.networkList"
          :key="netIdx"
        >
          {{ net.name }}&nbsp;{{ net.cateKey ? `(${net.cateKey})` : '' }}
        </li>
      </ul>

      <span v-else>-</span>
    </template>
    <!-- 네트워크 정보 -->

    <template #osType>
      <set-os-icon
        v-if="defaultData.osName"
        :os-name="`${defaultData.osName ? defaultData.osName : ''}${defaultData.osBit ? ' / ' + defaultData.osBit : ''}`"
      />

      <span
        v-else
        class="empty-content"
      >-</span>
    </template>
    <!-- OS 이미지 -->

    <template #esxi>
      <span v-if="defaultData.esxi">
        {{ defaultData.esxi.userConnectDetailInfo
          ? defaultData.esxi.userConnectDetailInfo.name
          : (defaultData.esxi.name ? defaultData.esxi.name : '-') }}
      </span>
      <span v-else>-</span>
    </template>

    <template #datastore>
      <span v-if="defaultData.datastore">
        {{ defaultData.datastore.name }}
        <small v-if="defaultData.datastore.freeSpace"><br>(사용 가능 용량: {{ defaultData.datastore.freeSpace | byte }})</small>
      </span>
      <span v-else>-</span>
    </template>
    <!-- 데이터스토어 -->

    <template #spec>
      <div class="flex">
        <span>{{ `vCPU: ${defaultData.vcpu}Core` }}</span>&nbsp;
        <small class="empty-content">{{ ` ( 소켓 수: ${defaultData.socket || 1}, 소켓당 코어 수: ${defaultData.vcpu / (defaultData.socket || 1)} )` }}</small>
      </div>
      <div>{{ `Memory: ${defaultData.memory}GB` }}</div>
      <div>{{ `RootDisk: ${defaultData.rootDiskSize}GB` }}</div>
      <div />
    </template>

    <template #installProgramList>
      <div class="join-comma-list">
        <span
          v-for="(pkg,pkgIdx) in defaultData.installProgramList"
          :key="`install_${pkgIdx}`"
        >
          {{ pkg.name }} {{ pkg.version }}
        </span>
      </div>
    </template>
    <!-- 설치프로그램 -->

    <template #licenseList>
      <div class="join-comma-list">
        <span
          v-for="sw in defaultData.licenseList"
          :key="`swLicense_${sw.swIdx}`"
        >
          {{ sw.name }}
        </span>
      </div>
    </template>
    <!-- 설치프로그램 -->

    <template #manageGroup>
      <span v-if="defaultData.manageGroupName">{{ defaultData.manageGroupName }}</span>
      <span v-else>-</span>
    </template>
    <!-- 운영그룹 -->
  </vertical-table>
</template>

<script>
import { mapGetters } from 'vuex'
import { SetOSIcon } from '@sd-fe/cmp-core'

export default {
  name: 'VmDefaultInfoTable',
  components: {
    'set-os-icon': SetOSIcon
  },
  props: {
    vmInfo: { // vm 정보
      type: Object,
      default: undefined
    },
    columnBindings: { // 자원 정보 노출 컬럼 bindings ['resourceName', 'spec'] 이렇게 받으면 자원 명, 사양 정보만 노출
      type: Array,
      default: undefined
    }
  },
  computed: {
    ...mapGetters({
      getProject: 'project/getProject'
    }),
    columns () {
      let columns = this.allColumns
      if (this.columnBindings) columns = this.allColumns.filter(col => this.columnBindings.includes(col.binding))

      if (columns.length % 2) columns[columns.length - 1].colspan = true

      return columns
    }
  },
  watch: {
    vmInfo: {
      immediate: true,
      deep: true,
      handler (val) {
        if (val) this.setData()
      }
    }
  },
  methods: {
    setData (data = this.vmInfo) {
      const metaInfo = data?.userInfo?.metaInfo ? JSON.parse(data.userInfo.metaInfo) : null

      const vcpu = data.cpuCores
      const socket = data?.socket || 1
      const memory = data.memorySize / 1024

      // 프로젝트
      let companyName = ''
      let groupName = ''
      let projectName = ''
      const projectIdx = data?.userInfo?.projectIdx
      if (projectIdx) {
        const projectInfo = this.getProject(projectIdx)
        companyName = projectInfo?.companyName
        groupName = projectInfo?.groupName
        projectName = projectInfo?.projectName
      }

      // Local Disk
      let rootDiskSize = 0 // root disk 용량
      const mappedExternals = []
      if (data.diskList) {
        data.diskList.forEach(disk => {
          const diskName = disk.diskName
            ? disk.diskName
            : disk.busNumber !== undefined
              ? `SCSI ${disk.busNumber}:${disk.unitNumber}`
              : '-'

          const diskSize = disk?.capacityB ? this.$options.filters.byteToGb(disk.capacityB) : (disk?.size || 0)
          if (disk.unitNumber === 0) {
            rootDiskSize = diskSize
            return
          }

          mappedExternals.push({
            size: diskSize,
            name: diskName
          })
        })
      }

      const externalDisks = mappedExternals.map(item => {
        const value = item.name + ': ' + item.size + 'GB'
        return value
      })

      const externalDiskValue = externalDisks?.length ? externalDisks.join(', ') : '-'

      // 네트워크 카테고리 => networkAdapterList / userInfo.networkList 비교 (unitNumber)
      let networkList = []
      if (data.networkAdapterList?.length && data.userInfo?.networkList?.length) {
        const userNetworks = data.userInfo.networkList

        networkList = data.networkAdapterList.map(net => {
          const sameNetwork = userNetworks.find(item => net.unitNumber === item.unitNumber)
          const { cateKey, cateIdx, cateName } = sameNetwork
          return {
            ...net,
            cateKey,
            cateIdx,
            cateName
          }
        })
      }
      this.defaultData = {
        projectInfo: companyName && groupName && projectName ? `${companyName} > ${groupName} > ${projectName}` : '-', // 관계사/조직/프로젝트
        resourceName: metaInfo ? metaInfo.resourceName : data.hostName, // 자원 명
        esxi: data.hostInfo,
        esxiName: data?.hostInfo?.userConnectDetailInfo?.name || data?.hostInfo?.name,
        hostName: data.name || '-', // 호스트 명
        datastore: data.datastore,
        itsmName: metaInfo?.itsmName || '-', // 업무 명
        networkList: networkList.length ? networkList : '-',
        vcpu,
        socket,
        memory,
        rootDiskSize,
        spec: `vCPU: ${vcpu}Core, Memory: ${memory}GB, RootDisk: ${rootDiskSize}GB`, // 설정된 사양 정보
        externalDisk: externalDiskValue, // Local Disk
        serviceDate: metaInfo?.serviceDate || null, // 서비스 개시일
        osType: data?.userInfo?.image?.osType,
        osName: data?.userInfo?.image?.userImageName,
        osBit: data?.userInfo?.image?.osBit,
        manageGroupName: data?.manageGroupName,
        installProgramList: data?.installProgramList || [],
        licenseList: data?.licenseList || [],
        customFee: data?.customFee || ''
      }
    }
  },
  data: (root) => ({
    defaultData: null,
    allColumns: [
      { binding: 'projectInfo', header: '관계사/조직/프로젝트', keyPath: 'common.GRID.compGroupProject' },
      { binding: 'esxi', header: 'ESXi' },
      { binding: 'hostName', header: root.$v('호스트 명') },
      { binding: 'datastore', header: '데이터스토어' },
      { binding: 'networkInfo', header: '네트워크 (네트워크 조직)' },
      { binding: 'spec', header: '설정된 사양 정보', keyPath: 'common.GRID.settedSpecInfo' },
      { binding: 'osType', header: 'OS 타입' },
      { binding: 'externalDisk', header: 'Local Disk' },
      { binding: 'installProgramList', header: root.$v('설치프로그램') },
      { binding: 'licenseList', header: root.$v('S/W 라이선스') },
      { binding: 'manageGroup', header: root.$v('운영그룹') },
      { binding: 'customFee', header: root.$v('Custom 요금') }
    ]
  })
}
</script>

<style lang="scss" scoped>
  .empty-content { color: $input-placeholder; }
</style>
