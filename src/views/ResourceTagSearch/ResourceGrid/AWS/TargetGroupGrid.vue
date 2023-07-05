<template>
  <div class="table-area">
    <cmp-grid
      :item-source="targetGroupList"
      :columns="targetGroupColumns"
      :init-custom-action="flex => this.grid = flex"
      :custom-init-filter="filter => this.gridFilter = filter"
      @selectedRow="selectRow"
      use-excel-download
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

      <template #targetType="props">
        {{ targetTypes[props.row.targetType] || '-' }}
      </template>
      <!-- 대상유형 -->
    </cmp-grid>
  </div>
  <!-- NLB -->
</template>
<script>
import GridUtils from '@/components/Utils/GridUtils'
import fetchAutocompleteOptions from '@/views/ConfigManage/AWS/fetchAutocompleteOptions.mixins'
import { mapGetters } from 'vuex'
import { includes } from 'lodash'
import API from '@sd-fe/cmp-core'

export default {
  name: 'TargetGroupGrid',
  mixins: [fetchAutocompleteOptions],
  props: {
    resourceGridData: {
      type: Array,
      default () {
        return []
      }
    }
  },
  computed: {
    ...mapGetters({
      isProjectLoaded: 'project/getIsProjectLoaded',
      getProject: 'project/getProject'
    })
  },
  watch: {
    isProjectLoaded: {
      immediate: true,
      async handler (flag) {
        if (flag) this.init() // 리스트 조회
      }
    }
  },
  methods: {
    async init () {
      await this.getTargetgroupList()
      this.filtering()
    },
    routeTo (to) {
      this.$router.push(to)
    },
    selectRow (row) {
      if (!row) return
      this.routeTo({
        name: 'set-resource-target-group-detail',
        params: {
          targetGroupArn: row.dataItem.targetGroupArn
        }
      })
    },
    async getTargetgroupList (param) {
      try {
        this.isGetTargetGroupList = true
        const { data } = await API.aws.getTargetGroups(param)
        if (!data) return

        data.sort((a, b) => {
          if (a.createDate > b.createDate) return -1
          else if (a.createDate < b.createDate) return 1
          else return 0
        })

        this.originData = data.map(item => {
          const projectInfo = this.getProject(item.projectIdx)

          return {
            ...item,
            algorithm: item.algorithm || '-',
            createDate: this.$options.filters.date(item.createDate),
            modifyDate: this.$options.filters.date(item.modifyDate),
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
        this.originData = []
        throw error
      } finally {
        this.isGetTargetGroupList = false
      }
    },
    /**
     * filteredByGroupList를 세팅합니다.
     * 세팅 전, 그리드의 sorting / filtering 상태를 기억했다가 filteredByGroupList 세팅 후 다시 설정해줍니다.
     */
    async updateMainGrid (grid = this.grid, filter = this.gridFilter) {
      this.originGridState = await GridUtils.onSaveGridState({ grid, filter })
      await this.getEC2List()
      await this.filtering()
      if (this.originGridState) await GridUtils.onRestoreGridState({ grid, filter }, this.originGridState)
    },
    /**
     * 테이블 상단 필터링 이벤트 (성능모드, 처리량 모드, 적용 범위, 가용 영역)
     */
    filtering () {
      // if (!this.selectedProjectInfo) {
      //   this.filteredByGroupList = this.originData
      // } else {
      this.filteredByGroupList = this.originData.filter(item => {
        let result = true

        if (this.selectedProjectInfo?.companyIdx) result = result && (item.companyIdx === this.selectedProjectInfo?.companyIdx)
        if (this.selectedProjectInfo?.groupIdx) result = result && (item.groupIdx === this.selectedProjectInfo.groupIdx)
        if (this.selectedProjectInfo?.projectIdx) result = result && (item.projectIdx === this.selectedProjectInfo.projectIdx)

        if (this.filtered.targetType) {
          result = result && (item.targetType === this.filtered.targetType)
        }
        if (this.filtered.algorithm) result = result && (item.algorithm === this.filtered.algorithm)

        return result
      })
      // }

      this.filterByText()
    },
    filterByText () {
      if (!this.searchTextObj) {
        this.targetGroupList = this.filteredByGroupList
        return
      }

      this.targetGroupList = this.filteredByGroupList.filter(item => {
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
      isGetTargetGroupList: false,

      originData: [],
      filteredByGroupList: [],
      targetGroupList: [],

      searchInputText: '',
      searchTextObj: null,
      searchableCols: [
        { label: `${root.$v('대상그룹')} ${root.$v('이름')}`, binding: 'targetGroupName' },
        { label: 'VPC ID', binding: 'vpcId' }
      ],

      targetTypeOptions: [// 대상 유형 선택 옵션
        { label: root.$v('전체'), value: null },
        { label: root.$v('인스턴스'), value: 'instance' },
        { label: 'IP', value: 'ip' }
      ],
      algorithmOptions: [// 알고리즘 선택 옵션
        { label: root.$v('전체'), value: null }
      ],

      originGridState: null,
      filtered: { // 상단 필터
        targetType: null, // 대상 유형
        algorithm: null // 알고리즘
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
      },
      targetTypes: {
        instance: root.$v('인스턴스'),
        ip: 'IP'
      },
      envType: {
        STG: root.$v('스테이징'),
        DEV: root.$v('개발'),
        PRD: root.$v('운영')
      },

      targetGroupColumns: [
        { binding: 'targetGroupName', header: `${root.$v('대상그룹')} ${root.$v('이름')}` },
        { binding: 'state', header: root.$v('상태'), customHtml: true, width: 150 },
        { binding: 'protocol', header: root.$v('프로토콜'), width: 100 },
        { binding: 'port', header: root.$v('포트'), width: 100 },
        { binding: 'vpcId', header: 'VPC ID' },
        { binding: 'targetType', header: root.$v('대상유형'), customHtml: true },
        { binding: 'targetCount', header: root.$v('등록대상 개수'), width: 100 },
        { binding: 'algorithm', header: root.$v('알고리즘') },
        { binding: 'companyName', header: '관계사', keyPath: 'common.TERMS.rel', width: 100 },
        { binding: 'groupName', header: '조직', keyPath: 'common.TERMS.group', width: 100 },
        { binding: 'projectName', header: '프로젝트', keyPath: 'common.TERMS.project', width: 100 },
        { binding: 'createDate', header: root.$v('생성 시간') },
        { binding: 'modifyDate', header: root.$v('마지막 변경 시간') }
      ]
    }
  }
}
</script>
