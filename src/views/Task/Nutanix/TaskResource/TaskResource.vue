<template>
  <div class="task-resource-wrapper">
    <g-tab
      ref="resource"
      :data="tabs"
      @click="saveTab"
    >
      <template #name="{ row }">
        {{ row.name }}
        <span class="view-count">{{ row.count }}</span>
      </template>

      <template
        v-for="tab in tabs"
        :slot="tab.field"
      >
        <div
          class="task-common-contents"
          :key="tab.field"
        >
          <g-foldable
            ref="confList"
            v-for="(item, key) in roleData[tab.field]"
            :key="key"
            :title="setCount(key, item.length)"
            :use-state="orderType"
          >
            <template #contents>
              <component
                :is="setComponent(key)"
                :data="item"
                :editable="setEditable(item, tab)"
                :use-checkbox="false"
                @update-source="item => $emit('update-source', item, tab)"
                @update-resource-info="data => $emit('update-resource-info', data, tab)"
                @cancel-order="rows => $emit('cancel-order', rows, tab)"
                @restore-order="rows => $emit('restore-order', rows, tab)"
                @schedule-order="rows => $emit('schedule-order', rows, tab)"
                @execute-order="rows => $emit('execute-order', rows, tab, false)"
                @delete-order="rows => $emit('delete-order', rows, tab, true)"
                @handmake-order="value => $emit('handmake-order', value, tab)"
                @execute-resolve="value => $emit('execute-resolve', value, tab)"
              />
              <!-- /. 자원 목록 -->
            </template>
          </g-foldable>

          <task-common-buttons
            class="flex-wrap center"
            :tab="tab"
            @report-order="$emit('report-order', true, tab)"
            @apply-approval="$emit('apply-approval', tab)"
            @complete-work-review="$emit('complete-work-review', tab, $event)"
            @complete-work-todo="$emit('complete-work-todo', tab, $event)"
            @complete-work-cancel="$emit('complete-work-cancel', tab, $event)"
          />
          <!-- /. 버튼 동작 -->
        </div>
      </template>
    </g-tab>
  </div>
</template>

<script>
import GFoldable from '@/components/common/g-foldable/g-foldable'
import TaskCommonButtons from '@/components/TaskCommonButtons/TaskCommonButtons'

import TaskCompute from '../TaskResource/TaskCompute/TaskCompute'
import TaskMarketplace from '../TaskResource/TaskMarketplace/TaskMarketplace'
import TaskDatabase from '../TaskResource/TaskDatabase/TaskDatabase'
import TaskStorage from '../TaskResource/TaskStorage/TaskStorage'
import TaskL4 from '../TaskResource/TaskL4/TaskL4'
import TaskL7 from '../TaskResource/TaskL7/TaskL7'
import TaskSecurity from '../TaskResource/TaskSecurity/TaskSecurity'
import TaskFileServer from '../TaskResource/TaskFileServer/TaskFileServer'
import TaskVMware from '../TaskResource/TaskVMware/TaskVMware'
import TaskVMStorage from '../TaskResource/TaskVMStorage/TaskVMStorage'
import TaskDetailCommon from '../TaskDetailCommon'

import { roleMixin } from '@/utils/work/role.js'

export default {
  name: 'TaskResource',
  props: {
    data: {
      type: Array,
      default: () => []
    },
    readOnly: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    type: (root) => (root.$route.name.replace(/-detail|task-/, '').toUpperCase()) // 현재 페이지가 [사전협의/할일/한일/결재신청/결재함] 상세중 어딘지 알랴줌
  },
  components: {
    'g-foldable': GFoldable,

    'task-compute': TaskCompute,
    'task-marketplace': TaskMarketplace,
    'task-database': TaskDatabase,
    'task-storage': TaskStorage,
    'task-l4': TaskL4,
    'task-l7': TaskL7,
    'task-security': TaskSecurity,
    'task-file-server': TaskFileServer,
    'task-vmware': TaskVMware,
    'task-vmware-storage': TaskVMStorage,
    'task-common-buttons': TaskCommonButtons
  },
  mixins: [TaskDetailCommon, roleMixin],
  created () {
    console.log('@@ TYPE', this.type)
    this.setTabs(this.data)
  },
  watch: {
    data (data) {
      // console.log(data)

      if (this.tabs.length) {
        const tab = (this.open.field) ? this.open : this.tabs[0]
        this.saveTab(tab) // 데이터 새로 저장하기 직전에 탭 정보 저장하기
      }

      this.setTabs(data)
      this.keepTab(this.open)
    }
  },
  methods: {
    /**
     * Tab 정보 가공
     * @param {Array} workRsps 자원 정보 목록
     */
    setTabs (workRsps) {
      // 데이터 세팅 시작
      const setTabs = {}
      const roleSetting = {} // 보고서, 결재설정 정보 분리

      workRsps.forEach(({
        workState, // CONFERENCE|TODO|DONE
        workItemRsps: source, // 자원목록
        workId, roleIdx, roleName,
        useApproval, useDoc, // 결재설정 ON/OFF, 보고서 설정 ON/OFF
        planDocument, reportDocument, // 사전협의 작업계획서, 할일 작업완료보고서
        ...workResps
      }) => {
        const services = {} // COMPUTE / NEWTORK / STORAGE / DATABASE ... 분류
        let block = false // 버튼 차단

        for (let i = 0; i < source.length; i++) {
          const { idx: srcIdx, workItemSpec, workItemConfig, autoScheduleAt, workItemState, resourceType, memo } = source[i]
          let { service } = source[i]

          // workItemSpec   자원 스펙 데이터 :: originJson (원본 데이터 - 절대 변하지 않음), actualJson (작업대상데이터(변경된 or 변경가능한 데이터))
          // workItemConfig 자원 할당 데이터 :: configJson (자원 할당 변경된 or 변경 가능한 데이터)
          const { actualJson, originJson } = workItemSpec ?? { actualJson: null, originJson: null }
          const { configJson } = workItemConfig ?? { configJson: null }
          // console.log(source[i])

          const data = {
            ...JSON.parse(actualJson),
            originJson,
            configJson: { ...JSON.parse(configJson) },
            autoScheduleAt,
            workItemState,
            srcIdx,
            resourceType,
            memo // 실패 사유
          }

          // 특정 자원은 내부에서 데이터를 분리해주어야함 ㅎㅠ 예외파티~
          service = this.serviceDistributor(service, data)

          this.orderType = resourceType // NEW|CHANGE|DELETE

          const hasRead = this.checkServiceAuth(service, 'readPermission')

          // 자원 foldable 용으로 분류
          if (hasRead) {
            data.isExecutable = this.checkServiceAuth(service, 'executePermission')
            if (services[service] === undefined) services[service] = [data]
            else services[service].push(data)
          }

          /*
            workItemState 상태값
              INSUFFICIENT (업무 진행을 할 수 없는 경우 ex) ip 할당이 안된 network)
              INIT (신규)
              CANCELLING (취소중인 상태 (복원 가능))
              CANCELED_AT_REVIEW (사전협의에서 작업취소 (컨펌))
              CANCELED_AT_TODO (할일에서의 작업취소 (컨펌))
              READY_TO_WORK (수동작업대기)
              SCHEDULED (자동작업대기)
              SCHEDULE_PAUSED (자동작업중지)
              WORKING (작업중)
              FAILING (실패 중인 상태)
              FAIL_CONFIRMED (실패-실패처리)
              FAIL_AS_SUCCESS (실패-성공처리)
              SUCCESS (성공)
          */

          // console.log(service, workItemState)
          if (workItemState === 'INSUFFICIENT') block = true // 통과못하면 block 처리
        }

        const key = `${roleIdx}_${roleName}`

        // role 기반으로 데이터 분리 및 저장
        if (setTabs[key]) setTabs[key] = { ...services }
        else setTabs[key] = { ...setTabs[key], ...services }

        // [워크플로우] 결재 on/off 여부, 보고서 설정 데이터 저장
        roleSetting[key] = { useApproval, useDoc, planDocument, reportDocument, workState, block, workId }
      })

      this.tabs = [] // role 기반 분리

      // tab 설정
      for (const key in setTabs) {
        let count = 0
        for (const src in setTabs[key]) count += setTabs[key][src]?.length

        const roleName = key.split('_')[1]
        const roleIdx = key.split('_')[0]

        // console.log(key, roleSetting[key])
        const setting = roleSetting[key]
        const workId = setting.workId

        const tab = { field: key, name: roleName, roleIdx, count, workId, setting }
        this.tabs.push(tab)
      }

      this.tabs = this.tabs.filter(tab => tab && tab.count > 0) // 역할 서비스 카운트 존재 시 탭 담기

      this.roleData = setTabs // 자원 기반 분리
      // console.log(this.roleData, '엉?')
      this.$emit('role-data', this.roleData)
    },

    /**
     * 같은 서비스 자원인데, 내부에서 분리가 필요한 경우
     * @param {String} service
     */
    serviceDistributor (service) {
      const key = {
        COMPUTE_BY_TEMPLATE: 'COMPUTE',
        VM_BY_TEMPLATE: 'VM'
      }[service]

      // 굳이 분리해줄 필요 없는 경우는 그냥 그대로 사용
      if (!key) return service
      else return key
    },

    // ============================================
    // =================== 기타 ====================
    // ============================================

    /**
     * 현재 보고있는 TAB 정보 저장 함수
     * @param {Object} tab 탭 정보 (field) 키는 필수입니다.
     */
    saveTab  ({ field, ...tab }) {
      const folder = this.$refs.confList
      const states = folder.map(({ foldState }) => foldState) // 폴더 상태 저장
      this.open = { field, states }
    },
    /**
     * 저장된 탭 정보 불러와서 유지해줌
     * @param {Object} tab
     */
    keepTab (open = this.open) {
      if (!this.tabs.length) return

      this.$nextTick(() => {
        // 탭 자동 설정
        for (let i = 0; i < this.tabs.length; i++) {
          const tab = this.tabs[i]
          if (tab.field === open.field) {
            this.$refs.resource.clickEvent(tab, i)
            break
          }
        }

        // 왜 폴더 여는건 안돼 ㅠㅠ 🟧🟧🟧🟧🟧
        // const folder = this.$refs.confList
        // console.log(folder, 'ddddd')
        // // folder state 자동 설정
        // for (let i = 0; i < folder.length; i++) {
        // // console.log(folder[i], open.states[i])
        //   // folder[i].foldState = true
        //   folder[i].foldState = open.states[i]
        // }
      })
    }
  },
  data () {
    return {
      orderType: 'NEW',
      tabs: [],
      open: { field: null, states: null }, // 최근에 열려있던 정보 저장
      roleData: [],
      setComponent (key) {
        return {
          COMPUTE: 'task-compute',
          STORAGE: 'task-storage',
          SECURITY: 'task-security',
          NETWORK_L4: 'task-l4',
          NETWORK_L7: 'task-l7',
          MARKET: 'task-marketplace',
          DATABASE: 'task-database',
          FILE_SERVER: 'task-file-server',
          VM: 'task-vmware',
          VSAN_ISCSI: 'task-vmware-storage'
        }[key]
      },

      setCount (key, length) {
        return `${key} (총 ${length}건)`
      },

      /**
       * 각 자원 편집 가능여부 확인
       * @param {Object} tab
       */
      setEditable: (item, { setting }) => {
        const { block, workState } = setting
        const [{ isExecutable }] = item

        const mustDisabled = /APPROVED|APPLY-APPROVAL/g

        if (
          this.readOnly ||
          block || // INSUFFICIENT 일때 편집 불가능
          !isExecutable || // 자원의 "실행권한" 여부 체크 -> false 라면 읽기전용
          mustDisabled.test(this.type) // 결재 관련 진행중이라면 읽기전용
        ) return false // 반드시 읽기전용이어야하는 경우

        // 연관자원일 때 {현재 보고있는 페이지 vs 현재 진행중인 상태값}이 서로 다른 경우가 있음 (상태값이 같은 경우에만 열어줘야함)
        const REVIEW = this.type === 'CONFERENCE' && /REVIEW/g.test(workState)
        const TODO = this.type === 'TODO' && /TODO/g.test(workState)
        // console.log(this.type, workState)

        return {
          REVIEW,
          CANCELED: true,
          APPROVAL1: false, // 사전협의 결재 대기중
          APPROVAL1_REJECTED: true, // 사전협의 결재 반려
          TODO, // 할일
          TODO_FINISHED: false, // 할일 완료
          APPROVAL2: false, // 할일 결재 대기중
          APPROVAL2_REJECTED: true, // 할일 결재 반려
          DONE: false // 한일
        }[workState]
      }
    }
  }
}
</script>

<style lang="scss" scoped>

.view-count {
  display: inline-block;
  font-size: 12px;
  margin-left: $gap-s;
  width: 20px;
  height: 20px;
  text-align: center;
  line-height: 20px;
  color: $white;
  border-radius: 50%;
  background-color: $main-red;
}

</style>
