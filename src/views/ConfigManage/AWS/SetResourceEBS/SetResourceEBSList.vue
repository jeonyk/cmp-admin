<!--
  * 파일명 : SetResourceEbsList.vue
  * 파일 기능 : 구성관리 > 자원관리 > EBS 자원 확인 기능
  * 작성자 : 김예담
  * 최종 작성일 : 2022-01-10
  * License By Shinsegae I&C
 -->

<template>
  <div
    class="set-resource-ebs-list"
  >
    <resource-filter-component
      v-loading="isGetOptions"
      cloud-type="public"
      @search="param => {
        selectedProjectInfo = param
        filtering()
      }"
      @reset="() => {
        filtered.availabilityZone = null
        filtered.volumeType = null
        selectedProjectInfo = null
        init()
      }"
    >
      <section class="filter-form">
        <span class="filter-name">{{ $v('가용영역') }}</span>
        <div>
          <searchable-select
            v-model="filtered.availabilityZone"
            :empty-text="$t('common.PLACEHOLDER.selectProject')"
            :placeholder="$v('전체')"
            :options="availableOptions"
            @change="e => {
              filtered.availabilityZone = e
              init()
            }"
            unique-key="value"
          />
        </div>
      </section>

      <section class="filter-form">
        <!-- VM 상태 -->
        <span class="filter-name">{{ $v('유형') }}</span>
        <div class="filter-options">
          <el-select
            v-model="filtered.volumeType"
            :placeholder="$v('유형')"
            :popper-append-to-body="false"
            @change="init"
          >
            <el-option
              v-for="option in typeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>
      </section>
    </resource-filter-component>

    <search-component
      v-model="searchInputText"
      style="width: 250px;"
      type="autocomplete"
      @fetch="fetchSearchOption"
      @select="selectAutoComplete"
      @reset="() => {
        searchTextObj = null
        filtering()
      }"
    />

    <section class="table-area">
      <cmp-grid
        v-if="isProjectLoaded"
        v-loading="isGetEBSList"
        class="ebs-grid"
        :item-source="ebsList"
        :columns="columns"
        :init-custom-action="flex => this.grid = flex"
        :custom-init-filter="filter => this.gridFilter = filter"
        @selectedRow="selectRow"
        :use-excel-download="true"
        selectable
        page-keeping

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
        <!-- 볼륨 상태 -->

        <template #attachedState="props">
          <cmp-status-tag
            :type="props.row.attachedState ? 'is-using'
              : 'is-error'"
          >
            {{ props.row.attachedState ? $v('연결') : $v('연결 안됨') }}
          </cmp-status-tag>
        </template>
        <!-- 연결 상태 -->
      </cmp-grid>
    </section>
  </div>
</template>
<script>
import API, { ResourceFilterComponent, SearchableSelect } from '@sd-fe/cmp-core'
import GridUtils from '@/components/Utils/GridUtils'
import { mapGetters } from 'vuex'
import { uniqBy, includes } from 'lodash'

export default {
  name: 'SetResourceEBSList',
  components: {
    ResourceFilterComponent,
    SearchableSelect
  },
  watch: {
    isProjectLoaded: {
      immediate: true,
      async handler (flag) {
        if (flag) {
          await this.getDefaultRegions() // 가용영역 조회
          await Promise.all([
            this.getEbsVolumeTypes(), // EBS 볼륜 타입 조회
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
    routeTo (to) {
      this.$router.push(to)
    },
    changePage (page) {
      this.init()
    },
    async init () {
      await this.getEBSList()
      this.filtering()
    },
    selectRow (row, columns) {
      if (!row) return
      this.routeTo({
        name: 'set-resource-ebs-detail',
        params: {
          volumeId: row.dataItem.volumeId
        }
      })
    },
    /**
     * API: 가용 영역 조회
     */
    async getDefaultRegions () {
      try {
        this.isGetOptions = true
        const response = await API.aws.getDefaultRegions()
        if (!response) return

        const list = response.map(item => {
          return {
            label: item.zoneName,
            value: item.zoneName,
            regionName: item.regionName,
            displayName: item.displayName
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
        this.isGetOptions = false
      }
    },
    /**
     * API: EBS 볼륨 타입 조회
     */
    async getEbsVolumeTypes () {
      try {
        this.isGetOptions = true
        const response = await API.aws.getEbsVolumeTypes()
        if (!response?.data) return

        const list = response.data.map(item => {
          return {
            label: item.volumeType,
            value: item.volumeType,
            displayName: item.volumeType
          }
        })

        const all = { label: this.$v('전체'), value: null }
        this.typeOptions = [all, ...list]
      } catch (error) {
        console.error(error)
        this.typeOptions = []
        throw error
      } finally {
        this.isGetOptions = false
      }
    },
    async getEBSList () {
      try {
        this.isGetEBSList = true
        if (this.filtered.availabilityZone === '전체') this.filtered.availabilityZone = null
        const param = {
          ...this.filtered
        }
        const response = await API.aws.getEBSList(param)
        if (!response) return

        response.sort((a, b) => {
          if (a.createTime > b.createTime) return -1
          else if (a.createTime < b.createTime) return 1
          else return 0
        })

        this.originData = response.map(item => {
          const projectInfo = this.getProject(item.projectIdx)

          const regionInfo = this.availableOptions.find(zone => zone.regionName === item.regionName)

          return {
            ...item,
            regionDisplayName: regionInfo ? regionInfo.displayName : '-',
            companyName: projectInfo?.companyName,
            companyIdx: projectInfo?.companyIdx,
            groupName: projectInfo?.groupName,
            groupIdx: projectInfo?.groupIdx,
            projectName: projectInfo?.projectName,
            projectIdx: projectInfo?.projectIdx,
            modifyTime: this.$options.filters.date(item.modifyTime),
            createTime: this.$options.filters.date(item.createTime)
          }
        })
        this.filtering()
      } catch (error) {
        console.error(error)
        const message = (error.response?.data) ? error.response.data.message : error.message
        this.$alert(message)
        this.originData = []
        throw error
      } finally {
        this.isGetEBSList = false
      }
    },

    /**
     * ebsList를 세팅합니다.
     * 세팅 전, 그리드의 sorting / filtering 상태를 기억했다가 ebsList 세팅 후 다시 설정해줍니다.
     */
    async updateMainGrid (grid = this.grid, filter = this.gridFilter) {
      this.originGridState = await GridUtils.onSaveGridState({ grid, filter })
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
        this.ebsList = this.filteredByGroupList
        return
      }

      this.ebsList = this.filteredByGroupList.filter(item => {
        let result = true

        if (this.searchTextObj?.text) {
          const jsonValue = JSON.stringify(item)
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
        // {label: this.$v('전체'), binding: 'all'},
        { label: `${this.$v('볼륨')}ID`, binding: 'volumeId' },
        { label: this.$v('유형'), binding: 'volumeType' }
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
      // const origin = this.originData
      this.searchTextObj = searchObj

      this.searchInputText = searchObj.text

      this.filtering()
    }

  },
  data (root) {
    return {
      totalResultCnt: 0,
      selectedProjectInfo: null,
      currPage: 1,
      isGetEBSList: false,
      isGetOptions: false,
      columns: [
        // { binding: 'volumeName', header: '볼륨 그룹 명', width: '*' },
        { binding: 'volumeId', header: `${root.$v('볼륨')}ID`, width: '*' },
        { binding: 'volumeType', header: root.$v('유형'), width: 150 },
        { binding: 'size', header: `${root.$v('크기')}(GB)`, width: 100 },
        { binding: 'iops', header: 'IOPS', width: 100 },
        { binding: 'availabilityZone', header: root.$v('가용영역'), width: '*' },
        { binding: 'state', header: root.$v('볼륨 상태'), width: 120, customHtml: true },
        { binding: 'attachedInstanceId', header: `${root.$v('연결된 인스턴스')} ID`, width: '*' },
        { binding: 'attachedState', header: root.$v('연결 상태'), width: 120, customHtml: true },
        { binding: 'regionDisplayName', header: root.$v('리전'), width: '*' },
        { binding: 'companyName', header: '관계사', keyPath: 'common.TERMS.rel' },
        { binding: 'groupName', header: '조직', keyPath: 'common.TERMS.group' },
        { binding: 'projectName', header: '프로젝트', keyPath: 'common.TERMS.project' },
        { binding: 'createTime', header: root.$v('생성 시간') },
        { binding: 'modifyTime', header: root.$v('마지막 변경 시간') }
      ],
      originData: [],
      filteredByGroupList: [], // 관/조/프 필터링 후 데이터
      ebsList: [],
      availableOptions: [], // 가용 영역 선택 옵션
      typeOptions: [], // 타입 선택 옵션
      originGridState: null,
      searchInputText: '',
      searchTextObj: null,
      filtered: { // 상단 필터
        availabilityZone: null, // 가용 영역
        volumeType: null // 타입
      },
      stateLabel: {
        error: {
          text: root.$v('오류'),
          tag: 'error'
        },
        'in-use': {
          text: root.$v('실행 중'),
          tag: 'using'
        },
        undefined: {
          text: root.$v('실행 중'),
          tag: 'using'
        },
        pending: {
          text: root.$v('대기'),
          tag: 'pending'
        },
        creating: {
          text: root.$v('진행 중'),
          tag: 'loading'
        },
        'in-use-optimizing': {
          text: root.$v('진행 중'),
          tag: 'loading'
        },
        'available-modifying': {
          text: root.$v('진행 중'),
          tag: 'loading'
        },
        available: {
          text: root.$v('사용 가능'),
          tag: 'available'
        },
        stopped: {
          text: root.$v('정지'),
          tag: 'stop'
        },
        deleting: {
          text: root.$v('삭제'),
          tag: 'undefined'
        }
      }
    }
  }
}
</script>
<style lang="scss">
.set-resource-ebs-list {
  .ebs-grid {
    .cmp-grid-inner {
      overflow: auto;
      max-width: 100%;
      min-height: 100px;
      #cmpGrid {
        width: 130%;
      }
    }
  }
}
</style>
