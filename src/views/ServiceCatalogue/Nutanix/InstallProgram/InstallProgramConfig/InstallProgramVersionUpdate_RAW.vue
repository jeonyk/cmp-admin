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
                v-for="(option, i) in item.options"
                :key="`${option.field || option.value}-${i}`"
                :label="option.label"
                :value="option.value"
              />
            </el-select>

            <el-input
              v-else
              class="-input"
              v-model="programValues[item.field]"
            />
          </register-contents>
          <!-- /. SW 라이선스, 지원 OS, OS bits, SW 명, SW 버전 -->

          <register-contents
            :title="$v('라이선스')"
            required
          >
            <div>
              <div class="tags">
                <el-tag closable>
                  {라이선스명}{버전}
                </el-tag>
                <el-tag closable>
                  {라이선스명}{버전}
                </el-tag>
                <el-tag closable>
                  {라이선스명}{버전}
                </el-tag>
              </div>

              <filtering-component
                :data="filterData"
                :use-title="false"
              >
                <!-- v-model="searchText" -->
                <!-- @search="val => filtering(val)" -->
                <search-component
                  class="search-area"
                  :placeholder="$v('라이선스명을 입력하세요')"
                />
              </filtering-component>

              <cmp-grid
                style="width: 790px;"
                v-if="true"
                :item-source="setSwOptions"
                :columns="licenseColumn"
                :paging-size="3"
                header-checkbox
                @checkedRowsData="checkedLicense"
                :changing-page-reset="false"
              />
              <p
                class="select-first"
                v-else
              >
                운영체제 유형, 운영체제, 운영체제 버전을 먼저 선택해주세요
              </p>
            </div>
          </register-contents>
          <!-- /. 라이선스 선택 -->
        </article>

        <register-contents :title="$v('설명')">
          <el-input
            :placeholder="$t('service.INSTALL.ALERT.036')"
            v-model="programValues.desc"
            type="textarea"
            :rows="5"
            resize="none"
            @input="testInput"
            :disabled="disableDesc"
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
import API from '@sd-fe/cmp-core'
import { cloneDeep } from 'lodash'

export default {
  name: 'InstallProgramVersionUpdate',
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
  watch: {
    async visible (visible) {
      if (visible) {
        this.loading = true

        // 추가 / 수정 UI 다르게 설정
        const types = {
          add: this.setaddProgramOptions, // [설치프로그램 목록] > [SW 추가]
          update: this.setUpdateProgramOptions, // [설치프로그램 목록] > [{SW} 변경]
          versionAdd: this.setaddProgramOptions, // [설치프로그램 상세] > [SW 버전 추가]
          versionUpdate: [...this.setaddProgramOptions, this.scriptOption] // [설치프로그램 상세] > [버전 목록] > [수정]
        }

        this.setSwOptions = types[this.type]
        this.setChainedPlaceholder()

        // 팝업창 오픈후 (400ms) 데이터 로드
        setTimeout(async () => {
          const optTypes = {
            add: () => this.setAddOptions(),
            update: () => this.setUpdateOptions(this.data),
            versionAdd: () => this.setDetailAddOptions(),
            versionUpdate: () => this.setVersionUpdateOptions(this.data)
          }

          // console.log(this.type)

          optTypes[this.type]()
        }, 400)
      }
    },
    programValues: { // 🌸 디버깅용
      deep: true,
      handler (value) {
        // console.log(value)
      }
    }
  },
  methods: {

    // -------------------------------------------------------------
    // ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ [설치프로그램 목록] ○ ○ ○ ○ ○ ○ ○ ○ ○ ○
    // -------------------------------------------------------------

    // ==========================
    // ======== [SW 추가] ========
    // ==========================

    /**
     * [SW 라이선스, 지원 OS] 옵션 세팅
     */
    async setAddOptions () {
      this.osTypes = await this.getOsTypes()
      const licenses = await this.getAddableSwList()

      this.setSwOptions[0].options = licenses // [SW 라이센스] 옵션 목록

      this.loading = false
    },

    /**
     * [SW 라이선스] 옵션 목록 세팅
     */
    async getAddableSwList () {
      try {
        const response = await API.sw.getAddableSwList({ category: 'installation' })

        const object = {}
        response.forEach(({ name, version, osType, swIdx, ...sw }, idx) => {
          const swName = `${name} _ ${version}` // [SW 라이선스] 옵션 명

          if (object[swName] !== undefined) object[swName].osTypes.push({ os: osType, swIdx })
          else object[swName] = { label: swName, value: swName, version, osTypes: [{ os: osType, swIdx }] }
        })

        const result = []
        for (const key in object) result.push(object[key])

        return result
      } catch (error) {
        console.error('@@ getAddableSwList: ', error)
        return []
      }
    },
    /**
     * [SW 추가] 인 경우, Select Box 변경 이벤트
     * @param { String } field 셀렉트박스가 가지고있는 [field]
     * @param { Number } idx 셀렉트박스의 idx
     */
    selectChangeAdd (field, idx) {
      const values = this.programValues[field]

      if (values !== undefined) {
        const actions = {
          // [SW 라이선스] 가 선택된 경우
          swLicense: () => {
            // 먼저 관련 옵션 / 값 리셋시키기
            this.setSwOptions[1].options = []
            this.setSwOptions[2].options = []
            this.programValues.supportOs = undefined // [지원 OS]
            this.programValues.osBits = undefined // [OS Bits]
            this.programValues.swIdx = undefined // [swIdx]

            const value = this.setSwOptions[0].options.filter(option => option.value === values)[0]
            if (value.length === 0) return

            this.programValues.swName = value.value.split(' _ ')[0] // [SW 명]
            this.programValues.swVersion = value.version // [SW 버전]

            this.setSwOptions[1].options = this.findOsType(value.osTypes) // [지원 OS] 옵션 목록 세팅
          },

          // [지원 OS] 가 선택된 경우
          supportOs: () => {
            // 먼저 관련 옵션 / 값 리셋시키기
            this.setSwOptions[2].options = []
            this.programValues.osBits = undefined // [OS Bits]
            this.programValues.swIdx = undefined // [swIdx]

            const value = this.setSwOptions[1].options.filter(option => option.value === values)[0]
            if (value.length === 0) return

            this.programValues.swIdx = value.swIdx // [swIdx]

            // [OS bits] 옵션 목록 세팅
            const osBits = [{ label: '64bits', value: 64 }, { label: '32bits', value: 32 }]
            this.setSwOptions[2].options = osBits
          }
        }

        if (actions[field] !== undefined) return actions[field]()
      }

      this.$forceUpdate()
    },

    /**
     * [SW 추가] 시 Validation 확인
     * @param { Object } values 설정한 데이터
     */
    addValidation (values = this.programValues) {
      const conditions = [
        { condition: values.swLicense, message: this.$t('service.INSTALL.ALERT.008') }, // SW 라이선스를 입력해주세요
        { condition: values.supportOs, message: this.$t('service.INSTALL.ALERT.009') }, // 지원 OS 를 입력해주세요
        { condition: values.osBits, message: this.$t('service.INSTALL.ALERT.010') } // OS Bits 를 입력해주세요
      ]

      return conditions.every(cond => {
        if (!cond.condition) this.$alert(cond.message)
        return cond.condition
      })
    },

    /**
     * [SW 추가] 추가시 발생하는 이벤트
     * @param { Object } values 설정한 데이터
     * @return { Function } base64 로 변환한 File 과 값을 emit 합니다.
     */
    addSw (values = this.programValues) {
      const validator = this.addValidation(values)
      if (!validator) return

      // 내보내기
      return this.saveValueWithBase64File(values, this.fileList)
    },

    // ==========================
    // ======== [SW 변경] ========
    // ==========================

    /**
     * [SW 버전, 지원 OS] 옵션 세팅
     */
    async setUpdateOptions (data = this.data) {
      console.log('%c Edit Data :: ', 'color: pink', data)

      this.osTypes = await this.getOsTypes()
      const versions = this.setAddableVersionList(data)

      this.setSwOptions[0].options = versions // [SW 버전] 옵션 목록

      // 기존에 등록 되어있던 썸네일 파일 정보 유지
      if (data.thumbnailImage) this.convertBase64IntoFile(data)

      this.loading = false
    },

    /**
     * [{SW Name} 변경] > [SW 버전] 옵션 세팅 (중복 제거)
     */
    setAddableVersionList (data = this.data) {
      const versions = []
      let resultIdx = -1 // osTypes 설정을 위한 index
      if (!data.versionList.length) return versions

      let currentVersion
      let osTypes = [] // 지원 가능한 OsTypes 세팅

      data.versionList.forEach(({ version, osType, swIdx, id, bitType, description, ...item }) => {
        // versionList 를 순회해서 이름이 다를 때만 입력 || (이름이 하나만 있는 경우 = 중복이 없는 경우)
        if (currentVersion !== version) {
          currentVersion = version
          const swVersion = `${version}`

          resultIdx += 1
          versions.push({ label: swVersion, value: swVersion, osTypes })
          osTypes = []
        }

        // [지원 OS] 설정
        // { os: osType(int), swIdx: (int),  versionId: 등록된 version의 Id(int), bit: (int), desc: (string) }
        osTypes.push({ os: osType, swIdx, versionId: id, bit: Number(bitType), desc: description })
        versions[resultIdx].osTypes = cloneDeep(osTypes)
      })
      return versions
    },

    /**
     * [{SW Name} 변경] 인 경우, Select Box 변경 이벤트
     * 선택된 Version 의 설명 변경
     * @param { String } field 셀렉트박스가 가지고있는 [field]
     * @param { Number } idx 셀렉트박스의 idx
     */
    selectChangeUpdate (field, idx) {
      const values = this.programValues[field]

      if (values !== undefined) {
        const actions = {
          // [SW 버전] 이 선택된 경우
          swVersion: () => {
            // 먼저 관련 옵션 / 값 리셋시키기
            this.setSwOptions[1].options = []
            this.setSwOptions[2].options = []
            this.programValues.supportOs = undefined // [지원 OS]
            this.programValues.osBits = undefined // [OS Bits]
            this.programValues.desc = undefined // [SW 설명]

            const value = this.setSwOptions[0].options.filter(option => option.value === values)[0]

            if (value.length === 0) return

            this.setSwOptions[1].options = this.findOsType(value.osTypes) // [지원 OS] 옵션 목록 세팅 + 지정된 bits 설정
          },

          // [지원 OS] 가 선택된 경우
          supportOs: () => {
            // 먼저 관련 옵션 / 값 리셋시키기
            this.setSwOptions[2].options = []
            this.programValues.osBits = undefined // [OS Bits]
            this.programValues.swIdx = undefined // [swIdx]
            this.programValues.desc = undefined // [SW 설명]

            const value = this.setSwOptions[1].options.filter(option => option.value === values)[0]
            if (value.length === 0) return

            this.programValues.swIdx = value.swIdx // [swIdx]
            this.programValues.versionId = value.versionId // [versionId] :: 선택한 버전의 id를 넣어줘야 변경에 반영이 됨

            // [OS bits] 옵션 목록 세팅
            // const osBits = [{ label: '64bits', value: 64 }, { label: '32bits', value: 32 }] // sample
            const osBits = [{ label: `${value.bit}bit`, value: value.bit, desc: value.desc }]
            this.setSwOptions[2].options = osBits
          },

          // [OS Bits] 가 선택된 경우
          osBits: () => {
            const value = this.setSwOptions[2].options.filter(option => option.value === values)[0]
            if (value.length === 0) return

            this.programValues.desc = `${value.desc}` // [SW 설명]
            this.$forceUpdate()
          }
        }

        if (actions[field] !== undefined) return actions[field]()
      }

      this.$forceUpdate()
    },

    /**
     * [{SW} 변경] 시 Validation 처리
     * @param { Object } values 설정한 데이터
     */
    updateValidation (values = this.programValues) {
      const conditions = [
        { condition: values.swVersion, message: this.$t('service.INSTALL.ALERT.011') }, // SW 버전 을 입력해주세요.
        { condition: values.supportOs, message: this.$t('service.INSTALL.ALERT.009') }, // 지원 OS 를 입력해주세요.
        { condition: values.osBits, message: this.$t('service.INSTALL.ALERT.010') } // OS Bits 를 입력해주세요.
      ]

      return conditions.every(cond => {
        if (!cond.condition) this.$alert(cond.message)
        return cond.condition
      })
    },

    /**
     * [{SW} 변경] 시 발생하는 이벤트
     * @param { Object } values 설정한 데이터
     * @return { Function } base64 로 변환한 File 과 값을 emit 합니다.
     */
    updateSw (values = this.programValues) {
      const validator = this.updateValidation()
      if (!validator) return

      // 저장하기 위해선 해당 [설치프로그램] 의 id 를 softwareId 키로 필요로합니다.
      values.softwareId = this.data.id

      // 내보개기
      return this.saveValueWithBase64File(values, this.fileList)
    },

    // -------------------------------------------------------------
    // ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ [설치프로그램 상세] ○ ○ ○ ○ ○ ○ ○ ○ ○ ○
    // -------------------------------------------------------------

    // ==============================
    // ======== [SW 버전 추가] ========
    // ==============================

    /**
     * [SW 라이선스, 지원 OS] 옵션 세팅
     */
    async setDetailAddOptions () {
      this.osTypes = await this.getOsTypes()
      const licenses = await this.getAddableVersionSwList()

      this.setSwOptions[0].options = licenses // [SW 라이센스] 옵션 목록

      this.loading = false
    },
    /**
     * [SW 라이선스] 옵션 목록 세팅
     */
    async getAddableVersionSwList () {
      try {
        const response = await API.sw.getAddableSwList({ category: 'installation' })
        const result = []
        let resultIdx = -1 // osTypes 설정을 위한 index

        if (!response.length) return result

        let currentName
        let currentVersion
        let osTypes = [] // 설정 가능한 OStypes 세팅

        const swName = this.$route.params.name
        response.forEach(({ name, version, osType, swIdx, ...sw }, index) => {
          // 현재 보고있는 SW 가 아닌경우는 노출시키지 않습니다.
          if (swName !== name) return

          // response 를 순회해서 이름이 다를 때만 입력 || (이름이 하나만 있는 경우 = 중복이 없는 경우)
          if (currentName !== name || currentVersion !== version) {
          // if (currentName !== name) {
            currentName = name
            currentVersion = version
            const swName = `${name} _ ${version}` // [SW 라이선스] 옵션 명

            resultIdx += 1
            result.push({ label: swName, value: swName, version })
            osTypes = []
          }

          // [지원 OS] 설정
          osTypes.push({ os: osType, swIdx })
          result[resultIdx].osTypes = cloneDeep(osTypes)
          // console.log(name, sw.osType, swIdx, cloneDeep(osTypes))
        })

        // console.log(result)
        return result
      } catch (error) {
        console.error('@@ getAddableSwList: ', error)
        return []
      }
    },

    // ===============================
    // ======== [Version 수정] ========
    // ===============================

    /**
     * [SW 버전, 지원 OS] 옵션 세팅
     */
    async setVersionUpdateOptions (data = this.data) {
      console.log('%c Version Edit Data :: ', 'color: yellow', data)

      const name = this.$route.params.name
      const { osType, bit, swIdx, id, desc, scriptList } = data

      this.osTypes = await this.getOsTypes()
      // const licenses = await this.getAddableSwList()

      // 기본 세팅
      // [SW 버전]
      this.setSwOptions[0].disabled = true
      // this.setSwOptions[0].options = licenses // [SW 라이센스] 옵션 목록
      this.programValues.swLicense = `${name} _ ${data.version}`

      // [지원 OS]
      this.setSwOptions[1].disabled = true
      this.setSwOptions[1].options = this.findOsType([{ os: osType, swIdx }]) // 필요는 없지만 형식을 맞추는게 나중에 버그 잡을때 편할 것 같아서..
      this.programValues.supportOs = osType

      // [OS bits]
      const osBits = [{ label: `${bit}bit`, value: bit, desc: desc }] // 필요는 없지만 형식을 맞추는게 나중에 버그 잡을때 편할 것 같아서..
      this.setSwOptions[2].disabled = true
      this.setSwOptions[2].options = osBits
      this.programValues.osBits = Number(bit)

      this.programValues.swName = name // [SW 명]
      this.programValues.swVersion = data.version // [SW 버전]

      // [SW 설명]  등록된 script 없으면 disabled
      this.disableDesc = (scriptList.length === 0) || (this.programValues.script === undefined)
      // this.programValues.desc = desc

      // [script]
      this.setSwOptions[5].disabled = scriptList.length === 0 // 등록된 script 없으면 disabled
      this.setSwOptions[5].placeholder = scriptList.length === 0 ? this.$t('service.INSTALL.PLACEHOLDER.001') : this.$t('service.INSTALL.PLACEHOLDER.002') // 등록된 script 없으면 ('Script 없음' : 'Script 선택')
      this.setSwOptions[5].options = this.setScriptOptions(scriptList) // script 버전 옵션 세팅

      this.programValues.swIdx = swIdx // [swIdx]
      this.programValues.versionId = id // [versionId] :: 선택한 버전의 id를 넣어줘야 변경에 반영이 됨
      this.programValues.versionDesc = data.desc // [versionDesc] 선택한 버전의 description (저장할 때 없으면 날아가더라구요)

      // 기존에 등록 되어있던 썸네일 파일 정보 유지
      if (data.thumbnailImage) this.convertBase64IntoFile(data)

      this.loading = false
    },

    /**
     * [SW 변경] 인 경우, Select Box 변경 이벤트
     * @param { String } field 셀렉트박스가 가지고있는 [field]
     * @param { Number } idx 셀렉트박스의 idx
     */
    selectChangeVersionUpdate (field, idx) {
      const values = this.programValues[field]

      if (values !== undefined) {
        const actions = {
          // [SW 버전 > Script] 가 선택된 경우
          script: () => {
            // [SW 설명] 세팅
            const value = this.setSwOptions[5].options.filter(option => option.value === values)[0]
            if (value.length === 0) return

            this.disableDesc = false
            this.programValues.desc = value.desc // script 의 [SW 설명]
            this.programValues.scriptId = value.scriptId // script 의 id
          }
        }

        if (actions[field] !== undefined) return actions[field]()
      }

      this.$forceUpdate()
    },

    /**
     * [SW 변경] 시 발생하는 이벤트
     * @param { Object } values 설정한 데이터
     * @return { Function } base64 로 변환한 File 과 값을 emit 합니다.
     */
    updateVersion (values = this.programValues) {
      const validator = this.updateValidation()
      if (!validator) return

      // 저장하기 위해선 해당 [설치프로그램] 의 id 를 softwareId 키로 필요로합니다.
      values.softwareId = this.$route.params.idx

      // 내보개기
      return this.saveValueWithBase64File(values, this.fileList)
    },

    // -------------------------------------------------------------
    // ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ [공용] ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○
    // -------------------------------------------------------------

    /**
     * [지원 OS] 옵션 목록 세팅
     */
    async getOsTypes () {
      try {
        const response = await API.enum.getOsTypes()
        return response.map(os => ({ label: os.codeVal, value: os.codeVal }))
      } catch (error) {
        console.error('@@ getOsTypes: ', error)
        return []
      }
    },

    /**
     * 셀렉트박스 변경 이벤트
     * @param { String } field
     * @param { Number } idx
     */
    selectChange (field, idx) {
      this.setChainedPlaceholder()

      // 추가 / 수정 UI 다르게 설정
      const types = {
        add: () => this.selectChangeAdd(field, idx), // [설치프로그램 목록] > [SW 추가]
        update: () => this.selectChangeUpdate(field, idx), // [설치프로그램 목록] > [{SW} 변경]
        versionAdd: () => this.selectChangeAdd(field, idx), // [설치프로그램 상세] > [SW 버전 추가]
        versionUpdate: () => this.selectChangeVersionUpdate(field, idx) // [설치프로그램 상세] > [버전 목록] > [수정]
      }

      return types[this.type]()
    },
    /**
     * [추가 / 변경] 버튼 클릭시 변경 이벤트
     * @param { String } type
     */
    actionApply (type = this.type) {
      this.setChainedPlaceholder()

      // 추가 / 수정 UI 다르게 설정
      const action = {
        add: () => this.addSw(this.programValues), // [설치프로그램 목록] > [SW 추가] > [추가]
        update: () => this.updateSw(this.programValues), // [설치프로그램 목록] > [{SW} 변경] > [변경]
        versionAdd: () => this.addSw(this.programValues), // [설치프로그램 상세] > [SW 버전 추가] > [추가]
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
      this.setSwOptions.forEach(option => { option.options = [] })
      this.fileList = []
      return this.$emit('close')
    },
    /**
     * 파일 변경시 이벤트
     * @param    {Object} file 업로드된 파일 한개
     * @param    {Array} formData 업로드된 파일 리스트
     * @return   {void}
     */
    changeFile (file, fileList) {
      if (file.size > (1024 * 30)) { // 30KB 이하 파일만 업로드 가능
        this.fileList = []
        return this.$alert(this.$t('common.ALERT.PROJECT.059', { size: '30KB' }))
      }

      // 이미지 외 기타 다른 파일 형식 차단
      const regex = new RegExp(/image\//gi)
      if (!regex.test(file.raw.type)) {
        this.fileList = []
        return this.$alert('이미지 형태만 업로드 가능합니다.')
      }

      this.fileList = !fileList.length ? [...fileList] : fileList.slice(-1)
    },
    /**
     * os-type 에 정의된 os 와 SW 의 osType을 비교하여
     * 해당하는 os 를 찾아 { label, value, swIdx } 를 만들어 반환합니다
     * [{SW} 변경] 시에는 해당 OS 에 설정된 bit, 저장될 versionId 도 함께 지정해줍니다
     * @param { Array } osTypes
     * @return { Array } [지원 OS] 를 위한 옵션 리스트 반환
     */
    findOsType (osTypes) {
      const result = []

      /*
        // [변경] 형식
        bit: 32
        desc: "Windows 32"
        os: "20"
        swIdx: 24
        versionId: 223

        // [추가] 형식
        os: "LINUX"
        swIdx: 87
       */

      // for 문을 사용한 이유는~ 속도가 더 빠르기 때문에~
      for (let i = 0; i < osTypes.length; i++) {
        const { os, swIdx, versionId, bit, desc } = osTypes[i]

        for (let j = 0; j < this.osTypes.length; j++) {
          const { label, value } = this.osTypes[j]

          // console.log(os, label)
          if (os === label || os === value) {
            // console.log('value.osTypes :', osTypes[i], '\n', 'this.osTypes :', this.osTypes[j])
            let object = { label, value, swIdx }

            // [{SW} 변경] 일경우에 지정되어야 할것 추가
            if (this.type === 'update') object = { ...object, versionId, bit, desc }

            result.push(object)
            break
          }
        }
      }

      return result
    },
    /**
     * 저장할 값을 이미지 파일 (Base64 파일 로 변환된) 과 함께 emit 합니다.
     * @param { Object } values 설정한 데이터
     * @param { Array } fileList 파일 목록
     * @return { Function } base64 로 변환한 File 과 값을 emit 합니다.
     */
    saveValueWithBase64File (values = this.programValues, fileList = this.fileList) {
      if (fileList.length) {
        const reader = new FileReader()
        reader.readAsDataURL(fileList[0].raw)
        reader.onload = () => {
          values.thumbnailImage = reader.result
          values.thumbnailName = fileList[0].name
          return this.$emit('update', values)
        }
      } else return this.$emit('update', values)
    },

    /**
     * [SW 설명] 변경될 때마다 변경되는 이벤트
     */
    testInput (value) {
      this.programValues.desc = value
      if (this.data !== null) this.$forceUpdate()
    },
    /**
     * 파일을 Base64 형식에서 > File 형식으로 (디코딩)변환합니다
     * @param { String } image Base64 형식의 String
     */
    convertBase64IntoFile (data) {
      const image = data.thumbnailImage

      const mimeType = image?.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0]
      const realData = image?.split(',')[1]

      const blob = this.b64toBlob(realData, mimeType)
      const fileName = data.thumbnailName
      const raw = new File([blob], fileName, { type: mimeType })

      const fileList = [{ name: raw.name, size: raw.size, uid: 1, raw }]
      this.fileList = fileList
    },
    /**
     * base64 를 Blob 오브젝트로 만드는 함수
     * @param { String } b64Data
     * @param { String } contentType mimeType
     * @param { Number } sliceSize 쪼개는 사이즈
     */
    b64toBlob (b64Data, contentType = '', sliceSize = 512) {
      if (b64Data === '' || b64Data === undefined) return

      const byteCharacters = atob(b64Data)
      const byteArrays = []

      for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize)
        const byteNumbers = new Array(slice.length)
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        byteArrays.push(byteArray)
      }

      const blob = new Blob(byteArrays, { type: contentType })
      return blob
    },

    checkedLicense (licenses) {
      console.log(licenses)
    }
  },
  data () {
    return {
      loading: false,
      setSwOptions: [],
      setaddProgramOptions: [
        {
          title: this.$v('설치프로그램 버전'),
          field: 'version',
          placeholder: this.$v('설치프로그램 버전을 선택해주세요')
        },
        {
          title: this.$v('운영체제유형'),
          field: 'swLicense',
          placeholder: this.$v('운영체제유형을 선택해주세요'),
          options: []
        },
        {
          title: this.$v('운영체제'),
          field: 'supportOs',
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
          placeholder: undefined,
          options: []
        }
      ],
      setUpdateProgramOptions: [
        {
          title: this.$v('S/W 버전'),
          field: 'swVersion',
          placeholder: undefined,
          chain: true,
          options: []
        },
        {
          title: this.$t('service.INSTALL.supportOS'), // 지원 OS
          field: 'supportOs',
          placeholder: undefined,
          chain: true,
          options: []
        },
        {
          title: 'OS bits',
          field: 'osBits',
          placeholder: undefined,
          chain: true,
          options: []
        }
      ],

      filterData: [
        {
          field: 'state',
          label: '카테고리',
          placeholder: '상태 전체',
          selections: [
            { label: '전체', value: undefined },
            { label: '실행 중', value: 'running' },
            { label: '진행 중', value: 'pending' },
            { label: '종료 중', value: 'stopping' },
            { label: '정지', value: 'stopped' }
          ]
        }
      ],
      scriptOption: { field: 'script', options: [], width: '145px' },
      disableDesc: false,
      osTypes: [],
      fileList: [],
      programValues: {},
      actionApplyButton (type) { // 변경/추가 모달 버튼 설정
        return {
          add: this.$t('common.BTN.add'), // [설치프로그램 목록] > [SW 추가]
          update: this.$t('common.BTN.change'), // [설치프로그램 목록] > [{SW} 변경]
          versionAdd: this.$t('common.BTN.add'), // [설치프로그램 상세] > [SW 버전 추가]
          versionUpdate: this.$t('common.BTN.change') // [설치프로그램 상세] > [버전 목록] > [수정]
        }[type]
      },
      setScriptOptions (scripts) {
        return scripts.map(({ scriptVersion, description, id, ...script }) => {
          return { label: scriptVersion, value: scriptVersion, desc: description, scriptId: id }
        })
      },
      licenseColumn: [
        { header: '라이선스명', binding: 'name' },
        { header: '라이선스버전', binding: 'version' },
        { header: '라이선스유형', binding: 'licenseType' },
        { header: '운영체제유형', binding: 'osType' },
        { header: '운영체제', binding: 'os' },
        { header: '운영체제버전', binding: 'osVersion' },
        { header: '구매수량', binding: 'buyCnt' },
        { header: '판매수량', binding: 'sellCnt' }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.add-sw {
  height: 600px;
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
