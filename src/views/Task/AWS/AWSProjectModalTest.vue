<template>
  <div>
    <el-dialog
      :visible.sync="publicProject.view"
      :title="title"
      width="1020px"
      top="5vh"
      @close="close"
    >
      <div v-loading="publicProject.loading">
        <dashboard-panel
          :title="getProjectText(publicProject.type)"
          :padding-top="0"
        >
          <vertical-table
            :data="publicProject"
            :columns="columns"
            type="horizontal"
          >
            <template #status>
              <cmp-status-tag
                v-if="publicProject.status === 'READY'"
                type="is-pending"
              >
                {{ $v('대기') }}
              </cmp-status-tag>

              <cmp-status-tag
                v-if="publicProject.status === 'RUNNING'"
                type="is-loading"
              >
                <i
                  class="el-icon-loading"
                />
                {{ $v('작업중') }}
              </cmp-status-tag>

              <el-tooltip
                effect="light"
                placement="top"
              >
                <div
                  v-if="publicProject.failMessage"
                  slot="content"
                >
                  {{ publicProject.failMessage }}
                </div>
                <cmp-status-tag
                  v-if="publicProject.status === 'FAIL'"
                  type="is-fail"
                >
                  {{ $v('실패') }}
                </cmp-status-tag>
              </el-tooltip>
            </template>
          </vertical-table>
        </dashboard-panel>

        <dashboard-panel
          v-if="viewKeyFields"
          :title="$t('common.BTN.ADMIN.regAcc')"
          :padding-top="0"
        >
          <!-- v-if="hiddenAccessKey" -->
          <div
            class="hidden-access-key"
            style="border:1px solid gold; display:none;"
          >
            <p>{{ $v('현재 로그인된 계정의 비밀번호를 입력 후 확인 가능합니다.') }}</p>
            <div
              class="flex-wrap"
              style="gap: 10px; justify-content: flex-start; align-items: flex-start;"
            >
              <div>
                <el-input
                  class="login-input"
                  style="width: 300px"
                  v-model="accountPw"
                  show-password
                  @input="() => failMessage !== undefined ? failMessage = undefined : null"
                  @keyup.native.enter="confirmPw(accountPw)"
                />
                <small class="wrong-alert">{{ failMessage }}</small>
              </div>
              <button
                class="button"
                type="is-primary"
                :disabled="!accountPw"
                @click="confirmPw(accountPw)"
              >
                {{ $v('확인') }}
              </button>
            </div>
          </div>

          <!-- v-else -->
          <vertical-table
            :data="publicProject"
            :columns="keyColumns"
          >
            <template #accessKey>
              <el-input v-model="publicProject.accessKey" />
            </template>
            <template #secretKey>
              <el-input v-model="publicProject.secretKey" />
            </template>
          </vertical-table>
        </dashboard-panel>
        <!-- 계정 등록 -->

        <div class="modal-button-area">
          <button
            class="button -modal-button"
            type="is-anti"
            @click="close"
          >
            <!-- 취소 -->
            {{ $t('common.BTN.cancel') }}
          </button>
          <button
            v-if="!isRunning"
            class="button -modal-button"
            type="is-undefined"
            :disabled="isLoading"
            @click="applyCommonProject.view = true"
          >
            <!-- 취소 -->
            {{ $v('반려') }}
          </button>
          <button
            v-if="publicProject.type === 'CREATE' && !isRunning"
            class="button -modal-button"
            type="is-primary"
            :disabled="isLoading"
            @click="createProject(publicProject)"
          >
            {{ $v('생성') }}
          </button>
          <button
            v-if="publicProject.type === 'DELETE' && !isRunning"
            class="button -modal-button"
            type="is-primary"
            @click="deleteProject(publicProject)"
          >
            {{ $v('삭제') }}
          </button>
        </div>
      </div>
    </el-dialog>
    <apply-modal
      ref="insertModal"
      :active="applyCommonProject.view"
      :state="applyCommonProject.state"
      @close="applyCommonProject.view = false"
      project-type="aws"
      @save="rejectProject"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex'

import API, { VerticalTable, DashboardPanel, CmpStatusTag } from '@sd-fe/cmp-core'
// import ApprovalMemberModal from '@/components/Modal/ApprovalMemberModal/ApprovalMemberModal'
import AWSProjectMixins from './AWSProjectMixins.script'
import { pick } from 'lodash'
import ApplyModal from '@/views/Task/Nutanix/TaskConference/ConferenceDetail/ConfCommonProjectApplyModal.vue'

export default {
  name: 'AWSProjectModal',
  components: {
    VerticalTable,
    'dashboard-panel': DashboardPanel,
    CmpStatusTag,
    ApplyModal
  },
  mixins: [AWSProjectMixins],
  props: {
    active: {
      type: Boolean,
      default: false
    },
    data: {
      type: Object,
      default: () => {}
    },
    title: {
      type: String,
      default: ''
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    }),
    viewKeyFields () {
      return this.publicProject.type === 'CREATE' && this.publicProject.status !== 'RUNNING'
    },
    isRunning () {
      return this.publicProject?.status === 'RUNNING'
    }
  },
  watch: {
    data: {
      deep: true,
      handler (newObj) {
        this.getProjectDetail(newObj)
      }
    }
  },
  methods: {
    async getAwsProject (projectIdx) {
      try {
        const res = await API.iam.getAwsProject(projectIdx)
        this.getProjectDetail(res)
      } catch (error) {
        this.close()
      } finally {
        this.isLoading = false
      }
    },
    timeout (projectIdx) {
      if (this.time) {
        clearTimeout(this.time)
        this.time = null
      }
      this.time = setTimeout(() => this.getAwsProject(projectIdx), 3000)
    },
    setDetail (projectObj) {
      const envType = { STG: this.$v('스테이징'), DEV: this.$v('개발'), PRD: this.$v('운영') }

      const environment = projectObj?.projectMapDto?.map(({ environment }) => envType[environment])
      const copyData = Object.assign({
        environment: environment?.join('/'), // 선택 VPC,
        view: true

      }, projectObj)
      return copyData
    },
    getProjectDetail (projectObj) {
      this.publicProject = this.setDetail(projectObj)

      // 대기 -> RUNNING 시 set interval
      if (/RUNNING/g.test(this.publicProject.status)) this.timeout(projectObj.projectIdx)
    },
    async rejectProject (data) {
      const { projectIdx } = this.publicProject
      const payload = {
        projectIdx: projectIdx,
        message: data.note
      }

      try {
        this.$confirm('반려하시겠습니까?')
          .then(async () => {
            await API.iam.rejectAwsProject(projectIdx, payload)
            this.$alert('반려되었습니다').then(() => {
              this.applyCommonProject.view = false
              this.close()
            }).catch(() => false)
          })
          .catch(() => false)
      } catch (err) {
        this.$alert('반려를 실패했습니다')
      }
    },
    getProjectText (projectType = '') {
      const type = {
        CREATE: '생성',
        DELETE: '삭제'
      }[projectType] ?? projectType

      const typeText = `(${type})`

      return `${this.$v('프로젝트 정보')} ${typeText}`
    },
    getStatusText (status) {
      return {
        READY: this.$v('대기'),
        FAIL: this.$v('실패')
      }[status] ?? status
    },
    async deleteProject ({ projectIdx }) {
      try {
        await API.iam.deleteAwsProject(projectIdx)
        this.getAwsProject(projectIdx)
      } catch (error) {
        console.log(error)
      }
    },
    async checkKeys (publicProject) {
      try {
        const { accessKey, secretKey, regionName } = publicProject
        if (!accessKey?.trim()) return this.$alert(this.$v('Access Key를 입력해주세요.'))
        if (!secretKey?.trim()) return this.$alert(this.$v('Secret Key를 입력해주세요.'))
        await API.iam.checkKey({ accessKey, secretKey, regionName })
        return true
      } catch (err) {
        if (err.response?.data) {
          const errorData = err.response.data
          // {“code”:“400",“message”:“Duplicate Key”}
          const UNVALID_KEY = 'AWS ERROR : Project key is not available' // 사용 불가능한 키
          const DUPLICATE_ERROR = 'Duplicate Key' // 중복키
          const DUPLICATE_USER = 'AWS ERROR : Aws_user is duplicate'

          if (errorData.message === DUPLICATE_ERROR) {
            this.$alert(this.$v('이미 사용 중인 키 입니다.'))
          } else if (errorData.message === UNVALID_KEY) {
            this.$alert(this.$v('사용 불가능한 키입니다.'))
          } else if (errorData.message === DUPLICATE_USER) {
            this.$alert(this.$v('중복된 AWS 계정입니다.'))
          } else {
            this.$alert(errorData.message)
          }
          return false
        }
        this.$alert(this.$v('Access Key 및 Secret Access Key를 확인해주세요.'))
        return false
      }
    },
    async createProject (publicProject) {
      const isSuccess = this.checkKeys(publicProject)
      if (!isSuccess) return

      try {
        this.isLoading = true
        const payload = this.setPayload(this.publicProject)
        await API.iam.approveAwsProject(payload)
        this.getAwsProject(publicProject.projectIdx)
      } catch (error) {
        if (error.response && error.response.data) {
          this.$alert(error.response.data.message)
        }
      } finally {
        this.getAwsProject(publicProject.projectIdx)
      }
    },
    setPayload (publicProject) {
      const result = {
        ...publicProject,
        projectDto: {
          accessKey: publicProject.accessKey,
          approvalNo: publicProject.approvalNo,

          isAdminRequest: false,
          name: publicProject.projectName,
          projectIdx: publicProject.projectIdx,
          projectMapDto: publicProject.projectMapDto,
          regionName: publicProject.regionName,
          secretKey: publicProject.secretKey
        }

      }

      return pick(result, this.awsPayloadKeys)
    },
    async validateAccessKey () {
      if (this.publicProject.type === 'DELETE') return this.proceedApprove()
    },

    /**
     * (PLUS 모드일 경우) 결재자를 현재 로그인한 관리자 정보로 설정하고, 결재를 신청
     */
    async getApprovalStatus () {
      const data = await API.work.getApprovalSetting()
      this.approvalStatus = data.useYn
    },
    close (call) {
      this.$parent.getAwsProjects()
      clearTimeout(this.time)
      this.$emit('close')
    }
  },
  data: root => ({
    isLoading: false,
    applyCommonProject: {
      view: false,
      state: 'reject'
    },
    time: null,
    awsPayloadKeys: ['accessKey', 'companyIdx', 'projectDto', 'projectIdx', 'projectName', 'secretKey', 'approvalNo'],
    approvalStatus: true,
    publicProjectDetail: null,
    blsmModal: false, // 결재자 선택 모달
    failModal: false,
    failReason: '',
    hiddenAccessKey: true, // access 키 read 가능 여부
    accountPw: '', // 현재 로그인된 계정의 비밀번호 인풋 창에 적힌 값
    failMessage: undefined, // 계정 패스워드 실패 메세지
    resourceList: [], // 결재할 자원 목록
    publicProject: { // 프로젝트 결재 모달 데이터
      loading: false,
      view: false
    },
    columns: [
      { binding: 'projectName', header: root.$v('프로젝트 명') },
      { binding: 'status', header: root.$v('상태'), customHtml: true },
      { binding: 'companyName', header: root.$v('관계사') },
      { binding: 'moduleType', header: root.$v('Public Cloud 유형') },
      { binding: 'region', header: root.$v('사용 Region') },
      { binding: 'environment', header: root.$v('선택 VPC') }
    ],
    keyColumns: [
      { binding: 'accessKey', header: 'Access Key' },
      { binding: 'secretKey', header: 'Secret Access Key' }
    ],
    isAlreadyProcessed (error) {
      if (error.response.data.message === 'Rest Error : duplicate operation') {
        // 이미 다른 관리자가 승인한 자원입니다. <br> 사전협의 목록으로 돌아갑니다.
        this.$alert(this.$t('common.ALERT.PROJECT.058'), '알림', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: this.$t('common.BTN.confirm'),
          callback: () => this.$router.push({ name: 'task-conference' })
        })
        return true
      } else return false
    }
  })
}
</script>

<style lang="scss" scoped>
.hidden-access-key {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 160px;
  border-radius: $radius;
  background-color: $ticket-back-color;
  > p { margin-bottom: $gap; font-size: 14px; text-align: center; }
  .wrong-alert { display: block; margin-top: 10px; color: $main-red; font-size: 12px;}
}
</style>
