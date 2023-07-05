<!--
  * 파일명 : TaskDatabase.vue
  * 파일 기능 : [Database] 관련 그리드입니다. 관련 그리드 데이터를 외부에서 받아 수정/변경 할 수 있습니다.
  * 작성자 : 염창윤 외 2명
  * 최종 작성일 : 2021-02-16
  * License By Shinsegae I&C
  * 2021-02-16 업무 > 사전협의 : 1. 그리드 엑셀다운로드 불필요한 곳 삭제 2. VLAN ID 노출 관련 수정
 -->

<template>
  <div class="task-database task-resource-grid">
    <section
      class="title-area flex-wrap"
      style="justify-content: space-between;"
    >
      <div class="process-top-area">
        <span class="sub-title">Database</span>
        <view-cnt :count="tableData.length" />
      </div>

      <task-common-source-buttons
        :checked-data="checkedData"
        @click="clickSourceButtonEvent"
      />
    </section>

    <cmp-grid
      :added-item-formatter="initGrid"
      :item-source="tableData"
      :columns="columns"
      class="task-resource-grid"
      :header-checkbox="true"
      :use-excel-download="false"
      @checkedRowsData="checkedRows"
      :use-column-filter="false"
      :all-checkbox-disable="!editable"
    >
      <template #setting="props">
        <a
          v-if="showSetting"
          :class="['-editable', displayConfigSettingClassName(props.row)]"
          @click.stop="selectAssignInfo(props)"
        >
          {{ workable ? displayConfigSettingText(props.row) : $v('자원 할당 보기') }}
        </a>
      </template>
      <!-- /. 자원 할당 설정 -->

      <template #info="props">
        <a
          class="-icon -copy-icon"
          @click="selectSourceInfo(props)"
        />
      </template>
      <!-- /. 자원정보 -->

      <template #workResult="{ row }">
        <task-status-tags
          :status="row.workItemState"
          :fail-message="row.memo"
          @confirm="$event => $emit('execute-resolve', { data: $event, row })"
        />
      </template>
      <!-- /. 작업 상태 -->
    </cmp-grid>

    <!-- 모달 -->
    <resource-info
      type="DATABASE"
      :read-only="!workable"
      :data="updateItem"
      :active="resourceInfoModal"
      @close="resourceInfoModal = false"
      @save="item => $emit('update-resource-info', item)"
    />
    <!-- /. [자원 정보] 모달 -->

    <task-source-modal-database
      :active="setTaskSourceModal"
      :data="updateItem"
      :table-data="tableData"
      :read-only="!workable"
      @confirm="saveAssignInfo"
      @close="setTaskSourceModal = false"
    />
    <!-- /. [자원 할당] 모달 -->
  </div>
</template>
<script>
import ViewCnt from '@/components/ViewCnt/ViewCnt'
import ResourceInfo from '@/components/Modal/ResourceInfo/ResourceInfo'
import TaskSourceModalDatabase from '@/components/Modal/TaskSourceModal/TaskSourceModalDatabase'
import TaskCommonSourceButtons from '@/components/TaskCommonSourceButtons/TaskCommonSourceButtons'

import TaskSetCommon from '../TaskSetCommon'
import TaskStatusTags from '../TaskStatusTags'

import { cloneDeep } from 'lodash'

export default {
  name: 'TaskDatabase',
  components: {
    'view-cnt': ViewCnt,
    'resource-info': ResourceInfo,
    'task-status-tags': TaskStatusTags,
    'task-source-modal-database': TaskSourceModalDatabase,
    'task-common-source-buttons': TaskCommonSourceButtons
  },
  mixins: [TaskSetCommon],
  props: {
    data: {
      type: Array,
      default: () => []
    },
    editable: {
      type: Boolean,
      default: true
    }
  },
  created () {
    this.columns = this.setColumns_V3(this.rawColumns, 'DATABASE')

    this.tableData = this.setInitData(this.data)
    this.userInfo = this.$store.state?.auth?.user

    // 삭제 자원은 > required = false 설정
    this.setUnrequiredColumns(this.tableData)
  },
  watch: {
    data (newVal) {
      // this.checkedData = []
      this.tableData = this.setInitData(newVal)
    }
  },
  methods: {
    /**
     * v3) Database 기본 데이터 세팅
     */
    setInitData (tableData) {
      const src = this.setCheckedSrcIdx()
      const cloneData = cloneDeep(tableData)
      const setDate = date => this.$options.filters.date(date, 'YYYY.MM.DD')

      const regex = new RegExp(/CANCELED_AT_|SUCCESS_BY_HAND|SUCCESS|WORKING/)

      const list = cloneData.map(row => {
        const { workSchedule, engineType, version, topology, osName, osVersion, osPlatform } = row
        const scheduling = workSchedule ? (`${setDate(workSchedule.scheduledAt)} ${workSchedule.useAutoSchedule ? this.$v('자동') : this.$v('수동')}`) : '-'
        // const displayExternalDiskList = row.externalDiskList?.length ? row.externalDiskList.filter(disk => !(disk?.deviceIndex === 0 && disk?.deviceBus === 'SCSI')) : [] // UI 상에서 rootDisk 노출을 없애기 위함

        const condition1 = regex.test(row.workItemState) // [작업취소] 확정시, [별도처리], [진행중] 상태에는 disabled
        const condition2 = this.$orderType() === 'URGENT' // [긴급] 자원일경우에는 disabled

        return {
          ...row,
          checked: src.has(row.srcIdx),
          disable: condition1 || condition2,
          scheduling, // 예약설정
          engineInfo: `${engineType}/${version}/${topology}`,
          osInfo: `${osName}${osVersion}${osPlatform}`
        }
      })

      return list
    }
  },
  data () {
    return {
      tableData: [],
      checkedData: [],
      updateItem: null,
      setTaskSourceModal: false,
      resourceInfoModal: false // [자원정보] 모달 ON/OFF
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
