<!--
  * 파일명 : ConfigLoggingServer.vue
  * 파일 기능 : 환경설정 > 로깅 서버 리스트 노출 및 관리(추가, 변경, 삭제)
  * 작성자 : 염창윤 외 3명
  * 최종 작성일 : 2021-02-03
  * License By Shinsegae I&C
  * 2021-02-03 Wijmo Grid 엑셀 다운로드 추가
 -->

<template>
  <div class="config-logging-server">
    <section class="table-top-wrap">
      <total-count :total-count="totalResultCnt" />
      <div class="button-area -right">
        <button
          class="button"
          type="is-primary"
          @click="createButtonClick"
        >
          {{ $t('common.BTN.ADMIN.addLogging') }}
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
          @click="deleteLoggingServer"
        >
          {{ $t('common.BTN.delete') }}
        </button>
      </div>
    </section>

    <section class="table-area">
      <cmp-grid
        v-loading="isGetLoggingServer"
        :item-source="loggingServerList"
        :columns="loggingServerColumns"
        selectable
        @selectedRow="selectRow"
        :init-custom-action="init"
        :column-data-map="columnDataMap"
        @total-count="cnt => totalResultCnt = cnt"
      >
        <template #loggingType="{ row }">
          <span>{{ loggingTypeLabel[row.loggingType]|| '-' }}</span>
        </template>
        <!-- /.타입 -->

        <template #loggingServerDesc="{ row }">
          <pre style="text-align: left;">{{ row.loggingServerDesc }}</pre>
        </template>
        <template #createTime="{ row }">
          <span>{{ row.createTime | date }}</span>
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
      v-loading="isConnectTest"
      :element-loading-text="$v('로깅 서버 연동 테스트 중입니다.')"
    >
      <section
        class="modal-body"
        style="border-top: 1px solid #3D435E"
      >
        <register-contents
          :title-width-px="210"
          :title="$t('common.GRID.type')"
          required
        >
          <el-radio-group
            v-model="loggingServer.loggingType"
            @change="val => clearLoggingServer(val)"
            :disabled="isUpdate"
          >
            <el-radio
              label="LINK"
            >
              {{ $v('링크 연동') }}
            </el-radio>
            <el-radio
              style="margin-left: 10px;"
              label="DATA"
            >
              {{ $v('데이터 연동') }}
            </el-radio>
          </el-radio-group>
        </register-contents>
        <!-- 타입 -->

        <register-contents
          :title-width-px="210"
          :title="$t('common.REGCON.loggingName')"
          required
        >
          <el-input
            v-model="loggingServer.loggingServerName"
            :placeholder="$t('admin.PREF.enterLogging')"
          />
        </register-contents>
        <!-- 로깅 이름 -->

        <register-contents
          :title-width-px="210"
          :title="$t('common.MODAL.explain')"
        >
          <el-input
            :placeholder="$t('admin.PREF.explain')"
            v-model="loggingServer.loggingServerDesc"
            type="textarea"
          />
        </register-contents>
        <!-- 설명 -->

        <div class="test-connect-area">
          <register-contents
            :title-width-px="210"
            :title="$t('admin.PREF.authInfo')"
            required
          >
            <div class="input-form">
              <span style="min-width: 100px;">{{ $t('admin.PREF.userName') }}: </span>
              <el-input
                :placeholder="$t('admin.PREF.userName')"
                v-model="loggingServer.loggingServerUserId"
                :disabled="testPassed"
              />
            </div>
            <div class="input-form">
              <span style="min-width: 100px;">{{ $t('admin.PREF.userPw') }}: </span>
              <el-input
                v-if="!isUpdate || otp"
                :placeholder="$t('admin.PREF.userPw')"
                v-model="loggingServer.loggingServerUserPw"
                show-password
                ref="otpPasswordInput"
                :disabled="testPassed"
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

          <register-contents
            :title-width-px="210"
            title="URL"
            required
          >
            <el-input
              :placeholder="$t('admin.PREF.enterUrl')"
              v-model="loggingServer.loggingServerUrl"
              :disabled="testPassed"
            />
          </register-contents>
          <!-- URL -->

          <span
            v-if="testPassed || isConnectTest"
            :class="['block-before-test', { 'is-connecting':isConnectTest }]"
          >
            {{ !isConnectTest ? $v('연결 테스트에 성공하였습니다.') : '' }}
          </span>
          <!-- /. 테스트 완료 문구 -->
        </div>

        <button
          v-if="loggingServer.loggingType === 'DATA'"
          :class="['test-btn','button', {'confirm' : testPassed }]"
          @click="checkEquipLogin()"
          :type="testPassed?'is-success':'is-primary'"
          :disabled="(!loggingServer.loggingServerUrl
            || !loggingServer.loggingServerUserId
            || !loggingServer.loggingServerUserPw
          ) ? true : false"
        >
          <i class="icon">
            <i
              v-if="isConnectTest"
              class="el-icon-loading"
            />
            <check-icon
              v-if="testPassed"
              class="check-icon"
            />
          </i>
          {{ testPassed ? `${$v('연동 테스트')} ${$v('성공')}'` : $v('연동 테스트') }}
        </button>
        <!-- 연결 테스트 -->
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
          @click="upsertLoggingServer"
          type="is-primary"
          :disabled="isUpdate && !otp"
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
import API from '@sd-fe/cmp-core'
import OTPModal from '@/components/Modal/OTPModal/OTPModal'
import { mapState } from 'vuex'
import { cloneDeep } from 'lodash'
import GridUtils from '@/components/Utils/GridUtils'
import CheckIcon from '@/components/Icons/CheckIcon.vue'

export default {
  name: 'ConfigLoggingServer',
  components: {
    'otp-modal': OTPModal,
    CheckIcon
  },
  created () {
    this.getLoggingServerList()
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  watch: {
    newItemModal (val) {
      if (!val) {
        this.otp = false
        this.testPassed = false
      }
    }
  },
  methods: {
    callbackApi: API.config.getCertLoggingServerList,
    validatedOTP (data) {
      this.otp = true
      this.otpModalActive = false

      const loggingServerList = data

      // 유저 비밀번호(loggingServerUserPw) '*******' 형태로 들어오는 데이터의 값을 알기 위해서
      if (loggingServerList && loggingServerList.length) {
        const findLoggingServer = loggingServerList.find(item => item.loggingType === this.loggingServer.loggingType)
        if (findLoggingServer?.loggingServerUserPw) this.loggingServer.loggingServerUserPw = findLoggingServer.loggingServerUserPw
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
    async getLoggingServerList () {
      try {
        this.isGetLoggingServer = true
        this.loggingServerList = await API.config.getLoggingServerList()

        this.columnDataMap.createTime = GridUtils.setColumnDataMap('createTime', this.loggingServerList, 'date')
      } catch (error) {
        console.error(error)
        this.loggingServerList = []
        throw error
      } finally {
        this.selectedRow = null
        this.isGetLoggingServer = false
      }
    },
    createButtonClick () {
      this.clearLoggingServer()
      this.newItemModal = true
      this.isUpdate = false
      this.modalTitle = this.$t('common.MODAL.addLoggingServ')
    },
    updateButtonClick () {
      this.newItemModal = true
      this.isUpdate = true
      this.modalTitle = this.$t('common.MODAL.modLoggingServ')
      this.loggingServer = cloneDeep(this.selectedRow._data)
    },
    async upsertLoggingServer () {
      const type = this.loggingServer.loggingType
      if (!this.isUpdate && this.loggingServerList.find(row => row.loggingType === type)) return this.$alert(this.$v('{type} 타입의 로깅 서버가<br>이미 존재합니다.', { type: this.loggingTypeLabel[type] }), { dangerouslyUseHTMLString: true })

      if (!this.loggingServer.loggingServerName?.trim()) return this.$alert(this.$t('common.ALERT.LOGGING.001')) // 로깅 서버 이름을 입력해주세요.

      if (!this.loggingServer?.loggingServerUserId?.trim()) return this.$alert(this.$v('인증 유저 이름을 입력해주세요.')) // 인증 유저 이름을 입력해주세요.

      if (!this.loggingServer?.loggingServerUserPw?.trim()) return this.$alert(this.$v('인증 유저 비밀번호를 입력해주세요.')) // 인증 유저 비밀번호를 입력해주세요.

      if (!this.loggingServer?.loggingServerUrl?.trim()) return this.$alert(this.$t('common.ALERT.LOGGING.002')) // 로깅 서버 URL을 입력해주세요.

      const urlRegex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\\.-]+)+[\w\-\\._~:/?#[\]@!\\$&'\\(\\)\\*\\+,;=.]+$/gm
      if (!urlRegex.test(this.loggingServer.loggingServerUrl)) {
        // this.$alert('잘못된 로깅 서버 URL입니다.')
        this.$alert(this.$t('common.ALERT.LOGGING.003'))
        return
      }

      if (this.loggingServer.loggingType === 'DATA' && !this.testPassed) return this.$alert(this.$t('common.ALERT.NUTA.038')) // 연결 테스트를 실행해주세요.

      let message = this.$t('common.CONFIRM.LOGGING.003')
      if (this.isUpdate) {
        // message = '로깅 서버 정보를 수정하시겠습니까?'
        message = this.$t('common.CONFIRM.LOGGING.002')
      }
      this.$confirm(message, '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        let createLoggingServerResponse
        // let successMessage = '생성하였습니다.'
        let successMessage = this.$t('common.ALERT.BASE.055')
        // let failMessage = '생성에 실패하였습니다.<br/>관리자 문의 부탁드립니다.'
        let failMessage = this.$t('common.ALERT.LOGGING.004')
        if (this.isUpdate) {
          // OTP 인증이 안된 상태면 패스워드 키를 삭제합니다.
          // 패스워드가 ********로 저장되는 문제를 방지합니다.
          if (!this.otp) {
            delete this.loggingServer.loggingServerUserPw
          }
          createLoggingServerResponse = await this.updateLoggingServer({
            ...this.loggingServer,
            updateUserId: this.user.userId,
            updateUserName: this.user.userName
          }, this.loggingServer.loggingType)
          // successMessage = '수정하였습니다.'
          successMessage = this.$t('common.ALERT.BASE.053')
          // failMessage = '수정에 실패하였습니다.<br/>관리자 문의 부탁드립니다.'
          failMessage = this.$t('common.ALERT.LOGGING.005')
        } else {
          createLoggingServerResponse = await this.createLoggingServer({
            ...this.loggingServer,
            createUserId: this.user.userId,
            createUserName: this.user.userName
          }, this.loggingServer.loggingType)
        }

        if (createLoggingServerResponse) {
          this.getLoggingServerList()
          this.$alert(successMessage, '', { dangerouslyUseHTMLString: true })
          this.$store.dispatch('common/setChangeMonitoringLogging', 'changed')
          this.clearLoggingServer()
          this.newItemModal = false
        } else {
          this.$alert(failMessage, '', {
            dangerouslyUseHTMLString: true
          })
        }
      }).catch(() => {

      })
    },
    /**
     * API : 로깅 서버 생성
     */
    async createLoggingServer (payload, loggingType) {
      const failMsg = this.$t('common.ALERT.LOGGING.004') // 생성에 실패하였습니다.<br/>관리자 문의 부탁드립니다.

      try {
        return await API.config.createLoggingServer(payload, loggingType)
      } catch (error) {
        console.error(error)
        return this.alertError(error, failMsg)
      }
    },
    /**
     * API : 로깅 서버 수정
     */
    async updateLoggingServer (payload, loggingType) {
      const failMsg = this.$t('common.ALERT.LOGGING.005') // 수정 실패하였습니다.<br/>관리자 문의 부탁드립니다.

      try {
        return await API.config.updateLoggingServer(payload, loggingType)
      } catch (error) {
        console.error(error)
        return this.alertError(error, failMsg)
      }
    },
    /**
     * API : 코드 조회
     */
    async getCodeList (params) {
      try {
        this.isCodeData = true
        return await API.config.getCodeList(params)
      } catch (error) {
        console.error(error)
        this.$alert(this.$t('common.ALERT.IND.006')) // 코드 조회 실패
      } finally {
        this.isCodeData = false
      }
    },
    async deleteLoggingServer () {
      this.$confirm(this.$t('common.CONFIRM.LOGGING.001')).then(async () => {
        const failMsg = this.$t('common.ALERT.BASE.015') // 삭제에 실패하였습니다.<br/>관리자 문의 부탁드립니다.
        try {
          const deleteLoggingServerResponse = await API.config.deleteLoggingServer(
            {
              userId: this.user.userId,
              userName: this.user.userName
            },
            this.selectedRow._data.loggingType
          )
          if (deleteLoggingServerResponse) {
            this.getLoggingServerList()
            // this.$alert('삭제하였습니다.')
            this.$alert(this.$t('common.ALERT.BASE.017'))
            this.$store.dispatch('common/setChangeMonitoringLogging', 'changed')
          } else {
            this.$alert(failMsg, { dangerouslyUseHTMLString: true })
          }
        } catch (error) {
          return this.alertError(error, failMsg)
        }
      }).catch(() => {
      })
    },
    clearLoggingServer (loggingType = null) {
      this.loggingServer = {
        loggingType: 'LINK',
        loggingServerName: '',
        loggingServerUrl: '',
        loggingServerDesc: '',
        loggingServerUserId: '',
        loggingServerUserPw: ''
      }
      this.testPassed = false
      if (loggingType) this.loggingServer.loggingType = loggingType
    },
    /**
     * 연결 테스트
     */
    async checkEquipLogin () {
      try {
        if (!this.otp && this.isUpdate) {
          return this.$alert(
            this.$v('비밀번호 보기 인증을 완료해주세요.'),
            { dangerouslyUseHTMLString: true }
          )
        }
        this.isConnectTest = true

        let userInfo = {}

        const userId = this.user.userId
        const userName = this.user.userName

        if (!this.isUpdate) { // 생성
          userInfo = {
            createUserId: userId,
            createUserName: userName
          }
        } else {
          userInfo = {
            updateUserId: userId,
            updateUserName: userName
          }
        }
        const payload = { ...this.loggingServer, ...userInfo }
        // const p1 = performance.now()
        const result = await API.config.loggingConnectTest(payload)

        // const p2 = performance.now()
        if (result !== undefined) {
          // console.log('테스트 걸리는 시간: ', p2 - p1 + ' ms')
          this.testPassed = result
          // const message = '연결 테스트에 ' + (this.testPassed ? '성공' : '실패') + '하였습니다.'
          const message = this.testPassed ? this.$t('common.ALERT.NUTA.005') : this.$t('common.ALERT.NUTA.006')
          this.$alert(message)
        }
      } catch (error) {
        console.error(error)
        const msg = this.$t('common.ALERT.NUTA.006')
        // if (error?.response?.data?.message) msg += '<br><br>' + error?.response?.data?.message
        return this.$alert(msg, { dangerouslyUseHTMLString: true })
      } finally {
        this.isConnectTest = false
      }
    },
    /**
     * 에러 코드 매핑
     * {@link https://cmp-api.growthsoft.co.kr/doc/cmp/v1/monitoring/swagger-ui.html#/error-doc-controller}
     * @param error
     * @param defaultErrorMsg {String} 기본 실패 메세지: '문제가 발생했습니다. 관리자에게 문의해주세요'
     */
    alertError (error, defaultErrorMsg = this.$t('common.ALERT.BASE.062')) {
      let errMsg = defaultErrorMsg

      const errorCode = error?.response?.data?.code
      if (errorCode) {
        const message = {
          MON0003: this.$v('연결 실패했습니다.'),
          MON0004: '해당 타입의 로깅 서버가<br>이미 존재합니다.',
          MON0005: this.$t('common.ALERT.BASE.033'), // 등록 실패하였습니다.
          MON1001: this.$v('작업 요청을 실패했습니다.'),
          MON1002: this.$t('common.ALERT.BASE.033') // 인증을 실패하였습니다.
        }
        if (message[errorCode]) errMsg = message[errorCode]
      }

      return this.$alert(errMsg, { dangerouslyUseHTMLString: true })
    }
  },
  data (root) {
    return {
      totalResultCnt: 0,
      otp: false,
      otpModalActive: false,
      selectedRow: null, // 선택한 로우
      loggingServerList: [],
      newItemModal: false,
      isUpdate: false,
      modalTitle: '',

      testPassed: false, // 연결 테스트 성공 여부

      isGetLoggingServer: false, // 로깅 서버 목록 조회 로딩
      isConnectTest: false, // 연결 테스트 로딩

      loggingServer: { // 링크 연동
        loggingType: 'LINK',
        loggingServerName: '',
        loggingServerUrl: '',
        loggingServerDesc: '',
        loggingServerUserId: '',
        loggingServerUserPw: ''
      },

      loggingTypeLabel: {
        DATA: root.$v('데이터 연동'),
        LINK: root.$v('링크 연동')
      },

      // 테이블 정보
      loggingServerColumns: [
        { header: '타입', binding: 'loggingType', width: 100, customHtml: true, keyPath: 'common.GRID.type' },
        { header: '로깅 서버 이름', binding: 'loggingServerName', width: 200, customHtml: true, keyPath: 'admin.PREF.loggingServerName' },
        { header: 'URL', binding: 'loggingServerUrl', width: 300, customHtml: true },
        { header: '로깅 서버 설명', binding: 'loggingServerDesc', width: '*', customHtml: true, align: 'left', keyPath: 'admin.PREF.loggingServerExplain' },
        { header: '아이디', binding: 'loggingServerUserId', width: 200, customHtml: true, keyPath: 'admin.PREF.id' },
        { header: '비밀번호', binding: 'loggingServerUserPw', width: 150, customHtml: true, keyPath: 'admin.PREF.pw' },
        { header: '생성 시간', binding: 'createTime', width: 150, customHtml: true, dataType: 'Date', keyPath: 'admin.PREF.createTime' }
      ],
      columnDataMap: {
        createTime: { value: '', captions: '' }
      }
    }
  }
}
</script>
<style lang="scss" scoped>
  .config-logging-server {
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

  .test-btn {
    width: 100%;
    margin-top:4px;
      &.confirm {
        background-color: $success;
        &:disabled {
          background: $success;
          opacity: 1;
        }
      }
      .icon {
        margin-right: 4px;
        .check-icon {
          height: 12px;
        }
      }
    }
  }
  .test-connect-area {
    position: relative;
    .block-before-test {
      background: rgba(0, 0, 0, 0.8);
      position: absolute;
      top: 0; left: 0; bottom: 0; right: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $light-gray;
      transition: background 0.2s ease-in-out;
      &.is-connecting {
        background: rgba(0, 0, 0, 0.2);
      }
    }
  }
</style>
