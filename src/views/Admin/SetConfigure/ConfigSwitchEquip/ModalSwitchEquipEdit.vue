<template>
  <div class="modal-switeq-edit">
    <section class="register-top-form">
      <h3 class="form-sub-title">
        {{ $v('기본 정보') }}
      </h3>
      <register-contents
        required
        :title="$v('수기관리여부(미지원장비)')"
        class="modal-contents--first"
      >
        <el-checkbox
          :disabled="modalStatus.type === 'UPDATE'||isSuccessTest"
          v-model="newFormData.isManualManagement"
        />
      </register-contents>
      <register-contents
        :title="$v('장비 타입')"
        required
      >
        <el-select
          v-model="newFormData.equipType"
          :popper-append-to-body="false"
          :placeholder="$v('장비 타입을 선택해주세요.')"
          :disabled="modalStatus.type === 'UPDATE'||isSuccessTest"
        >
          <el-option
            v-for="option in switchTypeOptions"
            :key="option.codeName"
            :label="option.label"
            :value="option.codeName"
          />
        </el-select>
      </register-contents>
      <register-contents
        required
        :title="$v('네트워크 장비명')"
      >
        <el-input
          v-model="newFormData.netName"
          :disabled="modalStatus.type === 'UPDATE'"
          :placeholder="$v('네트워크명을 입력해주세요.')"
        />
      </register-contents>
      <register-contents
        :title="$v('네트워크 카테고리')"
        required
      >
        <network-category-tree-selection-btn
          :init-data="selectedCateList"
          :cate-limit="10"
          @save="handleSaveNctSelected"
        />
      </register-contents>
    </section>

    <h3
      v-if="!(modalStatus.type==='UPDATE' && newFormData.isManualManagement)"
      class="form-sub-title"
      :class="{'form-sub-title--is-disabled': newFormData.isManualManagement}"
    >
      {{ $v('연결 정보') }}
    </h3>
    <section class="link-info-form">
      <register-connect-test-form
        v-if="!(modalStatus.type==='UPDATE' && newFormData.isManualManagement)"
        :disabled="newFormData.isManualManagement"
        :otp-success="isSuccessOtp"
        :modal-status="modalStatus"
        :require-data="connectTestData"
        :optional-data="{equipType : newFormData.equipType}"
        :test-callback-api="testCallbackApi"
        @connect="handleConnectTest"
        @openModalOTP="handleOpenModalOTP"
      >
        <template #otpTest>
          <otp-modal
            api-call-component-name="ConfigNetworkEquip"
            required-api
            :callback-api="callbackApi"
            :active="isOpenOTP"
            :network-idx="newFormData.netIdx"
            @close="isOpenOTP = false"
            @validated-otp="validatedOTP"
          />
        </template>
      </register-connect-test-form>
      <!-- 테스트 연결 후 - 정보 폼 -->
      <section
        v-if="(modalStatus.type==='UPDATE' && !newFormData.isManualManagement) || (modalStatus.type==='CREATE' && isSuccessTest)"
        class="modal-add-form"
      >
        <span
          v-if="!isSuccessTest"
          class="block-before-test"
        >
          <!-- 테스트를 먼저 진행해주세요. -->
          {{ $t('admin.PREF.proceedTest') }}
        </span>
        <register-contents
          required
          title="API_URL1"
        >
          <el-input
            v-model="newFormData.apiUrl1"
            :placeholder="'API_URL1'"
          />
        </register-contents>
        <register-contents
          title="API_URL2"
        >
          <el-input
            v-model="newFormData.apiUrl2"
            :placeholder="'API_URL2'"
          />
        </register-contents>
        <register-contents
          required
          :title="$v('동기화 주기')"
        >
          <el-input-number
            v-model="newFormData.intervalMin"
          />
          분
        </register-contents>
        <register-contents
          required
          title="Use source IP"
        >
          <el-radio-group v-model="newFormData.useSourceIp">
            <el-radio :label="true">
              ON
            </el-radio>
            <el-radio :label="false">
              OFF
            </el-radio>
          </el-radio-group>
        </register-contents>
        <register-contents
          :title="$v('설명')"
        >
          <el-input
            v-model="newFormData.comment"
            type="textarea"
            :placeholder="$v('설명을 입력하세요.')"
          />
        </register-contents>
      </section>
    </section>
    <common-modal-footer
      @confirm="handleConfirmEdit"
      @close="handleCloseModal"
    />
  </div>
</template>

<script>
import API, { NetworkCategoryTreeSelectionBtn, CommonModalFooter } from '@sd-fe/cmp-core'
import RegisterConnectTestForm from './RegisterConnectTestForm.vue'
import OtpModal from '@/components/Modal/OTPModal/OTPModal.vue'
import { cloneDeep } from 'lodash'
export default {
  components: {
    NetworkCategoryTreeSelectionBtn,
    CommonModalFooter,
    RegisterConnectTestForm,
    OtpModal
  },
  props: {
    modalStatus: {
      type: Object,
      default () {
        return {
          type: 'CREATE',
          isOpen: false
        }
      }
    },
    selectedRow: {
      type: Object,
      default () {
        return null
      }
    }
  },
  computed: {
    connectTestData () {
      const { id, password, masterUrl } = this.newFormData
      return {
        id, password, masterUrl
      }
    }
  },
  watch: {
    'modalStatus.isOpen': {
      handler (val) {
        if (val === true && this.modalStatus.type === 'UPDATE') {
          this.newFormData = cloneDeep(this.selectedRow)
          this.selectedCateList = this.selectedRow.categories.map((el) => ({ ...el, cateIdx: el.ipCategoryIdx }))
          this.newFormData.intervalMin = Math.ceil(this.selectedRow.intervalSec / 60)
          console.log('🚀 ~ file: ModalSwitchEquipEdit.vue:190 ~ handler ~ Math.ceil(this.selectedRow.intervalSec / 60):', Math.ceil(this.selectedRow.intervalSec / 60))
          this.newFormData.hashPassword = this.newFormData.password
          this.newFormData.password = null
        } else {
          this.initFormData()
        }
      }
    },
    selectedCateList: {
      deep: true,
      handler (val) {
        if (val && this.modalStatus.type) {
          this.newFormData.categories =
           val.map((el) => ({ ipCategoryIdx: el.cateIdx }))
        }
      }
    }
  },
  async created () {
    console.log('initFormData')
    this.initFormData()
    if (this.modalStatus.type === 'UPDATE') {
      this.newFormData = cloneDeep(this.selectedRow)
      this.selectedCateList = this.selectedRow.categories.map((el) => ({ ...el, cateIdx: el.ipCategoryIdx }))
      this.newFormData.intervalMin = Math.ceil(this.selectedRow.intervalSec / 60)
      console.log('🚀 ~ file: ModalSwitchEquipEdit.vue:190 ~ handler ~ Math.ceil(this.selectedRow.intervalSec / 60):', Math.ceil(this.selectedRow.intervalSec / 60))
      this.newFormData.hashPassword = this.newFormData.password
      this.newFormData.password = null
    }
    this.switchTypeOptions = await this.getCodeList('SWITCH_CLASS')
  },
  methods: {
    /** EVENT_HANDLER (카테고리 저장) 네트워크 모달에 '확인' 버튼 클릭시 동작
     * 선택되어진 카테고리를 변수에 동기시킵니다.
    */
    handleSaveNctSelected (data) {
      this.selectedCateList = data
    },
    handleOpenModalOTP () {
      this.isOpenOTP = true
    },
    // 폼을 초기화 합니다.
    initFormData () {
      this.newFormData = cloneDeep(this.initialData)
    },
    /** API_HANDLER  (GET) 코드 조회 (장비 타입 옵션 조회)
     */
    // TODO 여기에 로딩을 얼었음 AS-IS , 에러처리필요
    async getCodeList (param) {
      if (!param) return []
      try {
        const response = await API.config.getCodeList({ codeType: param })
        if (!response) return
        return response
      } catch (error) {
        this.$alert('장비 타입을 불러올 수 없습니다. <br /> 관리자에게 문의해주세요.', { dangerouslyUseHTMLString: true })
      }
    },

    validatedOTP (data) {
      this.otp = true
      this.isOpenOTP = false
      this.newFormData.password = data.password
      if (this.modalStatus.type === 'UPDATE') { this.isSuccessOtp = true }
      // this.newFormData.isManualManagement = data.isManualManagement

      this.$nextTick(() => {
        // this.$refs.otpPasswordInput.passwordVisible = true
      })
    },
    // OTP 콜백 API
    callbackApi: API.network.getCertEquipNetworks,
    // TEST 콜백 API
    testCallbackApi: API.network.checkEquipLogin,

    /** EVENT_HANDLER  연결 성공 시 */
    handleConnectTest (connectTest) {
      console.log(connectTest.isSuccess)
      this.isSuccessTest = connectTest.isSuccess
      this.newFormData = {
        ...this.newFormData, ...connectTest.data
      }
    },
    /**
     * 변경 모달 -> [확인]/[취소] -> 저장
     * @param {Object} payload emit으로 전달 받은 업데이트 된 템플릿 아이템, 없을 때 (저장 안하고 취소 눌렀을 때) 편집 전 상태로 돌려줍니다.
     */
    async saveUpdatedItem (updateForm) {
      try {
        let payload = null
        const { isManualManagement, netName, equipType, categories, id, password, masterUrl, apiUrl1, intervalMin, useSourceIp, netType } = updateForm
        if (isManualManagement) {
          payload = { isManualManagement, netName, categories, equipType }
        } else {
          payload = { isManualManagement, netName, categories, equipType, id, password, masterUrl, apiUrl1, intervalMin, useSourceIp, netType }
        }

        const testValid = await this.validatateForm(payload)
        if (intervalMin > 0) {
          updateForm.intervalSec = intervalMin * 60
        }

        if (!testValid.isSuccess) {
          this.$alert(testValid?.failureMessage)
          return false
        }
        let isSuccess = false
        let successMsg = ''
        const isConfirmed = await this.$confirm(this.$t('common.CONFIRM.BASE.001'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          cancelButtonText: this.$t('common.BTN.cancel')
        }).then(() => true).catch(() => false)

        if (isConfirmed) {
          if (this.modalStatus.type === 'CREATE') { // 아이템 생성일 때
            isSuccess = await this.createEquipNetwork(updateForm)
            successMsg = this.$t('common.ALERT.BASE.032') // 성공적으로 등록되었습니다.
          } else { // 아이템 변경일 때
            isSuccess = await this.updateEquipNetwork({ ...updateForm, netIdx: this.selectedRow.netIdx })
            successMsg = this.$t('common.ALERT.BASE.019')// 성공적으로 변경되었습니다.
          }
          if (isSuccess) {
            this.$alert(successMsg)
            this.$emit('confirm')
          }
        }
      } catch (error) {
        let errMsg = ''
        const ERR_CODE = error?.response?.data?.code

        switch (ERR_CODE) {
          case 'NET1003': errMsg = '네트워크 장비명이 이미 존재합니다.'; break
          case 'NET1004': errMsg = '동일한 관계사-망구분-서비스-switchType 인<br/>항목이 존재합니다.'; break
          default: errMsg = '실패하였습니다.<br>관리자 문의 부탁드립니다.'
        }

        this.$alert(`${this.modalStatus.type === 'CREATE' ? this.$v('생성') : this.$v('변경')} ${this.$v(errMsg)}`, { dangerouslyUseHTMLString: true })
      }
    },
    handleCloseModal () {
      console.log('cancel')
      this.$emit('cancel')
    },

    // API_HANDLER  (PUT) 네트워크 장비 수정
    async updateEquipNetwork (payload) {
      try {
        await API.network.updateEquipNetwork(payload)
        return true
      } catch (error) {
        console.error(error)
        throw error
      }
    },

    // API_HANDLER (POST) 네트워크 장비 생성
    async createEquipNetwork (payload) {
      try {
        await API.network.createEquipNetwork(payload)
        return true
      } catch (err) {
        console.error(err)
        throw err
      }
    },

    /**
     * EVENT_HANDLER (저장) 항목 생성/수정 모달에서 [확인]을 눌렀을 때 해당 로우 저장
     */
    async handleConfirmEdit () {
      this.saveUpdatedItem(this.newFormData)
    },

    /** [페이로드 벨리데이션]
     * 값이 없거나 올바른지 확인하는 함수 입니다.
     * 페이로드 값을 순환하면서 입력하지 않은 값이 있으면 isSuccess: flase와 메세지를 반환합니다.
     ** 'Api Url 2', '설명'은 필수 값이 아닙니다. */
    async validatateForm (payload) {
      let result = null
      const valLabel = {
        isManualManagement: '수기관리여부(미지원장비)',
        netName: '네트워크 장비명',
        categories: '네트워크 카테고리',
        id: '아이디',
        password: '비밀번호',
        equipType: '장비 타입', // 연동설정에서도 쓰임
        masterUrl: 'Master URL',
        apiUrl1: 'API URL1',
        intervalMin: '동기화 주기',
        useSourceIp: 'Use Source IP'
      }

      for (const key in payload) {
        if (payload[key] === null || payload[key] === undefined ||
         payload[key].length === 0 || payload[key] === 0 || payload[key] === '') {
          if (key === 'apiUrl2' || key === 'comment') break
          const msg = this.$v(valLabel[key]) + this.$v('이(가) 올바르지 않습니다.')
          result = { isSuccess: false, failureMessage: msg }
          break
        }
      }

      if (result === null) {
        result = { isSuccess: true }
      }
      return result
    }

  },

  data () {
    return {
      isOpenOTP: false,
      isSuccessTest: false,
      isSuccessOtp: false,
      switchTypeOptions: [],
      selectedCateList: [],
      // form data
      newFormData: null,
      initialData: {
        isManualManagement: false,
        equipType: null, // 연동설정에서도 쓰임
        netName: null,
        categories: [],
        id: null,
        password: null,
        netIdx: undefined,
        netType: 'SWITCH',
        masterUrl: null,
        apiUrl1: null,
        apiUrl2: null,
        intervalSec: null,
        intervalMin: null,
        useSourceIp: null,
        comment: null
      }
    }
  }
}
</script>

<style lang ="scss" scoped>
.modal-add-form {
  position: relative;
  overflow-y: scroll;
  max-height: 500px;
}
.modal-contents--first {
  border-top:1px solid #2A2D44;
}
.form-sub-title {
  margin-bottom: 10px;
  font-weight: 500;
  font-size: 16px;
  &--is-disabled {
    color: $gray;
  }
}
.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  max-width: 460px;
}
.network-category-btn {
  &.buttonMarginBtm {
    margin-bottom: 10px;
  }
}
.register-top-form {
  margin-bottom: 20px;
}
.link-info-form {
  position: relative;
  max-height: 400px;
  overflow-y: scroll;
}
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
</style>
