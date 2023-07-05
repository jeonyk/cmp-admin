<!--
  * 파일명 : SetResourceELBList.vue
  * 파일 기능 : 구성관리 > 자원관리 > ALB 리스트
  * 작성자 : 김예담
  * 최종 작성일 : 2022-04-07
  * License By Shinsegae I&C
 -->

<template>
  <section
    v-loading="isGetNLBList"
  >
    <resource-filter-component
      cloud-type="public"
      @search="searchByProject"
      @reset="filtered.schema = null"
    >
      <section class="filter-form">
        <span class="filter-name">스키마</span>
        <div class="filter-options">
          <el-select
            v-model="filtered.schema"
            placeholder="스키마"
            :popper-append-to-body="false"
            @change="filtering()"
          >
            <el-option
              v-for="option in schemaOptions"
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
      @fetch="fetchAutocompleteOptions(
        ...arguments,
        filteredByGroupList,
        searchableCols
      )"
      @select="selectAutoComplete"
      @reset="() => {
        searchTextObj = null
        filtering()
      }"
    />

    <div class="table-area">
      <cmp-grid
        v-loading="isGetNLBList"
        :item-source="elbList"
        :columns="elbColumns"
        :init-custom-action="flex => this.grid = flex"
        :custom-init-filter="filter => this.gridFilter = filter"
        @selectedRow="selectRow(...arguments, 'nlb')"
        use-excel-download
        selectable
        @total-count="cnt => totalResultCnt = cnt"
      >
        <template #state="props">
          <cmp-status-tag
            v-if="props.row.state && stateLabel[props.row.state]"
            :type="stateLabel[props.row.state] ?
              `is-${stateLabel[props.row.state].tag}` :
              undefined"
          >
            <i
              class="el-icon-loading"
              v-if="stateLabel[props.row.state].tag === 'loading'"
            />
            {{ props.row.state ? stateLabel[props.row.state].text : '-' }}
          </cmp-status-tag>
        </template>
        <!-- 상태 -->

        <template #availabilityZoneList="{ row }">
          <div v-if="row.availabilityZoneList && row.availabilityZoneList.length">
            <el-tooltip
              v-if="row.availabilityZoneList.length > 1"
              placement="bottom-end"
              popper-class="panel-title-popper"
              effect="light"
            >
              <template #content>
                <span v-html="zoneListHtml(row.availabilityZoneList)" />
              </template>
              <span>{{ row.availabilityZoneList[0] }} {{ $t('common.TERMS.other') }}
                <b>{{ row.availabilityZoneList.length - 1 }}</b>
              </span>
            </el-tooltip>

            <span v-else>{{ row.availabilityZoneList[0] }}</span>
          </div>
          <span v-else>-</span>
        </template>
        <!-- 가용영역 -->

        <template #createTime="props">
          <span v-if="props.row.createTime">{{ props.row.createTime | date }}</span>
        </template>
        <!-- 생성 날짜 -->
      </cmp-grid>
    </div>
  </section>
  <!-- NLB -->
</template>
<script>
import { includes } from 'lodash'
import API, { ResourceFilterComponent } from '@sd-fe/cmp-core'
import GridUtils from '@/components/Utils/GridUtils'
import fetchAutocompleteOptions from '../../fetchAutocompleteOptions.mixins.js'

import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'SetResourceELBList',
  mixins: [fetchAutocompleteOptions],
  components: {
    ResourceFilterComponent
  },
  computed: {
    ...mapGetters({
      // isProjectLoaded: 'project/getIsProjectLoaded',
      getProject: 'project/getProject'
    })
  },
  async created () {
    await this.getProjectByCloudType()
    this.init()
  },
  methods: {
    ...mapActions({
      getProjectByCloudType: 'project/getProjectByCloudType'
    }),
    async init () {
      await this.getELBList()
      this.filtering()
    },
    changePage (page) {
      this.currPage = page
      this.init()
    },

    routeTo (to) {
      this.$router.push(to)
    },
    selectRow (row, field) {
      if (!row) return
      this.routeTo({
        name: `set-resource-${field}-detail`,
        params: {
          elbArn: row.dataItem.elbArn
        }
      })
    },
    async getELBList (param) {
      try {
        this.isGetNLBList = true
        const { data } = await API.aws.getNLB(param)
        if (!data) return

        this.originData = data.map(item => {
          const projectInfo = this.getProject(item.projectIdx)

          return {
            ...item,
            monitoring: item.monitoringState ? 'enabled' : 'disabled',
            schema: item.isPublic ? '외부' : '내부',
            availabilityZoneList: item.abZoneJson?.length ? item.abZoneJson.map(zone => zone.zoneName) : [],

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
        this.elbList = []
        throw error
      } finally {
        this.isGetNLBList = false
      }
    },
    /**
     * projectIdx 를 바탕으로 속한 그룹 정보(조직)를 리턴합니다, 관조프 필터링을 위해 반드시 필요한 작업
     */
    getGroupInfo (treeData, projectIdx) {
      for (let i = 0; i < treeData.length; i++) {
        if (!treeData[i].groupProject.length) {
          const res = this.getGroupInfo(treeData[i].children, projectIdx)
          if (res) { return res }
        }
        const filtered = treeData[i].groupProject.filter(item => item.projectIdx === projectIdx)
        if (filtered?.length) return filtered[0]
      }
    },
    async searchByProject (payload) {
      this.selectedProjectInfo = payload
      this.isProgressVm = false
      await this.init()
    },
    /**
     * elbList를 세팅합니다.
     * 세팅 전, 그리드의 sorting / filtering 상태를 기억했다가 elbList 세팅 후 다시 설정해줍니다.
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
      // if (!this.selectedProjectInfo) {
      //   this.filteredByGroupList = this.originData
      // } else {
      this.filteredByGroupList = this.originData.filter(item => {
        let result = true
        if (this.selectedProjectInfo?.companyIdx) result = result && (item.companyIdx === this.selectedProjectInfo?.companyIdx)
        if (this.selectedProjectInfo?.groupIdx) result = result && (item.groupIdx === this.selectedProjectInfo.groupIdx)
        if (this.selectedProjectInfo?.projectIdx) result = result && (item.projectIdx === this.selectedProjectInfo.projectIdx)

        if (this.filtered.schema !== null) result = result && (item.isPublic === this.filtered.schema)
        return result
      })
      // }

      this.filterByText()
    },
    filterByText () {
      if (!this.searchTextObj) {
        this.elbList = this.filteredByGroupList
        return
      }

      this.elbList = this.filteredByGroupList.filter(item => {
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
    },
    zoneListHtml (list) {
      if (list.length <= 1) return
      let ips = ''
      for (let i = 1; i < list.length; i++) {
        ips += list[i] + '<br>'
      }
      return ips
    }

  },
  data () {
    return {
      totalResultCnt: 0,
      currPage: 1,
      isGetNLBList: false,
      originData: [
        {
          efsName: 'ITSM 프로젝트_ELB명_01',
          fileSystemId: 'fs-0fe4f786878547fa6',
          state: 'undefined',
          range: 'One Zone 모드',
          size: 16,
          mainUseRange: 100,
          iaRange: '0',
          performanceMode: '범용',
          throthroughputMode: '버스트 모드',
          dataLifeCycle: 'use',
          accessPointCnt: 5,
          availabilityZone: 'ap-northeast-2a',
          regionName: '서울',
          companyName: '신세계I&C',
          groupName: '데이터센터팀',
          projectName: 'ITSM 프로젝트',
          createTime: +new Date()
        },
        {
          efsName: 'ITSM 프로젝트_ELB명_02',
          fileSystemId: 'fs-0fe4f786878547fa6',
          state: 'running',
          range: 'Region 모드',
          size: 100,
          mainUseRange: 320,
          iaRange: 50,
          performanceMode: '최대 I/O',
          throthroughputMode: '프로비저닝',
          dataLifeCycle: 'notUse',
          accessPointCnt: 2,
          availabilityZone: 'ap-northeast-2a',
          regionName: '유럽',
          companyName: '신세계I&C',
          groupName: '데이터센터팀',
          projectName: 'ITSM 프로젝트',
          createTime: +new Date()
        },
        {
          efsName: 'ITSM 프로젝트_ELB명_03',
          fileSystemId: 'fs-0fe4f786878547fa6',
          state: 'shutting-down',
          range: 'Region 모드',
          size: 50,
          mainUseRange: 200,
          iaRange: 50,
          performanceMode: '최대 I/O',
          throthroughputMode: '프로비저닝',
          dataLifeCycle: 'notUse',
          accessPointCnt: 2,
          availabilityZone: 'ap-northeast-2a',
          regionName: '서울',
          companyName: '신세계I&C',
          groupName: '데이터센터팀',
          projectName: 'ITSM 프로젝트',
          createTime: +new Date()
        }
      ],
      filteredByGroupList: [],
      elbList: [],
      searchableCols: [
        { label: '인스턴스 명', binding: 'instanceId' },
        { label: '인스턴스 명', binding: 'instanceName' }
      ],

      selectedProjectInfo: null,
      searchInputText: '',
      searchTextObj: null,

      schemaOptions: [
        { label: '전체', value: null },
        { label: '외부', value: true },
        { label: '내부', value: false }
      ], // 스키마 선택 옵션

      originGridState: null,
      filtered: { // 상단 필터
        schema: null // 스키마
      },

      stateLabel: {
        provisioning: {
          text: '진행 중',
          tag: 'loading'
        },
        active: {
          text: '사용 가능',
          tag: 'available'
        },
        active_impaired: {
          text: '정지',
          tag: 'stop'
        },
        failed: {
          text: '장애',
          tag: 'error'
        }
      },

      // ========== NLB
      nlbGridData: [],

      // ================= ALB
      albGridData: [{
        lbName: '로드밸런서_01',
        state: 'undefined',
        schema: '내부',
        vpcId: 'vpc-0aa29e57f6b354702',
        availabilityZone: 'ap-northeast-2a',
        listener: 2,
        targetGroupCount: 1,
        companyName: '신세계 I&C',
        groupName: 'IDC 사업팀',
        projectName: 'CMP project',
        createTime: +new Date()
      }, {
        lbName: '로드밸런서_02',
        state: 'pending',
        schema: '외부',
        vpcId: 'vpc-6fc1b007',
        availabilityZone: 'ap-northeast-2a',
        listener: 3,
        targetGroupCount: 2,
        companyName: '신세계 I&C',
        groupName: 'IDC 사업팀',
        projectName: 'CMP project',
        createTime: +new Date()
      }],
      elbColumns: [
        { binding: 'elbName', header: '로드밸런서 이름' },
        { binding: 'state', header: '상태', customHtml: true },
        { binding: 'schema', header: '스키마' },
        { binding: 'vpcId', header: 'VPC ID' },
        { binding: 'availabilityZoneList', header: '가용영역', customHtml: true },
        { binding: 'listenerCount', header: '리스너 개수', width: 100 },
        { binding: 'targetGroupCount', header: '대상그룹 개수', width: 100 },
        { binding: 'companyName', header: '관계사', keyPath: 'common.TERMS.rel' },
        { binding: 'groupName', header: '조직', keyPath: 'common.TERMS.group' },
        { binding: 'projectName', header: '프로젝트', keyPath: 'common.TERMS.project' },
        { binding: 'createTime', header: '생성 날짜', customHtml: true }
      ]
    }
  }
}
</script>
<style lang="scss">
.set-resource-elb-list {
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
