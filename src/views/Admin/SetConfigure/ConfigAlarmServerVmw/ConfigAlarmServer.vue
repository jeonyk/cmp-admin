<!--
  * 파일명 : ConfigAlarmServer.vue
  * 파일 기능 : 환경설정 > 알람 서버 리스트 노출 및 관리(추가, 변경, 삭제)
  * 작성자 : 염창윤 외 5명
  * 최종 작성일 : 2021-02-03
  * License By Shinsegae I&C
  * 2021-02-03 Wijmo Grid 엑셀 다운로드 추가
 -->

<template>
  <div
    class="config-alarm-server"
    v-loading="loading || isAlarmTypes"
    :element-loading-text="$t('common.PLACEHOLDER.loading')"
  >
    <section class="table-top-wrap">
      <total-count :total-count="totalResultCnt" />
      <div class="button-area -right">
        <div class="button-area">
          <!-- 항목 추가 -->
          <button
            class="button"
            type="is-primary"
            @click="e => applyUpdateIp()"
          >
            {{ $t('common.TERMS.itemAdd') }}
          </button>

          <!-- 변경 -->
          <button
            class="button"
            :disabled="!selectedRow"
            @click="e => applyUpdateIp(selectedRow._data)"
          >
            {{ $t('common.BTN.change') }}
          </button>

          <!-- 삭제 -->
          <button
            class="button"
            type="is-anti"
            @click="deleteAlarmInfo"
            :disabled="!selectedRow"
          >
            {{ $t('common.BTN.delete') }}
          </button>
        </div>
      </div>
    </section>

    <section class="table-area">
      <cmp-grid
        :loading="loading"
        :item-source="tableData"
        :columns="columns"
        selectable
        @selectedRow="(row) => selectedRow = row"
        :init-custom-action="initGrid"
        :column-data-map="columnDataMap"
        @total-count="cnt => totalResultCnt = cnt"
      >
        <template #createTime="props">
          <span>{{ props.row.createTime | date }}</span>
        </template>
        <!-- 생성 시간 -->

        <template #updateTime="props">
          <span>{{ props.row.updateTime | date }}</span>
        </template>
        <!-- 수정 시간 -->
      </cmp-grid>
    </section>

    <!-- 모달 -->
    <!-- 항목 생성/수정 모달 -->
    <el-dialog
      :title="modalTitle"
      :visible.sync="newItemModalActive"
      class="new-item-modal"
      width="600px"
      @close="closeModal"
    >
      <section
        class="modal-body"
        style="border-top: 1px solid #3D435E"
      >
        <register-contents
          :title="$t('admin.PREF.alarmType')"
          required
        >
          <el-select
            v-model="updateForm.alarmType"
            :placeholder="$t('admin.PREF.selectAlarmType')"
            :disabled="originData !== null"
            :popper-append-to-body="false"
          >
            <el-option
              v-for="item in alarmTypeOptions"
              :key="item.codeVal"
              :label="item.codeName"
              :value="item.codeVal"
            />
          </el-select>
        </register-contents>
        <!-- 알람 타입 -->
        <template v-if="updateForm.alarmType !== ''">
          <div>
            <!-- :title="$t('admin.PREF.host')" -->
            <register-contents
              :title="$t('admin.PREF.transmissionType')"
              v-if="updateForm.alarmType === 'PPURIO_AT' || updateForm.alarmType === 'PPURIO_SMS'"
              required
            >
              <el-select
                v-model="updateForm.sendType"
                :placeholder="$t('common.PLACEHOLDER.transmissionType')"
                :popper-append-to-body="false"
              >
                <el-option
                  v-for="(item, index) in sendTypeOptions"
                  :key="index"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </register-contents>
            <!-- 전송 타입 -->

            <register-contents
              :title="$t('admin.PREF.host')"
              v-if="updateForm.sendType !== 'DB'"
              required
            >
              <el-input
                :placeholder="$t('admin.PREF.enterHost')"
                v-model="updateForm.host"
              />
            </register-contents>
            <!-- 호스트 -->

            <register-contents
              :title="$t('common.GRID.NETWORK.port')"
              v-if="updateForm.alarmType !== 'PPURIO_AT' && updateForm.alarmType !== 'PPURIO_SMS'"
            >
              <el-input
                :placeholder="$t('admin.PREF.enterPort')"
                v-model="updateForm.port"
              />
            </register-contents>
            <!-- 포트 -->

            <register-contents
              :title="$t('admin.PREF.mailInfo')"
              v-if="updateForm.alarmType === 'MAIL'"
            >
              <template>
                <div class="input-form">
                  <span style="min-width: 100px;">{{ $t('admin.PREF.protocol') }}: </span>
                  <el-input
                    :placeholder="$t('admin.PREF.protocol')"
                    v-model="updateForm.protocol"
                  />
                </div>
              </template>
            </register-contents>
            <!-- 메일 정보 > 프로토콜 -->

            <register-contents
              :title="$t('admin.PREF.accountInfo')"
              required
            >
              <template>
                <div class="input-form">
                  <span style="min-width: 100px;">ID: </span>
                  <el-input
                    :placeholder="$t('admin.PREF.userName')"
                    v-model="updateForm.user"
                  />
                </div>
                <div class="input-form">
                  <span style="min-width: 100px;">{{ $t('admin.PREF.pw') }}: </span>
                  <el-input
                    v-if="!originData || otp"
                    :placeholder="$t('admin.PREF.userPw')"
                    v-model="updateForm.password"
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
              </template>
            </register-contents>
            <!-- 계정 정보 -->

            <register-contents
              v-if="updateForm.alarmType === 'TALK' || updateForm.alarmType === 'PPURIO_AT' || updateForm.alarmType === 'PPURIO_SMS'"
              :title="updateForm.alarmType === 'TALK' ? $t('common.REGCON.bstockInfo') : updateForm.alarmType === 'PPURIO_AT' || updateForm.alarmType === 'PPURIO_SMS' ? $t('admin.PREF.ppurioInfo') : ''"
              :required="updateForm.alarmType === 'PPURIO_AT' || updateForm.alarmType === 'PPURIO_SMS'"
            >
              <template>
                <div class="input-form">
                  <span style="min-width: 100px;">{{ updateForm.alarmType === 'TALK' ? $t('common.PLACEHOLDER.senderId') : $t('admin.PREF.outgoingNumber') }}: </span>
                  <el-input
                    :placeholder="updateForm.alarmType === 'TALK' ? $t('common.PLACEHOLDER.senderId') : $t('admin.PREF.outgoingNumber')"
                    v-model="updateForm.senderId"
                  />
                </div>
                <div
                  v-if="updateForm.alarmType === 'TALK'"
                  class="input-form"
                >
                  <span style="min-width: 100px;">{{ $t('common.PLACEHOLDER.sysCode') }}: </span>
                  <el-input
                    :placeholder="$t('common.PLACEHOLDER.sysCode')"
                    v-model="updateForm.systemCode"
                  />
                </div>
                <div
                  v-if="updateForm.alarmType === 'TALK' || updateForm.alarmType === 'PPURIO_AT'"
                  class="input-form"
                >
                  <span style="min-width: 100px;">{{ updateForm.alarmType === 'TALK' ? $t('common.PLACEHOLDER.sysKey') : $t('admin.PREF.outgoingProfileKey') }}: </span>
                  <el-input
                    :placeholder="updateForm.alarmType === 'TALK' ? $t('common.PLACEHOLDER.sysKey') : $t('admin.PREF.outgoingProfileKey')"
                    v-model="updateForm.systemKey"
                  />
                </div>
              </template>
            </register-contents>
            <!-- 블톡 / 뿌리오 정보 -->

            <register-contents :title="$t('common.MODAL.explain')">
              <el-input
                :placeholder="$t('common.PLACEHOLDER.enterDes')"
                v-model="updateForm.comment"
                type="textarea"
              />
            </register-contents>
            <!-- 설명 -->

            <register-contents
              :title="$t('admin.PREF.templateManagement')"
              v-if="updateForm.alarmType === 'PPURIO_AT'"
              required
            >
              <div
                v-for="(tpl, index) in updateForm.alarmTemplate"
                :key="index"
                class="template-wrapper"
              >
                <div class="template-inner">
                  <span>{{ tpl.functionCode === "WORK_DONE" ? $t('common.REGCON.doneExec') : $t('common.REGCON.authOtp') }}</span>
                  <el-input
                    :placeholder="$t('common.PLACEHOLDER.templateCode')"
                    v-model="tpl[`${updateForm.sendType.toLowerCase()}TemplateCode`]"
                  />
                  <el-input
                    :placeholder="$t('common.PLACEHOLDER.countryCode')"
                    v-model="tpl.nationCode"
                    class="nation-code"
                  />
                </div>
                <el-input
                  :placeholder="$t('common.PLACEHOLDER.templateText')"
                  v-model="tpl.templateText"
                  type="textarea"
                />
              </div>
            </register-contents>
            <!-- 템플릿 관리 -->
          </div>
        </template>
      </section>

      <div class="modal-footer modal-button-area">
        <button
          class="button -modal-button"
          type="is-anti"
          @click="cancelSave"
        >
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          class="button -modal-button"
          @click="applyUpdate"
          type="is-primary"
        >
          {{ $t('common.BTN.confirm') }}
        </button>
      </div>
      <otp-modal
        api-call-component-name="ConfigAlarmServer"
        required-api
        :callback-api="callbackApi"
        :active="otpModalActive"
        :alarm-type="updateForm.alarmType"
        @close="otpModalActive = false"
        @validated-otp="validatedOTP"
      />
    </el-dialog>
  </div>
</template>
<script>
import { cloneDeep } from 'lodash'
import { mapState } from 'vuex'
import OTPModal from '@/components/Modal/OTPModal/OTPModal'
import API from '@sd-fe/cmp-core'

export default {
  name: 'ConfigAlarmServer',
  components: {
    'otp-modal': OTPModal
  },
  watch: {
    newItemModalActive (newVal) {
      if (newVal) this.otp = false
    }
  },
  computed: {
    ...mapState({
      packageType: state => state.auth.packageType
    }),
    modalTitle () {
      if (this.originData) return this.$t('admin.PREF.changeItem')
      else return this.$t('common.TERMS.itemAdd')
    }
  },
  async mounted () {
    await this.getAlarmTypeOptions()
    await this.getAlarmInfo()
  },
  methods: {
    callbackApi: API.alarm.alarm.getAlarmInfoCert,
    validatedOTP (data) {
      this.otp = true
      this.otpModalActive = false

      this.updateForm.password = data.password

      this.$nextTick(() => {
        // this.$refs.otpPasswordInput.passwordVisible = true
      })
    },
    /**
     * 알람 타입 옵션 조회
     */
    async getAlarmTypeOptions () {
      try {
        this.isAlarmTypes = true
        const alarmTypes = await API.alarm.config.getCodeList({ codeType: 'ALARM_TYPE' })
        if (!alarmTypes) return
        let options = alarmTypes

        if (this.packageType === 'PL') options = alarmTypes.filter(item => item.codeVal === 'MAIL')
        this.alarmTypeOptions = options
      } catch (error) {
        this.isAlarmTypes = false
        console.error(error)
        this.tableData = []
        this.$alert(error, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
      } finally {
        this.isAlarmTypes = false
      }
    },
    /**
     * 알람 서버 정보를 가져옵니다.
     */
    async getAlarmInfo () {
      try {
        this.loading = true
        const response = await API.alarm.alarm.getAlarmInfo()
        if (!response) return
        this.setAlarmData(response)
      } catch (error) {
        this.loading = false
        console.error(error)
        this.tableData = []
        this.$alert(error, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
      } finally {
        this.loading = false
      }
    },

    initGrid (grid) {
      this.grid = grid
    },
    /**
     * 그리드 데이터 세팅
     * @param {Array} data 그리드 origin 데이터
     */
    setAlarmData (data) {
      const alarmList = JSON.parse(JSON.stringify(data))

      this.tableData = this.packageType === 'PL'
        ? alarmList.filter(row => row.alarmType === 'MAIL')
        : alarmList

      // this.columnDataMap.updateTime = GridUtils.setColumnDataMap('updateTime', this.loggingServerList, 'date')
      // this.columnDataMap.createTime = GridUtils.setColumnDataMap('createTime', this.loggingServerList, 'date')

      if (this.grid) this.selectedRow = null
    },
    /**
     * [항목추가]/[변경] 클릭시 this.initData에 담아주고,
     * 업데이트 아이템을 세팅해줍니다. (생성/수정 구분을 위함)
     */
    applyUpdateIp (item) {
      console.log('@applyUpdateIp', item)
      if (item) this.originData = JSON.parse(JSON.stringify(item))
      else this.originData = null
      this.updateForm = this.setUpdateItem(item)
      this.newItemModalActive = true
    },
    /**
     * 업데이트 아이템 세팅
     * @return {Object} [변경]을 누르면 체크된 친구가 updateForm에 영향, [항목 추가]를 누르면 새로운 데이터 세팅
     */
    setUpdateItem (data) {
      let newTemp
      if (data) {
        newTemp = cloneDeep(data)
        return newTemp
      } else {
        newTemp = cloneDeep(this.updateEmptyForm)
        return newTemp
      }
    },
    /**
     * [삭제] 버튼 이벤트
     */
    deleteAlarmInfo () {
      if (!this.selectedRow) return

      this.$confirm(this.$t('common.CONFIRM.BASE.032'), '삭제', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        const alarmType = this.selectedRow._data.alarmType
        const result = await API.alarm.alarm.deleteAlarmInfo(alarmType)
        if (result.status === 200) this.$alert(this.$t('common.ALERT.BASE.017')) // 삭제하였습니다.
        else this.$alert(this.$t('common.ALERT.BASE.016')) // 삭제에 실패했습니다.

        this.$nextTick(async function () {
          await this.getAlarmInfo()
        })
      }).catch(() => false)
    },
    /**
     * 항목 생성/수정 모달에서 [확인]을 눌렀을 때 해당 로우 저장
     */
    applyUpdate () {
      if (!this.updateValid()) return

      if (this.originData && !this.otp) {
        // 인증을 먼저 진행해주세요.
        return this.$alert(this.$t('common.ALERT.ACCOUNT.019'))
      }

      this.$confirm(this.$t('common.CONFIRM.BASE.001'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.updateForm.isOtpAuth = this.otp // isOtpAuth 설정
        this.saveUpdatedItem(this.updateForm)
      }).catch(() => {
        return false
      })
    },
    /**
     * 항목 생성/수정 모달에서 [취소] 버튼을 눌렀을 때 발생하는 이벤트
     */
    cancelSave () {
      this.saveUpdatedItem(null)
      this.newItemModalActive = false
    },
    /**
     * 변경 모달 -> [확인]/[취소] -> 저장
     * @param {Object} updateRow emit으로 전달 받은 업데이트 된 템플릿 아이템, 없을 때 (저장 안하고 취소 눌렀을 때) 편집 전 상태로 돌려줍니다.
     */
    async saveUpdatedItem (updateRow) {
      console.log(updateRow)
      if (!updateRow) { // [취소] 눌렀을 때
        if (!this.originData) return
        this.tableData[this.selectedRow.index] = JSON.parse(JSON.stringify(this.originData))
      } else {
        if (updateRow.alarmType === 'PPURIO_AT') {
          updateRow.alarmTemplate.forEach(item => { item.alarmType = 'PPURIO_AT' })
        } else {
          const { alarmTemplate, ...rest } = updateRow
          updateRow = rest
        }
        if (!this.originData) { // 생성
          await this.createAlarmInfo(updateRow)
        } else { // 변경
          await this.updateAlarmInfo(updateRow.alarmType, updateRow)
        }
      }

      this.$nextTick(async function () {
        this.newItemModalActive = false
        await this.getAlarmInfo()
      })
    },
    /**
     * 새로운 알람 서버 생성
     */
    async createAlarmInfo (updateRow) {
      const result = await API.alarm.alarm.createAlarmInfo(updateRow)
      if (result.errorCode && result.errorCode === 'ALM2000') {
        return this.$alert(this.$t('common.ALERT.ALR.004'), { // 해당 알람 타입이<br>이미 존재합니다
          confirmButtonText: this.$t('common.BTN.confirm'),
          dangerouslyUseHTMLString: true
        })
      } else if (result.status !== 200) return this.$alert(this.$t('common.ALERT.BASE.033')) // 등록 실패하였습니다.
      else return this.$alert(this.$t('common.ALERT.BASE.032')) // 등록 성공하였습니다.
    },
    /**
     * 알람 서버 정보 수정
     */
    async updateAlarmInfo (alarmType, alarmInfo) {
      const result = await API.alarm.alarm.updateAlarmInfo(alarmType, alarmInfo)
      if (!result) this.$alert(this.$t('common.ALERT.BASE.020')) // 실패하였습니다.

      if (result.errorCode && result.errorCode === 'ALM2000') {
        return this.$alert(this.$t('common.ALERT.ALR.004'), { // 해당 알람 타입이<br>이미 존재합니다
          confirmButtonText: this.$t('common.BTN.confirm'),
          dangerouslyUseHTMLString: true
        })
      } else return this.$alert(this.$t('common.ALERT.BASE.043')) // 수정되었습니다
    },
    /**
     * 항목 추가/변경 시, validation 체크
     */
    updateValid () {
      if (!this.updateForm.alarmType) {
        this.$alert(this.$t('common.ALERT.ALR.002')) // 알람 타입을 선택해주세요.
        return false
      }
      if (this.updateForm.sendType !== 'DB' && !this.updateForm.host) {
        this.$alert(this.$t('common.ALERT.ALR.003')) // 호스트를 입력해주세요.
        return false
      }
      if (!this.updateForm.user) {
        this.$alert(this.$t('common.ALERT.ORG.012')) // ID를 입력해주세요.
        return false
      }
      if (!this.updateForm.password) {
        this.$alert(this.$t('admin.PREF.enterPw')) // 비밀번호를 입력하세요.
        return false
      }
      return true
    },
    closeModal () {
      this.newItemModalActive = false
      setTimeout(() => {
        this.updateForm = cloneDeep(this.updateEmptyForm)
      }, 500)
    }
  },
  data () {
    return {
      totalResultCnt: 0,
      otp: false,
      otpModalActive: false,
      loading: false,
      isAlarmTypes: false, // 알람 타입 옵션 로딩
      selectedRow: null,
      newItemModalActive: false,
      tableData: [],
      originData: null, // 업데이트 하려는 아이템 원본
      updateEmptyForm: {
        alarmType: '',
        sendType: '', // 전송 타입
        host: '',
        port: '',
        protocol: '',
        senderId: '',
        systemCode: '',
        systemKey: '',
        comment: '',
        alarmTemplate: [
          {
            functionCode: 'OTP_AUTH', // OTP 인증
            alarmType: 'PPURIO_AT',
            apiTemplateCode: '',
            dbTemplateCode: '',
            nationCode: '',
            templateText: ''
          },
          {
            functionCode: 'WORK_DONE', // 작업 완료
            alarmType: 'PPURIO_AT',
            apiTemplateCode: '',
            dbTemplateCode: '',
            nationCode: '',
            templateText: ''
          }
        ]
      },
      updateForm: {},

      // 테이블 정보
      columns: [
        { header: '알람 타입', binding: 'alarmType', width: 150, keyPath: 'admin.PREF.alarmType' },
        { header: '호스트', binding: 'host', width: '*', align: 'left', keyPath: 'admin.PREF.host' },
        { header: '설명', binding: 'comment', width: '*', align: 'left', keyPath: 'admin.PREF.explain' },
        { header: '생성 시간', binding: 'createTime', width: 200, customHtml: true, dataType: 'Date', keyPath: 'admin.PREF.createTime' },
        { header: '수정 시간', binding: 'updateTime', width: 200, customHtml: true, dataType: 'Date', keyPath: 'admin.PREF.modTime' }
      ],
      // 테이블 편집 정보
      alarmTypeOptions: [],
      sendTypeOptions: [
        { label: 'API', value: 'API' },
        { label: 'DB', value: 'DB' }
      ],
      columnDataMap: {
        createTime: null,
        updateTime: null
      }
    }
  }
}
</script>
<style lang="scss">
  .config-alarm-server {
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
        .template-wrapper {
          margin-bottom: 20px;
          .template-inner {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            > span {
              min-width: 65px;
            }
            .nation-code {
              width: 180px;
              margin-left: 10px;
            }
          }
          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }
  }
</style>
