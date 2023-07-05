<template>
  <div v-loading="isLoading">
    <h2 class="conference-section-title">
      <span style="">{{ $t('common.TERMS.orderInfo') }}</span>

      <span
        @click="visibleTable = !visibleTable"
        style="display:flex; align-items:center;"
      >
        <a style="font-size:16px;">{{ visibleTable ? "접기" : '펴기' }}</a>
        <a
          :class="['mdi', visibleTable ? 'mdi-chevron-up' : 'mdi-chevron-down']"
          style="margin-left: 8px;"
        />
      </span>
    </h2>
    <transition name="slide">
      <div
        class="conference-body"
        v-if="visibleTable"
      >
        <conf-detail-apply
          type="COMMON_PROJECT"
          :data="taskData"
        />
      </div>
    </transition>
    <!-- /. 주문 정보 -->

    <div
      class="common-project-wrap"
    >
      <button
        class="button change-btn"
        @click="activeChangeDistModal = true"
      >
        <!-- 변경 -->
        {{ $t('common.BTN.change') }}
      </button>

      <task-common-project
        :data="originCommonProject"
        :memo-lists="memoLists"
        @change-memo="updateMemo"
      />

      <div
        class="button-area -center"
        style="margin-top: 30px;"
      >
        <button
          class="button"
          type="is-anti"
          size="is-large"
          @click="openInsertModal('reject')"
        >
          <!-- 반려 -->
          {{ $t('common.BTN.TASK.reject') }}
        </button>
        <button
          class="button"
          type="is-primary"
          size="is-large"
          @click="openInsertModal('approve')"
        >
          <!-- 승인 -->
          {{ $t('common.BTN.TASK.ack') }}
        </button>
      </div>
    </div>

    <!-- 공통 프로젝트 관련 -->
    <el-dialog
      title="배부모델 변경"
      :visible.sync="activeChangeDistModal"
      :show-close="false"
      width="1000px"
    >
      <conf-change-dist-model
        :data="originCommonProject"
        @close="closeDistModal"
        @update="updateDistModels"
        style="height:auto; max-height:750px;"
      />
    </el-dialog>

    <conf-common-project-apply-modal
      v-loading="isLoading"
      ref="insertModal"
      :active="applyCommonProject.view"
      :state="applyCommonProject.state"
      @close="applyCommonProject.view = false"
      @save="approveCommonProject"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { cloneDeep } from 'lodash'
// import VueCookies from 'vue-cookies'
import ConfDetailApply from './ConfDetailApply'
import TaskCommonProject from '../../TaskCommonProject/TaskCommonProject.vue'
import ConfChangeDistModel from './ConfChangeDistModel.vue'
import ConfCommonProjectApplyModal from './ConfCommonProjectApplyModal.vue'

import API from '@/components/Apis/'
export default {
  components: {
    TaskCommonProject,
    ConfDetailApply,
    ConfChangeDistModel,
    ConfCommonProjectApplyModal
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      packageType: state => state.auth.packageType
    })
  },
  created () {
    // if (this.$route.params.id) this.setBreadCrumbs(this.taskData)
    this.setBreadCrumbs()
    this.setDetailData()
  },
  methods: {
    async setDetailData () {
      this.activeChangeDistModal = false
      const response = await this.getTaskPreDetail()
      this.commonProjectRole = response.orders[0].roles.find(role => role.roleName === '공통프로젝트').orderDataList?.[0]
      this.setOrderTable(response)

      this.setDistribtueProject()
      this.setMemo()
      this.setParams()
    },
    setOrderTable (res) {
      this.taskData = res
      this.taskData.name = '공통 프로젝트 생성 신청'
    },
    setDistribtueProject () {
      console.log('들어오는 값:', this.commonProjectRole.orderData)
      const { distributeProject, id, name, projectIdx } = this.commonProjectRole.orderData
      this.projectName = distributeProject.projectName
      // distributeProject.distributeGroups = distributeProject.distributeGroups.map(group => ({ ...group, isSelected: true }))
      distributeProject.id = id
      distributeProject.name = name
      this.projectIdx = projectIdx

      this.originCommonProject = distributeProject
      this.clonedCommonProject = cloneDeep(distributeProject)
    },
    setMemo () {
      this.memoLists = {
        data: this.taskData.orders[0].orderMemoList,
        orderNo: this.taskData.orderNo,
        approvalNo: this.taskData.approvalNo
      }
    },
    setParams () {
      this.orderDataIdx = this.commonProjectRole.orderDataIdx
      // this.projectName = this.commonProjectRole.orderData.projectName
      this.orderNo = this.taskData?.orderNo
      this.approvalNo = this.taskData.approvalNo
    },
    async getTaskPreDetail () {
      try {
        this.isLoading = true
        const response = await API.task.getTaskPreDetail(this.$route.params.id)
        return response
      } catch (error) {
        const message = {
          ODR1004: '해당 티켓이 존재하지 않습니다.'
        }
        this.$alert(message[error.response.data.code], '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          callback: () => {
            // 티켓 없는경우 목록으로 튕겨내기
            if (error.response.data.code === 'ODR1004') return this.$router.replace({ name: 'task-list' })
            return false
          }
        })
      } finally {
        this.isLoading = false
      }
    },
    // 빵가루 처리
    setBreadCrumbs () {
      this.$store.commit('common/ADD_PARAMETERS', {
        label: ` ${this.$route.params.id}`,
        path: ''
      })
    },
    updateDistModels (distModels) {
      // const ratee = this.initDistRate_2(distModels.distributeGroups)
      // console.log('#', ratee)
      // if (ratee) return
      const { userIdx, userId, userName, userPosition, userGroup, userGroupName, userCompany } = this.user
      const payload = {
        userId: userId,
        userName: userName,
        userPosition: userPosition,
        groupIdx: userGroup,
        groupName: userGroupName,
        taskDataList: [
          {
            userId: userId,
            userName: userName,
            taskManagementInfoIdx: null,
            taskManagementIdx: null,
            taskSendGroupIndex: null,
            taskSendMappingIndex: null,
            orderDataIdx: this.orderDataIdx,
            orderNo: this.orderNo,
            roleIdx: -10,
            orderType: 'NEW',
            workType: 'COMMON_PROJECT',
            orderData: {
              distributeProject: {
                ...distModels,
                distTotalRate: this.initDistRate(distModels.distributeGroups),
                projectIdx: this.projectIdx,
                projectName: this.projectName
              },
              projectIdx: this.projectIdx,
              name: distModels.name, // 배부모델명
              id: distModels.id,
              companyIdx: userCompany,
              groupIdx: userGroup,
              inCommon: true,
              projectName: this.projectName,
              noBilling: false,
              operationManagers: [],
              ownerCompany: 1,
              projectMemo: '',
              userIdx: userIdx
            },
            ipAddress: null,
            roleName: null,
            taskItsm: null,
            index: null,
            taskType: null
          }
        ]
      }
      this.insertDistModelData(payload)
    },
    async insertDistModelData (payload) {
      try {
        await API.task.insertTaskData(payload)
        this.$alert(this.$t('common.ALERT.BASE.049'), { // 저장되었습니다
          callback: () => {
            // 전체 데이터를 다시 가져옵니다.
            return this.setDetailData()
          }
        })
      } catch (error) {
        console.error(error)
        // 작업을 변경하는 도중 문제가 발생하였습니다. <br> 관리자에게 문의해주세요.
        this.$alert(this.$t('task.TODO.DETAIL.errorSave'), {
          dangerouslyUseHTMLString: true,
          callback: () => this.setDetailData()
        })
      }
    },
    async approveCommonProject (data) {
      const approvalState = data.state === 'reject' ? 'REJECT' : 'DONE'
      const message = data.state === 'reject' ? '반려가 완료되었습니다' : '승인이 완료되었습니다.'

      const { userId, userName, userPosition, userGroup, userGroupName, userGroupCode, userCompany, userCompanyName, userCompanyCode } = this.user
      const rejectParams = {
        approvalNo: this.approvalNo,
        orderNo: this.orderNo,
        roleIdx: -10,
        roleName: this.commonProjectRole?.roleName || '공통프로젝트',
        orderDataIdxList: [this.orderDataIdx], // 반려에서는 결재자 리스트 존재 X
        approvalStatus: approvalState, // 공통프로젝트만 필요
        reason: data.note, // 공통프로젝트만 필요
        userId: userId,
        userName: userName,
        userPosition: userPosition,
        groupIdx: userGroup,
        groupName: userGroupName,
        groupCode: userGroupCode,
        companyIdx: userCompany,
        companyName: userCompanyName,
        companyCode: userCompanyCode
      }

      const response = await this.approveProject(rejectParams)
      if (response) {
        this.$alert(message).then(() => {
          this.$router.replace({ name: 'task-done' })
        })
      }

      this.applyCommonProject.view = false
    },
    async approveProject (payload) {
      try {
        this.isLoading = true
        const response = await API.order.requestTask(payload)
        return response
      } catch (e) {
        // ORD1004 현재까지 받은 모든 에러가 현재 ODR1004
        if (e.response.data.code === 'ODR1004') this.$alert('작업을 실패했습니다.')
      } finally {
        this.isLoading = false
      }
    },
    closeDistModal () {
      this.activeChangeDistModal = false
      this.originCommonProject = {}
      setTimeout(() => {
        this.originCommonProject = this.clonedCommonProject
      }, 0)
    },
    // ** 공통 프로젝트 **
    openInsertModal (state) {
      this.applyCommonProject = {
        view: true,
        state: state
      }
      this.$refs.insertModal.note = ''
    },
    async updateMemo () {
      await this.setDetailData()
    },
    /**
     * 퍼센트 구하기
     */
    getPercent (unit, total) {
      const percent = (unit / total) * 100
      return Number.isNaN(percent)
        ? null
        : percent.toString().indexOf('.') === -1
          ? percent
          : percent.toFixed(2)
    },
    // initDistRate_2 (groups) {
    //   const noCommonGroup = groups.filter(
    //     group => group.groupIdx !== 0
    //     // group => !group.parentGroupName && group.groupIdx !== 0 *
    //     //* ****** 확인 */
    //   )
    //   const amountSum = noCommonGroup
    //     .map(group => group.amount)
    //     .reduce((a, b) => a + b, 0)
    //   noCommonGroup.forEach(group => {
    //     // group.amountPercent = this.getPercent(group.amount, amountSum)
    //     group.percent = this.getPercent(group.amount, amountSum)
    //   })

    //   // this.allRate = noCommonGroup
    //   return noCommonGroup
    // },
    initDistRate (groups) {
      let oneDepthGroups = groups.filter(
        group => !group.parentGroupName
      )
      // 각 비율을 계산한다.
      const sum = oneDepthGroups.reduce((cur, next) => cur + next.amount, 0)
      oneDepthGroups = oneDepthGroups.map(group => {
        return {
          ...group,
          percent: this.getPercent(group.amount, sum),
          rate: Number((group.amount / sum) * 100)
        }
      })

      // const twoDepthAff = this.detailModel.distributeGroups.filter(t => t.parentGroupName)
      const twoDepthAff = groups.filter(t => t.parentGroupName)
      const upRate = []

      oneDepthGroups.filter(group => !group.groupIdx)
        .forEach(group => {
          const twoDepth = twoDepthAff.filter(
            aff => aff.parentGroupName === group.groupName
          )
          const allSelectAmount = twoDepth.reduce(
            (a, b) => a + b.amount,
            0
          )
          twoDepth.forEach(select => {
            const rate = select.amount / allSelectAmount
            const externalRate = group.rate * rate

            upRate.push({ ...select, externalRate })
          })
        })

      upRate.forEach(rate => {
        const findGroup = oneDepthGroups.find(
          group => group.groupIdx === rate.groupIdx
        )
        if (findGroup) findGroup.rate = findGroup.rate + rate.externalRate
      })

      return oneDepthGroups.filter(group => group.groupIdx !== 0).map(group => ({ ...group, percent: group.rate.toFixed(2) }))
    }
  },
  data () {
    return {
      approvalNo: undefined,
      isCommonProject: false,
      distributeProject: undefined,
      projectName: undefined,
      orderDataIdx: undefined,
      orderNo: undefined,
      isLoading: false,
      taskData: {},
      originCommonProject: null,
      visibleTable: true,
      activeChangeDistModal: false,
      memoLists: {},
      applyCommonProject: {
        view: false,
        state: undefined
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .common-project-wrap {
    margin-top:50px;
    position: relative;
    .change-btn {
      position: absolute;
      top:-10px;
      right: 0;
    }
  }

.conference-section-title {
    display: flex;
    /* align-items: center; */
    margin-bottom: 20px;
    justify-content: space-between;
    /* font-size: 18px; */
  }
</style>
