<template>
  <div
    class="conference-project-detail"
    v-loading="isLoading"
  >
    <h2 class="conference-section-title">
      <span style="">{{ $t('common.TERMS.orderInfo') }}</span>

      <span
        @click="visibleTable = !visibleTable"
        style="display:flex; align-items:center;"
      >
        <a style="font-size:16px;">{{ visibleTable ? $v('접기') : $v('펴기') }}</a>
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
        <register-contents
          v-if="tempInfo && tempInfo.companyName"
          title="관계사"
          style="border-top: 1px solid #2A2D44;"
        >
          {{ tempInfo.companyName }}
        </register-contents>
        <div style="display:flex; flex-wrap:wrap; width:100%;">
          <register-contents
            v-if="tempInfo && tempInfo.groupName"
            :title="$v('조직명')"
            style="width:50%;"
          >
            {{ tempInfo.groupName }}
          </register-contents>
          <register-contents
            v-if="tempInfo && tempInfo.requesterName"
            :title="$v('요청자')"
            style="width:50%;"
          >
            {{ tempInfo.requesterName }}
          </register-contents>
          <register-contents
            v-if="tempInfo && tempInfo.projectName "
            :title="$v('프로젝트명')"
            style="width:50%;"
          >
            <el-tag class="-new">
              {{ $v('신규') }}
            </el-tag>  {{ tempInfo.projectName }}
          </register-contents>
          <register-contents
            v-if="tempInfo && tempInfo.createDate"
            :title="$v('요청일')"
            style="width:50%;"
          >
            {{ tempInfo.createDate }}
          </register-contents>
        </div>
      </div>
    </transition>
    <!-- /. 주문 정보 -->

    <div class="common-project-wrap">
      <button
        class="button change-btn"
        @click="activeChangeDistModal = true"
      >
        <!-- 변경 -->
        {{ $t('common.BTN.change') }}
      </button>

      <task-common-project
        :data="originCommonProject"
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
          {{ $v('반려') }}
        </button>
        <button
          class="button"
          type="is-primary"
          size="is-large"
          @click="openInsertModal('approve')"
        >
          {{ $v('승인') }}
        </button>
      </div>
    </div>

    <!-- 공통 프로젝트 관련 -->
    <el-dialog
      :title="$v('배부모델 변경')"
      :visible.sync="activeChangeDistModal"
      :show-close="false"
      width="1100px"
    >
      <distribute-edit-form
        :model="applyModel"
        :project="{...rawData}"
        is-user-mode
        ref="distributeForm"
      />
      <!-- @confirm="updateDistGroups" -->

      <div class="button-area">
        <button
          class="button"
          @click="activeChangeDistModal = false"
        >
          {{ $v('취소') }}
        </button>
        <button
          class="button"
          type="is-primary"
          @click="updateDistGroups"
        >
          {{ $v('완료') }}
        </button>
      </div>
    </el-dialog>

    <conf-common-project-apply-modal
      v-loading="isLoading"
      ref="insertModal"
      :active="applyCommonProject.view"
      :state="applyCommonProject.state"
      @close="applyCommonProject.view = false"
      @save="approveCommonProject"
      project-type="common"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { cloneDeep } from 'lodash'
import TaskCommonProject from '../../TaskCommonProject/TaskCommonProject.vue'
// import ConfChangeDistModel from './ConfChangeDistModel.vue'
import ConfCommonProjectApplyModal from './ConfCommonProjectApplyModal.vue'

import API, { DistributeEditForm } from '@sd-fe/cmp-core'

export default {
  components: {
    TaskCommonProject,
    // ConfChangeDistModel,
    ConfCommonProjectApplyModal,
    DistributeEditForm
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      packageType: state => state.auth.packageType,
      csp: state => state.cloud.cloud
    }),
    routeDestinationByCsp () {
      return {
        nutanix: 'set-project-list',
        vmware: 'set-project-list-vmw'
      }[this.csp]
    }
  },
  async created () {
    this.getDistModel()

    this.setBreadCrumbs()
    this.getProjectDetail()
    // this.setDetailData()
  },
  methods: {
    async getDistModel () {
      const data = await API.billing.getDistModel()
      this.applyModel = data.find(model => model.apply)
    },
    async updateDistGroups (params) {
      console.log('FORMAT 확인하세유')
      console.log(params)
      console.log('#raw', this.rawData)
      const payload = this.setPayload(params)

      console.log('#payload')
      console.log(payload)
      console.log(JSON.stringify(payload))
      // if (payload) return

      try {
        await API.billing.updateDistributeTemp(payload)
        this.$alert(this.$v('저장되었습니다.')).then(() => {
          this.activeChangeDistModal = false
          this.getProjectDetail()
        })
      } catch (error) {
        this.$alert(this.$t('task.TODO.DETAIL.errorSave'), {
          dangerouslyUseHTMLString: true
        })
        console.log(error)
      }
    },
    setPayload (params) {
      const data = this.$refs.distributeForm.getEmitData()
      const { distributeGroups, distributeInputType, distributeStandardName, id, name } = data
      console.log('확인하세요')
      console.log(data)

      return {
        distributeProject: {
          distributeProjectId: id,
          deletable: true,
          distributeGroups: distributeGroups,
          distributeInputType: distributeInputType,
          distributeModelId: this.rawData.distributeModelId,
          distributeStandardName: distributeStandardName,
          id: id,
          isNew: true,
          moduleType: this.projectCsp[this.csp],
          name: name,
          projectIdx: this.rawData.projectIdx,
          projectName: this.rawData.projectName

        },
        id: this.rawData.distributeModelId,
        modueleType: this.projectCsp[this.csp],
        name: name
      }
      // one depth 안에 id 는 distributeModelId
      //  distributeProjectId 값은 조회 나오는 id
    },
    setApprovalPayload (isApproval, message) {
      const { distributeGroup, projectIdx } = this.rawDataApproval
      const result = {
        approvalProjectInfo: {
          distributeProject: {
            distributeGroups: distributeGroup.distributeGroups,
            distributeInputType: distributeGroup.distributeInputType,
            distributeModelId: distributeGroup.distributeModelId,
            distributeStandardName: distributeGroup.distributeStandardName,
            id: distributeGroup.id,
            name: distributeGroup.name,
            projectIdx: projectIdx
          },
          moduleType: this.projectCsp[this.csp]
        },
        isApproval: isApproval,
        projectIdx: projectIdx,
        message

      }
      return result
    },

    async getProjectDetail () {
      try {
        const projectIdx = this.$route.params.projectIdx
        const response = await API.iam.getCommonProject(projectIdx)
        console.log('#공통 프로젝트 상세 데이터 ')
        console.log(response)
        console.log(JSON.stringify(response))
        this.tempInfo = response
        this.rawDataApproval = response
        this.rawData = {
          ...response,
          ...response?.distributeGroup
        }

        this.originCommonProject = response?.distributeGroup
        this.clonedCommonProject = cloneDeep(response?.distributeGroup)
      } catch (error) {
        console.log('Error', error)
        // this.$alert(this.$v('해당 티켓이 존재하지 않습니다.'))
        //   .then(() => {
        //     this.$router.replace({ name: this.routeDestinationByCsp })
        //   })
      }
    },
    async setDetailData () {
      this.activeChangeDistModal = false
    },
    // 빵가루 처리
    setBreadCrumbs () {
      this.$store.commit('common/ADD_PARAMETERS', {
        label: ` ${this.$route.params.projectIdx}`,
        path: ''
      })
    },
    async approveCommonProject (data) {
      // const approvalState = data.state === 'reject' ? 'REJECT' : 'DONE'
      const message = data.state === 'reject' ? this.$v('반려가 완료되었습니다.') : this.$v('승인이 완료되었습니다.')
      const isTrue = data.state !== 'reject'

      const payload = this.setApprovalPayload(isTrue, data.note)
      const response = await this.approveProject(payload)
      if (response) {
        this.$alert(message).then(() => {
          this.$router.replace({ name: this.routeDestinationByCsp })
        })
      }

      this.applyCommonProject.view = false
    },
    async approveProject (payload, params) {
      try {
        this.isLoading = true
        const response = await API.iam.approveCommonProject(payload, params)
        return response
      } catch (e) {
        return false
        // ORD1004 현재까지 받은 모든 에러가 현재 ODR1004
      } finally {
        this.isLoading = false
      }
    },
    // ** 공통 프로젝트 **
    openInsertModal (state) {
      this.applyCommonProject = {
        view: true,
        state: state
      }
      this.$refs.insertModal.note = ''
    }

  },
  data () {
    return {
      applyModel: {},
      rawDataApproval: {},
      projectCsp: {
        nutanix: 'NX',
        vmware: 'VMWARE'
      },
      rawData: undefined,
      tempInfo: undefined,
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
      applyCommonProject: {
        view: false,
        state: undefined
      },
      columnData: [
        { binding: 'asdjkl', time: '123' }
      ],
      columns: [
        {
          binding: 'time',
          header: '발송 시각'
        },
        {
          binding: 'cycle',
          header: '반복 주기'
        }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.button-area {
  display:flex;
  justify-content:center;
  margin-top:20px;
  padding-top:30px;
  border-top:1px solid #3D435E;
}

.conference-project-detail {
  &::v-deep {
    .contents {
      display:flex;
      align-items: center;
      width:100%;
    }
  }
}

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
  margin-bottom: 20px;
  justify-content: space-between;
}

.-new {
  color: #3E57C9;
  border:1px solid #3E57C9;
  background:transparent;
}
</style>
