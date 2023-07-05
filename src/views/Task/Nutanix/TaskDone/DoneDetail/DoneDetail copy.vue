<!--
  * 파일명 : DoneDetail.vue
  * 파일 기능 : [한일 > 상세] 페이지 입니다. 주문한 내역, 완료된 정보를 확인할 수 있습니다.
  * 작성자 : 이경환 외 2명 test
  * 최종 작성일 : 2021-02-19
  * License By Shinsegae I&C
  * 2021-02-19 Merge branch 'publish/grid-editing' of https://gitlab-s.growthsoft.co.kr/SSG/cmp-web-admin into publish/grid-editing
 -->

<template>
  <div class="done-detail">
    <section class="workflow-contents">
      <g-tab :data="taskDetailTab">
        <template #work>
          <div class="workflow-helper-wrap">
            <div class="helpers">
              <a
                class="memo-icon"
                @click="moveTo"
              >
                <span class="-alarm">
                  <span v-if="taskMemoList&&taskMemoList.data"> {{ taskMemoList.data.length }}</span>
                  <span v-else>0</span>
                </span>
              </a>
              <view-box-cnt type="is-white">
                {{ odrDataCount }}
              </view-box-cnt>

              <div
                class="conferece-checklist"
                v-if="checkList.length"
              >
                <!-- v-if="true" -->
                <conference-checklist
                  :data="checkList"
                  :is-done="true"
                  right="-190px"
                />
              </div>
            </div>

            <div class="download-buttons">
              <!-- <a
                class="download-text"
                @click="exportExcel"
              >
                견적서 다운로드
                <i class="download-icon" />
              </a> -->
              <pdf-download
                file-name="done"
                :grids="$refs"
              />
            </div>
          </div>
          <!-- /.workflow-helper-wrap -->

          <task-workflow-step
            :data="dataExam"
            :field="currentStep.roleName"
            @change="changeStep"
          />

          <div
            class="total-wrapper"
            v-loading="loading"
          >
            <div
              id="task-total-resource"
              v-for="(item, index) in dataExam"
              :key="index"
              class="workflow-list"
            >
              <div
                v-if="item.roleIdx === currentStep.roleIdx"
              >
                <section
                  v-for="resource in item.taskList"
                  :key="resource.id"
                  class="resource-area"
                >
                  <template v-if="resource.resourceList.length && (resource.workType === 'COMPUTE' || resource.workType === 'OVA')">
                    <task-compute
                      ref="doneCompute"
                      :data="resource.resourceList"
                      field="done"
                      :editable="false"
                    />
                  </template>

                  <template v-if="resource.resourceList.length && resource.workType === 'MARKET'">
                    <task-marketplace
                      ref="doneMarket"
                      :data="resource.resourceList"
                      field="done"
                      :editable="false"
                    />
                  </template>

                  <template v-if="resource.resourceList.length && resource.workType === 'DATABASE'">
                    <task-database
                      ref="doneDatabase"
                      :data="resource.resourceList"
                      field="done"
                      :editable="false"
                    />
                  </template>

                  <template v-if="resource.resourceList.length && resource.workType === 'STORAGE'">
                    <task-storage
                      ref="doneStorage"
                      :data="resource.resourceList"
                      field="done"
                      :editable="false"
                    />
                  </template>

                  <template v-if="resource.resourceList.length && resource.workType === 'NETWORK_L4'">
                    <task-l4
                      ref="doneL4"
                      :data="resource.resourceList"
                      field="done"
                      :editable="false"
                    />
                  </template>
                  <template v-if="resource.resourceList.length && resource.workType === 'NETWORK_L7'">
                    <task-l7
                      ref="doneL7"
                      :data="resource.resourceList"
                      field="done"
                      :editable="false"
                    />
                  </template>

                  <template v-if="resource.resourceList.length && resource.workType === 'SECURITY'">
                    <task-security
                      ref="doneSecurity"
                      :data="resource.resourceList"
                      field="done"
                      :editable="false"
                      :order-info.sync="orderInfo"
                    />
                  </template>
                </section>
              </div>

              <div
                class="empty-data"
                v-if="isEmpty()"
              >
                {{ $t('common.PLACEHOLDER.noData') }}
              </div>
            </div>
          </div>
        </template>
        <!-- 업무 내용 -->

        <template #order>
          <task-detail-apply :data="taskDoneInfo" />
        </template>
        <!-- 주문 정보 -->
      </g-tab>
    </section>
    <!-- /.workflow-contents -->

    <section id="memo-section">
      <h5 class="product-title">
        {{ $t('task.TODO.DETAIL.note') }}
      </h5>
      <task-memo
        :data="taskMemoList"
        @refresh-memo="getTaskDone"
      />
    </section>
  </div>
</template>
<script>
import ViewBox from '@/components/ViewBoxCnt/ViewBoxCnt'
import TaskWorkflowStep from '@/components/TaskWorkflowStep/TaskWorkflowStep'

import TaskCompute from '../../TaskResource/TaskCompute/TaskCompute'
import TaskMarketplace from '../../TaskResource/TaskMarketplace/TaskMarketplace'
import TaskDatabase from '../../TaskResource/TaskDatabase/TaskDatabase'
import TaskStorage from '../../TaskResource/TaskStorage/TaskStorage'
import TaskL4 from '../../TaskResource/TaskNetwork/TaskL4/TaskL4'
import TaskL7 from '../../TaskResource/TaskNetwork/TaskL7/TaskL7'
import TaskSecurity from '../../TaskResource/TaskSecurity/TaskSecurity'
import TaskDetailCommon from '../../TaskDetailCommon'

import TaskDetailApply from '../../TaskTodo/TodoDetail/TaskDetailApply'
import TaskMemo from '../../TaskMemo/TaskMemo'
import ConferenceCheckList from '@/components/ConferenceCheckList/ConferenceCheckList'
import * as wjGrid from '@grapecity/wijmo.grid'
import * as WjGridXlsx from '@grapecity/wijmo.grid.xlsx'
import API from '@sd-fe/cmp-core'

import Dayjs from 'dayjs'

export default {
  name: 'DoneDetail',
  components: {
    'task-workflow-step': TaskWorkflowStep,
    'view-box-cnt': ViewBox,

    'task-compute': TaskCompute,
    'task-marketplace': TaskMarketplace,
    'task-database': TaskDatabase,
    'task-storage': TaskStorage,
    'task-l4': TaskL4,
    'task-l7': TaskL7,
    'task-security': TaskSecurity,

    'task-detail-apply': TaskDetailApply,
    'task-memo': TaskMemo,
    'conference-checklist': ConferenceCheckList
  },
  mixins: [TaskDetailCommon],
  watch: {
    // rawDetail (data) {
    //   if (data.length) this.init()
    // }
  },
  async created () {
    this.orderNo = this.$route.params.id
    // this.getTasks()
    await this.getTaskDone(this.orderNo)
    this.setBreadCrumbs(this.taskDoneInfo)
  },
  methods: {
    async getTaskDone (param) {
      const response = await API.work.getTaskDone(param)
      console.log('@@ response : ', response)

      if (!response) {
        this.$router.replace({ name: 'not-found-status', params: { code: 500 } })
        return
      }

      // 한일이 아닌경우 페이지 뒤로가기
      if (!/DONE/gi.test(response.proceedStatus)) {
        this.$alert('해당 주문이 존재하지 않습니다. <br> 목록으로 이동합니다.', {
          dangerouslyUseHTMLString: true,
          callback: () => this.$router.back()
        })
        return
      }

      this.orderInfo = {
        orderDataIdx: response.orderIdx,
        orderNo: response.orderNo,
        orderType: response.orderType,
        userId: response.userId,
        userName: response.userName
      }
      // 주문 정보 항목
      this.taskDoneInfo = {
        ownerCompanyName: response.ownerCompanyName,
        projectName: response.projectName,
        deparment: response.groupName,
        chargeDate: '-',
        finishTime: response.finishTime,
        proceedStatus: response.odrProceedStatus,
        companyName: response.companyName,
        groupName: response.groupName,
        userName: response.userName,
        approvalCreateTime: response.approvalCreateTime,
        serviceDate: response.serviceDate,
        doneDate: response.doneDate
      }

      // const crStepList = response.roles?.filter(role => role.roleIdx === response.currentStep)
      // if (crStepList.length > 0) this.currentStep = { roleIdx: response.currentStep, roleName: crStepList[0].roleName }
      const userInfo = this.$store.state?.auth?.user

      if (userInfo?.userPermLevel === 0) {
        const crStepList = response.roles?.filter(role => role.roleIdx === response.currentStep)
        if (crStepList.length > 0) this.currentStep = { roleIdx: response.currentStep, roleName: crStepList[0].roleName }
      } else {
        let step = null
        step = userInfo.userPermUpperRoleList.find(role => role === response.currentStep)
        if (!step) step = userInfo.userPermUpperRoleList[0]
        step.roleIdx = step.roleUpper
        step.roleName = step.roleUpperName
        this.currentStep = step
      }
      this.lastStep = response.lastStep
      this.taskMemoList = { orderNo: response.orderNo, data: response.orderMemoList.filter(memo => !memo.isDeleted) }
      this.workFlowJson = response.roles?.filter(item => item.taskList)
      // console.log('!!workFlowJson: ', this.workFlowJson)
      for (const item in this.workFlowJson) {
        let count = 0
        if (!this.workFlowJson[item].taskList) continue
        this.workFlowJson[item].taskList.forEach(data => {
          data.resourceList = data.resourceList.map(item => {
            console.log('@@ item : ', item)
            const result = { ...item.orderData }
            result.meta = {}
            result.meta = {
              orderDataIdx: item.orderDataIdx,
              orderNo: item.orderNo,
              proceedStatus: item.proceedStatus,
              orderType: item.orderType,
              workType: item.workType,
              deleteDate: item.deleteDate,
              cancelDate: item.cancelDate,
              userId: item.userId,
              userName: item.userName
            }
            console.log('@@ result.meta : ', result.meta)
            result.workResult = {}
            if (item.taskSendRes) result.workResult = { ...item.taskSendRes }
            result.workResult.dataStatus = item.proceedStatus
            console.log('@@ result.workResult : ', result.workResult)
            if (result.workResult?.isSuccess || item.proceedStatus === 'DONE') result.disable = true
            return result
          })
          count = count + data.resourceCount
        })
        this.workFlowJson[item].count = count
      }
      const dataExam = this.workFlowJson.filter(item => item.count)
      if (dataExam.length <= 0) return

      dataExam.forEach(e => {
        console.log(userInfo)
        if (userInfo?.userPermLevel === 0) {
          e.isWriteRole = true
        } else if (userInfo.userPermUpperRoleList) {
          for (let i = 0; i < userInfo.userPermUpperRoleList.length; i++) {
            console.log(userInfo.userPermUpperRoleList[i].roleUpper)
            if (e.roleIdx === userInfo.userPermUpperRoleList[i].roleUpper) {
              e.isWriteRole = true
              // this.isOrderMemoRoel = true
            }
          }
        }
      })
      this.dataExam = dataExam
      // this.dataExam = this.workFlowJson
      this.odrDataCount = response.odrDataCount
      this.roleDataList = response.roleDataList
      this.setChecklist(this.currentStep.roleIdx)
      this.loading = false
    },
    changeStep (step) {
      this.currentStep = step
      // this.currentStep = this.tabStep
      this.setChecklist(this.currentStep.roleIdx)
    },
    setChecklist (roleIdx) {
      const taskRoleList = this.workFlowJson.filter(item => item.roleIdx === roleIdx)
      let taskRole
      if (taskRoleList.length > 0) taskRole = taskRoleList[0]
      else return
      this.checkList = []
      if (taskRole.beforeCheckList && taskRole.beforeCheckList.length > 0) {
        for (const before of taskRole.beforeCheckList) {
          this.checkList.push(before)
        }
      }
      if (taskRole.afterCheckList && taskRole.afterCheckList.length > 0) {
        for (const after of taskRole.afterCheckList) {
          this.checkList.push(after)
        }
      }
    },
    setBreadCrumbs (data) {
      let taskStatus = this.$t('task.STATE.complete')
      let taskColor = ''
      const state = 'DONE'
      if (data?.finishTime) {
        const today = Dayjs(new Date())
        const date = Dayjs(data.finishTime)
        let dDay = this.$options.filters.interval(today, date)
        dDay = dDay < 0 ? `-${Math.abs(dDay)}` : `+${Math.abs(dDay)}`

        taskStatus = `D${dDay} ${this.status[state].ko}`
        taskColor = this.status[state].color
      }
      // breadcrubs 설정
      this.$store.commit('common/ADD_PARAMETERS', {
        label: this.orderNo,
        path: '',
        statusKo: taskStatus,
        status: taskColor
      })
    },
    setDataList (order = this.order) {
      this.computeGridData = this.order.computeList ? [...this.order.computeList] : []
      this.databaseGridData = this.order.databaseList ? [...this.order.databaseList] : []
      this.marketplaceGridData = this.order.marketplaceGridData ? [...this.marketplaceGridData] : []
      this.storageGridData = this.order.storageList ? [...this.order.storageList] : []
      this.l4GridData = this.order.l4List ? [...this.order.l4List] : []
      this.l7GridData = this.order.l7List ? [...this.order.l7List] : []
      this.securityGridData = this.order.securityList ? [...this.order.securityList] : []
    },
    isEmpty () {
      if (!this.odrDataCount) return true
    },
    moveTo () {
      const memoOffset = document.querySelector('#memo-section').offsetTop
      window.scrollTo({
        top: memoOffset,
        behavior: 'smooth'
      })
    },
    drawProgressStep (status = undefined, need) {
      const statusData = {
        server: { width: 3.3, index: 1 },
        network: { width: 51.8, index: 2 },
        security: { width: 100, index: 3 }
      }
      if (status) return statusData[status][need]
      else return statusData.server[need]
    },
    download () {
      window.open('', '', 'width=800,height=1100')
    },
    // convertDataURIToBinary (dataURI) {
    //   var BASE64_MARKER = ';base64,'
    //   var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length
    //   var base64 = dataURI.substring(base64Index)
    //   var raw = window.atob(base64)
    //   var rawLength = raw.length
    //   var array = new Uint8Array(new ArrayBuffer(rawLength))

    //   for (let i = 0; i < rawLength; i++) {
    //     array[i] = raw.charCodeAt(i)
    //   }
    //   return array
    // },
    exportExcel (block = true) {
      if (block) {
        this.$alert(this.$t('common.ALERT.CONF.005'), '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
        return
        // 현재 당장 견적서 다운로드 기능이 필요없으므로 block 처리합니다.
        // 기능 추가될 경우 차단 풀어주시면 됩니다!
      }
      // --------
      // --------
      setTimeout(() => {
        const filename = 'Excel Test.xlsx'
        // console.log('@exportData', grid)
        const options = Object.assign({
          // includeCellStyles: false,

          formatItem: function (args) {
            const p = args.panel
            const xlsxCell = args.xlsxCell

            if (p.cellType === wjGrid.CellType.ColumnHeader) {
              xlsxCell.style.fill = {}
              xlsxCell.style.fill.color = '#EEEEEE'
            }
          }
        })
        WjGridXlsx.FlexGridXlsxConverter.saveAsync(this.projectGrid, options, filename, (progress) => {
          if (progress) {
            // this.isLoading = false
          }
        })
      }, 50)
    }
  },
  data () {
    return {
      checkList: [],
      odrDataCount: undefined,
      taskDoneInfo: undefined,
      taskMemoList: undefined,
      workFlowJson: undefined,
      rawDetail: undefined,
      loading: true,
      order: {},
      orderInfo: null,
      routeData: null,
      currentStep: {
        roleName: null // 현재 단계 ('server', 'network', 'security')
      },
      taskDetailTab: [
        { field: 'work', name: this.$v('업무 내용'), isActive: true, keyPath: 'common.TERMS.business' },
        { field: 'order', name: this.$v('주문 정보'), keyPath: 'common.TERMS.orderInfo' }
      ],
      applyExamData: {
        projectName: '구매', serviceName: 'BI_2020_Q1', target: '김포', deparment: '신세계', ownerRelation: '신세계 아이앤씨', task: 'IT 통합인프라 백화점 스마트 HUB', relation: '신세계푸드', team: '백화점 워크스마트팀', itsmName: '[에, Nu]발주', serverManager: '서버2', taskManager: '신세계 프라퍼티, 신세계 푸드', installDate: '2020.06.08 10:00:00', chargeDate: '2020.06.08 10:00:00', attachment: 'file', applyDesc: '서버 증설로 인해 자원 신청합니다. 기일 엄수 부탁드립니다.'
      },

      dataExam: [
        {
          id: 1,
          name: '서버',
          resourceList: [
            {
              id: 11,
              name: 'Compute'
            },
            {
              id: 12,
              name: 'Database'
            },
            {
              id: 13,
              name: 'Storage'
            }
          ]
        },
        {
          id: 2,
          name: '네트워크',
          resourceList: [
            {
              id: 14,
              name: 'L4'
            },
            {
              id: 15,
              name: 'L7'
            }
          ]
        },
        {
          id: 3,
          name: '보안',
          resourceList: [
            {
              id: 16,
              name: 'Security'
            }
          ]
        }
      ],
      // 자원 테이블 데이터
      computeGridData: [],
      databaseGridData: [],
      storageGridData: [],
      marketplaceGridData: [
      ],
      l4GridData: [],
      l7GridData: [],
      securityGridData: []
    }
  }
}
</script>
<style lang="scss">
.done-detail {
  .workflow-helper-wrap {
    // margin: $gap * 3 0 $gap;
    height: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .helpers {
      display: flex;
      align-items: center;
      > .memo-icon {
        position: relative;
        display: inline-block;
        margin-right: 15px;
        width: 22px;
        height: 21px;
        background-position: center;
        background-size: contain;
        background-repeat: no-repeat;
        background-image: url('../../../../../assets/images/icon-bubble@3x.png');
        > .-alarm {
          position: absolute;
          top: -8px;
          right: -8px;
          display: inline-block;
          width: 20px;
          height: 20px;
          font-size: 12px;
          line-height: 20px;
          text-align: center;
          border-radius: 50%;
          background-color: $main-red;
        }
      }
      .conferece-checklist {
        margin-left: $gap;
      }
    }

    > .download-buttons {
      display: flex;
      justify-content: flex-end;
      font-size: 14px;
      color: $color-lightgrey;
      > span {
        margin-left: 30px;
      }
    }
  }

  .total-information {
    margin: $gap 0 $gap * 2;
    border-top: 2px solid $main-black;
    border-bottom: 1px solid $main-black;
    padding: $gap $gap-m;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: $color-lightgrey;

    > strong {
      height: 13px;
      line-height: 13px;
      font-size: 20px;
    }

    > .total-count {
      height: 24px;
      font-family: 'Roboto';
      line-height: 24px;
      font-size: 16px;

      > span {
        color: #f6bb00;
        font-weight: bold;
        font-size: 24px;
      }
    }
  }

  .empty-data {
    line-height: 50px;
    text-align: center;
  }

  .workflow-list {
    & + .workflow-list {
      margin-top: 60px;
    }
  }
  .resource-area {
    & + .resource-area {
      margin-top: 60px;
    }
  }

  #memo-section {
    margin-top: $gap-m * 2;
    padding: $gap-m * 2;
    background-color: $ticket-back-color;
    border-radius: 20px;
    > .sub-title {
      margin-bottom: 0;
      line-height: normal;
    }
  }
}
</style>
