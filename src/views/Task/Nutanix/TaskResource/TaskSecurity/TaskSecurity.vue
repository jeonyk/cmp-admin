<!--
  * 파일명 : TaskSecurity.vue
  * 파일 기능 : [Compute] 관련 그리드입니다. 관련 그리드 데이터를 외부에서 받아 수정/변경 할 수 있습니다.
  * 작성자 : 이경환 외 4명
  * 최종 작성일 : 2021-02-19
  * License By Shinsegae I&C
  * 2021-02-19 fix: 사전 협의 필수값 체크 추가, 디스크 자원 변경 버그 수정
 -->

<template>
  <div class="task-compute task-resource-grid">
    <section
      class="title-area flex-wrap"
      style="justify-content: space-between;"
    >
      <div class="process-top-area">
        <span class="sub-title">Security</span>
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
      :init-custom-action="initGrid"
      :use-column-filter="false"
      :all-checkbox-disable="!editable"
    >
      <template #networkList="props">
        <span v-if="props.row.networkList">{{ props.row.networkList[0].cateKey }}</span>
      </template>
      <!-- /. 네트워크 -->

      <template #externalDiskListSum="props">
        <div class="cell-flex-wrap">
          <span
            class="disk"
            v-if="props.row.displayExternalDiskList.length"
          >{{ props.row.displayExternalDiskList | volumnGroupSize }} GB</span>

          <span v-if="props.row.displayExternalDiskList">
            <button-popup
              :popup-data="countDiskList(props.row.displayExternalDiskList)"
              trigger="hover"
            >
              {{ props.row.displayExternalDiskList.length }} EA
            </button-popup>
          </span>
        </div>
      </template>
      <!-- /. ExternalDisk -->

      <template #installProgram="props">
        <div v-if="props.row.installProgramList">
          <button-popup
            :popup-data="installProgramLists(props.row.installProgramList)"
            trigger="hover"
          >
            {{ props.row.installProgramList.length }} EA
          </button-popup>
        </div>
      </template>
      <!-- /. 설치프로그램 -->

      <template #setting="props">
        <a
          :class="['-editable', displayConfigSettingClassName(props.row)]"
          @click.stop="selectAssignInfo(props)"
        >
          {{ workable ? displayConfigSettingText(props.row) : $v('자원 할당 보기') }}
        </a>
      </template>
      <!-- /. 자원 할당 설정 -->

      <template #info>
        -
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
      type="COMPUTE"
      :read-only="!workable"
      :data="updateItem"
      :active="resourceInfoModal"
      @close="resourceInfoModal = false"
      @save="item => $emit('update-resource-info', item)"
    />
    <!-- /. [자원 정보] 모달 -->

    <task-source-modal-sg
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
import ButtonPopup from '@/components/ButtonPopup/ButtonPopup'
import ResourceInfo from '@/components/Modal/ResourceInfo/ResourceInfo'
import TaskSourceModalSG from '@/components/Modal/TaskSourceModal/TaskSourceModalSG'
import TaskCommonSourceButtons from '@/components/TaskCommonSourceButtons/TaskCommonSourceButtons'

import TaskSetCommon from '../TaskSetCommon'
import TaskStatusTags from '../TaskStatusTags'

import { cloneDeep } from 'lodash'

export default {
  name: 'TaskSecurity',
  components: {
    'view-cnt': ViewCnt,
    'button-popup': ButtonPopup,
    'resource-info': ResourceInfo,
    'task-status-tags': TaskStatusTags,
    'task-source-modal-sg': TaskSourceModalSG,
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
    this.columns = this.setColumns_V3(this.rawColumns, 'SECURITY')

    this.tableData = this.setInitData(this.data)
    this.userInfo = this.$store.state?.auth?.user

    // 삭제 자원은 > required = false 설정
    this.setUnrequiredColumns(this.tableData)
  },
  watch: {
    data (newVal) {
      this.checkedData = []
      this.tableData = this.setInitData(newVal)
    }
  },
  methods: {
    /**
     * v3) Compute 기본 데이터 세팅
     */
    setInitData (tableData) {
      const cloneData = cloneDeep(tableData)
      const setDate = date => this.$options.filters.date(date, 'YYYY.MM.DD')

      const regex = new RegExp(/CANCELED_AT_|SUCCESS_BY_HAND|SUCCESS|WORKING/)

      const list = cloneData.map(row => {
        const { autoScheduleAt } = row
        const scheduling = autoScheduleAt ? (`${setDate(autoScheduleAt)} ${autoScheduleAt ? this.$v('자동') : this.$v('수동')}`) : '-'
        const displayExternalDiskList = row.externalDiskList?.length ? row.externalDiskList.filter(disk => !(disk?.deviceIndex === 0 && disk?.deviceBus === 'SCSI')) : [] // UI 상에서 rootDisk 노출을 없애기 위함

        const condition1 = regex.test(row.workItemState) // [작업취소] 확정시, [별도처리], [진행중] 상태에는 disabled
        const condition2 = this.$orderType() === 'URGENT' // [긴급] 자원일경우에는 disabled

        return {
          ...row,
          disable: condition1 || condition2,
          scheduling, // 예약설정
          displayRootDiskSize: row.rootDiskSize + ' GB', // 읽기전용
          displayExternalDiskList
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
      resourceInfoModal: false, // [자원정보] 모달 ON/OFF
      installProgramLists: (lists) => {
        const pkgLists = lists.map(list => { return { label: `${list.softwareName} ${list.versionName}` } })
        return pkgLists
      },
      countDiskList: (lists) => lists.map(list => { return { label: `${list.diskSize} GB` } })
    }
  }
}
</script>

<style lang="scss" scoped>

.disk {
  display: block;
  margin-right: $gap-s;
  min-width: 60px;
}

</style>
