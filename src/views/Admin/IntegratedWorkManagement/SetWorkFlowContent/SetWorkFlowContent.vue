<template>
  <div class="workflow-content">
    <!-- 🌸 values :: {{ values }} <br><br> -->
    <!-- 🌸 rawValues :: {{ rawValues }} <br><br> -->
    <div
      class="-empty"
      v-if="!data"
    >
      {{ $v('프로세스를 선택해주세요.') }}
    </div>

    <div
      class="-empty"
      v-else-if="data && data.workflowId.workflowStep === 'DONE'"
    >
      {{ $v('해당 업무 단계는 조회 화면 입니다.') }}
    </div>

    <div
      v-else
      v-for="content in contents"
      :key="content.field"
      :class="['content', { 'border-bottom': content.borderBottom }]"
    >
      <strong class="label">{{ content.title }}</strong>

      <el-switch
        class="switch"
        v-if="content.type === 'switch'"
        v-model="values[content.field]"
      />

      <button
        class="button switch"
        type="is-primary"
        v-if="content.type === 'button'"
        @click="blsmModal = true"
      >
        {{ $v('결재선 설정') }}
      </button>

      <div
        class="reports"
        v-if="content.isDocument && values[content.field] === true"
      >
        <TemplateList
          :process="data"
          :auto-selected-templates="data.templates"
          @checked="data => values.templates = data"
        />
      </div>
      <!-- /. 보고서 설정 -->

      <div
        class="reports"
        v-if="data.approvers"
      >
        <cmp-grid
          :columns="approversColumns"
          :item-source="approvers"
        >
          <template #type="{ row }">
            {{ row.type === 'S' ? $v('결재') : $v('합의') }}
          </template>

          <template #delete="{ row }">
            <a
              class="-delete-icon"
              @click="deleteApprovers(row)"
            />
          </template>
        </cmp-grid>
      </div>
      <!-- /. 결재선 설정 -->

      <!-- <ul
        class="alert-items"
        v-if="content.items && content.items.length > 0"
      >
        <li
          v-for="item in content.items"
          :key="item.field"
        >
          <el-checkbox
            :label="item.label"
            v-model="alertValues[item.field]"
          />
        </li>
      </ul> -->
      <!-- /. Alert 설정 -->
    </div>

    <div
      class="button-area"
      v-if="data && data.workflowId.workflowStep !== 'DONE'"
    >
      <!-- <button
        class="button"
        type="is-anti"
        @click="reset"
      >
        {{ $v('초기화') }}
      </button> -->
      <button
        class="button"
        type="is-primary"
        @click="save"
      >
        {{ $v('저장') }}
      </button>
    </div>

    <!-- 조직도 모달 -->
    <approval-modal
      v-if="blsmModal"
      :active.sync="blsmModal"
      :data="approvers"
      @confirm="saveApprovers"
      @close="blsmModal = false"
    />
    <!-- :resource-list="resourceList" -->
  </div>
</template>

<script>

import API from '@sd-fe/cmp-core'
import ApprovalMemberModal from '@/components/Modal/ApprovalMemberModal/ApprovalMemberModal'
import TemplateList from '../SetWorkFlowTemplate/TemplateList'
import { cloneDeep } from 'lodash'

export default {
  name: 'SetWorkFlowContent',
  components: {
    TemplateList,
    'approval-modal': ApprovalMemberModal
  },
  props: {
    data: { // 선택된 [프로세스]
      type: [Object, null],
      default: null
    }
  },
  watch: {
    /**
     * [프로세스] 선택시 기본 계획 데이터와 바인딩
     * @param {Boolean} useApproval [결재 사용 설정] 여부
     * @param {Boolean} useDocument [보고서 설정] 여부
     * @param {Boolean} useAlert    [Alert 설정] 여부
     * @param {Array} templates     등록된 [보고서] 목록
     * @param {Object} workflowId   Object 형식의 서비스/프로세스 정보
     * @param {Array} approvers     저장된 결재자 정보
     */
    data ({ useApproval, useDocument, useAlert, templates, workflowId, approvers, ...data }) {
      this.initialize()
      // console.log('@@ change :: ', this.data)

      this.values = { useApproval, useDocument, useAlert, templates, workflowId }
      this.workflowId = cloneDeep(workflowId)
      this.id = workflowId.id // Text 형식의 workflowId
      this.approvers = cloneDeep(approvers)

      this.valuesWatcher(this.values)
      this.rawValues = JSON.parse(JSON.stringify(this.values))

      // 🌸 테스트용 콘솔
      // console.log(
      //   '%c @@ WATCH {data} :: ', 'background-color: skyblue; color: black',
      //   '\n - values: ', this.values
      // )
    },

    /**
     * values 최종 설정 내용을 외부로 emit 합니다.
     * @param {Object} values
     */
    values: {
      deep: true,
      handler (values) {
        this.initialize()
        this.valuesWatcher(values)
      }
    }
  },

  methods: {
    /**
     * 프로세스 선택시 제일 먼저
     * 매번 {this.contents} 를 초기값으로 초기화 합니다.
     */
    initialize () {
      this.contents = []
      // this.contents = [{ title: 'Alert 설정', field: 'useAlert' }]
    },

    /**
     * (value watch) values 최종 설정 내용을 외부로 emit 합니다.
     * @param {Object} values
     * @return {Function} $emit('values')
     */
    valuesWatcher (values) {
      const { useApproval } = values

      this.setDocumentSetting(useApproval) // [보고서 설정]
      // this.setAlertItemsSetting(useAlert) // [Alert 설정]
      this.setApprovalSetting() // [결재(권)자 선택 설정]

      // 🌸 테스트용 콘솔
      // console.log(
      //   '%c @@ WATCH {values} :: ', 'background-color: darkblue',
      //   '\n - values: ', values,
      //   '\n - this.contents: ', this.contents
      // )

      return this.$emit('values', values)
    },

    /**
     * - [결재 사용 설정 - ON] 일때 [보고서 설정] 노출 조건
     * - 사전협의 (일반) :: 작업계획서
     * - 사전협의 (긴급) :: 사후 완료보고서
     * - 할일    :: 작업완료보고서
     * - 결재    :: 없음
     *
     * [결재 사용 설정] 에 따라 [보고서 설정] 조건 설정
     * @param {Boolean|undefined} status useApproval ON/OFF 여부, undefined (결재1, 2)
     */
    setDocumentSetting (status) {
      // [결재 사용 설정] 기본 형태
      const approvalDefault = { title: '결재 사용 설정', field: 'useApproval', type: 'switch', borderBottom: true }

      // case 1) [결재 1,2] 일 경우 [결재 사용 설정] 자체가 없음
      if (status === undefined) {
        this.contents = [...this.contents]
        return
      }

      // case 2) [결재 사용 설정 - OFF] 일 경우 하단 [보고서 설정] 없음 + [보고서 설정] 체크 여부 초기화
      if (status === false) {
        this.contents = [approvalDefault, ...this.contents]
        this.values.useDocument = true // [보고서 설정 ON/OFF] 초기화 - default 는 ON 상태
        return
      }

      // 🌸 테스트용 콘솔
      // console.log(
      //   '%c@@ setDocumentSetting', 'color: yellow',
      //   '\n - this.data :: ', this.data,
      //   '\n - this.workflowId :: ', this.workflowId
      // )

      // case 3) [결재 사용 설정 - ON] 일 경우 하단 [보고서] 추가
      // default 설정
      const documentDefault = { title: this.$v('보고서 설정'), field: 'useDocument', type: 'switch', isDocument: true }
      const document = cloneDeep(documentDefault)

      this.contents = [approvalDefault, document, ...this.contents]
    },

    /**
     * [Alert 설정] 에 따라 [items] 노출 조건 설정
     * @param {Boolean} status useAlert ON/OFF 여부
     */
    setAlertItemsSetting (status) {
      // default 설정  =>  Web/Alert, Email checked
      const alertValuesDefault = { webAlert: true, email: true, sms: false, kakaoBiz: false }
      const alertItemsDefault = [
        { label: 'WEB Alert', field: 'webAlert' },
        { label: 'Email', field: 'email' },
        { label: 'SMS', field: 'sms' },
        { label: 'Kakao Biz', field: 'kakaoBiz' }
      ]

      this.alertValues = status ? cloneDeep(alertValuesDefault) : {}

      // ----
      // ----
      // ----

      // 결론 ) 전체 Contents 설정
      this.contents.map(item => {
        // [Alert 설정] :: ON 일경우, content.items 설정
        if (item.field === 'useAlert') {
          item.items = (status === true) ? cloneDeep(alertItemsDefault) : []
        }

        return item
      })
    },

    /**
     * 프로세스가 [결재] 일 경우,
     * [결재(권)자 선택] 설정
     */
    setApprovalSetting () {
      const regex = /APPROVAL/gi
      if (!regex.test(this.data?.workflowId?.workflowStep)) return

      const documentDefault = { title: this.$v('결재(권)자 설정'), field: 'useApprovalPerm', type: 'button' }
      const document = cloneDeep(documentDefault)

      this.contents = [document, ...this.contents]
    },

    /**
     * [결재선 설정] 저장
     * @param {Array} approvers 선택된 결재선 데이터
     */
    saveApprovers (approvers) {
      const result = approvers.map(({ userId, userName, userPosition, companyName, groupName, no, type }) => {
        return {
          no,
          type,
          approver: { id: userId, name: userName, position: userPosition },
          company: { idx: null, name: companyName },
          userGroup: { idx: null, name: groupName }
        }
      })

      this.values.approvers = result
      this.approvers = cloneDeep(result)

      // 🌸 테스트용 콘솔
      // console.log(
      //   '%c @@ WATCH {data} :: ', 'background-color: orange; color: black',
      //   '\n - values: ', this.values
      // )
    },

    /**
     * 결재자 삭제 (저장하기 전까진 UI에서만 삭제된 상태)
     * @param {Object} row 결재자 정보
     */
    deleteApprovers ({ no }) {
      const filter = this.approvers.filter(approver => approver.no !== no)
      const result = filter.map((data, index) => {
        data.no = index + 1 // 삭제되면 넘버 수정
        return data
      })

      this.values.approvers = result
      this.approvers = cloneDeep(result)
    },

    /**
     * [초기화] 버튼 클릭시 발생하는 이벤트
     * 모든 데이터 이전으로 초기화
     */
    reset () {
      this.$confirm(this.$v('내용을 저장하지 않고 초기화하시겠습니까?'), '알림', {
        confirmButtonText: this.$v('초기화'),
        cancelButtonText: this.$v('취소')
      }).then(() => {
        this.values = JSON.parse(JSON.stringify(this.rawValues))
      }).catch(() => false)
    },

    /**
     * [저장] 버튼 클릭시 발생하는 이벤트
     */
    save () {
      const save = async () => {
        try {
          // [사전협의/할일] vs [결재] 사용 api가 다름
          const workflowStep = this.data.workflowId?.workflowStep // REVIEW, APPROVAL1, TODO, APPROVAL2
          const regex = new RegExp('APPROVAL', 'gi')
          const isApproval = regex.test(workflowStep)
          const apiName = isApproval ? 'updateApprovalWorkflowId' : 'updateTaskWorkflowId'

          const payload = { workflowId: this.id, payload: this.values }
          const response = await API.work_v3[apiName](payload)

          if (response) return this.$emit('save')
        } catch (error) {
          console.error(error)
          return this.$alert(this.$v('저장에 실패했습니다.'))
        }
      }

      return this.$confirm(this.$v('내용을 저장하시겠습니까?'), '알림', {
        confirmButtonText: this.$v('저장'),
        cancelButtonText: this.$v('취소')
      }).then(save).catch(() => false)
    }
  },
  data: () => ({
    id: undefined, // workflowId 정보 저장 (String)
    workflowId: null, // workflowId 정보 저장 (Object)
    rawValues: {}, // 가공하지 않은 워크플로우 저장 데이터 ([초기화] 에 이용)
    values: {}, // 워크플로우 저장 데이터 데이터
    alertValues: {},
    contents: [ // 컨텐츠 내용 바인딩
      // ## 기본 컨텐츠 형태
      // { title: '결재 사용 설정', field: 'useApproval', borderBottom: true },
      // { title: '보고서 설정 (작업 계획서)', field: 'useDocument', borderBottom: true, isPlan: true },
      // { title: '보고서 설정 (사후완료보고서)', field: 'useDocument3', borderBottom: true, isPlan: true },
      // { title: '보고서 설정 (작업완료보고서)', field: 'useDocument4', borderBottom: true, isPlan: true },
      // {
      //   title: 'Alert 설정',
      //   field: 'useAlert'
      //   items: [
      //     { label: 'WEB Alert', field: 'webAlert' },
      //     { label: 'Email', field: 'email' },
      //     { label: 'SMS', field: 'sms' },
      //     { label: 'Kakao Biz', field: 'kakaoBiz' }
      //   ]
      // }
    ],
    approversColumns: [
      { header: '순번', binding: 'no' },
      { header: '이름', binding: 'approver.name' },
      { header: '조직', binding: 'userGroup.name' },
      { header: '결재 / 합의', binding: 'type', customHtml: true },
      { header: '삭제', binding: 'delete', customHtml: true }
    ],
    approvers: [],
    templateJson: [],
    blsmModal: false
  })
}
</script>

<style lang="scss" scoped>
.workflow-content {
  background: $dark-navy;
  border-radius: $radius-m;
  padding: 40px;
  height: 100%;
  box-sizing: border-box;
  position: relative;

  .-empty {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $input-placeholder;
  }

  .content {
    display: block;
    position: relative;
    padding-bottom: $gap-m;
    margin-top: $gap-m;

    &:first-child { margin: 0; }

    &.border-bottom { border-bottom: 1px solid $dark-slate; }

    .label { font-size: 16px }

    .switch {
      position: absolute;
      top: 0; right: 0;
    }
  }

  .reports {
    padding-top: $gap;
    // display: flex;
    // flex-direction: column;
    // justify-content: center;
    // align-items: flex-end;
  }

  .alert-items {
    margin-top: $gap;
    display: flex;
    align-items: center;

    li { margin-right: 40px; }
  }

  .button-area {
    position: absolute;
    bottom: 40px; right: 40px;
  }
}

.reports-lists-wrap {
  display: grid;
  grid-template-columns: 1fr 60px 1fr;
  grid-template-rows: 430px;

  .section {
    > div { height: 100% }

    .reports-lists {
      position: relative;

      &::after, &::before {
        content: '';
        position: absolute;
        width: 363px;
        height: 1px;
        left: 0;
        background-color: $purple-gray;
      }
      &::after { bottom: 0 }

      > ul {
        width: 370px;
        overflow-y: auto;
        height: 430px;
        padding-right: 10px;

        > li {
          height: 80px;
          border-bottom: 1px solid $purple-gray;
          display: flex;
          align-items: center;
          justify-content: space-between;

          &:last-child { border: none; }

          .-info {
            margin-left: $gap-s;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;

            strong { font-weight: normal; }
            span { color: $text-lighter-gray }
          }
        }
      }

      &.-empty {
        color: $input-placeholder;
        font-size: 13px;
        border-top: 1px solid $purple-gray;
        border-bottom: 1px solid $purple-gray;

        &::after, &::before { content: none }
      }
    }

    .reports-tag {
      border: 1px solid $purple-gray;
      border-radius: 6px;
      padding: $gap;
      box-sizing: border-box;

      > span {
        margin-bottom: $gap-s;
      }
    }

    .-empty {
      color: $input-placeholder;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }
}
</style>
