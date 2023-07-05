
<template>
  <section class="install-program-script-wrapper">
    <a
      class="go-back"
      @click="$router.go(-1)"
    >
      <i />
      <!-- 뒤로가기 -->
      {{ $t('service.INSTALL.goBack') }}
    </a>

    <article
      class="information-wrapper"
      v-loading="loading"
    >
      <h5 class="-title">
        <!-- {{ $route.params.name }} 스크립트 추가 -->
        {{ $route.params.name }}
        {{ $t('service.INSTALL.addScript') }}
      </h5>

      <div class="software-version-information">
        <div class="-info">
          <strong>
            {{ $v('스크립트 버전 정보') }}
            <span>*</span></strong>
          <el-input
            class="-input"
            :value="version.version"
            disabled
          />
          <b>・</b>
          <el-input
            v-model="scriptInfo.scriptVersion"
            class="-input"
          />
        </div>
        <!-- /. 스크립트 버전 정보 -->

        <div class="-info">
          <strong>
            {{ $v('타입') }}
            <span>*</span></strong>

          <el-select
            v-model="scriptInfo.scriptType"
            class="-input"
            style="width: 200px"
            :disabled="!version.version || !scriptInfo.scriptVersion"
          >
            <el-option
              v-for="item in scriptType"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
      </div>
      <!-- /. 스크립트 버전 정보 -->
    </article>
    <!-- /. 정보 -->

    <article class="script-tabs">
      <g-tab
        :data="tabs"
        ref="tabs"
        @click="setActiveTab"
      >
        <template #name="{ row }">
          {{ row.name }}
          <!-- 🌸 // {{ row.isActive }} -->
          <span :class="['status', `-${row._status}`]" />
        </template>

        <template
          v-for="(tab, tabIdx) in tabs"
          :slot="tab.field"
        >
          <!-- slot-scope="props" -->
          <div :key="tab.field">
            <div
              class="load-script flex-wrap -space-between"
              v-loading="loadScript"
            >
              <el-upload
                action=""
                class="cmp-upload -limit-width"
                :limit="1"
                :multiple="false"
                :show-file-list="true"
                :auto-upload="false"
                :file-list="fileList[tabIdx]"
                :on-remove="(file, fileList) => changeFile(tabIdx, file)"
                :on-change="(file, fileList) => changeFile(tabIdx, file)"
              >
                <button
                  class="button script-upload"
                  type="is-primary"
                >
                  <!-- 스크립트파일 불러오기 -->
                  {{ $t('service.INSTALL.ImportScriptFile') }}
                  <i class="-icon" />
                </button>
              </el-upload>
              <!-- /. 스크립트파일 불러오기 -->

              <button
                class="button"
                type="is-primary"
                @click="versionLoadModal = true"
              >
                <!-- 버전 불러오기 -->
                {{ $t('service.INSTALL.getVer') }}
              </button>
            </div>

            <div class="script-area">
              <CMPCodeEditor
                :values="contents[tabIdx]"
                @input="value => setScriptContents(value, tabIdx)"
              />
            </div>

            <div class="environment-value-wrapper">
              <div class="flex-wrap filter-wrapper">
                <el-select
                  v-model="selectedTestVmModel[tabIdx]"
                  class="test-vm-selection"
                  :disabled="testIsRunning"
                  :placeholder="$t('service.INSTALL.PLACEHOLDER.009')"
                  @change="setTestVMInfo"
                >
                  <el-option
                    v-for="item in testVMOptions"
                    :key="item.key"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>

                <button
                  class="button run-button"
                  type="is-primary"
                  :disabled="selectedTestVm[tabIdx] === undefined || testIsRunning"
                  @click="runTest(tabIdx)"
                >
                  <span>
                    Run <i class="mdi mdi-chevron-down" />
                  </span>
                </button>
              </div>
              <!-- /. 테스트 VM 선택, Run 버튼 -->

              <div class="script-result-area">
                <CMPCodeEditor
                  read-only
                  :values="testResults[tabIdx]"
                />
              </div>
            </div>
          </div>
          <!-- /. 탭 헤더 -->
        </template>
      </g-tab>

      <button
        class="button version-apply"
        type="is-primary"
        @click="applyVersion"
      >
        <!-- 버전 등록 -->
        {{ $t('service.INSTALL.registerVer') }}
      </button>
    </article>

    <!-- ///////////// -->
    <!-- //// 모달 //// -->
    <!-- ///////////// -->

    <!-- 버전불러오기 모달 -->
    <el-dialog
      :visible="versionLoadModal"
      title="버전 불러오기"
      width="990px"
      top="50px"
      @close="versionLoadModal = false"
    >
      <div class="modal-body version-load-modal">
        <article
          class="information-wrapper"
          v-if="false"
        >
          <h5 class="-title">
            {{ $route.params.name }}
          </h5>

          <span class="version-info">
            <!-- 정식 버전 -->
            {{ $t('service.INSTALL.fullVersion') }} : v{{ version.version }}
          </span>

          <textarea
            class="description tiny-scroll"
            type="textarea"
            readonly
            v-model="version.description"
          />

          <div class="-info">
            <strong class="info type">{{ version.osName }}</strong>
            <strong class="info bit">{{ version.bitType }}bit</strong>
          </div>
        </article>

        <div class="flex-wrap filter-wrapper">
          <span class="script-title">Script</span>
          <el-select
            v-model="selectedScript"
            class="script-select"
            :placeholder="$t('license.PLACEHOLDER.selectVersion')"
            @change="getScriptContents"
          >
            <el-option
              v-for="item in versionScriptOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
        <!-- /. 테스트 VM 선택 -->

        <div class="script-area">
          <CMPCodeEditor
            read-only
            :values="otherScriptContent"
          />
        </div>
      </div>

      <div class="modal-button-area">
        <button
          class="button"
          @click="closeModal"
        >
          <!-- 취소 -->
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          class="button"
          @click="getOtherScriptContents"
        >
          <!-- 가져오기 -->
          {{ $t('service.INSTALL.import') }}
        </button>
      </div>
    </el-dialog>
  </section>
</template>

<script>
import API, { CMPCodeEditor } from '@sd-fe/cmp-core'
import { mapState } from 'vuex'

export default {
  name: 'InstallProgramScript',
  components: {
    CMPCodeEditor
  },
  async mounted () {
    console.clear()
    this.setBreadcrumbs(this.$route)
    await this.init()
    this.selectTabs(this.$route.query)
    this.getTestVMList()
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      cloud: state => state.cloud.cloud.toUpperCase()
    })
  },
  methods: {
    /**
     * Breadcrumbs 를 세팅합니다.
     * @param { Object } route 라우트 정보
     */
    setBreadcrumbs (route) {
      this.$store.commit('common/ADD_PARAMETERS', {
        label: route.params.name,
        name: 'install-program-detail-view'
      })
      this.$store.commit('common/ADD_PARAMETERS', {
        label: this.$t('service.INSTALL.scriptManagement'), // 스크립트관리
        path: ''
      })
    },
    /**
     * script 쿼리가 설정된 경우, 스크립트 tab 에서 해당 탭을 on 시킵니다.
     * @param { Object } query 라우트 에 담긴 쿼리 정보
     */
    selectTabs (query) {
      if (!query.script) return
      const gTab = this.$refs.tabs

      this.tabs.forEach((tab, idx) => {
        if (tab.field === query.script.toUpperCase()) {
          this.setActiveTab(tab)
          return gTab.clickEvent(tab, idx)
        }
      })

      this.$forceUpdate()
    },
    /**
     * 해당 설치프로그램의 버전에 대한 정보를 가져옵니다. 기본적으로 필요해요.
     * @param { Object } param 특정 조건으로 필터링을 한 버전 목록을 가져오기 위해 파라미터가 필요합니다
     */
    async init (param) {
      this.loading = true

      this.version = await this.getSwVersion(this.$route.params.versionId)
      this.version.osName = this.version.osType
      this.versionScriptList = this.version?.scriptList

      // scriptVersion
      console.log('%c @@ this.version', 'color: yellow', this.version)

      // 스크립트 [타입] option 목록 세팅
      this.scriptType = await this.getITAutomationTypes()

      // [스크립트 수정] scriptId 가 있는경우 ? 스크립트 관리 상세 페이지 (스크립트 수정인 경우)
      if (this.$route.query.scriptId) {
        this.scriptInfo = await this.getScriptDetail(this.$route.query.scriptId)
        console.log('%c @@ this.scriptInfo', 'color: pink', this.scriptInfo)

        this.scriptDetailList = this.scriptInfo?.softwareScriptDetailList
        this.tabs = this.setTabs(this.scriptDetailList)
        this.setActiveTab(this.tabs[0])
      } else {
        // [스크립트 추가] 새로 스크립트를 추가하는 경우
        this.tabs = this.defaultTabs()
        this.setActiveTab(this.tabs[0])
        this.scriptInfo = {
          ...this.scriptInfo,
          scriptVersion: this.getBiggestVersion(this.version?.scriptList)
        }
      }

      this.setVersionScriptsOption(this.versionScriptList, this.version)

      this.loading = false
    },

    /**
     * 현재 진입하고있는 스크립트의 상세 정보를 가져옵니다.
     */
    async getSwVersion (versionId) {
      try {
        const version = await API.sw.getSwVersion(versionId)
        return version
      } catch (error) {
        console.error('@@ getSwVersion: ', error)
      }
    },

    /**
     * IT Automation Type 데이터 가져오기
     */
    async getITAutomationTypes () {
      try {
        const data = await API.sw.getITAutomationTypes()
        return data.map(({ field }) => ({ label: field, value: field }))
      } catch (error) {
        console.error('@@ getITAutomationTypes', error)
      }
    },

    /**
     * 현재 진입하고있는 스크립트의 상세 정보를 가져옵니다.
     */
    async getScriptDetail (scriptId) {
      try {
        const script = await API.sw.getScriptDetail(scriptId)
        return script
      } catch (error) {
        console.error('@@ getScriptDetail: ', error)
      }
    },

    /**
     * Test VM 목록을 불러옵니다.
     */
    async getTestVMList () {
      try {
        const response = await API.sw.getTestVMList({ vmType: this.cloud, osType: this.version.osType, bitType: `X${this.version.bitType}` })
        // console.log('test vms :: ', response)
        this.testVMOptions = response.map(({ vmUuid, vmName, vmType, osType, id, ...vm }) => ({ label: vmName, key: vmUuid, value: vmUuid, data: { vmName, vmUuid, vmType, osType, id } }))
      } catch (error) {
        console.error('@@ getTestVMList: ', error)
      }
    },

    /**
     * 선택한 VM 정보의 데이터를 selectedTestVm 에 저장합니다.
     * Run 할 때 hostUuid, osType 을 자동으로 저장해줍니다.
     * @param { String } vmUuid
     */
    setTestVMInfo (vmUuid) {
      for (let i = 0; i < this.testVMOptions.length; i++) {
        const option = this.testVMOptions[i]
        if (option.value === vmUuid) {
          this.selectedTestVm[this.activeTab.index] = option.data
          return
        }
      }
    },

    /**
     * [Run] 버튼을 눌러 시뮬레이션을 가동합니다 휙휙
     * @param { Number } tabIdx 현재 보고있는 탭 Index
     */
    async runTest (tabIdx) {
      try {
        this.testIsRunning = true
        this.testResults[tabIdx] = 'TEST VM IS RUNNING ...'
        const payload = this.setTestPayload(tabIdx)

        const response = await API.sw.simulation({ userIdx: this.user.userIdx, payload })

        // simulation 결과 반환 => result 는 String/JSON 둘중 아무거나 내려올 수 있음 => 그래서 그냥 있는 그대로 보여줌
        if (response) {
          // retcode 0 (성공), 1 (실패)
          const { data } = response
          this.testResults[tabIdx] = data[0].result
          this.setScriptDetail(data[0].retcode, tabIdx)
        }
      } catch (error) {
        console.error('@@ runTest: ', error)
        const message = error.response.data.message // 🟡 임시 에러메세지 :: 전체 수정 필요! (요청드렸음)
        const code = error.response.data.code

        const temp = {
          SM905: this.$t('service.INSTALL.ALERT.046'), // 해당버전은 이미 설치되었습니다.
          SM118: this.$t('service.INSTALL.ALERT.043'), // 설치 파일은 {installprogram_file(파일 순서)}로 작성해주세요.
          SM119: this.$t('service.INSTALL.ALERT.044') // 설치 파일이 없습니다.
        }[code]

        console.log(code, temp)

        this.$alert(temp || message, '', { callback: () => false })
        this.testResults[tabIdx] = 'ERROR OCCURED!'
      } finally {
        this.testIsRunning = false
      }
    },

    /**
     * payload 설정
     * @param { Number } tabIdx 현재 보고있는 탭 Index
     */
    setTestPayload (tabIdx) {
      const params = this.$route.params
      const version = this.version
      const script = this.scriptInfo
      const activeTab = this.activeTab

      // 현재 보고있는 스크립트 정보
      const scriptList = [
        {
          id: script.id, // script Id
          scriptVersion: script.scriptVersion,
          versionId: version.id,
          softwareScriptDetailList: [
            {
              contents: this.contents[activeTab.index],
              id: activeTab.id, // 현재 tab id
              scriptId: activeTab.scriptId,
              scriptType: activeTab.field
            }
          ]
        }
      ]

      // 현재 보고있는 version 정보
      const versionList = [
        {
          bitType: version.bitType,
          id: version.id, // version id
          osType: version.osType,
          softwareId: params.idx, // SW id
          swIdx: version.swIdx,
          scriptList
        }
      ]

      // console.log('version :: ', version)
      // console.log('script :: ', script)
      // console.log('activeTab :: ', activeTab)

      const payload = {
        isSimulation: true, // Test VM 돌리는 경우 true
        software: {
          id: params.idx, // SW id
          versionList
        },
        vmList: [this.selectedTestVm[tabIdx]]
      }

      // console.log(payload)
      // console.log(JSON.stringify(payload))

      return payload
    },

    /*
      <등록 안된 스크립트 (스크립트 추가시)> :: scriptId 없는 경우
      [버전 등록 하기 전] 시뮬레이션 실행 > 상태/결과값 반환 후 retcode 를 기준으로 scriptDetailList 즉시 UI 에만 반영 (DB 저장 X) => 새로고침/등록 안하면 전체 날아감
      [버전 등록 시] (1. 시뮬레이션 실행한 결과 scriptDetailList) 를 DB 에 저장 :: (관련 API : POST /versions/scripts)
      <등록 된 스크립트 (스크립트 수정시)> :: scriptId 있는경우
      스크립트 상세 진입시 기존 scriptDetailList 상태 유지
      시뮬레이션 실행 > 상태/결과값 반환 > 결과 status 값 UI 에만 반영 (DB 저장 X) => 새로고침하면 유지 X
      2. 의 과정에서 변경된 status 값을 [버전 등록] 으로 저장하면 DB 에 저장 => 새로고침하면 status 유지 O

      <등록된/안된 스크립트 공통>
      [기존 스크립트 (성공) -> UI 에서 스크립트 수정 (미실행 - UI 에만 반영)  -> 시뮬레이션 (성공) -> 저장  (DB 저장) ]
      scriptDetailList는 UI 에서 서버로 전송함 (API 수정 예정)
    */
    /**
     * 스크립트 테스트 후 결과를 UI 에서만 볼 수 있도록 탭에 저장합니다.
     * 해당 테스트 상태를 저장하려면 버전 등록으로 가능합니다.
     */
    setScriptDetail (retcode, tabIdx) {
      const status = {
        0: 'SUCCESS', // 성공
        1: 'FAILED' // 실패
      }[retcode]

      this.tabs[tabIdx].status = status
      this.tabs[tabIdx]._status = this.setStatus[status]

      // 그냥 selectTabs 호출하면 너무 빨리 호출돼서 적용이 안돼요..
      setTimeout(() => { this.selectTabs({ script: this.activeTab.field }) }, 1)
    },

    /**
     * [버전 등록] 클릭시 발생하는 이벤트
     */
    async applyVersion () {
      const validator = this.validator()
      if (!validator) return

      // console.log(this.version, this.scriptInfo, this.user, this.tabs)
      const { scriptVersion, isUse, description, scriptType } = this.scriptInfo
      console.log(scriptType, '=?')

      const softwareScriptDetailList = this.tabs.map(({ id, field, status, scriptId, ...tab }, index) => {
        const result = {
          contents: this.contents[index],
          id, // 각 탭의 id
          scriptId,
          scriptType: field,
          status
        }
        return result
      })

      // 🔶 (220406) 임시 (READ / UPDATE) 일경우가 임시로 삭제되어 하드코딩으로 추가됩니다
      let details

      if (this.scriptDetailList.length) { // script [수정] 일때
        const ids = softwareScriptDetailList.map(script => script.id)
        const filter = list => list.filter(script => ids.indexOf(script.id) < 0)

        details = filter(this.scriptDetailList)
      } else { // script [새로 등록] 일때
        const temp = scriptType => ({ contents: undefined, id: undefined, scriptId: undefined, scriptType, status: 'SUCCESS' })
        details = [temp('READ'), temp('UPDATE')]
      }
      // /. 🔶

      // scriptId 가 있는 경우 ? 수정 : 추가
      const isUpdate = this.$route.query.scriptId

      const payload = {
        description: description === null ? '' : description,
        id: this.scriptInfo.id, // scriptId
        isUse, // 해당 스크립트의 사용/미사용 여부
        scriptType, // 스크립트 타입
        scriptVersion, // 스크립트의 버전
        versionId: this.version.id,
        softwareScriptDetailList: [...softwareScriptDetailList, ...details] // 🔶
      }

      console.log(payload, this.contents)
      // console.log(JSON.stringify(payload))

      const result = isUpdate ? await this.updateScriptDetail(payload) : await this.addScript(payload)
      const message = isUpdate ? this.$t('common.BTN.modify') : this.$t('common.BTN.add') // 수정 : 추가

      if (result.status) {
        // 성공적으로 ${message}되었습니다. 목록으로 이동합니다.
        return this.$alert(this.$t('service.INSTALL.ALERT.019', { message }), '', { callback: () => this.$router.go(-1) })
      } else {
        const code = {
          SM181: this.$t('service.INSTALL.ALERT.020') // 이미 해당 버전이 존재합니다
        }[result.code]

        // 저장에 실패했습니다 {code 정보}
        this.$alert(this.$t('service.INSTALL.ALERT.021') + `${result.code} : ${code || result.message}`, '', {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
      }
    },

    validator () {
      const validator = [
        { condition: this.version.version, message: this.$v('스크립트 버전정보를 입력해주세요.') },
        { condition: this.scriptInfo.scriptVersion, message: this.$v('스크립트 버전정보를 입력해주세요.') },
        { condition: this.scriptInfo.scriptType, message: this.$v('스크립트 타입을 선택해주세요.') }
      ]

      return validator.every(({ condition, message }) => {
        if (!condition) this.$alert(message)
        return condition
      })
    },

    /**
     * 스크립트 버전 [추가]
     */
    async addScript (payload) {
      try {
        const response = await API.sw.addScript(payload)
        return { status: response }
      } catch (error) {
        console.error('@@ addScript : ', error)
        return { status: false, code: error.response.data.code, message: error.response.data.message }
      }
    },
    /**
     * 스크립트 버전 [수정]
     */
    async updateScriptDetail (payload) {
      try {
        const response = await API.sw.updateScriptDetail(payload)
        return { status: response }
      } catch (error) {
        console.error('@@ updateScriptDetail : ', error)
        return { status: false, code: error.response.data.code }
      }
    },
    /**
     * Script 내용 입력시 데이터 저장
     */
    setScriptContents (value, idx) {
      this.contents[idx] = value
      this.$forceUpdate()
    },
    setActiveTab (tab) {
      this.activeTab = tab
      this.setVersionScriptsOption(this.versionScriptList, this.version)
      this.$forceUpdate()
      // console.log('tab', tab)
    },

    // =====
    // ===== 버전 불러오기
    // =====

    /**
     * [버전 불러오기] 에서 탭과 일치하는 스크립트들을 연결합니다.
     */
    setVersionScriptsOption (scripts = this.versionScriptList, version = this.version) {
      const result = []
      for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i]
        if (this.$route.query.scriptId && (script.scriptVersion === this.scriptInfo.scriptVersion)) continue

        // 해당 스크립트의 내용
        const scriptContents = script.softwareScriptDetailList.filter(type => type.scriptType === this.activeTab?.field)[0]

        const contents = scriptContents?.contents ? scriptContents?.contents : ''
        const option = { label: `${version.version}.${script.scriptVersion}`, value: script.scriptVersion, contents }
        result.push(option)
      }

      this.versionScriptOptions = result
    },
    /**
     * [버전 불러오기] 의 Script 를 선택한 경우, 해당 내용의 스크립트 컨텐츠를 가져옵니다.
     */
    getScriptContents (scriptVersion) {
      const result = this.versionScriptOptions.filter(option => option.value === scriptVersion)
      this.otherScriptContent = result[0].contents
    },
    getOtherScriptContents () {
      this.setScriptContents(this.otherScriptContent, this.activeTab.index)
      this.closeModal()
    },
    closeModal () {
      this.versionLoadModal = false
      this.selectedScript = undefined
      this.otherScriptContent = ''
    },

    // ===
    // === 스크립트 파일 불러오기
    // ===

    /**
     * [스크립트 파일] 파일 변경시 이벤트
     * @param    {Object} file 업로드된 파일 한개
     * @param    {Array} formData 업로드된 파일 리스트
     * @return   {void}
     */
    changeFile (index, file) {
      if (file.size > (1024 * 1024 * 100)) { // 100Mb 이하 파일만 업로드 가능
        return this.$alert(this.$t('common.ALERT.PROJECT.059', { size: '100Mb' }))
      }

      // if (file.size > (1024 * 1024 * 1024 * 5)) { // 5GB 이하 파일만 업로드 가능
      //   return this.$alert(this.$t('common.ALERT.PROJECT.059', { size: '5GB' }))
      // }
      this.fileList[index] = []

      const reader = new FileReader()
      reader.readAsText(file.raw)
      reader.onload = () => {
        this.loadScript = true
        this.contents[index] = reader.result
        this.$forceUpdate()
        this.loadScript = false
      }
    }
  },
  data () {
    return {
      setTabs (tabs) { // 탭의 상태를 설정합니다.
        if (!tabs) return
        // 🔶  (220406) 임시 (READ / UPDATE) 타입 제외
        const exeptTab = tabs.filter(({ scriptType }) => scriptType === 'INSTALL' || scriptType === 'UNINSTALL')

        return exeptTab.map(({ scriptType, status, ...tab }, index) => {
          this.setScriptContents(tab.contents, index)
          return {
            index,
            field: scriptType,
            name: `${scriptType[0].toUpperCase() + scriptType.toLowerCase().slice(1)} Script`,
            _status: this.setStatus[status],
            status,
            ...tab
          }
        })
      },
      setStatus: {
        UNEXECUTED: undefined,
        FAILED: 'fail',
        SUCCESS: 'success',
        IN_PROGRESS: 'ing'
      },
      loading: false,
      loadScript: false,
      osTypes: [],
      tabs: [],
      scriptType: [], // 타입 option 목록
      defaultTabs () {
        return [
          { index: 0, field: 'INSTALL', name: 'Install Script', status: 'UNEXECUTED', contents: null, file: null },
          { index: 1, field: 'UNINSTALL', name: 'Uninstall Script', status: 'UNEXECUTED', contents: null, file: null }
          // { index: 2, field: 'UPDATE', name: 'Update Script', status: 'UNEXECUTED', contents: null, file: null },
          // { index: 3, field: 'READ', name: 'Read Script', status: 'UNEXECUTED', contents: null, file: null }
        ]
      },
      activeTab: null,
      contents: [],
      testResults: [],
      versionLoadModal: false,
      version: {},
      versionScriptList: [], // 버전 불러오기에서 다른 스크립트를 불러올 때 사용
      versionScriptOptions: [], // 버전 불러오기의 다른 스크립트
      selectedScript: undefined,
      otherScriptContent: undefined, // 버전 불러오기의 선택한 다른 스크립트 내용
      fileList: [], // 스크립트 파일 목록
      scriptInfo: {},
      scriptDetailList: [], // 스크립트 편집 영역 raw 데이터
      scriptDetailContent: undefined, // 스크립트 텍스트
      getBiggestVersion (scripts) { // 가장 큰 버전을 확인합니다.
        let num = 0
        if (scripts.length === 0) return num

        for (let i = 0; i < scripts.length; i++) {
          const script = scripts[i]
          if (num < script.scriptVersion) num = script.scriptVersion
        }
        return num + 1
      },
      testIsRunning: false,
      testVMOptions: [], // TestVM 목록
      selectedTestVm: {}, // VM Run 시 필요한 vmList 를 저장합니다
      selectedTestVmModel: {} // 그냥 고유값 판별 용도 (읽기전용)
    }
  }
}
</script>

<style lang="scss" scoped>
.install-program-script-wrapper {
  position: relative;

  .go-back {
    position: absolute;
    top: -65px; left: 0;
    color: $text-lighter-gray;
    font-size: 13px;
    line-height: 25px;
    display: flex;
    align-items: center;

    i {
      position: relative;
      border-top: 1px solid $text-lighter-gray;
      border-left: 1px solid $text-lighter-gray;
      display: block;
      width: 10px; height: 10px;
      transform: rotate(-45deg);
      margin: 0 5px 0 3px;
    }
  }
  .-title { font-size: 16px; }

  .information-wrapper {
    background-color: $dark-navy;
    border-radius: $radius-m;
    padding: $gap $gap $gap-m $gap;
    height: 120px;
    margin-bottom: 70px;
    box-sizing: border-box;
    position: relative;

    .-title { margin-bottom: 15px; }

    .version-info { font-size: 10px; }

    .software-version-information {
      display: flex;

      .-info {
        display: flex;
        align-items: center;
        margin-right: 40px;

        strong {
          display: block;
          color: $light-gray;
          font-weight: 400;
          font-size: 13px;
          display: flex;
          align-items: center;

          span {
            color: $main-red;
            display: block;
            margin: 0 15px 8px 5px;
          }
        }

        .-input { width: 70px; }
        b {
          display: block;
          margin: 0 5px;
        }
      }
    }

    .description {
      margin-top: $gap-s;
      margin-bottom: 10px;
      border: 1px solid $purple-gray;
      box-sizing: border-box;
      border-radius: 5px;
      padding: 15px;
      height: 100px;
      overflow-y: auto;
      line-height: 22px;
      font-size: 13px;
      color: $light-gray;
      background-color: transparent;
      display: block;
      width: 100%;
      line-height: 1.5;
      resize: none;

      &:focus { outline: none;}
    }

    .info {
      border-radius: $radius-s;
      padding: 0 5px;
      line-height: 22px;
      font-size: 12px;
      &.type {
        background-color: #C0D7ED;
        color: $sea-blue;
        margin-right: 5px;
      }
      &.bit {
        background-color: #FCEADB;
        color: $yellow;
      }
    }
  }

  .script-tabs {
    .status {
      display: block;
      width: 5px;
      height: 5px;
      background-color: $main-gray;
      border-radius: 50%;
      margin-bottom: 20px;
      margin-left: 5px;

      &.-success { background-color: $sea-blue; }
      &.-ing { background-color: $yellow; }
      &.-fail { background-color: $main-red; }
    }

    .load-script {
      margin-bottom: 15px;
    }

    .script-upload {
      display: flex;
      align-items: center;
      .-icon {
        display: block;
        width: 15px; height: 15px;
        margin-left: 5px;
        -webkit-mask-image: url('../../../../../assets/images/icon-upload.svg');
        mask-image: url('../../../../../assets/images/icon-upload.svg');
        background-color: $white;
        mask-size: contain;
        mask-repeat: no-repeat;
      }
    }

    .script-area {
      margin-bottom: $gap;
      height: 490px;
    }

    .environment-value-wrapper {
      .test-vm-selection {
        width: 140px;
        margin-right: $gap;
      }
      .run-button {
        padding: 0 15px;
        box-sizing: border-box;

        span {
          display: flex;
          align-items: center;
          .mdi {
            margin-left: 5px;
            display: block;
            transition: .3s ease transform;
            &::before { font-size: 13px; }
          }
        }
      }

      .script-result-area {
        border-radius: $radius-s;
        height: 190px;
        margin-top: 15px;
        margin-bottom: 40px;
      }
    }

    .version-apply {
      width: 100%;
      height: 60px;
      font-size: 16px;
    }
  }

  .version-load-modal {
    // height: 670px;
    height: 420px;
    border-bottom: 1px solid #3D435E;

    .information-wrapper { margin-bottom: 15px; }

    .script-title { font-size: 13px; }

    .script-select {
      width: 140px;
      margin-left: $gap-s;
    }

    .script-area {
      margin-top: $gap;
      height: 350px;
    }
  }
}
</style>

<style lang="scss">
.install-program-script-wrapper {
  .-input .el-input__inner { padding: 0 $gap-s; }
  .el-textarea .el-textarea__inner {
    height: 100px;
    padding: 15px;
    font-size: 13px;
    color: $light-gray;
    margin-bottom: $gap-s;
    margin-top: 10px;
    border: 1px solid $purple-gray;
    border-radius: 5px;
    box-sizing: border-box;
    overflow-y: auto;
  }
}
</style>
