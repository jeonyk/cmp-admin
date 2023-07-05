<template>
  <div>
    <el-dialog
      :visible.sync="publicProject.view"
      :title="publicProject.approvalNo"
      width="1020px"
      top="5vh"
      @close="close()"
    >
      <div v-loading="publicProject.loading">
        <dashboard-panel
          :title="$t('common.MODAL.projectInfo')"
          :padding-top="0"
        >
          <vertical-table
            :data="publicProject"
            :columns="modalColumns[0]"
            type="horizontal"
          />
        </dashboard-panel>
        <!-- 프로젝트 정보 -->

        <dashboard-panel
          v-if="data && data.orderType === 'NEW'"
          :title="$t('common.BTN.ADMIN.regAcc')"
          :padding-top="0"
        >
          <div
            class="hidden-access-key"
            v-if="hiddenAccessKey"
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
            <!-- /. 비밀번호 확인 -->
          </div>

          <vertical-table
            v-else
            :data="publicProject"
            :columns="modalColumns[1]"
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
            @click="close()"
          >
            <!-- 취소 -->
            {{ $t('common.BTN.cancel') }}
          </button>
          <button
            class="button -modal-button"
            type="is-primary"
            @click="validateAccessKey"
          >
            <!-- :disabled="!publicProject.accessKey.trim() || !publicProject.secretKey.trim()" -->
            {{ $v('다음') }}
          </button>
        </div>
      </div>
    </el-dialog>

    <!-- 조직도 모달 -->
    <approval-modal
      v-loading="false"
      v-if="blsmModal"
      :active.sync="blsmModal"
      @close="blsmModal = false"
      :resource-list="resourceList"
      @confirm="setTask"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex'

import API, { VerticalTable, DashboardPanel } from '@sd-fe/cmp-core'
import ApprovalMemberModal from '@/components/Modal/ApprovalMemberModal/ApprovalMemberModal'
import AWSProjectMixins from './AWSProjectMixins.script'

export default {
  name: 'AWSProjectModal',
  components: {
    VerticalTable,
    'dashboard-panel': DashboardPanel,
    'approval-modal': ApprovalMemberModal
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
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  watch: {
    active (view) {
      this.activePublicProject(this.data, view)
      this.getApprovalStatus()
    }
  },
  methods: {

    /**
     * [AWS 프로젝트 생성] 모달
     * @param { Object } item
     * @param { Boolean } status
     */
    async activePublicProject ({ id, project, moduleType, orderType, ...item }, status) {
      if (!status) return this.close()

      try {
        this.publicProject.loading = true
        this.publicProjectDetail = await API.work.getTaskPreDetail(id)

        // 🔸 (220407) AWS 프로젝트는 한개밖에 신청못하니까 ... 일단 이렇게 ... 임시
        const roles = this.publicProjectDetail.orders[0].roles.filter(role => role.roleMemo === 'AWS프로젝트')[0]
        const detail = roles.orderDataList[0].orderData

        // 선택 VPC
        const envType = { STG: this.$v('스테이징'), DEV: this.$v('개발'), PRD: this.$v('운영') }
        const environment = detail?.projectDto?.projectMapDto?.map(({ environment }) => envType[environment])

        const copyData = Object.assign({
          approvalNo: this.publicProjectDetail.approvalNo, // 결재번호
          companyName: this.publicProjectDetail.companyName, // 프로젝트 명
          displayName: detail.projectDto.region, // 사용 Region
          environment: environment?.join('/'), // 선택 VPC
          projectName: project[0].label, // 프로젝트 정보
          moduleType, // Public Cloud 유형
          orderType, // [신규/삭제]건 확인
          accessKey: detail.projectDto.accessKey || undefined,
          secretKey: detail.projectDto.secretKey || undefined,
          regionName: detail.projectDto.regionName
        })

        // accessKey 가 없는경우 (초기) ? 비밀번호 창 숨김 안해도 됨
        if (!detail.projectDto.accessKey && !detail.projectDto.secretKey) this.hiddenAccessKey = false

        // 사전협의용
        this.publicProject = { ...copyData, view: status }
      } catch (error) {
        console.error('@@ activePublicProject : ', error)
        return this.close()
      } finally {
        this.publicProject.loading = false
      }

      console.log('@모달 프로젝트 정보: ', this.publicProject)
    },

    /**
     * [다음] 클릭시 AccessKey 를 검사합니다.
     */
    async validateAccessKey () {
      // 프로젝트 [삭제] 건일경우는 accessKey 검사 없이 바로 결재를 태웁니다
      if (this.publicProject.orderType === 'DELETE') return this.proceedApprove()

      const isValid = await this.checkKey(this.publicProject)
      if (!isValid) return this.$alert(this.$v('Access Key 가 올바르지 않습니다.'), { callback: () => false })

      return this.proceedApprove()
    },

    /**
     * AWS 프로젝트 정보 저장
     */
    async saveKey ({ accessKey, secretKey }) {
      try {
        const roles = this.publicProjectDetail.orders[0].roles.filter(role => role.roleMemo === 'AWS프로젝트')[0]
        const detail = roles.orderDataList[0]
        detail.orderData.projectDto = { ...detail.orderData.projectDto, accessKey, secretKey }

        const payload = {
          userId: this.user?.userId,
          userName: this.user?.userName,
          userPosition: this.user?.userPosition,
          groupIdx: this.user?.userGroup,
          groupName: this.user?.userGroupName,
          taskDataList: [detail]
        }

        // console.log(JSON.stringify(payload), payload)
        await API.work.saveKey(payload)

        return true
      } catch (error) {
        console.error('@@ saveKey : ', error)
      } finally {
        this.publicProject.loading = false
      }
    },

    /**
     * @function
     * @param {Object} item
     * 결재 실행 => 승인 버튼 클릭시 모달 오픈
     */
    proceedApprove () {
      this.resourceList = [this.$store.state?.auth?.user]
      if (this.approvalStatus === false) {
        const listData = []
        this.setTask(listData)
        return
      } // 결제자 정보 입력 후 성공

      // (PLUS 모드일경우) 바로 결재 신청
      if (this.packageType === 'PL') {
        return this.$confirm(this.$t('common.CONFIRM.APPROVAL.003')) // 해당 내용으로 결재하시겠습니까?
          .then(this.approveWithoutMembers)
          .catch(() => false)
      }

      // (STAND, ENTER, BASIC 모드일경우) 조직도 모달 오픈

      this.blsmModal = true
    },

    /**
     * (PLUS 모드일 경우) 결재자를 현재 로그인한 관리자 정보로 설정하고, 결재를 신청
     */
    async getApprovalStatus () {
      const data = await API.work.getApprovalSetting()
      this.approvalStatus = data.useYn
      // this.approvalStatus = false // 결재 미사용 테스트 코드 false 일 경우
    },
    approveWithoutMembers () {
      const { userCompanyCode, userCompanyName, userGroupCode, userDuty, userGroup, userGroupName, userId, userIdx, userName, userPosition } = this.user
      const userList = [{
        companyCode: userCompanyCode,
        companyName: userCompanyName,
        groupCode: userGroupCode,
        groupName: `${userCompanyName} ${userGroupName}`, // 신세계I&C 데이터센터팀
        index: 0,
        no: 1,
        type: 'S', // 결재 S / 합의 A
        userCompany: userCompanyCode,
        userDuty,
        userGroup,
        userId,
        userIdx,
        userName,
        userPosition
      }]

      return this.setTask(userList)
    },
    async setTask (userList, user = this.user) {
      const roles = this.publicProjectDetail.orders[0].roles.filter(role => role.roleMemo === 'AWS프로젝트')[0]
      const details = roles.orderDataList

      const { userId, userName, userPosition, userGroup, userGroupName, userGroupCode, userCompany, userCompanyName, userCompanyCode } = user

      const orderDataIdxList = details.map(order => order.orderDataIdx)

      const approvalData = {
        approvalNo: this.publicProjectDetail.approvalNo,
        orderNo: details[0].orderNo,
        roleIdx: roles.roleIdx,
        roleName: roles.roleName,
        orderDataIdxList,
        userId,
        userName,
        userPosition,
        groupIdx: userGroup,
        groupName: userGroupName,
        groupCode: userGroupCode,
        companyIdx: userCompany,
        companyName: userCompanyName,
        companyCode: userCompanyCode,
        approvalUsers: JSON.parse(JSON.stringify(userList))
      }

      // console.log('%c ==== blossom 데이터랑 같이 보낼때 JSON.....', 'color: #D0FF9A')
      // console.log(approvalData)
      // this.$router.push({ name: 'task-conference' })

      return this.requestTask(approvalData)
    },
    async requestTask (task) {
      try {
        this.loading = true
        await API.work.requestTask(task)
        const type = this.data.orderType === 'NEW' ? this.$v('생성') : this.$v('삭제')

        return this.$alert(
          // AWS {프로젝트} 생성/삭제 <br> 결재 신청이 완료되었습니다.
          `AWS ${this.publicProject.projectName} ${type} <br> ${this.$v('결재 신청이 완료되었습니다.')}`, {
            dangerouslyUseHTMLString: true,
            callback: () => this.close(true)
          }).then(() => { this.blsmModal = false })
      } catch (error) {
        if (this.isAlreadyProcessed(error)) return

        const errorType = {

        }[error.response.data.message]

        this.$alert(errorType || error)
        return false
      } finally {
        this.loading = false
      }
    },
    close (call) {
      this.publicProject.view = false
      this.accountPw = undefined
      this.hiddenAccessKey = true
      this.$emit('close')

      if (call) this.$emit('call')
    }
  },
  data: root => ({
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
      loading: false
    },
    modalColumns: [
      [
        { binding: 'projectName', header: root.$v('프로젝트 명'), colspan: true },
        { binding: 'companyName', header: root.$v('관계사') },
        { binding: 'moduleType', header: root.$v('Public Cloud 유형') },
        { binding: 'displayName', header: root.$v('사용 Region') },
        { binding: 'environment', header: root.$v('선택 VPC') }
      ], [
        { binding: 'accessKey', header: 'Access Key' },
        { binding: 'secretKey', header: 'Secret Access Key' }
      ]
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
