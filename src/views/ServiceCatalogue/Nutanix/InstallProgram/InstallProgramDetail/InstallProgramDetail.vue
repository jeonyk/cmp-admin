
<template>
  <div v-loading="loading">
    <div class="flex-wrap -space-between">
      <filtering-component
        v-if="filteringOptions.length"
        :data="filteringOptions"
        @selected="filterAction"
        @reset-data="filterRest"
      />

      <button
        class="button"
        type="is-primary"
        @click="viewInstallhistory = true"
      >
        {{ $v('Script 실행 이력조회') }}
      </button>
    </div>

    <section class="detail-wrapper">
      <article>
        <div class="sw-version-info">
          <div class="-name">
            <h6>{{ $route.params.name }}</h6>
            <small v-if="installableVersionCount > 0">
              <!-- 신규 SW 추가 {{ installableVersionCount }}건 -->
              {{ $t('service.INSTALL.newSWCnt', { count: installableVersionCount }) }}
            </small>
          </div>

          <button
            class="button"
            type="is-primary"
            @click="updateProgram('versionAdd', `설치프로그램 버전 추가`)"
          >
            {{ $v('버전 추가') }}
          </button>
        </div>
        <!-- /. SW 정보, 버전 추가  -->

        <search-bar
          :user-reset-icon="false"
          size="mini"
          @input="val => { if(!val) init() }"
          @change="changeText"
          :placeholder="$t('common.ALERT.SERVICE.019')"
        />
        <!-- /. 검색영역 -->

        <ul
          class="versions"
          v-if="swVersions.length"
        >
          <li
            v-for="(item, idx) in swVersions"
            :key="idx"
            :class="['-item', selectedVersion && selectedVersion.id === item.id ? '-selected' : '']"
            @click="clickVersion(item)"
          >
            <span :class="['status', item.statusName.css]" />
            <div class="-info">
              <b class="name">
                <span
                  v-if="setNewTag(item.createDate)"
                  class="new"
                >N</span>
                Ver {{ item.version }}
                <!-- // 🌸 {{ item.id }} -->
              </b>

              <strong class="info type">{{ item.osName }}</strong>
              <strong class="info bit">{{ item.bit }} bit</strong>
            </div>

            <el-tooltip
              effect="light"
              placement="right"
              popper-class="edit-modal-popper"
            >
              <i
                class="mdi mdi-dots-vertical"
                @mouseenter="item.edit = true"
              />
              <template #content>
                <p @click="updateProgram('versionUpdate', `S/W ${$t('common.BTN.change')}`, item)">
                  {{ $v('변경') }}
                </p>
                <p @click="setDeleteSW(true, item)">
                  {{ $v('삭제') }}
                </p>
              </template>
            </el-tooltip>
            <!-- /. 수정/삭제 설정 -->
          </li>
        </ul>

        <div
          class="versions -empty"
          v-else
        >
          {{ $t('common.PLACEHOLDER.noData') }}
        </div>
      </article>
      <!-- /. LEFT - 소프트웨어 버전 리스트 -->

      <article v-if="selectedVersion !== null">
        <!-- 디버깅 ~ 🌸 {{ selectedVersion }} -->
        <div class="detail-description-wrapper">
          <div class="detail-description">
            <h5 class="-title">
              <span
                v-if="setNewTag(selectedVersion.createDate)"
                style="margin-right: 8px"
                class="new"
              >N</span>
              Ver {{ selectedVersion.version }}

              <small v-if="selectedVersion.usableScript">
                {{ $t('service.INSTALL.usingScriptVer') }} : v{{ selectedVersion.swScriptVersion }}
              </small>
              <small v-else>
                <!-- 사용 가능한 스크립트 버전이 없습니다. -->
                {{ $t('service.INSTALL.ALERT.014') }}
              </small>
            </h5>

            <div class="version-desc-buttons">
              <small>
                <strong class="info type">{{ selectedVersion.osName }}</strong>
                <strong class="info bit">{{ selectedVersion.bit }} bit</strong>
              </small>
            </div>

            <textarea
              class="description tiny-scroll"
              readonly
              :placeholder="$v(`Ver ${selectedVersion.version}의 등록된 설명이 없습니다.`)"
              v-model="selectedVersion.desc"
            />
          </div>
          <!-- /. 버전 상세 설명 -->
        </div>
        <!-- /. 버전 설명 -->

        <g-tab :data="tabData">
          <template #manageProgram>
            <install-vm-list />
          </template>
          <!-- /. VM 별 설치프로그램 관리 -->

          <template #manageScript>
            <article class="script-version-list-wrapper">
              <div
                class="flex-wrap -space-between"
                style="margin-bottom: 15px;"
              >
                <h5 class="-title">
                  <!-- 설치스크립트 관리 -->
                  {{ $t('service.INSTALL.manageScript') }}
                </h5>
                <button
                  class="button"
                  type="is-primary"
                  @click="$router.push({ name: 'install-program-script', params: { versionId: selectedVersion.id } })"
                >
                  <!-- 스크립트 버전 추가 -->
                  {{ $t('service.INSTALL.addScriptVer') }}
                </button>
              </div>

              <div>
                <!-- :item-source="selectedVersion.scriptList" -->
                <cmp-grid
                  :item-source="installScriptData"
                  :columns="installScriptColumn"
                  :use-column-filter="false"
                  :paging-size="5"
                >
                  <template #statusName="{ row }">
                    <el-tooltip
                      effect="light"
                      placement="bottom"
                      :disabled="row.statusName !== 'FAILED'"
                    >
                      <span :class="['simulation', row.statusName.css ]">
                        {{ row.statusName.name }}
                      </span>

                      <div slot="content">
                        실패 사유
                      </div>
                    </el-tooltip>
                  </template>
                  <!-- /. 시뮬레이션 -->

                  <template #script="{ row }">
                    <ul class="script-types flex-wrap">
                      <li
                        v-for="s in scriptTypes"
                        :key="s.label"
                        @click="$router.push({
                          name: s.routeTo,
                          query: {scriptId: row.id, ...s.query },
                          params: { versionId: selectedVersion.id }
                        })"
                      >
                        {{ s.label }}
                      </li>
                    </ul>
                  </template>
                  <!-- /. 스크립트 -->

                  <template #isUsing="props">
                    <el-switch
                      class="using-switch"
                      v-model="props.row.isUse"
                      @change="changeInstallScriptUsage(props.row)"
                    />
                    <!-- <el-select
                      v-model="props.row.isUse"
                      placeholder="사용여부"
                      :popper-append-to-body="true"
                      @change="changeInstallScriptUsage(props.row)"
                    >
                      <el-option
                        v-for="type in isUsingOption"
                        :key="type.value"
                        :label="type.label"
                        :value="type.value"
                      />
                    </el-select> -->
                  </template>
                  <!-- /. 사용여부 -->

                  <template #fn="{ row }">
                    <div class="function-icons">
                      <i
                        class="-edit-icon"
                        @click="$router.push({
                          name: 'install-program-script',
                          params: { versionId: selectedVersion.id },
                          query: { scriptId: row.id }
                        })"
                      />
                      <i
                        class="-delete-icon"
                        @click="setDeleteScript(true, row)"
                      />
                    </div>
                  </template>
                </cmp-grid>
              </div>
            </article>
          </template>
          <!-- /. 설치스크립트 관리 목록 -->
        </g-tab>
      </article>
      <!-- /. RIGHT - 설치스크립트 상세 -->

      <article
        v-else
        class="empty"
      >
        <!-- 소프트웨어 버전을 선택해주세요. -->
        {{ $t('service.INSTALL.ALERT.015') }}
      </article>
    </section>
    <!-- /. 상세 -->

    <!-- //////////// -->
    <!-- //// 모달 /// -->
    <!-- //////////// -->
    <install-program-history
      :visible="viewInstallhistory"
      @close="viewInstallhistory = false"
      :title="`Script 실행 이력조회 :: ${$route.params.name}`"
      width="1450px"
      top="50px"
    />
    <!-- /. Script 실행 이력조회 모달 -->

    <install-program-version-update
      :visible="setSwModal.visible"
      :type="setSwModal.type"
      :title="setSwModal.title"
      :data="setSwModal.data"
      width="1100px"
      top="50px"
      @close="setSwModal.visible = false"
      @update="updateSwAction"
    />
    <!-- /. [SW 버전] 수정모달 -->

    <install-program-delete
      :status="deleteSwModal"
      @delete="deleteSW"
    />
    <!-- /. [SW 버전] 삭제 모달 -->

    <install-program-update-file
      :visible="setFileModal.visible"
      :title="setFileModal.title"
      :data="setFileModal.data"
      :type="setFileModal.type"
      width="360px"
      top="50px"
      @update="refreshVersion"
      @upload-status="val => fileUploading = val"
      @close="() => fileUploading ? null : setFileModal.visible = false"
    />
    <!-- /. [설치 파일] 추가 -->

    <install-program-delete
      :status="deleteScriptModal"
      @delete="deleteScript"
    />
    <!-- /. [설치스크립트] 삭제 모달 -->
  </div>
</template>

<script>
import API, { FilteringComponent } from '@sd-fe/cmp-core'
import InstallProgramHistory from '../InstallProgramLists/InstallProgramHistory'
import SearchBar from '@/components/SearchBar/SearchBar'
import InstallProgramVersionUpdate from '../InstallProgramConfig/InstallProgramVersionUpdate'
import InstallProgramUpdateFile from '../InstallProgramConfig/InstallProgramUpdateFile'
import InstallProgramDelete from '../InstallProgramConfig/InstallProgramDelete'
import { mapState } from 'vuex'
import InstallVMList from './InstallVMList.vue'

export default {
  name: 'InstallProgramDetail',
  components: {
    'filtering-component': FilteringComponent,
    'install-program-history': InstallProgramHistory,
    'search-bar': SearchBar,
    'install-program-version-update': InstallProgramVersionUpdate,
    'install-program-update-file': InstallProgramUpdateFile,
    'install-program-delete': InstallProgramDelete,
    'install-vm-list': InstallVMList
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  watch: {
    selectedVersion (version) {
      if (!version) return

      if (version.usableScript) version.swScriptVersion = version.version + '.' + version.usableScript.scriptVersion

      // this.installFileData = this.setInstallFileData(version)  // ❌ 설치파일 관리가 이제는 없어졌음
      this.installScriptData = this.setInstallScriptData(version)
    }
  },
  async created () {
    console.clear()

    // breadcrumbs
    this.setVersionBreadcrumb()

    const osTypes = await this.getOsTypesGroup()

    // OS 필터 세팅
    this.filteringOptions[0].selections = osTypes
    this.osTypes = this.setOsTypeFinder(osTypes)

    this.init()
  },
  methods: {
    /**
     * 화면 초기화~
     * @param { Object } param 특정 조건으로 필터링을 한 버전 목록을 가져오기 위해 파라미터가 필요합니다
     */
    async init (param) {
      this.loading = true
      this.rawData = await this.getVersionLists(this.$route.params.idx, param)
      await this.getSwInfo(this.$route.params.idx)

      console.log(this.rawData, 'init rawData')
      this.swVersions = await this.setVersionsFormat(this.rawData)

      // 자동으로 version 선택하기
      if (this.$route.query?.version) {
        const versionIdx = Number(this.$route.query?.version)

        this.swVersions.forEach(version => {
          if (version.id === versionIdx) {
            this.selectedVersion = version
            return false
          }
        })
      }

      this.loading = false
    },

    /**
     * 현재 [선택된 SW] 의 상세 정보를 가져옵니다.
     */
    async getSwInfo (id) {
      try {
        const version = await API.sw.getSwInfo(id)
        this.installableVersionCount = version.newLicenseCnt
      } catch (error) {
        this.loading = false
        console.error('@@ getSwInfo: ', error)
        this.installableVersionCount = 0
      }
    },

    /**
     * [지원 OS] 옵션 목록 세팅 (검색 필터용)
     * { 20: { label: 'Windows', value: 20 }, ... } 형식으로 저장합니다.
     */
    async getOsTypesGroup () {
      try {
        this.loading = true
        const response = await API.enum.getOsTypeGroup()
        return response.map(({ codeVal, codeIdx }) => ({ label: codeVal, value: codeVal }))
      } catch (error) {
        console.error('@@ getOsTypesGroup: ', error)
        return []
      } finally {
        this.loading = false
      }
    },

    /**
     * [지원 OS] 를 index 로 판별하기 위해 세팅
     * @param { Array } osTypes getOsTypes로 가져온 데이터
     */
    setOsTypeFinder (osTypes) {
      const object = {}
      osTypes.forEach(({ label, value }) => { object[value] = { label, value } })
      return object
    },

    // -------------------------------------------------------------
    // ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ [버전] ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○
    // -------------------------------------------------------------

    /**
     * 설치프로그램 프로그램명 breadcrumb 세팅
     */
    setVersionBreadcrumb () {
      this.$store.commit('common/ADD_PARAMETERS', {
        label: this.$route.params.name,
        path: ''
      })
    },

    /**
     * 현재 SW의 [좌측 version 목록]을 불러옵니다
     * @param { Number } idx 해당 프로그램의 index
     */
    async getVersionLists (idx = this.$route.params.idx, param) {
      try {
        const response = await API.sw.getVersionLists(idx, param)
        return response
      } catch (error) {
        this.loading = false
        console.error('@@ getVersionLists: ', error)
        return []
      }
    },

    /**
     * [좌측 version 목록]의 형식을 가공합니다.
     * @param { Array } data rawData 를 포함합니다.
     */
    async setVersionsFormat (data) {
      return data.map(({ version, bitType, osType, status, description, isUse, ...item }) => {
        return {
          ...item,
          version,
          osType,
          bit: bitType,
          osName: osType,
          statusName: this.simulationStatus[status || 'UNEXECUTED'],
          desc: description
        }
      })
    },

    /**
     * [SW 버전] 추가 / 수정
     * [추가] type: 'add', title: 'S/W 추가'
     * [수정] type: 'update', title: 'S/W 변경'
     */
    updateProgram (type, title, item = null) {
      this.setSwModal = {
        visible: true,
        type,
        title,
        data: item
      }
    },

    // ===============================
    // ========= [SW 버전 추가] ========
    // ===============================

    /**
     * [SW 추가] 시 payload 를 정의합니다.
     * @param { Object } items 변경된 데이터 입력
     */
    addSw ({ version, desc, osSystem, osType, osVersion, osBits, swList, isDisplay, installType, ...items }) {
      const softwareId = Number(this.$route.params.idx) // 저장하기 위해선 해당 [설치프로그램] 의 id 를 softwareId 키로 필요로합니다.

      const payload = {
        version,
        softwareId,
        osSystem,
        osType,
        osVersion,
        isDisplay,
        installType,
        bitType: osBits,
        description: desc,
        swList
      }

      // console.log(payload, swList)
      return this.addSwVersion(payload)
    },
    /**
     * [SW 추가] API 정의
     * 동일한 조건(SW 라이선스, 지원 OS, OS bits)에 등록하는경우 차단
     * 동일한 SW 라이선스 밑에 지원하는 다른 OS 를 설정한 경우는 해당 SW 라이선스 versionList 아래로 들어감
     */
    async addSwVersion (payload) {
      try {
        await API.sw.addSwVersion(payload)
        this.refreshVersion()
        this.setSwModal.visible = false
      } catch (error) {
        console.error('@@ addSwVersion : ', error)
        // SW 추가에 실패했습니다. <br> 다시 시도해주세요
        this.$alert(this.$t('service.INSTALL.ALERT.006'), '', { dangerouslyUseHTMLString: true, callback: () => false })
      }
    },

    // ===============================
    // ========= [SW 버전 변경] ========
    // ===============================

    /**
     * [SW 버전 변경] 시 payload 를 정의합니다.
     * @param { Object } items 변경된 데이터 입력
     */
    updateSw ({ id, version, desc, osSystem, osType, osVersion, osBits, swList, isDisplay, installType, ...items }) {
      const softwareId = Number(this.$route.params.idx) // 저장하기 위해선 해당 [설치프로그램] 의 id 를 softwareId 키로 필요로합니다.

      const payload = {
        id,
        version,
        softwareId,
        osSystem,
        osType,
        osVersion,
        isDisplay,
        installType,
        bitType: osBits,
        description: desc,
        swList
      }

      // console.log(payload)
      return this.updateSwVersion(payload)
    },

    /**
     * [SW 변경] API 정의
     */
    async updateSwVersion (payload) {
      try {
        await API.sw.updateSwVersion(payload)
        this.refreshVersion()
        this.setSwModal.visible = false
      } catch (error) {
        console.error('@@ updateScript : ', error)
        // SW 변경에 실패했습니다. <br> 다시 시도해주세요
        this.$alert(this.$t('service.INSTALL.ALERT.007'), '', { dangerouslyUseHTMLString: true, callback: () => false })
      }
    },
    /**
     * [SW 변경] API 정의
     */
    async updateScript (payload) {
      try {
        await API.sw.updateScript(payload)
        this.refreshVersion()
        this.setSwModal.visible = false
      } catch (error) {
        console.error('@@ updateScript : ', error)
        // SW 변경에 실패했습니다. <br> 다시 시도해주세요
        this.$alert(this.$t('service.INSTALL.ALERT.007'), '', { dangerouslyUseHTMLString: true, callback: () => false })
      }
    },

    // ===============================
    // ========= [SW 버전 삭제] ========
    // ===============================

    /**
     * [SW 버전] 삭제시 세팅
     */
    setDeleteSW (status, item = null) {
      this.deleteSwModal = {
        visible: status,
        item,
        value: undefined,
        disabled: true,
        name: `${this.$route.params.name}` // 삭제시 입력할 이름
      }
    },

    /**
     * [SW 버전] 삭제
     * 삭제 시에는 true 를 내보내주어 액션을 취하고,
     * 아닐경우에는 그냥 삭제 모달 close 만 합니다.
     */
    async deleteSW (action) {
      if (action === true) {
        const response = await API.sw.deleteSwVersion(this.deleteSwModal.item.id)
        if (response) {
          // `${this.deleteSwModal.name}(이)가 삭제되었습니다.
          this.$alert(this.$t('service.INSTALL.ALERT.005', { name: this.deleteSwModal.name }), {
            callback: () => this.refreshVersion()
          })
        }
      }
      return this.setDeleteSW(false)
    },

    // ==========================
    // ========== [공용] =========
    // ==========================

    /**
     * [SW 버전 추가 / 수정] 버전 변경시 발생하는 이벤트 핸들링
     */
    updateSwAction (item) {
      const type = {
        versionAdd: () => this.addSw(item),
        versionUpdate: () => this.updateSw(item)
      }

      return type[this.setSwModal.type]()
    },

    /**
     * 갱신 후 화면을 새로고침합니다.
     */
    async refreshVersion () {
      await this.init()
      if (this.selectedVersion === null) return

      const versionIdx = this.selectedVersion.id
      this.selectedVersion = null

      this.swVersions.forEach(version => {
        if (version.id === versionIdx) {
          this.selectedVersion = version
          return false
        }
      })
    },

    /**
     * 버전 클릭시 발생하는 이벤트입니다
     * @param { Object } item 선택한 버전
     */
    clickVersion (item) {
      if (this.selectedVersion && this.selectedVersion.id === item.id) return

      this.selectedVersion = item
      this.$router.replace({ query: { version: this.selectedVersion.id } })
      this.setVersionBreadcrumb()
    },

    /**
     * [검색] 실행시 동작합니다
     */
    async changeText (value) {
      this.params = { ...this.params, version: value }
      this.init(this.params)
    },
    filterAction (values) {
      this.params = { ...this.params, ...values }
      this.init(this.params)
    },
    filterRest (values) {
      this.params = {}
      this.init(this.params)
    },

    // -------------------------------------------------------------
    // ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ [설치 파일 관리] ○ ○ ○ ○ ○ ○ ○ ○ ○ ○
    // -------------------------------------------------------------

    /**
     * [설치 파일 관리] 목록 세팅
     */
    setInstallFileData (version) {
      const date = date => this.$options.filters.date(date, 'YYYY.MM.DD')
      const size = byte => this.$options.filters.byte(byte)
      const masking = name => this.$options.filters.maskingName(name)

      return version?.fileList.map((file, idx) => {
        const user = (file.createUserName && file.createUserId) ? file.createUserName + ' (' + masking(file.createUserId) + ')' : '-'
        const result = {
          ...file,
          order: idx + 1,
          createDate: date(file.createDate),
          fileName: file.originalName,
          user,
          size: size(file.size)
        }
        return result
      })
    },
    /**
     * [설치 파일] 추가/수정
     * [추가] type: 'add', title: '파일 추가'
     * [추가] type: 'update', title: '파일 수정'
     */
    updateFile (type, title, item = this.selectedVersion) {
      this.setFileModal = {
        visible: true,
        type,
        title,
        data: item
      }
    },
    /**
     * [설치 파일] 삭제
     */
    deleteFile ({ fileName, id, ...row }) {
      // `${fileName}<br>파일을 삭제하시겠습니까?`
      this.$confirm(this.$t('service.INSTALL.ALERT.016', { fileName }), {
        dangerouslyUseHTMLString: true,
        confirmButtonText: this.$t('common.BTN.delete'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        const response = await API.sw.versionFileDelete(id)
        if (response) {
          // `${fileName}<br>파일이 삭제되었습니다.`
          this.$alert(this.$t('service.INSTALL.ALERT.017', { fileName }), {
            dangerouslyUseHTMLString: true,
            callback: () => {
              this.refreshVersion()
              // this.init()
              // console.log(this.selectedVersion)
            }
          })
        }
      }).catch(() => false)
    },

    // -------------------------------------------------------------
    // ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ [설치스크립트 관리] ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○
    // -------------------------------------------------------------

    /**
     * 설치스크립트 목록 데이터 세팅
     * @param { Object } version 버전 정보
     */
    setInstallScriptData (version) {
      const masking = name => {
        if (name) return this.$options.filters.maskingName(name)
      }

      return version?.scriptList?.map(script => ({
        ...script,
        isUse: Boolean(script.isUse),
        statusName: this.simulationStatus[script.status],
        swScriptVersion: version.version + '.' + script.scriptVersion,
        user: script.createUserName + ' (' + masking(script.createUserId) + ')'
      }))
    },

    /**
     * 사용 여부 변경시 동작합니다
     * @param { Object } row 스크립트 버전 목록
     */
    async changeInstallScriptUsage (row) {
      const payload = {
        ...row,
        isUse: Number(row.isUse),
        updateUserIdx: this.user.userIdx,
        updateUserName: this.user.userName,
        updateUserId: this.user.userId
      }
      // console.log(JSON.stringify(payload))
      // console.log(payload)

      const result = await this.updateScriptDetail(payload)
      if (result) this.refreshVersion()
    },

    /**
     * 스크립트 버전 [수정] - 사용 / 미사용 설정
     */
    async updateScriptDetail (payload) {
      try {
        this.loading = true
        const response = await API.sw.updateScriptDetail(payload)
        return response
      } catch (error) {
        console.error('@@ updateScriptDetail : ', error)
        // 작업을 변경하는 도중 문제가 발생하였습니다. <br> 관리자에게 문의해주세요.
        this.$alert(this.$t('task.TODO.DETAIL.errorSave'), { dangerouslyUseHTMLString: true })
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * [설치스크립트] 삭제시 세팅
     */
    setDeleteScript (status, item = null) {
      this.deleteScriptModal = {
        visible: status,
        item,
        value: undefined,
        disabled: true,
        name: `${this.$route.params.name}`
      }
    },
    /**
     * [설치스크립트] 삭제
     * 삭제 시에는 true 를 내보내주어 액션을 취하고,
     * 아닐경우에는 그냥 삭제 모달 close 만 합니다.
     * @param { Boolean } action
     */
    deleteScript (action) {
      if (action === true) {
        const param = {
          name: this.deleteScriptModal.name,
          version: this.deleteScriptModal.item.swScriptVersion
        }
        // `${this.deleteScriptModal.name} Script ${this.deleteScriptModal.item.swScriptVersion} (이)가 <br> 삭제되었습니다.
        this.$alert(this.$t('service.INSTALL.ALERT.018', param), '', {
          dangerouslyUseHTMLString: true,
          callback: async () => {
            // 설치스크립트 삭제
            const response = await API.sw.deleteScript(this.deleteScriptModal.item.id)
            if (response) {
              this.refreshVersion()
              return this.setDeleteScript(false)
            }
          }
        })
      } else return this.setDeleteScript(false)
    }

  },
  data () {
    return {
      loading: false,
      installableVersionCount: 0,
      // 필터링 데이터
      filteringOptions: [
        {
          field: 'osType',
          label: 'OS',
          placeholder: `OS ${this.$t('common.BTN.select')}`,
          selections: []
        },
        {
          field: 'bitType',
          label: this.$t('service.INSTALL.supportBit'), // 지원 Bit
          placeholder: `Bit ${this.$t('common.BTN.select')}`,
          selections: [
            { label: '64 bit', value: 64 },
            { label: '32 bit', value: 32 }
          ]
        },
        {
          field: 'status',
          label: this.$t('service.INSTALL.simulationStatus'), // 시뮬레이션 상태
          // keyPath: 'service.INSTALL.COL.admin.ACCOUNT.state',
          placeholder: `${this.$t('admin.NOTI.state')} ${this.$t('common.BTN.select')}`,
          selections: [
            { label: this.$t('service.INSTALL.STATUS.UNEXECUTED'), value: 'UNEXECUTED' }, // 미실행
            { label: this.$t('service.INSTALL.STATUS.FAILED'), value: 'FAILED' }, // 실패
            { label: this.$t('service.INSTALL.STATUS.SUCCESS'), value: 'SUCCESS' }, // 성공
            { label: this.$t('service.INSTALL.STATUS.IN_PROGRESS'), value: 'IN_PROGRESS' } // 진행중
          ]
        }
      ],
      viewInstallhistory: false, // 설치 이력 조회 모달 on/off
      params: {}, // version 검색시 params
      osTypes: {}, // osType 정리
      swVersions: [],
      rawData: [], // swVersions 를 위한 rawData
      setSwModal: {
        visible: false, // SW 추가 모달 on/off
        type: undefined // SW 추가 :: add / 수정 :: update
      },
      setFileModal: {
        visible: false, // 파일추가 모달 on/off
        type: undefined // 파일추가 :: add / 수정 :: update
      },
      fileUploading: false, // 파일 업로드중인지 상태 확인 (true/false)
      deleteSwModal: { // 삭제할 [SW 버전]
        visible: false,
        item: null,
        value: undefined,
        disabled: true
      },
      deleteScriptModal: { // 삭제할 설치스크립트
        visible: false,
        item: null,
        value: undefined,
        disabled: true
      },
      selectedVersion: null, // 선택된 버전
      setNewTag (createDate) { // 생성된 후 24시간 에만 [N] 태그를 설정합니다
        return (Date.now() - createDate) < 86400000
      },
      installFileColumn: [
        { header: '업로드일', binding: 'createDate', width: 180, keyPath: 'service.INSTALL.COL.uploadDate' },
        { header: '파일 순서', binding: 'order', width: 100, keyPath: 'service.INSTALL.COL.fileOrder' },
        { header: '파일 종류', binding: 'type', width: 200, keyPath: 'service.INSTALL.COL.fileType' },
        { header: '파일 명', binding: 'fileName', keyPath: 'service.INSTALL.COL.fileName' },
        { header: '등록한 계정', binding: 'user', width: 200, keyPath: 'service.INSTALL.COL.regId' },
        { header: '크기', binding: 'size', width: 180, keyPath: 'service.INSTALL.COL.size' },
        { header: '기능', binding: 'fn', width: 135, customHtml: true, keyPath: 'service.INSTALL.COL.func' }
      ],
      installFileData: [], // 설치 파일 관리 목록
      installScriptColumn: [
        { header: 'S/W 버전', binding: 'swScriptVersion', width: 160, keyPath: 'service.INSTALL.COL.swVer' },
        { header: '작성자', binding: 'user', width: 200, keyPath: 'service.INSTALL.COL.writer' },
        { header: '시뮬레이션', binding: 'statusName', width: 160, customHtml: true, keyPath: 'service.INSTALL.COL.simulation' },
        { header: '스크립트', binding: 'script', customHtml: true, keyPath: 'service.INSTALL.COL.script' },
        { header: '사용여부', binding: 'isUsing', width: 160, customHtml: true, keyPath: 'service.INSTALL.COL.isUse' },
        { header: '기능', binding: 'fn', width: 135, align: 'justify', customHtml: true, keyPath: 'service.INSTALL.COL.func' }
      ],
      scriptTypes: [
        { label: 'Install', routeTo: 'install-program-script', query: { script: 'Install' } },
        { label: 'UnInstall', routeTo: 'install-program-script', query: { script: 'Uninstall' } }
        // { label: 'Update', routeTo: 'install-program-script', query: { script: 'Update' } },
        // { label: 'Read', routeTo: 'install-program-script', query: { script: 'Read' } }
      ],
      simulationStatus: { // 시뮬레이션 상태
        UNEXECUTED: { name: this.$t('service.INSTALL.STATUS.UNEXECUTED'), css: '-ing' }, // 미실행
        FAILED: { name: this.$t('service.INSTALL.STATUS.FAILED'), css: '-fail' }, // 실패
        SUCCESS: { name: this.$t('service.INSTALL.STATUS.SUCCESS'), css: '-success' }, // 성공
        IN_PROGRESS: { name: this.$t('service.INSTALL.STATUS.IN_PROGRESS'), css: '-ing' } // 진행중
      },
      // 사용 / 미사용
      isUsingTypes: [{ label: this.$t('service.INSTALL.STATUS.use'), value: true }, { label: this.$t('service.INSTALL.STATUS.noUse'), value: false }],
      isUsingOption: [{ label: this.$t('service.INSTALL.STATUS.use'), value: 1 }, { label: this.$t('service.INSTALL.STATUS.noUse'), value: 0 }],
      installScriptData: [], // 설치스크립트관리
      tabData: [
        { field: 'manageProgram', name: this.$v('VM 별 설치프로그램 관리'), routeTo: 'set-account-user' },
        { field: 'manageScript', name: this.$v('설치스크립트 관리'), routeTo: 'set-account-admin' }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.detail-wrapper {
  display: flex;

  > article:first-child {
    flex: 0 0 270px;
    height: 735px;

    .sw-version-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 25px;
      height: 32px;

      .-name {
        h6 {
          font-size: 16px;
          line-height: 16px;
        }
        small { color: $input-placeholder }
      }
    }

    .versions {
      margin-top: $gap-m;
      padding-right: 10px;;
      overflow-y: auto;
      height: 600px;

      .-item {
        height: 75px;
        border: 1px solid $purple-gray;
        border-radius: 6px;
        margin-bottom: $gap-s;
        display: flex;
        overflow: hidden;
        box-sizing: border-box;
        position: relative;
        cursor: pointer;
        transition: .3s ease background-color;
        &:last-child { margin: 0 }

        &.-selected {
          background-color: $white;
          .-info {
            .name {
              color: $text-black;
              .new { color: $white }
            }
          }
        }

        .status {
          display: block;
          flex: 0 0 5px;

          &.-success { background-color: $sea-blue }
          &.-fail { background-color: $main-red }
          &.-ing { background-color: $yellow }
        }

        .-info {
          padding: 15px;
          .name {
            display: flex;
            align-items: center;
            font-size: 14px;
            margin-bottom: $gap-s;
            line-height: 14px;
            transition: .3s ease color;
          }
        }

        .mdi {
          position: absolute;
          top: 15px; right: 15px;
          cursor: pointer;
        }
      }

      &.-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        color: $input-placeholder;
      }
    }
  }

  > article:last-child {
    margin-left: $gap-m;
    flex: 1 1 auto;
    &.empty {
      height: inherit;
      background: rgba(193, 188, 208, 0.05);
      border: 1px dashed #727797;
      box-sizing: border-box;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $white;
    }

    .simulation {
      &.-success { color: $sea-blue }
      &.-fail { color: $main-red }
      &.-ing { color: $yellow }
    }

    .script-types {
      color: $primary;
      text-decoration: underline;
      justify-content: center;
      li {
        cursor: pointer;
        margin: 0 30px;
      }
    }
  }

  .detail-description-wrapper {
    background-color: $dark-navy;
    max-height: 180px;
    margin-bottom: 40px;
    border-radius: $radius-m;
    padding: $gap;
    box-sizing: border-box;

    .detail-description {
      .version-desc-buttons {
        box-sizing: border-box;
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        height: 32px;

        small {
          display: block;
          height: 18px;
        }

        .button { margin-left: $gap-s; }
      }

      .description {
        margin-top: $gap;
        height: 70px;
        border: none;
        border-radius: 5px;
        box-sizing: border-box;
        overflow-y: auto;
        font-size: 13px;
        color: $light-gray;
        background-color: transparent;
        display: block;
        width: 100%;
        line-height: 1.5;
        resize: none;

        &:focus { outline: none;}
      }
    }

    .install-files { margin-bottom: $gap-s; }

  }

  .script-version-list-wrapper {
    width: 1300px;
  }

  .-title {
    font-size: 15px;
    display: flex;
    align-items: flex-end;

    small {
      display: block;
      margin-left: $gap-s;
      font-weight: normal;
      font-size: 10px;
    }
  }

  .new {
    width: 16px; height: 16px;
    display: block;
    line-height: 18px;
    text-align: center;
    background-color: $primary;
    border-radius: 1px;
    margin-right: 5px;
    font-size: 11px;
    transition: .3s ease color;
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

  .function-icons {
    display: flex;
    align-items: center;
    justify-content: center;
    > i:first-child { margin-right: 30px; }
  }

  .fade-enter-active, .fade-leave-active {
    transition: opacity .2s;
  }
  .fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
    opacity: 0;
  }

}
</style>

<style lang="scss">
.el-tooltip__popper {
  &.edit-modal-popper {
    border: none;
    p {
      line-height: 18px;
      width: auto;
      text-align: center;
      cursor: pointer;
      font-size: 12px;
    }
  }
}

.el-switch.is-checked {
  .el-switch__core {
    &::before { left: -11px !important; }
  }
}
</style>
