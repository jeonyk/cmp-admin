
<template>
  <article class="install-to-vm-wrapper">
    <resource-filter-component
      :module-type="moduleType"
      ref="filter"
      :use-title="false"
      @search="setFilter"
    >
      <div class="filter-options -checkbox">
        <el-checkbox
          @change="setFilter(filtersCheckbox)"
          v-model="filtersCheckbox.requested"
        >
          {{ $v('요청된 VM만 보기') }}
        </el-checkbox>
        <el-checkbox
          @change="setFilter(filtersCheckbox)"
          v-model="filtersCheckbox.urgent"
        >
          {{ $v('긴급 자원만 보기') }}
        </el-checkbox>
      </div>
    </resource-filter-component>
    <!-- /. 관조프 -->
    <!-- /. 필터링 -->

    <total-count :total-count="totalResultCnt" />

    <div class="flex-wrap -space-between">
      <search-bar
        class="search-area"
        :placeholder="`${$v('VM(Host) 명')} ${$v('검색')}`"
        @input="setText"
      />

      <div class="button-space">
        <button
          class="button"
          type="is-primary"
          :disabled="buttonDisabled()"
          @click="eachInstall({ installType: 'SCRIPT', scriptType: 'INSTALL' })"
        >
          {{ $v('설치 Script 수행') }}
        </button>
        <button
          class="button"
          type="is-primary"
          :disabled="buttonDisabled()"
          @click="eachInstall({ installType: 'MANUAL', scriptType: 'INSTALL' })"
        >
          {{ $v('설치 Manual 수행') }}
        </button>
        <button
          class="button"
          type="is-primary"
          :disabled="buttonDisabled()"
          @click="eachInstall({ installType: 'SCRIPT', scriptType: 'UNINSTALL' })"
        >
          {{ $v('삭제 Script 수행') }}
        </button>
        <button
          class="button"
          type="is-primary"
          :disabled="buttonDisabled()"
          @click="eachInstall({ installType: 'MANUAL', scriptType: 'UNINSTALL' })"
        >
          {{ $v('삭제 Manual 수행') }}
        </button>
      </div>
    </div>

    <cmp-grid
      style="width: 1300px;"
      v-loading="loading"
      :item-source="installHistoryData"
      :columns="installHistoryColumn"
      :header-merge="headerMergeColumns"
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
        <installing-result :data="row" />
      </template>
      <!-- /. 설치 결과화면 -->

      <template #status="{ row }">
        <vm-status :data="row" />
      </template>
      <!-- /. VM상태 -->

      <template #osVersion="{ row }">
        <os-version :data="row" />
      </template>
      <!-- /. /. OS 버전 -->

      <template #spec="{ row }">
        <basic-spec :data="row" />
      </template>
      <!-- /. 기본 사양 -->

      <template #scriptexcute="{ row }">
        <script-execute
          :data="row"
          use-tooltip
        />
      </template>
      <!-- /. Script 수행 가능 여부 -->

      <template #installStatus="{ row }">
        <script-status-simple
          :data="row"
          binding="installStatus"
        />
      </template>
      <template #uninstallStatus="{ row }">
        <script-status-simple
          :data="row"
          binding="uninstallStatus"
        />
      </template>
      <!-- /. 설치 / 삭제 Script 수행 상태 -->

      <template #installVersionList="{ row }">
        <div class="flex-wrap center">
          <el-tooltip
            effect="light"
            :disabled="row.installVersionList.length < 1"
          >
            <span>{{ installVersionListValue(row) }}</span>
            <div
              slot="content"
              v-html="installVersionListContent(row)"
            />
          </el-tooltip>
        </div>
      </template>
      <!-- /. 현재 설치된 버전  -->

      <template #install="{ row }">
        <process-button
          :data="row"
          @click="installAddRow(row, 'vmUuid')"
        />
      </template>
      <!-- /. 진행상황 -->
    </cmp-grid>
  </article>
</template>

<script>
import SearchBar from '@/components/SearchBar/SearchBar'
import InstallProgramMixins from '../InstallProgramMixins.script'
import API, { ResourceFilterComponent } from '@sd-fe/cmp-core'
import { VMStatus, OSVersion, BasicSpec, ScriptExecute, ScriptStatusSimple, ProcessButtton, InstallingResult } from '../InstallVMListContents.script'

export default {
  name: 'InstallVMList',
  mixins: [InstallProgramMixins],
  components: {
    'search-bar': SearchBar,
    'vm-status': VMStatus,
    'os-version': OSVersion,
    'basic-spec': BasicSpec,
    'script-execute': ScriptExecute,
    'script-status-simple': ScriptStatusSimple,
    'process-button': ProcessButtton,
    'installing-result': InstallingResult,
    ResourceFilterComponent
  },
  watch: {
    '$route.query' ({ version }) {
      this.init()
    }
  },
  created () {
    if (this.$route.query.version) this.init()
  },
  methods: {
    async init () {
      this.version = await this.getSwVersion(this.$route.query.version)
      this.version.osName = this.version.osType

      this.versionLoading = await false

      await this.getVMList()

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
      const beforeLen = this.rawData.length // 업데이트하기 전 rawData 갯수
      const params = { ...this.filters, keyword: this.filterText } // 필터링 조건
      this.rawData = await this.getVMListData({ vmType: this.cloud, ...params })

      // 매번 데이터를 전체 변경하면 시간이 너무 오래걸림 + 깜빡임 현상 있어서
      // 데이터 갯수 없거나 || 데이터에 변경이 있을 경우 (성공해서 VM 목록에서 사라진 경우) 에만 데이터를 전체 변경합니다 (필터링 조건이 있는 상태로!)
      if (!this.installHistoryData.length || beforeLen !== this.rawData.length) this.installHistoryData = JSON.parse(JSON.stringify(this.rawData))

      // 현재 작업중인 내용이 있는지 확인 (진행중이라면 interval)
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
    // ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ [VM 목록 저장] ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○
    // -------------------------------------------------------------

    /**
     * VMList 불러오기
     * @param {Object} params
     */
    async getVMListData (params) {
      try {
        const response = await API.sw.getVmLists(params)

        const result = response.map(({ vm }) => {
          const { externalDisks, externalDisk, disk } = this.calculateExternalDisk(vm.diskList)

          // console.log(vm)
          return {
            ...vm,
            disk,
            ...this.setExecuteStatus(vm),
            bits: vm.osType?.replace(/X/g, '') + 'bit',
            externalDiskDisplay: { externalDisks, externalDisk },
            isOngoing: vm.isOngoing,
            installProgramCnt: vm.installProgramCnt + 'EA',
            location: `${vm.companyName} > ${vm.groupName} > ${vm.projectName}`
          }
        })

        // 기타 옵션 체크체크
        const { requested, urgent } = params

        // 요청된 VM 만 보기 / 긴급 자원만 보기
        if (requested || urgent) {
          return result.filter(vm => {
            const requested = (params.requested) ? params.requested === vm.isOrder : true
            const isUrgent = (params.urgent) ? params.urgent === vm.isUrgent : true

            return requested && isUrgent
          })
        }

        return result
      } catch (error) {
        console.error('@@ InstallVMList > getVMListData', error)
      }
    },

    // -------------------------------------------------------------
    // ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ [공통] ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○
    // -------------------------------------------------------------

    /**
     * 단체 설치 payload 설정
     * @param { Array } rows 선택한 vm목록
     * @param { String } scriptType INSTALL|UNINSTALL
     */
    setTestPayload (rows = this.selectedRows, { installType, scriptType }) {
      const params = this.$route.params
      const version = this.version

      // 선택한 VM 들
      const vmList = rows.map(({ vmUuid, osType, vmName, vmType, ...row }) => ({ vmUuid, osType, vmName, vmType }))

      // console.log(version.usableScript)
      const payload = {
        isSimulation: false,
        software: {
          id: params.idx,
          versionList: [ // 현재 보고있는 version 정보
            {
              id: version.id, // version id
              installType,
              scriptList: [
                {
                  id: version.usableScript.id, // 사용 가능한 script id
                  softwareScriptDetailList: [{ scriptType }]
                }
              ]
            }
          ]
        },
        vmList
      }

      // console.log(payload)
      // console.log(JSON.stringify(payload))
      return payload
    },

    /**
     * [선택 설치/삭제] 기능
     * @param { String } installType MANUAL|SCRIPT
     * @param { String } scriptType INSTALL|UNINSTALL
     */
    eachInstall (options) {
      const program = this.$route.params.name
      const { usableScript } = this.version
      if (!usableScript) return this.$alert(this.$v('해당 설치프로그램에 사용 가능한 스크립트가 없습니다.'))

      // 현재 VM에 {program} 를 설치하시겠습니까?
      this.$confirm(this.$t('service.INSTALL.ALERT.031', { program }), {
        dangerouslyUseHTMLString: true,
        cancelButtonText: this.$t('common.BTN.cancel'), // 취소
        confirmButtonText: this.$t('service.INSTALL.install') // 설치
      }).then(() => {
        const payload = this.setTestPayload(this.selectedRows, options)
        this.programSetUp(payload)
        setTimeout(() => this.getVMList(), 300)
      }).catch(() => false)
    },

    /**
     * 다수 VM 에 설치/삭제 Script 수행
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
     * 현재 진입하고있는 스크립트의 버전 상세 정보를 가져옵니다.
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
      this.filters = { ...this.filters, ...value }
      // console.log(this.filters)
      this.getVMList()
    },
    /**
     * [검색 텍스트] 설정시 데이터를 검색 시작합니다.
     * @param {Object} value 텍스트
     */
    setText (value) {
      this.filterText = value
      this.getVMList()
    },

    /**
     * vm 선택시 다중선택
     * @param { Array } rows
     */
    setSelectedRows (rows) {
      this.selectedRows = [...rows]
      // console.log(this.selectedRows)
    }
  },
  destroyed () {
    clearTimeout(this.time)
  },
  data () {
    return {
      loading: false,
      versionLoading: false,
      filters: { companyIdx: null, groupIdx: null, projectIdx: null },
      filtersCheckbox: { requested: undefined, urgent: undefined },
      filterText: undefined,
      version: {},
      updateList: [],
      selectedRows: [],
      installHistoryColumn: [
        { header: this.$v('프로젝트 위치'), binding: 'location', width: 280, customHtml: true },
        { header: this.$v('VM(Host) 명'), binding: 'vmName', width: 150, customHtml: true },
        { header: this.$v('주문번호'), binding: 'orderNo', width: 100, customHtml: true },
        { header: this.$v('VM 상태'), binding: 'status', width: 100, customHtml: true },
        { header: this.$v('OS 버전(Bits)'), binding: 'osVersion', width: 200, customHtml: true },
        { header: this.$v('기본 사양'), binding: 'spec', width: 280, customHtml: true },
        { header: 'VM(Host) IP', binding: 'ipAddress', width: 150 },
        { header: 'Install Prgram', binding: 'installProgramCnt', width: 100, customHtml: true },
        { header: this.$v('Script 수행 가능여부'), binding: 'scriptexcute', width: 150, customHtml: true },

        { header: this.$v('Script'), binding: 'installscript', width: 150, customHtml: true },
        { header: this.$v('Manual'), binding: 'installmanual', width: 150, customHtml: true },
        { header: this.$v('Script'), binding: 'uninstallScript', width: 150, customHtml: true },
        { header: this.$v('Manual'), binding: 'uninstallManual', width: 150, customHtml: true },

        { header: this.$v('설치상태'), binding: 'statusLabel', width: 100, customHtml: true },
        { header: this.$v('설치 Script 수행 상태'), binding: 'installStatus', width: 150, customHtml: true },
        { header: this.$v('삭제 Script 수행 상태'), binding: 'uninstallStatus', width: 150, customHtml: true },
        { header: this.$v('현재 설치된 버전'), binding: 'installVersionList', width: 120, customHtml: true },
        { header: ' ', binding: 'install', customHtml: true, width: 110, cssClass: 'open-install', sorting: false }
      ],
      headerMergeColumns: {
        colSpan: [
          { startIdx: 9, endIdx: 10, header: this.$v('설치 Script 수행 여부') },
          { startIdx: 11, endIdx: 12, header: this.$v('삭제 Script 수행 여부') }
        ],
        rowSpan: ['location', 'vmName', 'status', 'orderNo', 'osVersion', 'ipAddress', 'spec', 'installProgramCnt', 'scriptexcute', 'status', 'installStatus', 'uninstallStatus', 'installVersionList', 'install']
      },
      installHistoryData: [],
      rawData: [],
      /**
       * [설치 / 삭제 Script 수행] 버튼 disabled 조건 추가
       * 설치 진행중(1)인 VM이 있다면 설치 불가능
       * @return {Boolean}
       */
      buttonDisabled () {
        const condition = this.selectedRows.every(({ isOngoing }) => isOngoing === 0)
        return !this.installHistoryData.length || !this.selectedRows.length || !condition
      },
      /**
       * [현재 설치된 버전] 값 설정
       */
      installVersionListValue ({ installVersionList }) {
        if (installVersionList.length === 0) return '-'

        if (installVersionList.length === 1) return installVersionList[0].version
        else return `${installVersionList[0].version} ${this.$v('외')} ${installVersionList.length - 1}`
      },
      installVersionListContent ({ installVersionList }) {
        return installVersionList?.map(({ version }) => version).join('<br>')
      },

      /**
       * 참고 (https://docs.google.com/presentation/d/1Zfjt8PGQi1U6UDnm--xyHMkhfgxDxdbw/edit#slide=id.p15)
       *
       * (- 없음, $ 설치중, O 설치됨|성공, X 미설치|삭제)
       *
       *   0. 기본
       *       - 설치 Script (-) Manual (X) | 삭제 Script (-) Manual (-)  | 설치상태 (X) | 설치 Script 수행 상태 (-) | 삭제 Script 수행 상태 (-)
       *   1. Manual로만 설치 가능
       *       - 설치 Script (X) Manual (X) |  삭제 Script (-) Manual (-) | 설치상태 (X) | 설치 Script 수행 상태 (-) | 삭제 Script 수행 상태 (-)
       *
       *   2. 설치 Script 수행 { [Script] 클릭 => 진행중 => 성공/실패 }
       *       - 설치 Script ($) Manual (X) | 삭제 Script (-) Manual (-) | 설치상태 (X) | 설치 Script 수행 상태 ($) | 삭제 Script 수행 상태 (O) [진행중]
       *       - 설치 Script (O) Manual (X) | 삭제 Script (-) Manual (-) | 설치상태 (O) | 설치 Script 수행 상태 (O) | 삭제 Script 수행 상태 (-) [성공]
       *       - 설치 Script (X) Manual (X) | 삭제 Script (-) Manual (-) | 설치상태 (X) | 설치 Script 수행 상태 (X) | 삭제 Script 수행 상태 (-) [실패]
       *
       *   3. 설치 Manual 수행 { [Manual] 클릭 => 진행중 => 성공/실패 }
       *       - 설치 Script (X) Manual ($) | 삭제 Script (-) Manual (-) | 설치상태 (X) | 설치 Script 수행 상태 ($) | 삭제 Script 수행 상태 (-) [진행중]
       *       - 설치 Script (X) Manual (O) | 삭제 Script (-) Manual (-) | 설치상태 (X) | 설치 Script 수행 상태 (O) | 삭제 Script 수행 상태 (-) [성공]
       *       - 설치 Script (X) Manual (X) | 삭제 Script (-) Manual (-) | 설치상태 (X) | 설치 Script 수행 상태 (X) | 삭제 Script 수행 상태 (-) [실패]
       *
       *
       *   4. 삭제 Script 수행 { [Script] 클릭 => 진행중 => 성공/실패 }
       *       - 설치 Script (O) Manual (X) | 삭제 Script ($) Manual (-) | 설치상태 (O) | 설치 Script 수행 상태 (-) | 삭제 Script 수행 상태 ($) [진행중]
       *       - 설치 Script (X) Manual (X) | 삭제 Script (-) Manual (-) | 설치상태 (X) | 설치 Script 수행 상태 (-) | 삭제 Script 수행 상태 (O) [성공]
       *       - 설치 Script (O) Manual (X) | 삭제 Script (-) Manual (-) | 설치상태 (O) | 설치 Script 수행 상태 (-) | 삭제 Script 수행 상태 (X) [실패]
       *
       *   5. 삭제 Manual 수행 { [Manual] 클릭 => 진행중 => 성공/실패 }
       *       - 설치 Script (X) Manual (O) | 삭제 Script (-) Manual ($) | 설치상태 (O) | 설치 Script 수행 상태 (-) | 삭제 Script 수행 상태 ($) [진행중]
       *       - 설치 Script (X) Manual (X) | 삭제 Script (-) Manual (-) | 설치상태 (X) | 설치 Script 수행 상태 (-) | 삭제 Script 수행 상태 (O) [성공]
       *       - 설치 Script (X) Manual (O) | 삭제 Script (-) Manual (-) | 설치상태 (O) | 설치 Script 수행 상태 (-) | 삭제 Script 수행 상태 (X) [실패]
       *
       *   ** 예외 :: 사용가능 스크립트(usableScript)가 없다면 [Script] 로 설치 불가능
       *       - 설치 Script (X) Manual (#) | 삭제 Script (X) Manual (#)
       */

      setExecuteStatus ({ progressList }) {
        // 0. 기본
        if (progressList.length === 0) {
          return {
            installscript: this.$v('미설치'),
            installmanual: this.$v('미설치'),
            uninstallScript: '-',
            uninstallManual: '-',
            statusLabel: this.$v('미설치')
          }
        }

        let curr = null

        for (const progress of progressList) {
          if (curr === null) {
            curr = progress // 처음이라면 일단 한번 상태 저장
            continue
          }

          // 최신 상태가 있는지 먼저 비교함 => 가장 최신상태만 보여주기로 함 (바꿔치기~)
          if (curr.endTime < progress.endTime) curr = progress
        }

        const { state, type: scriptType, installType } = curr

        const labels = {
          INSTALL: { IN_PROGRESS: this.$v('설치중'), SUCCESS: this.$v('설치됨'), FAILED: this.$v('실패') },
          UNINSTALL: { IN_PROGRESS: this.$v('삭제중'), SUCCESS: '-', FAILED: this.$v('실패') }
        }[scriptType][state]

        // console.log(labels, state, scriptType, installType)
        // console.log(progressList, states)

        const installscript = (scriptType === 'INSTALL') && (installType === 'SCRIPT') ? labels : this.$v('미설치')
        const installmanual = (scriptType === 'INSTALL') && (installType === 'MANUAL') ? labels : this.$v('미설치')
        const uninstallScript = (scriptType === 'UNINSTALL') && (installType === 'SCRIPT') ? labels : '-'
        const uninstallManual = (scriptType === 'UNINSTALL') && (installType === 'MANUAL') ? labels : '-'

        const statusLabel = (scriptType === 'INSTALL') && (state === 'SUCCESS') ? this.$v('설치됨') : this.$v('미설치')

        const installStatus = (scriptType === 'INSTALL') ? state : undefined
        const uninstallStatus = (scriptType === 'UNINSTALL') ? state : undefined

        return {
          installscript,
          installmanual,
          uninstallScript,
          uninstallManual,
          statusLabel, // 설치 상태
          installStatus, // 설치 Script 수행 상태
          uninstallStatus// 삭제 Script 수행 상태
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.install-to-vm-wrapper {
  position: relative;

  .-checkbox {
    > label {
      margin-right: $gap;
    }
  }

  .search-area {
    margin: $gap-s 0 15px 0;
  }

  .button-space {
    button { margin-left: $gap-s; }
  }
}
</style>
