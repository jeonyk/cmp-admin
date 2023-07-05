
<template>
  <section class="install-to-vm-wrapper">
    <a
      class="go-back"
      @click="$router.go(-1)"
    >
      <i />
      <!-- 뒤로가기 -->
      {{ $t('service.INSTALL.goBack') }}
    </a>

    <article
      v-loading="versionLoading"
      :class="['label-information-wrapper', { '-is-list' : isInstalledList }]"
    >
      <h5 class="-title">
        {{ label.title }}
      </h5>

      <p
        class="script-version-information"
        v-if="version.swScriptVersion && testvmInfo"
      >
        <!-- 선택된 스크립트 버전 -->
        {{ $t('service.INSTALL.selectedScriptVer') }} : v{{ version.swScriptVersion }}
        <!-- 이 SW은 {Window10(64bits)} 환경에서 vCPU : {4}Core, Memory : {16}GB, Disk : {100}GB에서 테스트되었습니다. -->
        <span>* {{ testvmInfo }} </span>
      </p>
      <p
        class="script-version-information -empty"
        v-else
      >
        <!-- 사용 가능한 Script 가 없습니다. -->
        {{ $t('service.INSTALL.ALERT.023') }}
      </p>

      <textarea
        class="description -outline tiny-scroll"
        readonly
        :value="version.description"
      />

      <div
        :class="`-info ${!version.osName && !version.bitType ? '-empty' : null}`"
      >
        <strong
          class="info type"
          v-if="version.osName"
        >{{ version.osName }}</strong>
        <strong
          class="info bit"
          v-if="version.bitType"
        >{{ version.bitType }}bit</strong>
      </div>
      <!-- /. 💜 설치, 💙 설치 리스트 :: 설치/업데이트 상세 -->

      <!-- /// -->

      <div
        class="update-support-version"
        v-if="isInstalledList"
      >
        <h6>
          <!-- 업데이트 지원 버전 -->
          {{ $t('service.INSTALL.updateSupportVer') }}
        </h6>
        <div class="version-type -outline">
          <span
            class="-version"
            v-for="idx in updateList"
            :key="idx"
          >v{{ idx }}
          </span>
        </div>
      </div>
      <!-- /. 💙 설치리스트 :: 업데이트 지원 버전 -->
    </article>
    <!-- /. 정보 -->

    <article class="program-list-wrapper">
      <h5 class="-title">
        {{ label.listLabel }}
      </h5>

      <!-- 🟡 -->
      <resource-filter-component
        ref="filter"
        :use-title="false"
        @search="setFilter"
      />
      <!-- /. 관조프 -->
      <!-- /. 필터링 -->

      <total-count :total-count="totalResultCnt" />

      <div class="flex-wrap -space-between">
        <!-- 🟡 -->
        <search-bar
          class="search-area"
          :placeholder="`${$v('VM(Host) 명')} ${$v('검색')}`"
          @input="setText"
        />

        <div class="button-space">
          <button
            class="button"
            type="is-primary"
            :disabled="!installHistoryData.length"
            @click="isInstalledList ? allUpdate() : allInstall()"
          >
            <!-- {{ isInstalledList ? '전체 업데이트' : '전체 설치' }} -->
            {{ $t(`service.INSTALL.${isInstalledList ? 'allUpdate' : 'allInstall'}`) }}
          </button>
          <button
            class="button"
            type="is-primary"
            :disabled="!installHistoryData.length || !selectedRows.length"
            @click="isInstalledList ? selectionUpdate() : selectionInstall()"
          >
            <!-- {{ isInstalledList ? '선택 업데이트' : '선택 설치' }} -->
            {{ $t(`service.INSTALL.${isInstalledList ? 'optUpdate' : 'optSelect'}`) }}
          </button>
        </div>
      </div>

      <cmp-grid
        v-loading="loading"
        :item-source="installHistoryData"
        :columns="installHistoryColumn"
        :use-column-filter="false"
        :init-custom-action="initGrid"
        :added-item-formatter="addedItemFormatter"
        :sort-keeping="sortedCol"
        page-keeping
        :paging-size="pageSize"
        selectable
        multi-select
        @total-count="cnt => totalResultCnt = cnt"
        @selectedRows="setSelectedRows"
        @changingPage="setSelectedRowsStyle"
      >
        <template #location="{ row }">
          <div
            class="script-install-execute"
            v-if="row.installing"
          >
            <div class="flex-wrap">
              <button
                :style="`width: ${isInstalledList ? 120 : 110}px`"
                class="button install-button"
                :disabled="row.isOngoing === 1"
                @click="isInstalledList ? eachUpdate(row.row) : eachInstall(row.row)"
              >
                <span class="span">
                  <!-- {{ isInstalledList ? '업데이트 실행' : '설치 실행' }} -->
                  {{ $t(`service.INSTALL.${isInstalledList ? 'executeUpdate' : 'executeInstall'}`) }}
                  <i class="mdi mdi-chevron-right" />
                </span>
              </button>

              <p
                class="version-setting"
                v-if="version.swScriptVersion"
              >
                <!-- 설치 예정 버전 -->
                {{ $t('service.INSTALL.scheduledInstallVer') }} : v{{ version.swScriptVersion }}
              </p>
              <p
                v-else
                class="version-setting"
              >
                {{ $v('설치 가능한 버전이 없습니다.') }}
              </p>
              <!-- >>>> 🌸 {{ row.row.hostName }} {{ row.row.id }} -->
            </div>

            <div class="shell-script-area">
              <CMPCodeEditor :values="row.installResult" />
            </div>
          </div>
        </template>
        <!-- /. 설치 결과화면 -->

        <template #hostName="{row}">
          <div>
            <span
              v-if="row.deleteDate"
              class="new-tag-wh -delete"
            > {{ setDeleteDateState(row.deleteDate) }}</span>
            <!-- 삭제 예정/중/실패-->
            {{ row.hostName }}
          </div>
        </template>

        <template #status="{ row }">
          <cmp-status-tag
            line-style
            :type="row.powerState === 'ON' ? 'is-blue' : 'is-undefined'"
            style="width: 55px"
            :contents="row.powerState"
          />
        </template>

        <template #osVersion="props">
          <div
            class="flex-wrap center"
            v-if="props.row.osType"
          >
            <set-os-icon
              :os-name="props.row.osType"
            />
            ({{ props.row.bits }})
          </div>
          <span v-else>-</span>
        </template>

        <template #spec="{ row }">
          vCPU : {{ row.cpu }}Core, RAM : {{ row.memory }}GB,<br> Disk {{ row.disk }}GB,
          External Disk({{ row.externalDisks ? row.externalDisks.length : 0 }}EA) : {{ row.externalDisk }}GB
        </template>

        <template #install="{ row, cell }">
          <div class="install-button-wrap flex-wrap center">
            <button
              style="width: 90px;"
              class="button install-button"
              type="is-primary"
              :disabled="row.isOngoing === 1"
              @click.stop="installAddRow(row, cell)"
            >
              <span class="span">
                <!-- {{ isInstalledList ? '업데이트' : '설치' }} -->
                {{ $t(`service.INSTALL.${isInstalledList ? 'update' : 'install'}`) }}
                <i :class="['mdi mdi-chevron-down', { '-open': row._open }]" />
              </span>
            </button>
          </div>
        </template>
      </cmp-grid>
    </article>
    <!-- /. 💜 설치, 💙 설치 리스트 :: 설치/업데이트 목록 -->
  </section>
</template>

<script>
import SearchBar from '@/components/SearchBar/SearchBar'
import API, { SetOSIcon, CMPCodeEditor, ResourceFilterComponent } from '@sd-fe/cmp-core'
import { CellRange } from '@grapecity/wijmo.grid'
import { mapState } from 'vuex'
import Dayjs from 'dayjs'

export default {
  name: 'InstallToVM',
  components: {
    'search-bar': SearchBar,
    'set-os-icon': SetOSIcon,
    CMPCodeEditor,
    ResourceFilterComponent
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  created () {
    this.setBreadcrumbs(this.$route)
    this.init()
  },
  methods: {
    async init () {
      console.clear()
      console.log('%c ## Installed VM', 'color: yellow', this.isInstalledList)
      // => (220404) 기획이 잘못되어 [INSTALL VM] 페이지가 삭제되었습니다

      this.version = await this.getSwVersion(this.$route.params.versionId)
      this.version.osName = this.version.osType
      this.testvmInfo = await this.checkTestSuccess()
      if (this.isInstalledList) this.updateList = await this.getUpdateList(this.$route.params.versionId)
      else this.versionLoading = await false

      await this.getVMList()
      // this.scriptList = this.version?.scriptList
      // '사용' 스크립트가 있는 경우만 설정
      if (this.version.usableScript) {
        this.version.swScriptVersion = this.version.version + '.' + this.version.usableScript.scriptVersion
        this.$forceUpdate()
      }
    },

    /**
     * VM 목록을 가져옵니다.
     */
    async getVMList (useInterval = true) {
      const swId = this.$route.params.idx
      const versionId = this.$route.params.versionId

      const beforeLen = this.rawData.length // 업데이트하기 전 rawData 갯수
      this.rawData = this.isInstalledList ? await this.getVmInstalledLists(versionId) : await this.getVmLists(swId)

      // 매번 데이터를 전체 변경하면 시간이 너무 오래걸림 + 깜빡임 현상 있어서
      // 데이터 갯수 없거나 || 데이터에 변경이 있을 경우 (성공해서 VM 목록에서 사라진 경우) 에만 데이터를 전체 변경합니다
      if (!this.installHistoryData.length || beforeLen !== this.rawData.length) this.installHistoryData = JSON.parse(JSON.stringify(this.rawData))
      this.findIsOngoing(this.rawData)

      // 현재 작업중인 내용이 있는지 확인
      const isOngoing = await this.rawData.some(data => data.isOngoing === 1)

      if (useInterval && isOngoing) this.timeout()
    },

    timeout () {
      if (this.time) {
        clearTimeout(this.time)
        this.time = null
      }
      this.time = setTimeout(this.getVMList, 5000)
    },

    // -------------------------------------------------------------
    // ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ [VM Install] ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○
    // -------------------------------------------------------------

    /**
     * VM Install 목록 조회
     */
    async getVmLists (param) {
      try {
        this.loading = true
        const bit = (b) => b.replace(/X/g, '') + 'bit'
        const response = await API.sw.getVmLists({ swId: param })

        const result = response.map(vm => {
          const { externalDisks, externalDisk, disk } = this.calculateExternalDisk(vm.softwareMinionDiskList)

          return {
            ...vm,
            status: vm.isPingOk,
            osVersion: `${vm.osType}${bit(vm.bitType)}`,
            bits: bit(vm.bitType),
            externalDisks,
            externalDisk,
            disk,
            spec: `vCPU : ${vm.cpu}Core, RAM : ${vm.memory}GB, Disk ${disk}GB, External Disk(${vm.softwareMinionDiskList.length}EA) : ${vm.memory}GB`,
            installProgram: `${vm.installSwCnt}EA`,
            location: `${vm.companyName} > ${vm.groupName} > ${vm.projectName}`
          }
        })

        return result // 결과 반환
      } catch (error) {
        console.error('@@ getVmLists', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * [개별 설치] 기능
     * @param { Object } row
     */
    eachInstall (row) {
      const program = this.$route.params.name
      // 현재 VM에 {program} 를 설치하시겠습니까?
      this.$confirm(this.$t('service.INSTALL.ALERT.031', { program }), {
        dangerouslyUseHTMLString: true,
        cancelButtonText: this.$t('common.BTN.cancel'), // 취소
        confirmButtonText: this.$t('service.INSTALL.install') // 설치
      }).then(() => {
        const payload = this.setTestPayload([row], 'INSTALL')
        this.programSetUp(payload)
        setTimeout(() => this.getVMList(), 300)
      }).catch(() => false)
    },

    /**
     * 단체 설치 payload 설정
     */
    setTestPayload (rows = this.selectedRows, scriptType) {
      const params = this.$route.params
      const version = this.version

      // 선택한 VM 들
      const softwareMinionList = rows.map(({ hostUuid, osType, hostName, id, ...row }) => ({ hostUuid, osType, hostName, id }))
      this.setDisableInstallButton(rows.map(({ hostUuid }) => hostUuid))

      const payload = {
        isSimulation: false,
        software: {
          id: params.idx,
          versionList: [ // 현재 보고있는 version 정보
            {
              id: version.id, // version id
              scriptList: [
                { softwareScriptDetailList: [{ scriptType }] }
              ]
            }
          ]
        },
        softwareMinionList
      }

      // console.log(payload)
      // console.log(JSON.stringify(payload))
      return payload
    },

    /**
     * [전체 설치] 기능
     */
    allInstall () {
      if (this.user.userPermLevel !== 0) {
        // 전체 설치는<br>최고 관리자만 수행 가능합니다.
        this.$alert(this.$t('service.INSTALL.ALERT.024'), '', {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
        return
      }

      // 전체 자원에 대해서 ${this.$route.params.name} 를<br>설치하시겠습니까?
      this.$confirm(this.$t('service.INSTALL.ALERT.025', { name: this.$route.params.name }), '', {
        dangerouslyUseHTMLString: true,
        confirmButtonText: this.$t('service.INSTALL.install') // 설치
      }).then(() => {
        const softwareMinionList = this.installHistoryData.map(({ hostUuid, osType, hostName, ...row }) => ({ hostUuid, osType, hostName }))
        const payload = this.setTestPayload(softwareMinionList, 'INSTALL')
        this.programSetUp(payload)
        setTimeout(() => this.getVMList(), 300)
      }).catch(() => false)
    },

    /**
     * [선택 설치] 기능
     */
    selectionInstall () {
      // 선택된 VM에 ${this.$route.params.name} 를<br>설치하시겠습니까?
      this.$confirm(this.$t('service.INSTALL.ALERT.026', { name: this.$route.params.name }), '', {
        dangerouslyUseHTMLString: true,
        confirmButtonText: this.$t('service.INSTALL.install') // 설치
      }).then(() => {
        const payload = this.setTestPayload(this.selectedRows, 'INSTALL')
        this.programSetUp(payload)
        setTimeout(() => this.getVMList(), 300)
      }).catch(() => false)
    },

    /**
     * 설치 진행중인 경우를 확인하여 ProgressBar 를 설정합니다
     */
    findIsOngoing (vms = this.rawData) {
      const findIdx = id => {
        let index
        for (let i = 0; i < this.installHistoryData.length; i++) {
          if (id === this.installHistoryData[i].id) {
            index = i
            break
          }
        }
        return index
      }

      vms.forEach(async vm => {
        const idx = findIdx(vm.id) // 동일한 Index 찾기

        this.installHistoryData[idx].isOngoing = vm.isOngoing // 상태값만 변경하기
        const installArea = this.installHistoryData[idx + 1] // 설치 프로세스 영역

        // 설치 진행중 (1) 일때 설정
        if (vm.isOngoing === 1) {
          const installResult = await this.getInstallProgress(vm.id)
          // console.log(this.installHistoryData[idx]?.hostName, this.installHistoryData[idx])

          // VM 영역이 있고(바로 위가 설치프로세스 영역인 경우인지 확인하기 위함) + 하단에 설치프로세스가 없는 경우만 = 설치프로세스 영역 추가함
          if (this.installHistoryData[idx]?.hostName && !installArea?.installing) {
            this.installHistoryData[idx]._open = true // open 상태 설정
            this.installHistoryData.splice(idx + 1, 0, { installing: true, installResult, isOngoing: vm.isOngoing, row: this.installHistoryData[idx] })
          } else {
            installArea.installResult = installResult
            installArea.isOngoing = vm.isOngoing
          }

        // 설치 안되는중 (0) 일때 설정
        } else {
          // 설치 안되는중인데 설치 프로세스가 노출되는 중이라면 ? 실패 결과 표기만 해줄 예정
          if (installArea?.installing === true && installArea.isOngoing === 1) {
            installArea.installResult += this.$t('service.INSTALL.ALERT.039') // \n> 설치 프로세스가 종료되었습니다.
            installArea.isOngoing = vm.isOngoing
          }
        }
      })
    },
    /**
     * 프로세스 확인
     */
    async getInstallProgress (minionId) {
      try {
        const response = await API.sw.getInstallProgress({ minionId })
        const keys = Object.keys(response)
        const isProcess = new RegExp('is') // is___ 를 포함하고있는 key는 process 를 의미합니다.
        const result = []
        let gauge = 0
        let failed = false

        for (const key of keys) {
          if (isProcess.test(key) === true) {
            result.push(response[key])
            if (response[key] === true) gauge += 1
            if (response[key] === false) failed = true
          }
        }

        const percent = parseInt(10 / result.length)
        const start = this.$t('service.INSTALL.ALERT.040', { version: this.version.version }) // 설치프로그램 명 v${this.version.version} 으로 설치 시작 \n\n
        const fail = failed ? this.$t('service.INSTALL.ALERT.041') : '' // \n>>>>>>>> 설치 실패 <<<<<<<< : ''
        const percentImg = []
        for (let i = 1; i <= gauge; i++) {
          percentImg.push(this.setPercent(percent, i, failed))
        }
        return start + percentImg.join('\n') + fail
      } catch (error) {
        console.error('@@ getInstallProgress', error)
      }
    },

    setPercent (percent, gauge, failed) {
      const full = '■'
      const empty = '□'

      const result = []
      for (let i = 0; i <= 10; i++) {
        const mark = i < percent * gauge ? full : empty
        result.push(mark)
      }

      const process = this.$t('service.INSTALL.ALERT.042', { result: result.join('') }) // 설치 진행중 ${result.join('')}
      return process
    },

    // -------------------------------------------------------------
    // ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ [Installed VM] ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○
    // -------------------------------------------------------------

    /**
     * Installed VM 목록 조회
     */
    async getVmInstalledLists (param) {
      try {
        this.loading = true
        const response = await API.sw.getVmInstalledLists({ versionId: param })
        const result = response.map(vm => {
          const { externalDisks, externalDisk, disk } = this.calculateExternalDisk(vm.softwareMinionDiskList)

          return {
            ...vm,
            status: vm.isPingOk,
            bits: vm.bitType.replace(/X/g, '') + 'bit',
            externalDisks,
            externalDisk,
            spec: `vCPU : ${vm.cpu}Core, RAM : ${vm.memory}GB, Disk ${disk}GB, External Disk(${vm.softwareMinionDiskList.length}EA) : ${vm.memory}GB`,
            currentVer: `v${vm.installedVersion}`,
            location: `${vm.companyName} > ${vm.groupName} > ${vm.projectName}`
          }
        })

        return result
      } catch (error) {
        console.error('@@ getVmLists', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * [개별 업데이트] 기능
     * @param { Object } row
     */
    eachUpdate (row) {
      const program = this.$route.params.name
      // 해당 VM에 {program} 를 {version} 업데이트 하시겠습니까?
      this.$confirm(this.$t('service.INSTALL.ALERT.032', { program, version: this.version.swScriptVersion }), {
        dangerouslyUseHTMLString: true,
        cancelButtonText: this.$t('common.BTN.cancel'), // 취소
        confirmButtonText: this.$t('service.INSTALL.update') // 업데이트
      }).then(() => {
        const payload = this.setTestPayload([row], 'UPDATE')
        this.programSetUp(payload)
        setTimeout(() => this.getVMList(), 300)
      }).catch(() => false)
    },

    /**
     * [전체 업데이트] 기능
     */
    allUpdate () {
      if (this.user.userPermLevel !== 0) {
        // 전체 설치는<br>최고 관리자만 수행 가능합니다.
        this.$alert(this.$t('service.INSTALL.ALERT.024'), '', {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
        return
      }

      const program = this.$route.params.name
      // 전체 자원에 대해서 {program} 를 <br> v{version} 로 업데이트 하시겠습니까?
      this.$confirm(this.$t('service.INSTALL.ALERT.034', { program, version: this.version.swScriptVersion }), '', {
        dangerouslyUseHTMLString: true,
        confirmButtonText: this.$t('service.INSTALL.install') // 설치
      }).then(() => {
        const softwareMinionList = this.installHistoryData.map(({ hostUuid, osType, hostName, ...row }) => ({ hostUuid, osType, hostName }))
        const payload = this.setTestPayload(softwareMinionList, 'UPDATE')
        this.programSetUp(payload)
        setTimeout(() => this.getVMList(), 300)
      }).catch(() => false)
    },

    /**
     * [선택 업데이트] 기능
     */
    selectionUpdate () {
      const program = this.$route.params.name
      // 선택된 VM에 {program} 를<br> v{version} 업데이트 하시겠습니까?
      this.$confirm(this.$t('service.INSTALL.ALERT.035', { program, version: this.version.swScriptVersion }), '', {
        dangerouslyUseHTMLString: true,
        confirmButtonText: this.$t('service.INSTALL.install') // 설치
      }).then(() => {
        const payload = this.setTestPayload(this.selectedRows, 'UPDATE')
        this.programSetUp(payload)
        setTimeout(() => this.getVMList(), 300)
      }).catch(() => false)
    },

    /**
     * [업데이트 지원 버전] 목록 확인
     */
    async getUpdateList (versionId) {
      try {
        const response = await API.sw.getUpdateList({ versionId })
        if (response.length) {
          return response.map(resp => (resp.version))
        } else return response
      } catch (error) {
        console.error('@@ getUpdateList : ', error)
      } finally {
        this.versionLoading = false
      }
    },

    // -------------------------------------------------------------
    // ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ [공통] ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○
    // -------------------------------------------------------------

    /**
     * 다수 VM 에 프로그램 설치
     */
    async programSetUp (payload) {
      this.installHistoryData.forEach(data => { data.isSelected = false })
      this.selectedRows = []
      this.gridRefresh(this.grid)
      try {
        const response = await API.sw.programSetUp({ payload, userIdx: this.user.userIdx })
        return response
      } catch (error) {
        this.$alert(error.response.data.message, { callback: () => false })
        console.error('@@ programSetUp :: ', error)
      }
    },

    /**
     * Breadcrumbs 를 세팅합니다.
     */
    setBreadcrumbs (route) {
      const path = route.path.split('/')
      const name = path[path.length - 1]
      const include = /installed/gi
      this.isInstalledList = include.test(name)

      if (this.isInstalledList === true) { // 설치된 VM 리스트 인경우
        this.label = {
          breadcrumb: this.$t('service.INSTALL.nameInstallList', { name: route.params.name }), // {route.params.name} 설치 리스트
          title: this.$t('service.INSTALL.nameUpdate', { name: route.params.name }), // {route.params.name} 업데이트
          listLabel: this.$t('service.INSTALL.nameInstallVMList', { name: route.params.name }) // {route.params.name} 설치 VM 리스트
        }

        // header: '현재 설치된 버전'
        this.installHistoryColumn.splice(6, 0, { header: this.$t('service.INSTALL.COL.currVer'), binding: 'currentVer', customHtml: true, width: 120 })
      } else { // 설치프로그램 설치 인경우
        this.label = {
          breadcrumb: this.$t('service.INSTALL.nameInstall', { name: route.params.name }), // ${name} 설치
          title: this.$t('service.INSTALL.nameInstall', { name: route.params.name }), // ${name} 설치
          listLabel: this.$t('service.INSTALL.nameInstall', { name: route.params.name }) // ${name} 설치
        }
        this.installHistoryColumn.splice(6, 0, { header: 'Install Program', binding: 'installProgram', width: 120 })
      }

      this.$store.commit('common/ADD_PARAMETERS', {
        label: route.params.name,
        name: 'install-program-detail-view'
      })
      this.$store.commit('common/ADD_PARAMETERS', {
        label: this.label.breadcrumb,
        path: ''
      })
    },

    /**
     * 현재 진입하고있는 스크립트의 상세 정보를 가져옵니다.
     */
    async getSwVersion (versionId) {
      try {
        this.versionLoading = true
        const version = await API.sw.getSwVersion(versionId)
        return version
      } catch (error) {
        console.error('@@ getSwVersion: ', error)
        this.versionLoading = false
      }
    },

    /**
     * [관조프] 설정시 데이터를 검색 시작합니다.
     * @param {Object} value 관조프
     */
    setFilter (value) {
      this.filters = value
      this.searchFilter(this.filters, this.filterText)
    },
    /**
     * [검색 텍스트] 설정시 데이터를 검색 시작합니다.
     * @param {Object} value 텍스트
     */
    setText (value) {
      this.filterText = value
      this.searchFilter(this.filters, this.filterText)
    },

    /**
     * [관조프, 검색] 필터 변경시 발생하는 이벤트
     * @param {Object} values 관조프
     * @param {String} text 검색 텍스트
     */
    searchFilter (values = this.filters, text = this.filterText) {
      let empty = true // 관조프 설정 X 인경우 (전체 인경우)
      for (const key in values) {
        if (values[key] !== null) {
          empty = false
          break
        }
      }

      // [관조프, 검색] 아무것도 설정되지 않은 경우
      if (empty && text === undefined) {
        this.installHistoryData = JSON.parse(JSON.stringify(this.rawData))
        return
      }

      // console.log(values, text)
      this.installHistoryData = this.rawData.filter(vm => {
        const regexp = new RegExp(String(text), 'gi')
        const hostName = text ? regexp.test(vm.hostName) : true

        const companyIdx = values.companyIdx !== null ? values.companyIdx === vm.companyId : true
        const groupIdx = values.groupIdx !== null ? values.groupIdx === vm.groupIdx : true
        const projectIdx = values.projectIdx !== null ? values.projectIdx === vm.projectId : true

        // console.log(vm)
        // console.log(vm.companyId, values.companyIdx)
        // console.log(vm.groupIdx, values.groupIdx)
        // console.log(vm.projectId, values.projectIdx)
        // console.log(hostName, companyIdx, groupIdx, projectIdx)

        return hostName && companyIdx && groupIdx && projectIdx
      })
    },

    /**
     * test 성공여부 확인 (이 SW 는 ~~~ 환경에서 ~~~ 테스트되었습니다 영역)
     */
    async checkTestSuccess () {
      try {
        const versionId = this.$route.params.versionId
        const response = await API.sw.checkTestSuccess({ versionId })
        if (response.length > 0) {
          const { bitType, osType, cpu, memory, softwareMinionDiskList } = response[0]
          const { disk } = this.calculateExternalDisk(softwareMinionDiskList)
          const bit = bitType.replace(/X/gi, '')
          return this.$t('service.INSTALL.ALERT.022', { bit, osType, cpu, memory, disk })
        }
      } catch (error) {
        console.log('@@ checkTestSuccess', error)
        this.versionLoading = false
      }
    },

    /**
     * [설치/업데이트] 클릭시 선택 disabled (UI 에서 일단 처리...)
     * `id` 값(고유값)을 가지고 판별합니다.
     */
    setDisableInstallButton (rows) {
      const uuids = [...rows]
      this.installHistoryData.forEach(item => {
        const index = uuids.indexOf(item.hostUuid)
        if (index > -1) {
          item.isOngoing = 1
          uuids.splice(index, 1)
        }
      })
    },

    /**
     * [설치] 클릭 버튼 클릭시 하단 스크립트 영역 출력
     * @param { Object } row
     * @param { Object } cell
     */
    installAddRow (row, cell) {
      row._open = !row._open

      const index = this.installHistoryData.findIndex(vm => vm.id === row.id) // 삽입할 index 위치를 먼저 확인
      const info = { installing: true, isOngoing: row.isOngoing, installResult: `$ ${row.hostName}[${row.osType}] > ...`, row }

      // 해당 위치 바로 하단에 삽입
      if (row._open) this.installHistoryData.splice(index + 1, 0, info) // row 추가
      else this.installHistoryData.splice(index + 1, 1) // row 삭제

      // 마지막 row일 경우에 삽입 하면 다음장으로 넘어가 버려서 (11), 1 페이지 이상일 경우 첫 번째 row에 추가하면 앞장으로 넘어가버려서 (9)
      // console.log(cell.index)
      // this.pageSize = (this.currPage > 1 && cell.index === 0) || (cell.index % 9 === 0) ? 11 : 10
    },

    /**
     * vm 선택시 다중선택
     * @param { Array } rows
     */
    setSelectedRows (rows) {
      // [설치 상태] 를 제외하고만 선택합니다
      this.selectedRows = rows.filter(row => row.installing !== true)
    },

    initGrid (grid) {
      this.grid = grid

      // sorting 이벤트 발생할 경우 저장
      grid.sortingColumn.addHandler((s, e) => {
        const col = s.columns[e.col]
        const asc = col.currentSort !== '+'

        this.sortedCol = { binding: col.binding, asc }
      })

      // 프로세스 가로 병합
      grid.mergeManager.getMergedRange = (panel, r, c, clip) => {
        const rng = new CellRange(r, c)
        const dataItem = panel.rows[rng.row].dataItem

        if (dataItem && dataItem.installing) {
          // 가로(column) 병합
          for (let i = rng.col; i < panel.columns.length - 1; i++) rng.col2 = i + 1
          for (let i = rng.col; i > 0; i--) rng.col = i - 1
        }
        return rng
      }
    },
    gridRefresh () {
      const cv = this.grid.collectionView
      if (cv) cv.refresh()
      this.selectedRows = []
    },
    addedItemFormatter (panel, r, c, cell) {
      if (panel.cellType === 2) return false

      panel.rows.forEach((row, idx) => {
        if (row.dataIndex !== -1) row.height = 70
        // 설치 실행 영역 row hover 효과 덮어썼음
        if (row.dataItem && row.dataItem.installing === true) {
          row.height = 380
          row.cssClass = 'is-shell-script'
        }
      })

      this.setSelectedRowsStyle()
    },

    /**
     * 멀티 셀렉트 사용시 페이지를 이동할때 자동으로 이전페이지의 선택된 항목을 선택하게 합니다.
     */
    setSelectedRowsStyle (page) {
      if (page) this.currpage = page
      const selectedRowsIdx = this.selectedRows.map(item => item.id)

      this.$nextTick(() => {
        this.grid.rows.forEach(row => {
          const indexOf = selectedRowsIdx.indexOf(row.dataItem.id)
          if (indexOf > -1) {
            row.dataItem.isSelected = true
            row.cssClass = 'selected-row'
          }
        })
      })
    },
    setDeleteDateState (deleteDate) {
      const today = Dayjs().format('YYYY-MM-DD')
      const delDate = Dayjs(deleteDate).format('YYYY-MM-DD')
      const isBeforeDelDate = Dayjs(today).isBefore(delDate)
      if (isBeforeDelDate) return this.$t('task.TODO.beDeleted') // '삭제 예정' : 삭제 일 > 오늘
      else if (Dayjs(today).isSame(delDate)) return this.$t('common.TERMS.deleting') // '삭제 중' : 삭제 일 = 오늘
      else if (!isBeforeDelDate) return this.$t('common.ALERT.BASE.038')// '삭제 실패' : 삭제 일 < 오늘
    }

  },
  destroyed () {
    clearTimeout(this.time)
  },
  data () {
    return {
      testvmInfo: undefined,
      loading: false,
      versionLoading: false,
      osTypes: [],
      filters: { companyIdx: null, groupIdx: null, projectIdx: null },
      filterText: undefined,
      version: {},
      isInstalledList: false,
      updateList: [],
      label: {
        breadcrumb: undefined,
        title: undefined,
        listLabel: undefined
      },
      grid: null,
      currpage: 1,
      pageSize: 10,
      selectedRows: [],
      installHistoryColumn: [
        { header: '프로젝트 위치', binding: 'location', customHtml: true, keyPath: 'service.INSTALL.COL.projectLoc' },
        { header: 'VM(Host) 명', binding: 'hostName', width: 300, keyPath: 'service.INSTALL.COL.hostName', customHtml: true },
        { header: '상태', binding: 'status', width: 100, customHtml: true, keyPath: 'service.INSTALL.COL.status' },
        { header: 'OS Version(Bits)', binding: 'osVersion', width: 200, customHtml: true },
        { header: 'VM(Host) IP', binding: 'ip', width: 200 },
        { header: '기본 사양', binding: 'spec', width: 280, keyPath: 'service.INSTALL.COL.spec', customHtml: true },
        // { header: 'Install Program', binding: 'program', customHtml: true, width: 120 },
        // { header: '현재 설치된 버전', binding: 'program', customHtml: true, width: 120 },
        { header: ' ', binding: 'install', customHtml: true, width: 110, cssClass: 'open-install', sorting: false }
      ],
      installHistoryData: [],
      rawData: [],
      totalResultCnt: 0,
      sortedCol: null,
      calculateExternalDisk (softwareMinionDiskList) {
        const externalDisks = []
        const disks = []

        // 🌸 디버깅용
        // const debuggingDisk = softwareMinionDiskList.map(disk => { return { type: disk.deviceBus, size: disk.size, disk: disk.diskIndex === 0 } })

        if (softwareMinionDiskList.length) {
          // Disk 사이즈
          softwareMinionDiskList.forEach(disk => {
            if (disk.deviceBus === 'SCSI' && disk.diskIndex === 0) disks.push(disk.size || 0)
            else externalDisks.push(disk.size || 0)
          })
        }

        const sum = (array) => {
          if (!array.length) return 0
          return array.reduce((acc, curr) => {
            acc += curr
            return acc
          })
        }

        const externalDisk = sum(externalDisks)
        const disk = sum(disks)

        // console.log(debuggingDisk, { externalDisks, externalDisk, disk })
        return { externalDisks, externalDisk, disk }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.install-to-vm-wrapper {
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

  .label-information-wrapper {
    background-color: $dark-navy;
    height: 230px;
    margin-bottom: 70px;
    border-radius: $radius-m;
    padding: $gap $gap $gap-m $gap;
    box-sizing: border-box;

    .-title { margin-bottom: 10px; }

    .script-version-information {
      color: $light-gray;
      font-size: 13px;
      span {
        color: $primary;
        display: inline-block;
        margin-left: $gap-s;
      }

      &.-empty {
        color: $input-placeholder;
      }
    }

    .-outline {
      margin-top: 10px;
      border: 1px solid $purple-gray;
      border-radius: 5px;
      box-sizing: border-box;
      overflow-y: auto;
    }

    .description {
      height: 100px;
      padding: 15px;
      font-size: 13px;
      color: $light-gray;
      margin-bottom: $gap-s;
      font-size: 13px;
      color: $light-gray;
      background-color: transparent;
      display: block;
      width: 100%;
      line-height: 1.5;
      resize: none;

      &:focus { outline: none;}
    }

    .-info.-empty { height: 20px; }
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

    &.-is-list {
      height: 355px;
      .update-support-version {
        margin-top: 20px;
        h6 { font-size: 13px; }
        .version-type {
          height: 80px;
          padding: $gap-s;

          .-version {
            border-radius: 25px;
            background-color: #C0CAF5;
            line-height: 22px;
            padding: 0 7px;
            margin-right: 5px;
            color: $primary;
            font-size: 12px;
            font-weight: 700;
          }
        }
      }

    }
  }

  .program-list-wrapper {
    .-title { margin-bottom: $gap; }

    .filter-wrapper {
      display: flex;
      margin-bottom: 15px;

      .filtering-list {
        display: flex;
        align-items: center;
        margin-right: 40px;

        .filter-name {
          display: block;
          margin-right: $gap-s;
        }

        .el-input {
          width: 140px;
        }
      }
    }

    .search-area {
      margin: $gap-s 0 15px 0;
    }

    .button-space {
      button { margin-left: $gap-s; }
    }

    .script-install-execute {
      .version-setting {
        margin-left: 15px;
      }

      .shell-script-area {
        margin-top: 15px;
        background-color: $dark-navy;
        height: 300px;
        border-radius: $radius-s;
        box-sizing: border-box;
        line-height: 24px;
        overflow-y: auto;
        text-align: left;
      }
    }
  }

  .install-button-wrap { height: 70px; }

  .install-button {
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    span {
      display: flex;
      align-items: center;
      .mdi {
        margin-left: 5px;
        display: block;
        transition: .3s ease transform;
        &::before { font-size: 13px; }

        &.-open  {
          transform: rotate(-180deg);
        }
      }
    }
  }
}
</style>

<style lang="scss">
.install-to-vm-wrapper {
  .wj-cells {
    .wj-cell.open-install {
      padding: 0;
    }

    .wj-row {
      .wj-cell { padding: 0; }
      &:hover {
        .wj-cell.is-shell-script {
          cursor: auto;
          background: transparent;
          color: $light-gray;
        }
      }
    }
  }
}

.new-tag-wh {
  display: inline-block;
  padding: 0 3px;
  width: 16px;
  min-height: 16px;
  line-height: 14px;
  text-align: center;
  color: $white;
  font-weight: bold;
  background-color: $primary;
  border: 1px solid $primary;
  // border-radius: 11px;
  font-size: 11px;
  &.-delete {
    padding: 0 2px;
    width: auto;
    font-weight: normal;
    // color: $main-sred;
    background-color: $input-placeholder;
    border-color: $input-placeholder;
  }
}

</style>
