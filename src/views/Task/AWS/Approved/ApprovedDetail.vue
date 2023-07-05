<template>
  <div class="approved-detail">
    <section class="top-area">
      <h2>{{ $route.params.title }}</h2>
      <div class="button-area -right">
        <button
          class="button"
          @click="openApprovalLine"
        >
          <!-- 결재선 -->
          {{ $t('task.PAY.DETAIL.line') }}
        </button>
        <button
          v-if="isApprovalRole"
          class="button"
          @click="openApproveConfirm"
          type="is-primary"
        >
          <!-- 결재 확인 -->
          {{ $t('task.PAY.confirm') }}
        </button>
      </div>
    </section>

    <section class="draft-wrap">
      <div class="approve-block">
        <div class="approved-list">
          <draft-approve
            v-if="approverUserList.length > 0"
            :title="$t('task.PAY.title')"
            :data="approverUserList"
          />
          <!-- 결재 / 합의 -->
        </div>
      </div>

      <div class="register-item-wrap">
        <div class="divided">
          <register-contents :title="$t('task.PAY.DETAIL.depart')">
            <span> {{ data.groupName }} </span>
          </register-contents>
          <!-- 신청 부서 -->
          <register-contents :title="$t('task.PRIOR.DETAIL.drafter')">
            <span> {{ data.userName }} </span>
          </register-contents>
          <!-- 기안자 -->
          <register-contents :title="$t('task.PAY.DETAIL.shelf')">
            <span> {{ data.expireDate - data.createTime | inServiceLife }}({{ data.expireDate | dateSimple }}) </span>
          </register-contents>
          <!-- 보존년한 -->
        </div>
      </div>
    </section>

    <section class="approved-information-wrap">
      <dashboard-panel
        :title="$t('task.PAY.DETAIL.info')"
        :padding-top="0"
        class="panel-body -info"
      >
        <register-contents
          :title="$t('task.PAY.DETAIL.subject')"
          style="border-top: 1px solid #2A2D44"
          type="input"
        >
          <span v-if="data.userTask">
            {{ data.userTask.name }}
          </span>
        </register-contents>
        <!-- /. 요청 제목 -->

        <register-contents
          :title="$t('task.PRIOR.GRID.endDate')"
          type="input"
        >
          <span v-if="data.userTask">
            {{ data.userTask.finishTime |dateSimple }}
          </span>
        </register-contents>
        <!-- /. 완료 희망일 -->

        <register-contents
          :title="$t('task.PAY.DETAIL.reasonRequest')"
          type="input"
        >
          <span v-if="data.userTask">
            {{ data.userTask.reason }}
          </span>
        </register-contents>
        <!-- /. 신청 사유 -->

        <register-contents
          :title="$t('common.TERMS.file')"
          type="input"
          style="border-bottom: 1px solid #2A2D44"
        >
          <file-down-component
            v-if="data.userTask && data.userTask.fileName"
            :file-name="data.userTask.fileName"
            :url="data.fileUrl"
          />
          <span v-else>{{ $t('admin.PREF.noFile') }}</span>
        </register-contents>
        <!-- /. 첨부파일 -->
      </dashboard-panel>

      <dashboard-panel :title="$t('common.MODAL.resInfo')">
        <!-- <g-foldable
          v-for="(item,idx) in dataExam"
          :key="idx"
          :title="item.name"
          :use-state="item.useState"
        >
          <template #contents>
            <section class="resource-area">
              <template v-if="computeGridData.length && item.key === 'COMPUTE'">
                <task-compute
                  :data="computeGridData"
                  field="approved"
                  :is-create-time="true"
                  :editable="false"
                />
              </template>

              <template v-if="marketplaceGridData.length && item.key === 'MARKET'">
                <task-marketplace
                  :data="marketplaceGridData"
                  field="approved"
                  :is-create-time="true"
                  :editable="false"
                />
              </template>

              <template v-if="databaseGridData.length && item.key === 'DATABASE'">
                <task-database
                  :data="databaseGridData"
                  field="approved"
                  :is-create-time="true"
                  :editable="false"
                />
              </template>

              <template v-if="storageGridData.length && item.key === 'STORAGE'">
                <task-storage
                  :data="storageGridData"
                  field="approved"
                  :is-create-time="true"
                  :editable="false"
                />
              </template>

              <template v-if="(l4GridData.length||securityGridData.length||securityGridData.length) && item.key === 'NETWORK'">
                <task-l4
                  v-if="l4GridData.length > 0"
                  :data="l4GridData"
                  field="approved"
                  :is-create-time="true"
                  :editable="false"
                />
                <task-l7
                  v-if="l7GridData.length > 0"
                  :data="l7GridData"
                  field="approved"
                  :is-create-time="true"
                  :editable="false"
                />
                <task-security
                  v-if="securityGridData.length > 0"
                  :data="securityGridData"
                  field="approved"
                  :is-create-time="true"
                  :editable="false"
                />
              </template>
            </section>
          </template>
        </g-foldable> -->
      </dashboard-panel>

      <dashboard-panel :title="$t('task.TODO.DETAIL.note')">
        <task-memo
          :data="memoList"
          :disable-writing="true"
        />
      </dashboard-panel>
      <!-- /. 메모 -->
    </section>

    <div class="button-area -center">
      <button
        class="button"
        size="is-large"
        @click="e => {
          $router.push({ name: 'task-approved' })
        }"
      >
        {{ $t('common.BTN.list') }}
      </button>
    </div>

    <el-dialog
      :title="approvalProcessModal.title"
      :visible.sync="approvalProcessModal.view"
      :width="approvalProcessModal.width"
      @close="closeModal"
    >
      <!-- 결재선 -->
      <approval-process
        v-if="approvalProcessModal.title === $t('task.PAY.DETAIL.line')"
        :data="data.approvalUserList"
      />

      <!-- 결재 승인 -->
      <article
        class="approval-approve-modal"
        v-if="approvalProcessModal.title === $t('task.PAY.confirm')"
      >
        <register-contents
          :title="$t('common.PLACEHOLDER.remark')"
          class="remark"
        >
          <div class="proceed-approval">
            <el-input
              type="textarea"
              v-model="note"
            />
          </div>
        </register-contents>
        <!-- /. 비고 -->

        <div class="modal-button-area">
          <button
            class="button"
            @click="closeModal"
          >
            <!-- 취소 -->
            {{ $t('common.BTN.cancel') }}
          </button>
          <button
            class="button"
            type="is-primary"
            @click="appoveSuccess"
          >
            <!-- 결재 -->
            {{ $t('task.PAY.title') }}
          </button>
        </div>
      </article>
    </el-dialog>
  </div>
</template>

<script>
import API, { FileDownComponent, DashboardPanel, DraftApprove } from '@sd-fe/cmp-core'
import TaskMemo from '@/views/Task/Nutanix/TaskMemo/TaskMemo.vue'
import ApprovalProcess from '@/views/Task/Nutanix/TaskApproved/ApprovedDetail/ApprovalProcess.vue'

export default {
  name: 'ApprovedDetail',
  components: {
    FileDownComponent,
    'dashboard-panel': DashboardPanel,
    'task-memo': TaskMemo,
    'approval-process': ApprovalProcess,
    'draft-approve': DraftApprove
  },
  created () {
    this.init()
  },
  methods: {
    approvalUserSetting (approvalUserList) {
      // [결재 / 합의] 할당된 계정 리스트 설정
      if (approvalUserList && approvalUserList.length) {
        const empty = { userPosition: '-', userName: '-' }
        this.approverUserList = approvalUserList.map(usr => {
          if (usr.type === 'S' || usr.type === 'M') return usr
          else return empty
        })
      }
    },
    // gridDataSetting (gridData) {
    //   const compute = []
    //   const market = []
    //   const database = []
    //   const storage = []
    //   const l4 = []
    //   const l7 = []
    //   const sequrity = []

    //   let orderType = null
    //   if (gridData && gridData.length > 0) {
    //     gridData.forEach(p => {
    //       orderType = p.orderType
    //       p.orderData.createTime = p.createTime
    //       if (p.workType === 'STORAGE') storage.push(p.orderData)
    //       else if (p.workType === 'COMPUTE') compute.push(p.orderData)
    //       else if (p.workType === 'SECURITY') sequrity.push(p)
    //       else if (p.workType === 'NETWORK_L4') l4.push(p.orderData)
    //       else if (p.workType === 'NETWORK_L7') l7.push(p.orderData)
    //       else if (p.workType === 'MARKET') market.push(p.orderData)
    //       else if (p.workType === 'DATABASE') database.push(p.orderData)
    //     })
    //   }
    //   this.dataExam = []
    //   if (compute.length > 0) {
    //     this.computeGridData = compute
    //     this.dataExam.push({ name: '서버', key: 'COMPUTE', useState: orderType })
    //   }

    //   if (l4.length > 0 || l7.length > 0 || sequrity.length > 0) {
    //     this.l4GridData = l4
    //     this.l7GridData = l7
    //     this.securityGridData = sequrity
    //     this.dataExam.push({ name: '네트워크', key: 'NETWORK', useState: orderType })
    //   }

    //   if (storage.length > 0) {
    //     this.storageGridData = storage
    //     this.dataExam.push({ name: '스토리지', key: 'STORAGE', useState: orderType })
    //   }
    //   if (database.length > 0) {
    //     this.databaseGridData = database
    //     this.dataExam.push({ name: '데이터베이스', key: 'DATABASE', useState: orderType })
    //   }
    //   if (market.length > 0) {
    //     this.marketplaceGridData = market
    //     this.dataExam.push({ name: '마켓플레이스', key: 'MARKET', useState: orderType })
    //   }

    //   this.marketplaceGridData = market
    // },
    async init () {
      try {
        this.isApproval = true
        // this.$store.state?.auth?.user?.userId
        const res = await API.work.getTaskUser({ approvalNo: this.$route.params.approvalNo, userId: this.$store.state?.auth?.user?.userId })

        if (res === null) {
          this.$router.go(-1)
        }
        this.taskNo = this.$route.params.approvalNo
        if (this.taskNo !== undefined) {
          const response = await this.getTask(this.taskNo)

          if (response.systemType === 'INSIDE' && (response.taskStatus === 'WAIT' || response.taskStatus === 'PROCEED') && res.allocationDate && res.approvalTime === null) {
            this.isApprovalRole = true
          }
          if (response.url) {
            this.fileUrl = process.env.VUE_APP_ZUUL_URL + '/api/cmp/v1/work/approval/file/download?approvalNo=' + response.approvalNo
          }

          this.approvalUserSetting(response.approvalUserList)
          // this.gridDataSetting(response.taskDataList)
          if (response.userTask) {
            if (response.userTask.url) {
              response.fileUrl = process.env.VUE_APP_ZUUL_URL + '/api/cmp/v1/work/approval/file/download?approvalNo=' + response.userTask.approvalNo
            }
          }
          if (response.orderMemoList) {
            this.memoList = {
              approvalNo: this.$route.params.id,
              orderNo: response.orderNo,
              data: response.orderMemoList
            }
          }
          this.data = response
          // console.log('데이터 확인', this.data)
        } else {
          this.$router.go(-1)
        }
      } catch (error) {
        this.$alert(error, '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
      } finally {
        this.isApproval = false
      }
    },
    async getTask (taskNo) {
      return API.work.getTaskAdmin({ approvalNo: taskNo })
    },
    openApprovalLine () {
      this.approvalProcessModal = {
        view: true,
        title: this.$t('task.PAY.DETAIL.line'), // 결재선
        width: '80%'
      }
    },
    openApproveConfirm () {
      this.approvalProcessModal = {
        view: true,
        title: this.$t('task.PAY.confirm'), // 결재승인
        width: '500px'
      }
    },
    closeModal () {
      this.note = ''
      this.approveProcess = null
      this.approvalProcessModal = {
        view: false,
        title: null,
        width: ''
      }
    },
    async appoveSuccess () {
      // 결재 하시겠습니까?
      this.$confirm(this.$t('common.CONFIRM.APPROVAL.001'), '알림', {
        confirmButtonText: this.$t('common.TERMS.yes'),
        cancelButtonText: this.$t('common.TERMS.no')
      }).then(async () => {
        await this.updateTask()
        this.$alert(this.$t('common.ALERT.BASE.045'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          callback: () => {
            this.$router.go(-1)
            this.closeModal()
          }
        })
      }).catch(() => { return false })
    },
    async updateTask () {
      try {
        const hours = new Date()
        hours.setHours(hours.getHours() - 9)

        this.isApproval = true
        const payload = {
          status: 'DONE',
          approvalTime: this.$options.filters.timestamp(hours),
          note: this.note
        }

        await API.work.updateTask(this.taskNo, this.$store.state?.auth?.user?.userId, payload)
      } catch (error) {
        this.$alert(error, '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
      } finally {
        this.isApproval = false
      }
    }
  },
  data () {
    return {
      note: '',
      isApproval: true,
      isApprovalRole: false,
      taskNo: null,
      approverUserList: [],
      agreementUserList: [],
      data: {},
      memoList: [],
      approvalProcessModal: {
        view: false,
        title: null,
        width: ''
      },
      infoTitle: '',
      infoEndDate: '',
      infoDesc: '',
      approveState: [
        { position: '기안', name: '박종민', state: '승인', date: '06/18 13:01' },
        { position: '팀장', name: '현윤섭', state: '승인', date: '06/18 13:01' }
      ],
      fileUrl: null,
      dataExam: [], // 자원 테이블 데이터
      computeGridData: [],
      databaseGridData: [],
      storageGridData: [],
      marketplaceGridData: [],
      l4GridData: [],
      l7GridData: [],
      securityGridData: []

    }
  }
}
</script>

<style lang="scss">
.approved-detail {
  .top-area {
    margin-bottom: $gap;
    justify-content: space-between;
    align-items: center;

    > .option-buttons {
      > button:first-child {
        margin-right: $gap-s;
      }
    }
  }

  .draft-wrap {
    .approve-block {
      display: flex;
      justify-content: flex-end;
      margin-bottom: $gap;
      text-align: right;

      > .approved-list {
        // width: 500px;
        > *:first-child {
          margin-bottom: $gap-s;
        }
      }
    }
  }

  .approved-information-wrap {
    > .dashboard-panel {
      margin-top: 50px;
      &.-info {
        .panel-body {
          padding-top: 0;
        }
      }
    }
  }
}

.register-item-wrap {
  border-top: 1px solid $border-color;
  .divided {
    display: flex;
    > * {
      flex: 0 0 33.33%;
    }
  }
}

.remark .contents {
    border-top: 1px solid $dark-slate;
  }
</style>
