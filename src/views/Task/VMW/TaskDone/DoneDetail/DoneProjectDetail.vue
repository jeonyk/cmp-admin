<template>
  <div>
    <!-- <conf-detail-apply
      type="project"
      :data="taskData"
    /> -->
    <g-tab :data="tabs">
      <template #detail>
        <task-common-project
          v-if="isTrue"
          :data="originCommonProject"
          :memo-lists="memoLists"
          @change-memo="updateMemo"
        />
        <!-- @change-memo="afterMemoUpdated" -->
      </template>
      <template #order>
        <h2 class="conference-section-title">
          <span style="">{{ $t('common.TERMS.orderInfo') }}</span>

          <span
            class="flex-wrap"
            @click="visibleTable = !visibleTable"
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
      </template>
    </g-tab>
  </div>
</template>

<script>
import { cloneDeep } from 'lodash'
// import VerticalTable from '@/components/VerticalTable/VerticalTable'
import TaskCommonProject from '../../TaskCommonProject/TaskCommonProject.vue'
import ConfDetailApply from '../../TaskConference/ConferenceDetail/ConfDetailApply.vue'
import API from '@/components/Apis/'
export default {
  components: {
    // VerticalTable,
    TaskCommonProject,
    ConfDetailApply
  },
  created () {
    this.setBreadCrumbs()
    this.setDetailData()
  },
  methods: {
    async setDetailData () {
      this.activeChangeDistModal = false
      const response = await this.getTaskPreDetail()
      setTimeout(() => {
        this.isTrue = true
        this.originCommonProject = response.roleDataList['-10'][0].orderData.distributeProject
        this.originCommonProject.name = response.roleDataList['-10'][0].orderData.name
      }, 0)
      if (response) {
        this.taskData = response
        this.taskData.name = '공통 프로젝트 생성'
        this.orderNo = response?.orderNo
        this.commonProjectRole = this.originCommonProject = response.roleDataList['-10'][0].orderData.distributeProject
        this.setCommonProject(this.commonProjectRole)
      }
    },
    setCommonProject (commonProject) {
      this.originCommonProject = commonProject
      this.clonedCommonProject = cloneDeep(commonProject)
      this.memoLists = {
        data: this.taskData.orderMemoList,
        orderNo: this.taskData.orderNo,
        approvalNo: this.taskData.approvalNo
      }
    },
    async getTaskPreDetail () {
      try {
        this.isLoading = true
        const response = await API.workMngTask.getTaskDone(this.$route.params.id)
        this.taskData = response
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
    setBreadCrumbs () {
      this.$store.commit('common/ADD_PARAMETERS', {
        label: ` ${this.$route.params.id}`,
        path: ''
      })
    },
    updateMemo () {
      this.setDetailData()
    }
  },
  data () {
    return {
      isTrue: false,
      memoLists: {},
      originCommonProject: {},
      taskData: undefined,
      visibleTable: true,
      tabs: [
        { field: 'detail', name: '업무내용' },
        { field: 'order', name: '주문 정보' }
      ]
    }
  }
}
</script>

<style scoped>

.conference-section-title {
    display: flex;

    /* align-items: center; */
    margin-bottom: 20px;
    justify-content: space-between;
    /* font-size: 18px; */
}
</style>
