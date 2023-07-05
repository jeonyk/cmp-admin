<!--
  * 파일명 : ConfigMonitoringServer.vue
  * 파일 기능 : 환경설정 > 모니터링 서버 리스트 노출 및 관리(추가, 변경, 삭제)
  * 작성자 : 염창윤 외 4명
  * 최종 작성일 : 2021-02-03
  * License By Shinsegae I&C
  * 2021-02-03 Wijmo Grid 엑셀 다운로드 추가
 -->

<template>
  <div
    class="config-monitoring-server"
    v-loading="loading"
    :element-loading-text="$t('common.PLACEHOLDER.loading')"
  >
    <section class="table-top-wrap">
      <total-count :total-count="totalResultCnt" />
      <div class="button-area -right">
        <!-- <sync-component
          :last-info="lastSync"
          @click="activeSync"
        /> -->
        <!-- <button
          class="button"
          style="margin-left: 10px;"
        >
          테스트
        </button> -->
        <!-- <span class="divider" /> -->
        <button
          class="button"
          type="is-primary"
          @click="createButtonClick"
          :disabled="monitoringServerList.length > 0"
        >
          {{ $t('common.BTN.ADMIN.addMonitor') }}
        </button>
        <button
          class="button"
          :disabled="!selectedRow"
          @click="updateButtonClick"
        >
          {{ $t('common.BTN.change') }}
        </button>
        <button
          class="button"
          type="is-anti"
          :disabled="!selectedRow"
          @click="deleteMonitoringServer"
        >
          {{ $t('common.BTN.delete') }}
        </button>
      </div>
    </section>

    <section class="table-area">
      <cmp-grid
        :loading="loading"
        :item-source="monitoringServerList"
        :columns="monitoringServerColumns"
        selectable
        @selectedRow="selectRow"
        :init-custom-action="init"
        @total-count="cnt => totalResultCnt = cnt"
      >
        <!-- <template #auth="props">
          <span v-if="props.row.auth.userName && props.row.auth.userPw">기입 완료</span>
          <span v-else><button
            class="button"
            @click.stop="applyUpdate(props.row)"
          >인증 정보 설정</button></span>
        </template> -->
        <!-- /.인증 정보 -->

        <template #monitoringServerDesc="props">
          <!-- <el-input
            :value="props.row.monitoringServerDesc"
            type="textarea"
            disabled
            class="disabled-text-area"
          /> -->
          <pre style="text-align: left;">{{ props.row.monitoringServerDesc }}</pre>
        </template>
        <template #createTime="props">
          <span>{{ props.row.createTime | date }}</span>
        </template>
      </cmp-grid>
    </section>

    <!-- 모달 -->
    <!-- 항목 생성/수정 모달 -->
    <el-dialog
      :title="modalTitle"
      :visible.sync="newItemModal"
      class="new-item-modal"
      width="600px"
      @close="newItemModal = false"
    >
      <section
        class="modal-body"
        style="border-top: 1px solid #3D435E"
      >
        <register-contents
          :title="$t('admin.PREF.monitorServerName')"
          required
        >
          <el-input
            v-model="monitoringServer.monitoringServerName"
            :placeholder="$t('admin.PREF.enterMonitorServerName')"
          />
        </register-contents>
        <!-- 모니터링 이름 -->

        <register-contents
          title="URL"
          required
        >
          <el-input
            :placeholder="$t('admin.PREF.enterUrl')"
            v-model="monitoringServer.monitoringServerUrl"
          />
        </register-contents>
        <!-- URL -->

        <register-contents
          :title="$t('admin.PREF.autheticationInfo')"
        >
          <div class="input-form">
            <span style="min-width: 100px;">{{ $t('admin.PREF.id') }}: </span>
            <el-input
              :placeholder="$t('admin.PREF.id')"
              v-model="monitoringServer.monitoringServerUserId"
            />
          </div>
          <div class="input-form">
            <span style="min-width: 100px;">{{ $t('admin.PREF.pw') }}: </span>
            <el-input
              v-if="!isUpdate || otp"
              :placeholder="$t('admin.PREF.pw')"
              v-model="monitoringServer.monitoringServerUserPw"
              show-password
              ref="otpPasswordInput"
            />
            <button
              v-else
              @click="otpModalActive = !otpModalActive"
              type="is-primary"
              class="button -confirm"
            >
              {{ $t('common.BTN.viewPw') }}
            </button>
          </div>
        </register-contents>
        <!-- 인증 정보 -->

        <register-contents :title="$t('common.MODAL.explain')">
          <el-input
            :placeholder="$t('admin.PREF.explain')"
            v-model="monitoringServer.monitoringServerDesc"
            type="textarea"
          />
        </register-contents>
      </section>

      <div class="modal-footer modal-button-area">
        <button
          class="button -modal-button"
          type="is-anti"
          @click="newItemModal = false"
        >
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          class="button -modal-button"
          @click="upsertMonitoringServer"
          type="is-primary"
        >
          {{ $t('common.BTN.confirm') }}
        </button>
      </div>
      <otp-modal
        required-api
        :callback-api="callbackApi"
        :active="otpModalActive"
        @close="otpModalActive = false"
        @validated-otp="validatedOTP"
      />
    </el-dialog>
  </div>
</template>
<script>
import OTPModal from '@/components/Modal/OTPModal/OTPModal'
import API from '@sd-fe/cmp-core'
import { cloneDeep } from 'lodash'

export default {
  name: 'ConfigMonitoringServer',
  components: {
    'otp-modal': OTPModal
  },
  created () {
    this.getMonitoringServerList()
  },
  watch: {
    newItemModal (val) {
      if (!val) this.otp = false
    }
  },
  methods: {
    callbackApi: API.config.getCertMonitoringServerList,
    validatedOTP (data) {
      this.otp = true
      this.otpModalActive = false

      const monitoringServer = data

      if (monitoringServer && monitoringServer.length) {
        const findMonitoringServer = monitoringServer.find(item => item.monitoringServerIdx === this.monitoringServer.monitoringServerIdx)
        if (findMonitoringServer) this.monitoringServer = findMonitoringServer
      }

      this.$nextTick(() => {
        // this.$refs.otpPasswordInput.passwordVisible = true
      })
    },
    selectRow (rowData) {
      this.selectedRow = rowData
    },
    init (grid) {
      this.grid = grid
    },
    async getMonitoringServerList (payload = {}) {
      try {
        this.loading = true
        const response = await API.config.getMonitoringServerList(payload)
        if (!response) return
        this.monitoringServerList = [...response]
      } catch (error) {
        this.loading = false
        console.error(error)
        this.monitoringServerList = []
        this.$alert(error, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
      } finally {
        this.loading = false
      }
    },
    createButtonClick () {
      this.clearMonitorServer()
      this.newItemModal = true
      this.isUpdate = false
      this.modalTitle = this.$t('admin.PREF.monitorServerAdd')
    },
    updateButtonClick () {
      this.newItemModal = true
      this.isUpdate = true
      this.modalTitle = this.$t('admin.PREF.monitorServerModify')
      this.monitoringServer = cloneDeep(this.selectedRow._data)
    },
    async upsertMonitoringServer () {
      if (!this.monitoringServer.monitoringServerName || this.monitoringServer.monitoringServerName === '') {
        // this.$alert('모니터링 서버 이름을 입력해주세요.')
        this.$alert(this.$t('common.ALERT.MON.001'))
        return
      }
      if (!this.monitoringServer.monitoringServerUrl || this.monitoringServer.monitoringServerUrl === '') {
        // this.$alert('모니터링 서버 URL을 입력해주세요.')
        this.$alert(this.$t('common.ALERT.MON.002'))
        return
      }
      const urlRegex = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/gm

      if (!urlRegex.test(this.monitoringServer.monitoringServerUrl)) {
        // this.$alert('잘못된 모니터링 서버 URL입니다.')
        this.$alert(this.$t('common.ALERT.MON.003'))
        return
      }
      // let message = '모니터링 서버 정보를 저장하시겠습니까?'
      let message = this.$t('common.CONFIRM.MON.003')
      if (this.isUpdate) {
        // message = '모니터링 서버 정보를 수정하시겠습니까?'
        message = this.$t('common.CONFIRM.MON.002')
      }
      this.$confirm(message, '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        let createMonitoringServerResponse
        // let successMessage = '생성하였습니다.'
        let successMessage = this.$t('common.ALERT.BASE.055')
        // let failMessage = '생성에 실패하였습니다.<br/>관리자 문의 부탁드립니다.'
        let failMessage = this.$t('common.ALERT.LOGGING.004')
        if (this.isUpdate) {
          // OTP 인증이 안된 상태면 패스워드 키를 삭제합니다.
          // 패스워드가 ********로 저장되는 문제를 방지합니다.
          if (!this.otp) {
            delete this.monitoringServer.monitoringServerUserPw
          }
          createMonitoringServerResponse = await API.config.updateMonitoringServer(this.monitoringServer)
          // successMessage = '수정하였습니다.'
          successMessage = this.$t('common.ALERT.BASE.053')
          // failMessage = '수정에 실패하였습니다.<br/>관리자 문의 부탁드립니다.'
          failMessage = this.$t('common.ALERT.LOGGING.005')
        } else {
          createMonitoringServerResponse = await API.config.createMonitoringServer(this.monitoringServer)
        }

        if (createMonitoringServerResponse) {
          this.getMonitoringServerList()
          this.$alert(successMessage, '', { dangerouslyUseHTMLString: true })
          this.$store.dispatch('common/setChangeMonitoringLogging', 'changed')
          this.clearMonitorServer()
          this.newItemModal = false
        } else {
          this.$alert(failMessage, '', {
            dangerouslyUseHTMLString: true
          })
        }
      }).catch(() => {

      })
    },
    async deleteMonitoringServer () {
      this.$confirm(this.$t('common.CONFIRM.MON.001'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        const deleteMonitoringServerResponse = await API.config.deleteMonitoringServer({ monitoringServerIdx: this.selectedRow._data.monitoringServerIdx })
        if (deleteMonitoringServerResponse) {
          this.getMonitoringServerList()
          this.$alert(this.$t('common.ALERT.BASE.017'))
          this.$store.dispatch('common/setChangeMonitoringLogging', 'changed')
        } else {
          this.$alert(this.$t('common.ALERT.BASE.015'), '', {
            dangerouslyUseHTMLString: true
          })
        }
      }).catch(() => {
      })
    },
    clearMonitorServer () {
      this.monitoringServer = {
        monitoringServerName: '',
        monitoringServerUrl: '',
        monitoringServerDesc: '',
        monitoringServerUserId: '',
        monitoringServerUserPw: ''
      }
    }
  },
  data () {
    return {
      totalResultCnt: 0,
      otp: false,
      otpModalActive: false,
      loading: false,
      selectedRow: null, // 선택한 로우
      monitoringServerList: [],
      newItemModal: false,
      isUpdate: false,
      modalTitle: '',
      monitoringServer: {
        monitoringServerName: '',
        monitoringServerUrl: '',
        monitoringServerDesc: '',
        monitoringServerUserId: '',
        monitoringServerUserPw: ''
      },

      // 테이블 정보
      monitoringServerColumns: [
        { header: '모니터링 서버 이름', binding: 'monitoringServerName', width: 200, customHtml: true, keyPath: 'admin.PREF.monitorServerName' },
        { header: 'URL', binding: 'monitoringServerUrl', width: 300, customHtml: true },
        { header: '모니터링 서버 설명', binding: 'monitoringServerDesc', width: '*', customHtml: true, align: 'left', keyPath: 'admin.PREF.monitorServerExplain' },
        { header: '아이디', binding: 'monitoringServerUserId', width: 200, customHtml: true, keyPath: 'admin.PREF.id' },
        { header: '비밀번호', binding: 'monitoringServerUserPw', width: 200, customHtml: true, keyPath: 'admin.PREF.pw' },
        { header: '생성 시간', binding: 'createTime', width: 200, customHtml: true, dataType: 'Date', keyPath: 'admin.PREF.createTime' }
      ]
    }
  }
}
</script>
<style lang="scss">
  .config-monitoring-server {
    .table-area {
      margin-top: $gap;
      .disabled-text-area {
        textarea {
          border: 0;
          cursor: pointer;
        }
      }
    }
     // 모달
    .new-item-modal {
      .modal-body {
        .input-form {
          display: flex;
          align-items: center;
          position: relative;
          > .button {
            width: 100%;
          }
          & + .input-form {
            margin-top: 5px;
          }
        }
      }
    }
  }
</style>
