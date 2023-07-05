<template>
  <div class="table-area">
    <cmp-grid
      v-loading="isGetEc2List"
      class="ebs-grid"
      :item-source="ec2List"
      :columns="columns"
      :init-custom-action="flex => this.grid = flex"
      :custom-init-filter="filter => this.gridFilter = filter"
      @selectedRow="selectRow"
      selectable
      @total-count="cnt => totalResultCnt = cnt"
    >
      <template #state="props">
        <cmp-status-tag
          v-if="stateLabel[props.row.state]"
          :type="stateLabel[props.row.state] ?
            `is-${stateLabel[props.row.state].tag}` :
            undefined"
        >
          <i
            class="el-icon-loading"
            v-if="stateLabel[props.row.state].tag === 'loading'"
          />
          {{ stateLabel[props.row.state].text || '-' }}
        </cmp-status-tag>
      </template>
      <!-- 상태 -->

      <template #diskCapacity="{ row }">
        <span>{{ row.numberOfDisk || 0 }}</span>개&nbsp;
        (&nbsp;<span>{{ row.diskCapacity | GB }}</span>&nbsp;)
      </template>
    </cmp-grid>
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
import GridUtils from '@/components/Utils/GridUtils'
import { includes, uniqBy } from 'lodash'
import { mapGetters } from 'vuex'

export default {
  name: 'SetResourceEC2List',
  props: {
    resourceGridData: {
      type: Array,
      default () {
        return []
      }
    }
  },
  watch: {
    isProjectLoaded: {
      immediate: true,
      async handler (flag) {
        if (flag) {
          await Promise.all([
            this.getDefaultRegions(), // 가용영역 조회
            this.init() // 리스트 조회
          ])
        }
      }
    }
  },
  computed: {
    ...mapGetters({
      isProjectLoaded: 'project/getIsProjectLoaded',
      getProject: 'project/getProject'
    })
  },
  methods: {
    async init () {
      await this.getEC2List()
      // await this.getEC2TestList() => 테스트용 더미 데이터
      this.filtering()
    },
    changePage (page) {
      this.init()
    },

    routeTo (to) {
      this.$router.push(to)
    },
    selectRow (row, columns) {
      // console.log('@@ row : ', row)
      if (!row) return
      this.routeTo({
        name: 'set-resource-ec2-detail',
        params: {
          instanceId: row.dataItem.instanceId
        }
      })
    },
    /**
     * API: EC2 목록 조회
     */
    async getEC2List (param) {
      try {
        this.isGetEc2List = true
        const response = await API.aws.getEC2List({
          ...param,
          availabilityZone: this.filtered.available,
          instanceType: this.filtered.instanceType
        })
        if (!response) return

        response.sort((a, b) => {
          if (a.createDate > b.createDate) return -1
          else if (a.createDate < b.createDate) return 1
          else return 0
        })

        this.originData = response.map(item => {
          const projectInfo = this.getProject(item.projectIdx)

          const regionInfo = this.availableOptions.find(zone => zone.value === item.regionName)
          return {
            ...item,
            diskCapacity: Number(item.diskCapacity) || 0,
            regionDisplayName: regionInfo ? regionInfo.displayName : '-',
            monitoring: item.monitoringState ? 'enabled' : 'disabled',
            createDate: this.$options.filters.date(item.createDate),

            companyName: projectInfo?.companyName,
            companyIdx: projectInfo?.companyIdx,
            groupName: projectInfo?.groupName,
            groupIdx: projectInfo?.groupIdx,
            projectName: projectInfo?.projectName,
            projectIdx: projectInfo?.projectIdx
          }
        })
      } catch (error) {
        console.error(error)
        this.ec2List = []
        throw error
      } finally {
        this.isGetEc2List = false
      }
    },
    /**
     * 성능 테스트용 목업 데이터
     */
    async getEC2TestList () {
      try {
        this.isGetEc2List = true
        const response = await API.aws.getEC2TestList()
        if (!response) return

        this.originData = response.map(item => {
          const projectInfo = this.getProject(item.projectIdx) || this.getProject(2598)
          const regionInfo = this.availableOptions.find(zone => zone.value === item.regionName)
          return {
            ...item,
            regionDisplayName: regionInfo ? regionInfo.displayName : '-',
            monitoring: item.monitoringState ? 'enabled' : 'disabled',
            companyName: projectInfo.companyName,
            companyIdx: projectInfo.companyIdx,
            groupName: projectInfo.groupName,
            groupIdx: projectInfo.groupIdx,
            projectName: projectInfo.projectName,
            projectIdx: projectInfo.projectIdx
          }
        })
      } catch (error) {
        console.error(error)
        const message = (error.response?.data) ? error.response.data.message : error.message
        this.$alert(message)
        this.originData = []
        this.isGetEc2List = false
        throw error
      } finally {
        this.isGetEc2List = false
      }
    },
    /**
     * API: 가용 영역 조회
     */
    async getDefaultRegions () {
      try {
        this.isGetRegions = true
        const response = await API.aws.getDefaultRegions()
        if (!response) return

        const list = response.map(item => {
          return {
            label: item.zoneName,
            value: item.regionName,
            displayName: item.displayName
            // value: item.zoneName
          }
        })

        const options = uniqBy(list, 'value')

        const all = { label: this.$v('전체'), value: null }
        this.availableOptions = [all, ...options]
      } catch (error) {
        console.error(error)
        this.availableOptions = []
        throw error
      } finally {
        this.isGetRegions = false
      }
    },
    /**
     * API: 인스턴스 타입 조회
     */
    async getInstanceTypes (regionName) {
      try {
        this.isGetRegions = true
        this.filtered.instanceType = null

        const { data } = await API.aws.getInstanceTypes({
          regionName
        })
        if (!data?.list) return

        const list = data.list.map(item => {
          return {
            label: item.instanceType,
            value: item.instanceType
          }
        })

        const all = { label: this.$v('전체'), value: null }

        this.typeOptions = [all, ...list]
      } catch (error) {
        console.error(error)
        this.typeOptions = []
        throw error
      } finally {
        this.isGetRegions = false
      }
    },

    /**
     * 필터링 : 가용 영역 변경 이벤트
     * regionName에 따라 리스트 필터링
     * 인스턴스 유형 옵션 세팅
     */
    async changeRegion (regionName) {
      this.filtered.available = regionName
      if (regionName) await this.getInstanceTypes(regionName)
      else {
        this.filtered.instanceType = null
        this.typeOptions = []
      }
      this.updateMainGrid()
    },
    /**
     * ec2List를 세팅합니다.
     * 세팅 전, 그리드의 sorting / filtering 상태를 기억했다가 ec2List 세팅 후 다시 설정해줍니다.
     */
    async updateMainGrid (e, grid = this.grid, filter = this.gridFilter) {
      this.filtered.instanceType = e
      this.originGridState = await GridUtils.onSaveGridState({ grid, filter })
      await this.getEC2List()
      await this.filtering()
      if (this.originGridState) await GridUtils.onRestoreGridState({ grid, filter }, this.originGridState)
    },
    /**
     * 관계사 > 조직 > 프로젝트 필터링
     */
    filtering () {
      if (!this.selectedProjectInfo) {
        this.filteredByGroupList = this.originData
      } else {
        this.filteredByGroupList = this.originData.filter(item => {
          let result = true
          if (this.selectedProjectInfo?.companyIdx) result = result && (item.companyIdx === this.selectedProjectInfo?.companyIdx)
          if (this.selectedProjectInfo?.groupIdx) result = result && (item.groupIdx === this.selectedProjectInfo.groupIdx)
          if (this.selectedProjectInfo?.projectIdx) result = result && (item.projectIdx === this.selectedProjectInfo.projectIdx)

          return result
        })
      }

      this.filterByText()
    },
    filterByText () {
      if (!this.searchTextObj) {
        this.ec2List = this.filteredByGroupList
        return
      }

      this.ec2List = this.filteredByGroupList.filter(item => {
        let result = true

        if (this.searchTextObj?.binding && this.searchTextObj?.text) {
          let jsonValue

          if (this.searchTextObj.binding === 'all') jsonValue = JSON.stringify(item)
          else jsonValue = JSON.stringify(item[this.searchTextObj.binding])
          result = result && (includes(jsonValue, this.searchTextObj.text))
        }

        return result
      })
    },
    /**
     * searchComponent가 autocomplete일 때, 옵션에 뜨는 데이터를 세팅해줍니다.
     */
    fetchSearchOption ({ searchText, callback }) {
      if (!searchText) return callback(undefined)
      const createFilter = (queryString) => {
        return (link) => {
          return (includes(link.text, queryString))
        }
      }

      const baseGridData = this.filteredByGroupList
      const options = []

      const searchableCols = [
        // {label: '전체', binding: 'all'},
        { label: this.$v('인스턴스 ID'), binding: 'instanceId' },
        { label: this.$v('인스턴스 명'), binding: 'instanceName' }
      ]

      baseGridData.forEach(row => {
        for (const [key, value] of Object.entries(row)) {
          const sameCol = searchableCols.find(col => col.binding === key)

          if (sameCol) {
            if (includes(value, searchText)) {
              options.push({
                text: value,
                value: sameCol.label + ': ' + value,
                binding: sameCol.binding
              })
            }
          } else {
            if (includes(value, searchText)) {
              options.push({
                text: value,
                value: this.$v('전체') + ': ' + value,
                binding: 'all'
              })
            }
          }
        }
      })
      options.sort((a, b) => {
        if (a.binding > b.binding) return 1
        else if (a.binding < b.binding) return -1
        else return 0
      })

      const results = searchText ? options.filter(createFilter(searchText)) : options
      const uniqResult = uniqBy(results, 'value')

      callback(uniqResult)
    },
    /**
     * search text 입력 후, 필터링을 적용합니다.
     */
    async selectAutoComplete (searchObj) {
      if (!searchObj) return
      this.searchTextObj = searchObj

      this.searchInputText = searchObj.text

      this.filtering()
    }

  },
  data (root) {
    return {
      selectedProjectInfo: null,
      totalResultCnt: 0,
      currPage: 1,
      isGetEc2List: false, // 로딩: EC2 리스트 조회
      isGetRegions: false, // 로딩: rkdyddu 리스트 조회

      searchInputText: '',
      searchTextObj: null,
      grid: null,
      gridFilter: null,
      columns: [
        { binding: 'instanceId', header: root.$v('인스턴스 ID') },
        { binding: 'instanceName', header: root.$v('인스턴스 명') },
        { binding: 'publicIp', header: 'public IP' },
        { binding: 'state', header: root.$v('상태'), customHtml: true },
        { binding: 'amiId', header: 'AMI ID' },
        { binding: 'architecture', header: 'Architecture' },
        { binding: 'instanceType', header: root.$v('인스턴스 유형') },
        { binding: 'vcpu', header: 'vCPU(Core)', width: 100 },
        { binding: 'memory', header: `${root.$v('메모리')} (MB)`, width: 100 },
        { binding: 'diskCapacity', header: root.$v('디스크'), width: 100, customHtml: true },
        { binding: 'monitoring', header: root.$v('모니터링') },
        { binding: 'regionDisplayName', header: root.$v('리전') },
        { binding: 'availabilityZone', header: root.$v('가용영역') },
        { binding: 'companyName', header: '관계사', keyPath: 'common.TERMS.rel', customHtml: true },
        { binding: 'groupName', header: '조직', keyPath: 'common.TERMS.group', customHtml: true },
        { binding: 'projectName', header: '프로젝트', keyPath: 'common.TERMS.project', customHtml: true },
        { binding: 'createDate', header: root.$v('생성 시간') }
      ],
      originData: [],
      filteredByGroupList: [],
      ec2List: [],
      availableOptions: [], // 가용 영역 선택 옵션
      typeOptions: [], // 타입 선택 옵션
      originGridState: null,
      filtered: { // 상단 필터
        available: null, // 가용 영역
        instanceType: null // 타입
      },
      stateLabel: {
        pending: {
          text: root.$v('진행 중'),
          tag: 'loading'
        },
        running: {
          text: root.$v('실행 중'),
          tag: 'using'
        },
        undefined: {
          text: root.$v('실행 중'),
          tag: 'using'
        },
        'shutting-down': {
          text: root.$v('대기'),
          tag: 'pending'
        },
        terminated: {
          text: root.$v('사용 가능'),
          tag: 'available'
        },
        stopping: {
          text: root.$v('종료 중'),
          tag: 'loading'
        },
        stopped: {
          text: root.$v('정지'),
          tag: 'stop'
        }
      }
    }
  }
}
</script>
<style lang="scss">
.set-resource-ec2-list {
  .ebs-grid {
    .cmp-grid-inner {
      overflow: auto;
      max-width: 100%;
      min-height: 100px;
      #cmpGrid {
        width: 150%;
      }
    }
  }
}
</style>
