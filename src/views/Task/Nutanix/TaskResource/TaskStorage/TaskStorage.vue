<!--
  * 파일명 : TaskStorage.vue
  * 파일 기능 : [Storage] 관련 그리드입니다. 관련 그리드 데이터를 외부에서 받아 수정/변경 할 수 있습니다.
  * 작성자 : 염창윤 외 2명
  * 최종 작성일 : 2021-02-16
  * License By Shinsegae I&C
  * 2021-02-16 업무 > 사전협의 : 1. 그리드 엑셀다운로드 불필요한 곳 삭제 2. VLAN ID 노출 관련 수정
 -->

<template>
  <div class="task-storage task-resource-grid">
    <section
      class="title-area flex-wrap"
      style="justify-content: space-between;"
    >
      <div class="process-top-area">
        <span class="sub-title">Storage</span>
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
      <template #vmList="props">
        <button-popup
          :popup-data="countVmList(props.row.vmList)"
          trigger="hover"
        >
          {{ props.row.vmList.length }} EA
        </button-popup>
      </template>
      <!-- /. 연결 호스트 -->

      <template #diskList="props">
        <button-popup
          :popup-data="countDiskList(props.row.diskList)"
          trigger="hover"
        >
          {{ props.row.diskList.length }} EA
        </button-popup>
      </template>
      <!-- /. 크기(신청 용량) -->

      <template #setting>
        -
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

    <resource-info
      type="STORAGE"
      :read-only="!workable"
      :data="updateItem"
      :active="resourceInfoModal"
      @close="resourceInfoModal = false"
      @save="item => $emit('update-resource-info', item)"
    />
    <!-- /. [자원 정보] 모달 -->
  </div>
</template>
<script>
import ViewCnt from '@/components/ViewCnt/ViewCnt'
import ButtonPopup from '@/components/ButtonPopup/ButtonPopup'
import ResourceInfo from '@/components/Modal/ResourceInfo/ResourceInfo'
import TaskCommonSourceButtons from '@/components/TaskCommonSourceButtons/TaskCommonSourceButtons'

import TaskSetCommon from '../TaskSetCommon'
import TaskStatusTags from '../TaskStatusTags'

import { cloneDeep } from 'lodash'

export default {
  name: 'TaskStorage',
  components: {
    'view-cnt': ViewCnt,
    'button-popup': ButtonPopup,
    'resource-info': ResourceInfo,
    'task-status-tags': TaskStatusTags,
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
    this.columns = this.setColumns_V3(this.rawColumns, 'STORAGE')

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

      const list = cloneData.map(row => {
        const { autoScheduleAt } = row
        const scheduling = autoScheduleAt ? (`${setDate(autoScheduleAt)} ${autoScheduleAt ? this.$v('자동') : this.$v('수동')}`) : '-'

        return {
          ...row,
          checked: src.has(row.srcIdx),
          scheduling // 예약설정
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
      resourceInfoModal: false, // [자원정보] 모달 ON/OFF
      countVmList: (lists) => lists.map(list => { return { label: list.hostname } }),
      countDiskList: (lists) => lists.map(list => { return { label: `${list.diskSize} GB` } })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
