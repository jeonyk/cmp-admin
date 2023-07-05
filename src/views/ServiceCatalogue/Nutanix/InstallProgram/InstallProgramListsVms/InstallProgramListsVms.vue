<!--

  * 파일명 : InstallProgramLists.vue
  * 파일 기능 : 서비스 카탈로그 > 설치프로그램 정보 리스트, 설치프로그램 추가/수정/삭제 기능, 필터링(OS / 사용 여부)
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2021-01-15
  * License By Shinsegae I&C
  * 2021-01-15 Update: lodash 사용방식 변경
 -->

<template>
  <section
    class="install-program"
    v-loading="loading"
  >
    <resource-filter-component
      :module-type="cloud"
      ref="filter"
      @search="setFilter"
      @reset="resetFilter"
    >
      <span class="filter-name">{{ $v('VM 상태') }}</span>
      <div class="filter-options">
        <el-select
          v-model="filters.status"
          :placeholder="$t('common.BTN.select')"
          :popper-append-to-body="false"
          @change="value => setFilter(value, 'status')"
        >
          <el-option
            v-for="{ label, value } in vmStateOptions"
            :key="value"
            :label="label"
            :value="value"
          />
        </el-select>
      </div>
    </resource-filter-component>

    <filtering-component
      ref="filter"
      :data="filterData"
      :use-title="false"
      @selected="value => setFilter(value)"
    />

    <filtering-component :use-title="false">
      <span class="filter-name">{{ $v('주문번호') }}</span>
      <search-bar
        ref="searchbar"
        :user-reset-icon="false"
        :placeholder="$v('주문번호를 입력해주세요')"
        @input="setText"
      />

      <div class="filter-options -checkbox">
        <el-checkbox
          @change="value => setFilter(value)"
          v-model="filters.requested"
        >
          {{ $v('요청된 VM만 보기') }}
        </el-checkbox>
        <el-checkbox
          @change="value => setFilter(value)"
          v-model="filters.urgent"
        >
          {{ $v('긴급 자원만 보기') }}
        </el-checkbox>
      </div>
    </filtering-component>
    <!-- /. 검색창 필터 -->

    <article>
      <cmp-grid
        v-loading="loading"
        :item-source="installHistoryData"
        :columns="installHistoryColumn"
        :use-column-filter="false"
        :init-custom-action="initGrid"
        :added-item-formatter="addedItemFormatter"
        :sort-keeping="sortedCol"
        page-keeping
        :paging-size="pageSize"
        selectable
        @total-count="cnt => totalResultCnt = cnt"
        @selectedRow="setSelectedRows"
        @changingPage="setSelectedRowsStyle"
      >
        <template #status="{ row }">
          <vm-status :data="row" />
        </template>
        <!-- /. VM상태 -->

        <template #osVersion="{ row }">
          <os-version :data="row" />
        </template>
        <!-- /. OS 버전 -->

        <template #spec="{ row }">
          <basic-spec :data="row" />
        </template>
        <!-- /. 기본 사양 -->

        <template #scriptexcute="{ row }">
          <script-execute
            :data="row"
            use-tooltip
          />
        </template>
      <!-- /. Script 수행 가능 여부 -->
      </cmp-grid>
    </article>
  </section>
</template>

<script>
import API, { FilteringComponent } from '@sd-fe/cmp-core'
import SearchBar from '@/components/SearchBar/SearchBar'
import InstallProgramMixins from '../InstallProgramMixins.script'
import { VMStatus, OSVersion, BasicSpec, ScriptExecute } from '../InstallVMListContents.script'

export default {
  name: 'InstallProgramListsVms',
  mixins: [InstallProgramMixins],
  components: {
    'filtering-component': FilteringComponent,
    'search-bar': SearchBar,
    'vm-status': VMStatus,
    'os-version': OSVersion,
    'basic-spec': BasicSpec,
    'script-execute': ScriptExecute
  },
  created () {
    this.init()
  },
  methods: {
    async init () {
      this.rawData = await this.getSwVMListData({ vmType: this.cloud })
      this.filterData[0].selections = this.setClusterNodeOptions(this.rawData)
      this.installHistoryData = JSON.parse(JSON.stringify(this.rawData))
    },

    /**
     * VM 목록을 가져옵니다.
     */
    async getSwVMListData (params) {
      try {
        const response = await API.sw.getSwVMLists(params)

        return response.map(({ vm }) => {
          const { externalDisks, externalDisk, disk } = this.calculateExternalDisk(vm.diskList)

          return {
            ...vm,
            disk,
            bits: vm.osType?.replace(/X/g, '') + 'bit',
            externalDiskDisplay: { externalDisks, externalDisk },
            location: `${vm.companyName} > ${vm.groupName} > ${vm.projectName}`
          }
        })
      } catch (error) {
        console.error('@@ InstallProgramListsVms > getSwVMListData', error)
        return []
      }
    },

    /**
     * [클러스터 / 노드] 기본 옵션 만들기
     * @param {Array} data rawData
     */
    setClusterNodeOptions (data) {
      const clusters = {}

      // 기본 cluster / hostname 중복 제거
      data.forEach(({ clusterName, hostName, ...vm }) => {
        const cls = clusters[clusterName]

        if (!cls) clusters[clusterName] = [hostName]
        else {
          const index = cls.indexOf(hostName)
          if (index === -1) cls.push(hostName)
        }
      })

      // console.log(clusters, '클러스터')

      const result = []
      for (const cluster in clusters) {
        const hostInfo = clusters[cluster].map(hostName => (hostName ? { label: hostName, value: hostName } : undefined))
        const options = hostInfo.filter(value => value) // null 값이 있다면 제거

        const clusterInfo = { label: cluster, value: cluster, options }
        result.push(clusterInfo)
      }

      return result
    },

    /**
     * [관조프] 설정시 데이터를 검색 시작합니다.
     * @param {Object} value 저장할 값
     * @param {String} key 저장할 키값
     */
    setFilter (value, key = undefined) {
      // 키가 없는 경우 (관조프), (클러스터/노드)
      if (!key) this.filters = { ...this.filters, ...value }
      else this.filters[key] = value

      // cluster 선택하면 > 그에 따라 하단에 노드 옵션 변경 (나도 이렇게 짜고싶지 않았어 ^^)
      if (this.filters.cluster) {
        this.filterData[1].selections = []
        const nodes = this.filterData[0].selections.filter(({ value }) => value === this.filters.cluster)[0].options
        this.filterData[1].selections = nodes
      }

      this.searchFilter(this.filters, this.filterText)
    },

    /**
     * [검색 텍스트] 설정시 데이터를 검색 시작합니다.
     * @param {Object} value 텍스트
     */
    setText (value) {
      this.filterText = value
      this.searchFilter(this.filters, this.filterText)
    },

    resetFilter () {
      this.filters = { companyIdx: null, groupIdx: null, projectIdx: null, status: '', requested: undefined, urgent: undefined }
      this.filterText = undefined
      if (this.$refs.searchbar) this.$refs.searchbar.value = undefined
      if (this.$refs.filter) this.$refs.filter.resetData()

      this.init()
      this.$forceUpdate()
    },

    /**
     * 검색 필터, 주문번호 등 변경시 발생하는 이벤트
     * @param {Object} values 관조프
     * @param {String} text 검색 텍스트
     */
    searchFilter (values = this.filters, text = this.filterText) {
      let empty = true // 관조프 설정 X 인경우 (전체 인경우)
      for (const key in values) {
        if (values[key] !== null) {
          empty = false
          break
        }
      }

      // [관조프, 검색] 아무것도 설정되지 않은 경우
      if (empty && text === undefined) return

      // console.log(values, text) // 필터링 조건

      // console.log(values, text)
      this.installHistoryData = this.rawData.filter(vm => {
        const regexp = new RegExp(String(text), 'gi')
        const orderNo = text ? regexp.test(vm.orderNo) : true // 주문번호

        const companyIdx = (values.companyIdx !== null) ? (values.companyIdx === vm.companyId) : true
        const groupIdx = (values.groupIdx !== null) ? (values.groupIdx === vm.groupIdx) : true
        const projectIdx = (values.projectIdx !== null) ? (values.projectIdx === vm.projectId) : true

        // VM 상태 :: [전체] 인 경우 통과 | 아니면 비교
        const powerState = (values.status !== '') ? (vm.powerState === values.status) : true

        // 클러스터 / 노드 검색
        const clusterName = (values.cluster) ? values.cluster === vm.clusterName : true
        const hostName = (values.node) ? values.node === vm.hostName : true

        // 요청된 VM 만 보기 / 긴급 자원만 보기
        const requested = (values.requested) ? values.requested === vm.isOrder : true
        const isUrgent = (values.urgent) ? values.urgent === vm.isUrgent : true

        // console.log(clusterName, vm.clusterName)
        // console.log(hostName, vm.hostName)
        // console.log(vm.isOrder, vm.isUrgent)
        // console.log(vm.companyId, values.companyIdx)
        // console.log(vm.groupIdx, values.groupIdx)
        // console.log(vm.projectId, values.projectIdx)
        // console.log(orderNo, companyIdx, groupIdx, projectIdx)

        return orderNo && companyIdx && groupIdx && projectIdx && powerState && clusterName && hostName && requested && isUrgent
      })
    },

    /**
     * vm 선택시 다중선택
     * @param { Array } rows
     */
    setSelectedRows ({ dataItem }) {
      const { vmUuid } = dataItem
      const name = {
        VMWARE: 'install-program-detail-vms-vmw',
        NUTANIX: 'install-program-detail-vms'
      }[this.cloud]

      return this.$router.push({ name, query: { id: vmUuid } })
    }
  },
  data () {
    return {
      loading: false,
      filters: { companyIdx: null, groupIdx: null, projectIdx: null, status: '' },
      filterText: undefined, // 주문번호 검색어
      filter: {
        category: undefined,
        name: undefined,
        startDate: undefined,
        endDate: undefined
      },
      // VM 상태 Option 목록
      vmStateOptions: [
        { value: '', label: this.$i18n.locale === 'en' ? 'All' : '전체' },
        { value: 'ON', label: 'ON' },
        { value: 'OFF', label: 'OFF' }
      ],
      filterData: [
        {
          label: '클러스터',
          field: 'cluster',
          selections: []
        },
        {
          label: '노드',
          field: 'node',
          selections: []
        }
      ],
      selectedRows: [],
      installHistoryData: [],
      installHistoryColumn: [
        { header: this.$v('프로젝트 위치'), binding: 'location', width: 280, customHtml: true },
        { header: this.$v('VM(Host) 명'), binding: 'vmName', width: 150, customHtml: true },
        { header: this.$v('주문번호'), binding: 'orderNo', width: 100, customHtml: true },
        { header: this.$v('VM상태'), binding: 'status', width: 100, customHtml: true },
        { header: this.$v('OS 버전(Bits)'), binding: 'osVersion', width: 200, customHtml: true },
        { header: this.$v('기본 사양'), binding: 'spec', width: 280, customHtml: true },
        { header: 'VM(Host) IP', binding: 'ipAddress', width: 150 },
        { header: this.$v('Script 사용여부'), binding: 'scriptexcute', width: 150, customHtml: true },
        { header: this.$v('클러스터'), binding: 'clusterName', width: 150, customHtml: true },
        { header: this.$v('노드'), binding: 'hostName', width: 150, customHtml: true }
      ],
      rawData: []
    }
  }
}
</script>

<style lang="scss" scoped>

.-checkbox {
  > label {
    margin-left: $gap;
  }
}

</style>
