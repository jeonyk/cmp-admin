<template>
  <el-dialog
    :visible="visible"
    :title="title"
    :width="width"
    :top="top"
    @close="closeEvent"
  >
    <!-- 🌸 :: {{ programValues }} <br> -->
    <div v-loading="loading">
      <section class="modal-body add-sw">
        <article class="sw-lists">
          <register-contents
            v-for="(item, idx) in setSwOptions"
            :title="item.title"
            :required="!!item.title"
            :key="item.field"
            :style="{ width: item.width }"
            :class="{ '-version': !item.title }"
          >
            <el-select
              v-if="item.options"
              class="-input"
              :placeholder="item.placeholder"
              v-model="programValues[item.field]"
              :popper-append-to-body="false"
              :disabled="item.disabled"
              @change="selectChange(item.field, idx)"
            >
              <el-option
                v-for="({ field, label, value }, i) in item.options"
                :key="`${field || value}-${i}`"
                :label="label"
                :value="value"
              />
            </el-select>
            <!-- /. 선택박스 -->

            <el-radio-group
              v-else-if="item.radio"
              v-model="programValues[item.field]"
              @change="disable = false"
              :disabled="item.field === 'isDisplay' && disable"
            >
              <el-radio
                v-for="{ label, value } in item.radio"
                :key="label"
                :label="value"
                :disabled="item.field === 'isDisplay' && useExpose && value"
              >
                {{ label }}
              </el-radio>
            </el-radio-group>
            <!-- /. 라디오버튼 -->

            <el-input
              v-else
              v-model="programValues[item.field]"
              :placeholder="item.placeholder"
              class="-input"
            />
          </register-contents>
          <!-- /. SW 라이선스, 지원 OS, OS bits, SW 명, SW 버전 -->

          <register-contents
            :title="$v('라이선스')"
            required
          >
            <!-- 라이선스 추가 모달 -->
            <add-license-modal
              v-if="licenseAddable"
              :data="swList"
              @save="values => swList = values"
            />

            <p
              class="select-first"
              v-else
            >
              {{ $v('❊ 운영체제 구분, 운영체제, 운영체제 버전을 먼저 선택해주세요') }}
            </p>
          </register-contents>
          <!-- /. 라이선스 -->
        </article>

        <register-contents :title="$v('설명')">
          <el-input
            :placeholder="$t('service.INSTALL.ALERT.036')"
            v-model="programValues.desc"
            type="textarea"
            :rows="5"
            resize="none"
            @input="testInput"
          />
        </register-contents>
      <!-- /. SW 설명 -->
      </section>

      <div class="modal-button-area">
        <button
          class="button"
          @click="closeEvent"
        >
          <!-- 취소 -->
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          class="button"
          type="is-primary"
          @click="actionApply(type)"
        >
          <!-- 추가 / 변경 -->
          {{ actionApplyButton(type) }}
        </button>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import API, { AddLicenseModal } from '@sd-fe/cmp-core'
import LicenseUtil from '@/components/MeteringLicense/LicenseUtil.script'

export default {
  name: 'InstallProgramVersionUpdate',
  components: {
    'add-license-modal': AddLicenseModal
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: undefined
    },
    width: {
      type: String,
      default: 'auto'
    },
    top: {
      type: String,
      default: '50px'
    },
    type: {
      type: String,
      default: 'add',
      validator (value) {
        return ['add', 'update', 'versionAdd', 'versionUpdate'].includes(value)
      }
    },
    data: {
      type: Object,
      default: () => null
    }
  },
  mixins: [LicenseUtil],
  computed: {
    /**
     * [사용자 노출여부 disable 여부 추가
     */
    useExpose () {
      const { installType } = this.programValues
      const condition1 = installType === undefined || installType === 'SCRIPT'

      // 버전 [추가]
      if (!this.data) return condition1

      //  버전 [변경]
      let condition2 = false // 기본 조건으로 비교

      const { scriptList } = this.data
      const passed = scriptList.some(({ status }) => status === 'SUCCESS') // 시뮬레이션 성공 여부
      if (!passed) condition2 = true

      return condition1 && condition2
    }
  },
  watch: {
    async visible (visible) {
      if (visible) {
        console.clear()
        console.log('%c Edit Data :: ', 'color: pink', this.data)
        this.loading = true

        this.setSwOptions = this.setaddProgramOptions
        this.swList = []

        // 팝업창 오픈후 (400ms) 데이터 로드
        setTimeout(async () => {
          const optTypes = {
            versionAdd: () => this.setVersionAddOptions(),
            versionUpdate: () => this.setVersionUpdateOptions(this.data)
          }

          optTypes[this.type]()
        }, 400)
      }
    },
    programValues: { // 🌸 디버깅용
      deep: true,
      handler (values) {
        // console.log(values)
        this.licenseAddable = this.setLicenseAddable()
      }
    }
  },
  methods: {

    /**
     * [버전 추가] 모달 open시 [운영체제 > 구분] 옵션 세팅 (V3
     */
    async setVersionAddOptions () {
      const osSystem = await this.setCodeTree()
      this.setSwOptions[3].options = osSystem // [운영체제 구분] 옵션 목록

      this.loading = false
    },

    /**
     * [SW 버전, 지원 OS] 옵션 세팅
     */
    async setVersionUpdateOptions (data = this.data) {
      console.log('%c Version Edit Data :: ', 'color: yellow', data)

      const osSystem = await this.setCodeTree()
      this.setSwOptions[3].options = osSystem // [운영체제 구분] 옵션 목록

      this.programValues = { ...data, osBits: data.bit }
      this.swList = [...data.swList]

      // 자동으로 하단 옵션 세팅해주기
      const iterate = [{ key: 'osSystem', opt: 3 }, { key: 'osType', opt: 4 }]

      for (const { key, opt } of iterate) {
        const value = this.setSwOptions[opt].options.filter(option => option.value === this.programValues[key])[0]
        if (!value || value.length === 0) break

        this.setSwOptions[opt + 1].options = value.children || [] // [운영체제, 운영체제 버전] option 세팅
      }

      this.loading = false
    },

    // ==========================
    // ==========================
    // ==========================

    /**
     * 셀렉트박스 변경 이벤트
     * @param { String } field 셀렉트박스가 가지고있는 [field]
     * @param { Number } idx 셀렉트박스의 idx
     */
    selectChange (field, idx) {
      this.setChainedPlaceholder()

      const values = this.programValues[field]

      if (values !== undefined) {
        const actions = {
          // [운영체제 구분] 이 선택된 경우
          osSystem: () => {
            // 먼저 관련 옵션 / 값 리셋시키기
            this.setSwOptions[4].options = [] // 운영체제 목록
            this.setSwOptions[5].options = [] // 운영체제 버전 목록
            this.swList = [] // 라이선스 목록

            this.programValues.osType = undefined // [운영체제]
            this.programValues.osVersion = undefined // [운영체제버전]
            this.programValues.swIdx = [] // [라이선스]

            const value = this.setSwOptions[3].options.filter(option => option.value === values)[0]
            if (value.length === 0) return

            this.setSwOptions[4].options = value.children || [] // 운영체제 option 세팅

            this.licenseAddable = this.setLicenseAddable()
            this.$forceUpdate()
          },

          // [운영체제] 가 선택된 경우
          osType: () => {
            this.setSwOptions[5].options = [] // 운영체제 버전 목록
            this.swList = [] // 라이선스 목록

            this.programValues.osVersion = undefined // [운영체제버전]
            this.programValues.swIdx = [] // [라이선스]

            const value = this.setSwOptions[4].options.filter(option => option.value === values)[0]
            if (value.length === 0) return

            this.setSwOptions[5].options = value.children || [] // 운영체제 버전 option 세팅

            this.licenseAddable = this.setLicenseAddable()
            this.$forceUpdate()
          },

          // [운영체제 버전] 이 선택된 경우
          osVersion: () => {
            this.licenseAddable = this.setLicenseAddable()
            this.$forceUpdate()
          }
        }

        if (actions[field] !== undefined) return actions[field]()
      }
    },

    /**
     * [버전 추가] 시 Validation 확인
     * @param { Object } values 설정한 데이터
     */
    addValidation (values = this.programValues) {
      const typeCondition = values.installType === 'MANUAL' ? (values.isDisplay !== undefined) : true // 사용자 노출여부 (필수/선택) 조건

      const conditions = [
        { condition: values.version, message: this.$v('설치프로그램 버전을 입력해주세요.') },
        { condition: values.installType, message: this.$v('설치프로그램 관리를 선택해주세요.') },
        { condition: typeCondition, message: this.$v('사용자 노출여부를 선택해주세요.') },
        { condition: values.osType, message: this.$v('운영체제 구분을 선택해주세요.') },
        { condition: values.osSystem, message: this.$v('운영체제를 선택해주세요.') },
        { condition: values.osVersion, message: this.$v('운영체제 버전을 선택해주세요.') },
        { condition: values.osBits, message: this.$v('OS Bits 를 선택해주세요.') },
        { condition: this.swList.length, message: this.$v('라이선스를 선택해주세요.') }
      ]

      return conditions.every(cond => {
        if (!cond.condition) this.$alert(cond.message)
        return cond.condition
      })
    },

    /**
     * [버전 추가] 추가시 발생하는 이벤트
     * @param { Object } values 설정한 데이터
     * @return { Function } base64 로 변환한 File 과 값을 emit 합니다.
     */
    addSw (values = this.programValues) {
      const validator = this.addValidation(values)
      if (!validator) return

      values.swList = this.swList.map(({ swIdx }) => ({ swIdx }))

      // 내보내기
      return this.$emit('update', values)
    },

    /**
     * [버전 변경] 시 발생하는 이벤트 (V3)
     * @param { Object } values 설정한 데이터
     * @return { Function } base64 로 변환한 File 과 값을 emit 합니다.
     */
    updateVersion (values = this.programValues) {
      const validator = this.addValidation(values)
      if (!validator) return

      const swList = this.swList.map(({ swIdx }) => ({ swIdx }))
      const payload = { ...values, swList }

      // 저장하기 위해선 해당 [설치프로그램] 의 id 를 softwareId 키로 필요로합니다.
      values.softwareId = this.$route.params.idx

      // 내보내기
      return this.$emit('update', payload)
    },

    // -------------------------------------------------------------
    // ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ [공용] ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○
    // -------------------------------------------------------------

    /**
     * 설치프로그램에 등록되어있는 코드목록 세팅 (V3) 🟧🟧🟧🟧🟧
     */
    async getCodeList (params) {
      try {
        const response = await API.config.getCodeList(params)
        return response
      } catch (error) {
        console.error('@@ getCodeList: ', error)
      }
    },

    /**
     * 코드 트리 만들기
     * 나중에 재귀로 리팩토링 한번 할게요...
     */
    async setCodeTree () {
      const osSystem = await this.getCodeList({ codeType: 'OS_SYSTEM' })
      const osType = await this.getCodeList({ codeType: 'OS_TYPE' })
      const osVersion = await this.getCodeList({ codeType: 'OS_VERSION' })
      const osBits = await this.getCodeList({ codeType: 'OS_BIT' })

      const findOsBitContent = this.setSwOptions.find(opt => opt.field === 'osBits')
      if (findOsBitContent) findOsBitContent.options = osBits.map(osBit => ({ label: osBit.codeName, value: osBit.codeVal }))

      // console.log(osSystem, osType, osVersion)

      // osVersion 세팅
      const osVersions = {}
      for (const { upperCodeIdx, codeVal, codeName } of osVersion) {
        const already = osVersions[upperCodeIdx]
        const option = { label: codeName, value: codeVal }

        if (already) osVersions[upperCodeIdx].push(option)
        else osVersions[upperCodeIdx] = [option]
      }

      // osTypes 세팅
      const osTypes = {}
      for (const { upperCodeIdx, codeIdx, codeVal, codeName } of osType) {
        const already = osTypes[upperCodeIdx]
        const option = { label: codeName, value: codeVal, children: osVersions[codeIdx] }

        if (already) osTypes[upperCodeIdx].push(option)
        else osTypes[upperCodeIdx] = [option]
      }

      // osSystems 세팅
      const osSystems = {}
      for (const { codeIdx, codeVal, codeName } of osSystem) {
        const already = osSystems[codeVal]
        const option = { label: codeName, value: codeVal, children: osTypes[codeIdx] }

        if (already) osSystems[codeIdx] = option
        else osSystems[codeIdx] = option
      }

      const result = []
      for (const key in osSystems) result.push(osSystems[key])

      return result
    },

    /**
     * [추가 / 변경] 버튼 클릭시 변경 이벤트
     * @param { String } type
     */
    actionApply (type = this.type) {
      // 추가 / 수정 UI 다르게 설정
      const action = {
        versionAdd: () => this.addSw(this.programValues), // [설치프로그램 상세] > [버전 추가] > [추가]
        versionUpdate: () => this.updateVersion(this.programValues) // [설치프로그램 상세] > [버전 목록] > [추가]
      }

      return action[type]()
    },

    /**
     * 선택된 value 가 있/없는경우에 맞추어 placeholder 텍스트를 변경합니다
     */
    setChainedPlaceholder () {
      // chain = true 설정된 경우는 placeholder 변경
      const fields = this.setSwOptions.filter(opt => opt.chain).map(opt => opt.field)
      const values = this.programValues

      let isFirst = true
      for (const field of fields) {
        // console.log(`${field} : ${values[field]}`)

        // 해당 키의 값이 없는지 확인
        if (values[field] === undefined) {
          this.setSwOptions.forEach((opt, idx) => {
            if (opt.field === field) {
              // 맨 앞의 내용이 선택되어있는지 확인하고, 내용 없으면 ? '~를 먼저 선택해주세요' 표기
              opt.placeholder = isFirst ? (
                // `${opt.title} 를 선택해주세요.`
                this.$t('service.INSTALL.PLACEHOLDER.003', { title: opt.title })
              ) : (
                // `${this.setSwOptions[idx - 1].title} 를 먼저 선택해주세요.`
                this.$t('service.INSTALL.PLACEHOLDER.004', { title: this.setSwOptions[idx - 1].title })
              )

              isFirst = false
              return false
            }
          })
        }
      }
    },
    /**
     * [취소/닫기] 버튼 클릭시 이벤트
     */
    closeEvent () {
      this.programValues = {}
      this.setSwOptions.forEach((option) => {
        if (option.field !== 'osBits' && option.options) option.options = []
      })

      return this.$emit('close')
    },

    /**
     * [SW 설명] 변경될 때마다 변경되는 이벤트
     */
    testInput (value) {
      this.programValues.desc = value
      if (this.data !== null) this.$forceUpdate()
    }
  },
  data () {
    return {
      disable: true,
      loading: false,
      setSwOptions: [],
      setaddProgramOptions: [
        {
          title: this.$v('설치프로그램 버전'),
          field: 'version',
          placeholder: this.$v('설치프로그램 버전을 입력해주세요')
        },
        {
          title: this.$v('설치프로그램 관리'),
          field: 'installType',
          radio: [
            { label: 'Script', value: 'SCRIPT' },
            { label: 'Manual', value: 'MANUAL' }
          ]
        },
        {
          title: this.$v('사용자 노출여부'),
          field: 'isDisplay',
          radio: [
            { label: '노출', value: true },
            { label: '비노출', value: false }
          ]
        },
        {
          title: this.$v('운영체제 구분'),
          field: 'osSystem',
          placeholder: this.$v('운영체제 구분을 선택해주세요'),
          options: []
        },
        {
          title: this.$v('운영체제'),
          field: 'osType',
          placeholder: this.$v('운영체제를 선택해주세요'),
          chain: true,
          options: []
        },
        {
          title: this.$v('운영체제 버전'),
          field: 'osVersion',
          placeholder: this.$v('운영체제 버전을 선택해주세요'),
          chain: true,
          options: []
        },
        {
          title: 'OS bits',
          field: 'osBits',
          placeholder: this.$v('OS Bits 를 선택해주세요'),
          // options: [{ label: 'X32', value: 32 }, { label: 'X64', value: 64 }]
          options: []
        }
      ],
      programValues: {},
      licenseAddable: false,
      actionApplyButton (type) { // 변경/추가 모달 버튼 설정
        return {
          versionAdd: this.$t('common.BTN.add'), // [설치프로그램 상세] > [버전 추가]
          versionUpdate: this.$t('common.BTN.change') // [설치프로그램 상세] > [버전 목록] > [수정]
        }[type]
      },
      /**
       * [라이선스] 영역 노출여부 세팅
       */
      setLicenseAddable () {
        const { osType, osSystem, osVersion } = this.programValues
        return !!(osType && osSystem && osVersion)
      },
      swList: []
    }
  }
}
</script>

<style lang="scss" scoped>
.add-sw {
  height: 500px;
  overflow: auto;

  .tags {
    margin-bottom: 15px;
  }

  .select-first {
    font-size: 13px;
    color: $input-placeholder;
  }

  .-input {
    // width: 300px;
    display: block;
  }

  .sw-lists {
    // margin-top: -20px;
    // display: grid;
    // grid-template-columns: repeat(3, 1fr);
    column-gap: 15px;
    row-gap: 12px;
    position: relative;

    .-version {
      position: absolute;
      bottom: 0;
      right: 315px;

      .title {
        display: block;
        margin-top: 40px;
      }
    }
  }

  .division {
    margin-top: $gap-s;
  }
}
</style>
