<!--
  * 파일명 : SetResourceEFSList.vue
  * 파일 기능 : 구성관리 > 자원관리 > EFS 리스트
  * 작성자 : 김예담
  * 최종 작성일 : 2022-04-06
  * License By Shinsegae I&C
 -->

<template>
  <div class="table-area">
    <cmp-grid
      v-loading="isGetEFSList"
      class="ebs-grid"
      :item-source="efsList"
      :columns="columns"
      :init-custom-action="flex => this.grid = flex"
      :custom-init-filter="filter => this.gridFilter = filter"
      @selectedRow="selectRow"
      @total-count="cnt => totalResultCnt = cnt"
      selectable
      page-keeping
    >
      <template #lifeCycleState="{ row }">
        <cmp-status-tag
          v-if="stateLabel[row.lifeCycleState]"
          :type="stateLabel[row.lifeCycleState] ?
            `is-${stateLabel[row.lifeCycleState].tag}` :
            undefined"
        >
          <i
            class="el-icon-loading"
            v-if="stateLabel[row.lifeCycleState].tag === 'loading'"
          />
          {{ stateLabel[row.lifeCycleState].text || '-' }}
        </cmp-status-tag>
      </template>
      <!-- 상태 -->

      <template #isRegion="{ row }">
        {{ row.isRegion ? 'Region' : 'One Zone' }}&nbsp;{{ $v('모드') }}
      </template>
      <!-- 적용 범위 -->

      <template #size="{ row }">
        {{ row.size }}&nbsp;GiB
      </template>
      <!-- 전체 크기 -->

      <template #sizeStandard="{ row }">
        {{ row.sizeStandard }}&nbsp;GiB
      </template>
      <!-- 주 사용 영역 -->

      <template #sizeIa="{ row }">
        {{ row.sizeIa }}&nbsp;GiB
      </template>
      <!-- IA 영역 -->

      <template #performanceMode="{ row }">
        {{ performanceMode[row.performanceMode] || '-' }}
      </template>
      <!-- 성능 모드  -->

      <template #throughputMode="{ row }">
        {{ throughputModeLabel[row.throughputMode] || '-' }}
      </template>
      <!-- 처리량 모드 -->

      <template #useIa="{ row }">
        {{ row.useIa ? $v('사용') : $v('미사용') }}
      </template>
      <!-- 데이터 수명 주기 -->

      <template #accessPointCnt="{ row }">
        {{ row.accessPointCnt || 0 }}&nbsp;개
      </template>
      <!-- 엑세스 포인트 수 -->

      <template #companyName="{ row }">
        <span>{{ row.companyName || '-' }}</span>
      </template>
      <!-- 관계사 -->

      <template #groupName="{ row }">
        <span>{{ row.groupName || '-' }}</span>
      </template>
      <!-- 조직 -->

      <template #projectName="{ row }">
        <span>{{ row.projectName || '-' }}</span>
      </template>
      <!-- 프로젝트 -->
    </cmp-grid>
  </div>
</template>
<script>
import API from '@sd-fe/cmp-core'
import GridUtils from '@/components/Utils/GridUtils'
import fetchAutocompleteOptions from '@/views/ConfigManage/AWS/fetchAutocompleteOptions.mixins'
import { includes, uniqBy } from 'lodash'
import { mapGetters } from 'vuex'

export default {
  name: 'SetResourceEFSList',
  mixins: [fetchAutocompleteOptions],
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
      await this.getEFSList()
      this.filtering()
    },

    routeTo (to) {
      this.$router.push(to)
    },
    selectRow (row, columns) {
      // console.log('@@ row : ', row)
      if (!row) return
      this.routeTo({
        name: 'set-resource-efs-detail',
        params: {
          fileSystemId: row.dataItem.fileSystemId
        }
      })
    },
    async getEFSList () {
      try {
        this.isGetEFSList = true
        const { data: response } = await API.aws.getEFSListAdm({
          ...this.filtered
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
            useIa: 'transitionToIa' in item || 'transitionToPrimaryStorageClass' in item,
            availabilityZone: item?.orderData?.regionName,
            accessPointCnt: item.accessPoints ? item.accessPoints.length : 0,
            regionDisplayName: regionInfo ? regionInfo.displayName : '-',
            modifyDate: this.$options.filters.date(item.modifyDate),
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
        this.efsList = []
        throw error
      } finally {
        this.isGetEFSList = false
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
            // value: item.regionName,
            value: item.zoneName,
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
     * efsList를 세팅합니다.
     * 세팅 전, 그리드의 sorting / filtering 상태를 기억했다가 efsList 세팅 후 다시 설정해줍니다.
     */
    async updateMainGrid (grid = this.grid, filter = this.gridFilter) {
      this.originGridState = await GridUtils.onSaveGridState({ grid, filter })
      await this.filtering()
      if (this.originGridState) await GridUtils.onRestoreGridState({ grid, filter }, this.originGridState)
    },
    /**
     * 테이블 상단 필터링 이벤트 (성능모드, 처리량 모드, 적용 범위, 가용 영역)
     */
    filtering () {
      if (!this.selectedProjectInfo) {
        this.filteredByGroupList = this.originData
      } else {
        this.filteredByGroupList = this.originData.filter(item => {
          let result = true
          if (this.filtered.performance) result = result && (item.performance === this.filtered.performance)
          if (this.filtered.throughput) result = result && (item.throughput === this.filtered.throughput)

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
        this.efsList = this.filteredByGroupList
        return
      }

      this.efsList = this.filteredByGroupList.filter(item => {
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
      totalResultCnt: 0,
      currPage: 1,
      isGetEFSList: false,
      isGetRegions: false,
      selectedProjectInfo: null,
      columns: [
        { binding: 'fileSystemName', header: `EFS ${root.$v('이름')}` }, //
        { binding: 'fileSystemId', header: root.$v('파일 시스템 ID') }, //
        { binding: 'lifeCycleState', header: root.$v('상태'), customHtml: true, width: 120 }, //
        { binding: 'isRegion', header: root.$v('적용 범위'), customHtml: true, width: 120 }, //
        { binding: 'size', header: `${root.$v('전체')} ${root.$v('크기')}`, width: 100, customHtml: true }, //
        { binding: 'sizeStandard', header: root.$v('주 사용 영역'), width: 100, customHtml: true }, //
        { binding: 'sizeIa', header: `IA ${root.$v('영역')}`, width: 100, customHtml: true }, //
        { binding: 'performanceMode', header: root.$v('성능 모드'), width: 100, customHtml: true },
        { binding: 'throughputMode', header: root.$v('처리량 모드'), width: 100, customHtml: true }, //
        { binding: 'useIa', header: root.$v('데이터 수명 주기'), customHtml: true, width: 120 }, //
        { binding: 'accessPointCnt', header: root.$v('엑세스 포인트 수'), width: 100, customHtml: true },
        { binding: 'availabilityZone', header: root.$v('가용영역') },
        { binding: 'regionDisplayName', header: root.$v('리전') },
        { binding: 'companyName', header: '관계사', keyPath: 'common.TERMS.rel', customHtml: true },
        { binding: 'groupName', header: '조직', keyPath: 'common.TERMS.group', customHtml: true },
        { binding: 'projectName', header: '프로젝트', keyPath: 'common.TERMS.project', customHtml: true },
        { binding: 'createDate', header: root.$v('생성 시간') },
        { binding: 'modifyDate', header: root.$v('마지막 변경 시간'), width: 150 }
      ],
      searchableCols: [
        { label: `EFS ${root.$v('이름')}`, binding: 'fileSystemName' },
        { label: root.$v('파일 시스템 ID 명'), binding: 'fileSystemId' }
      ],
      originData: [],
      filteredByGroupList: [],
      efsList: [],

      searchInputText: '',
      searchTextObj: null,

      performanceOptions: [ // 성능 모드 선택 옵션
        { label: root.$v('전체'), value: null },
        { value: 'generalPurpose', label: root.$v('범용 모드') },
        { value: 'maxIO', label: root.$v('최대 I/O 모드') }
      ],
      throughputOptions: [ // 처리량 선택 옵션
        { label: root.$v('전체'), value: null },
        { value: 'bursting', label: root.$v('버스트 모드') },
        { value: 'provisioning', label: root.$v('프로비저닝') }
      ],
      rangeOptions: [ // 적용 범위 선택 옵션
        { label: root.$v('전체'), value: null },
        { value: true, label: 'Region' },
        { value: false, label: 'One Zone' }
      ],
      availableOptions: [], // 가용 영역 선택 옵션

      originGridState: null,
      filtered: { // 상단 필터
        performanceMode: null, // 성능 모드
        throughputMode: null, // 처리량 모드
        isRegion: null, // 적용 범위
        availabilityZone: null // 가용 영역
      },
      performanceMode: { // 성능 모드
        generalPurpose: root.$v('범용 모드'),
        maxIO: root.$v('최대 I/O 모드')
      },
      throughputModeLabel: { // 처리량 모드
        bursting: root.$v('버스트 모드'),
        provisioning: root.$v('프로비저닝')
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
        available: {
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
