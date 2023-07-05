
<template>
  <section class="install-program-vmsr">
    <article class="program-list-wrapper">
      <h5 class="-title">
        {{ $v('서버정보') }}
      </h5>

      <div class="program-detail">
        <register-contents
          v-for="{ field, label } in vmInfo"
          :key="field"
          :title="label"
        >
          <!-- {{ field }} -->
          <component
            v-if="setVMInfo[field]"
            :is="setVMInfo[field]"
            :data="vmData"
          />
          <span v-else>{{ vmData[field] }}</span>
        </register-contents>
      </div>
    </article>
    <!-- /. 서버 정보 -->

    <article>
      <h5 class="-title">
        {{ $v('설치프로그램 목록') }}
      </h5>

      <cmp-grid
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
        @total-count="cnt => totalResultCnt = cnt"
        @changingPage="setSelectedRowsStyle"
      >
        <template #location="{ row }">
          <installing-result :data="row" />
        </template>
        <!-- /. 설치 결과화면 -->

        <template #installScript="{ row }">
          <!-- {{ row.installType }} -->
          <button
            class="button"
            :disabled="row.installScript"
            @click="eachInstall({ scriptType: 'INSTALL', scriptType: 'INSTALL', row })"
          >
            {{ $v('설치') }}
          </button>
        </template>
        <template #installManual="{ row }">
          <button
            class="button"
            :disabled="row.installManual"
            @click="setManualScript({ scriptType: 'INSTALL', row })"
          >
            {{ $v('설치 처리완료') }}
          </button>
        </template>
        <template #uninstallScript="{ row }">
          <button
            class="button"
            :disabled="row.uninstallScript"
            @click="eachInstall({ scriptType: 'UNINSTALL', row })"
          >
            {{ $v('삭제') }}
          </button>
        </template>
        <template #uninstallManual="{ row }">
          <button
            class="button"
            :disabled="row.uninstallManual"
            @click="setManualScript({ scriptType: 'UNINSTALL', row })"
          >
            {{ $v('삭제 처리완료') }}
          </button>
        </template>
        <!-- /. 설치 / 삭제 Script 수행 여부 (SCRIPT / MANUAL) -->

        <template #installStatus="{ row }">
          <script-status
            :data="row"
            binding="installStatus"
          />
        </template>
        <template #uninstallStatus="{ row }">
          <script-status
            :data="row"
            binding="uninstallStatus"
          />
        </template>
        <!-- /. 설치 / 삭제 Script 수행 상태 -->

        <template #install="{ row }">
          <process-button
            :data="row"
            @click="installAddRow(row, 'versionId')"
          />
        </template>
        <!-- /. [진행상황] 버튼 -->
      </cmp-grid>
    </article>
  </section>
</template>

<script>
import InstallProgramMixins from '../InstallProgramMixins.script'
import API from '@sd-fe/cmp-core'
import { VMStatus, BasicSpec, ScriptExecute, ScriptStatusSimple, ProcessButtton, InstallingResult } from '../InstallVMListContents.script'

export default {
  name: 'InstallVMListDetail',
  mixins: [InstallProgramMixins],
  components: {
    'script-status': ScriptStatusSimple,
    'vm-status': VMStatus,
    'basic-spec': BasicSpec,
    'script-execute': ScriptExecute,
    'process-button': ProcessButtton,
    'installing-result': InstallingResult
  },
  created () {
    this.init()
  },
  methods: {
    async init () {
      await this.getVersionList({ vmType: this.cloud })
    },

    /**
     * 버전 목록을 가져옵니다.
     * @param {Object} params
     */
    async getVersionList (useInterval = true) {
      const beforeLen = this.rawData.length // 업데이트하기 전 rawData 갯수
      const { vm, versionList } = await this.getVersionListData({ vmType: this.cloud })

      this.vmData = this.setVMData(vm)
      this.rawData = this.setVersionList(vm, versionList)

      // 매번 데이터를 전체 변경하면 시간이 너무 오래걸림 + 깜빡임 현상 있어서
      // 데이터 갯수 없거나 || 데이터에 변경이 있을 경우 (성공해서 VM 목록에서 사라진 경우) 에만 데이터를 전체 변경합니다
      if (!this.installHistoryData.length || beforeLen !== this.rawData.length) this.installHistoryData = JSON.parse(JSON.stringify(this.rawData))

      // 현재 작업중인 내용이 있는지 확인
      const isOngoing = await this.rawData.some(data => data.installStatus === 'IN_PROGRESS' || data.uninstallStatus === 'IN_PROGRESS')

      if (useInterval && isOngoing) this.timeout()
    },

    timeout () {
      if (this.time) {
        clearTimeout(this.time)
        this.time = null
      }
      this.time = setTimeout(this.getVersionList, 5000)
    },

    /**
     * [서버 정보] 데이터 세팅
     * @param { Object } vm vm 정보
     */
    setVMData (vm) {
      const { externalDisks, externalDisk, disk } = this.calculateExternalDisk(vm.diskList)

      return {
        ...vm,
        bits: vm.osType?.replace(/X/g, '') + 'bit',
        externalDiskDisplay: { externalDisks, externalDisk },
        disk,
        location: `${vm.companyName} > ${vm.groupName} > ${vm.projectName}`
      }
    },

    /**
     * [설치프로그램 목록] 데이터 세팅
     * @param { Object } vm vm 정보
     * @param { Array } versionList vm 에 속한 버전정보
     */
    setVersionList (vm, versionList) {
      const versionId = (vm.progressList.length) ? vm.progressList[0].versionId : -1

      return versionList.map(version => {
        return {
          ...version,
          ...this.setExecuteStatus(version),
          statusLabel: version.status === 'INSTALL' ? this.$v('설치됨') : this.$v('미설치'),
          location: version.softwareName,
          vmName: vm.vmName,
          osType: vm.osType,
          progressList: (versionId === version.versionId) ? vm.progressList : []
        }
      })
    },

    // -------------------------------------------------------------
    // ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ [설치프로그램 목록 저장] ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○
    // -------------------------------------------------------------

    /**
     * 설치프로그램 목록을 가져옵니다.
     */
    async getVersionListData (params) {
      try {
        const response = await API.sw.getSwVMLists(params)

        let result = null
        const { id: vmUuid } = this.$route.query

        for (const { vm, versionList } of response) {
          if (vm.vmUuid === vmUuid) {
            result = { vm, versionList }
            break
          }
        }

        return result
      } catch (error) {
        console.error('@@ InstallVMList > getVersionList', error)
      }
    },

    // -------------------------------------------------------------
    // ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ [공통] ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○
    // -------------------------------------------------------------

    /**
     * 단체 설치 payload 설정
     * @param { Array } vm 현재 보고있는 vm
     * @param { String } scriptType INSTALL|UNINSTALL
     */
    setTestPayload (version, { installType, scriptType }) {
      // 선택한 VM 들
      const { vmUuid, osType, vmName, vmType } = this.vmData
      const vmList = [{ vmUuid, osType, vmName, vmType }]

      const payload = {
        simulation: false,
        software: {
          id: version.softwareId,
          versionList: [ // 현재 보고있는 version 정보
            {
              id: version.versionId, // version id
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
     * (Manual) Script 설치/삭제 기능
     * @param { String } scriptType INSTALL|UNINSTALL
     * @param { String } row 설치프로그램 정보
     */
    setManualScript ({ scriptType, row }) {
      const { softwareName, versionId } = row
      const type = { INSTALL: this.$v('설치'), UNINSTALL: this.$v('삭제') }[scriptType]

      this.$confirm(this.$v(`현재 VM에 {program} 를 ${type}하시겠습니까?`, { program: softwareName }), {
        dangerouslyUseHTMLString: true,
        cancelButtonText: this.$t('common.BTN.cancel'), // 취소
        confirmButtonText: this.$t('service.INSTALL.install') // 설치
      }).then(async () => {
        const payload = {
          scriptType, // INSTALL|UNINSTALL
          result: true, // 처리 완료
          versionId, // 버전 ID
          vm: this.vmData
        }

        const result = await this.saveProgramManualResult(payload)
        if (!result) this.$alert(this.$v('설치 처리에 실패하였습니다.'))

        setTimeout(() => this.getVersionList(), 300)
      }).catch(() => false)
    },

    /**
     * Manual 세팅
     */
    async saveProgramManualResult (payload) {
      try {
        const response = await API.sw.saveProgramManualResult({ payload, userIdx: this.user.userIdx })
        return response
      } catch (error) {
        this.$alert(error.response.data.message, { callback: () => false })
        console.error('@@ saveProgramManualResult :: ', error)
      }
    },

    /**
     * [선택 설치/삭제] 기능
     * @param { String } installType MANUAL|SCRIPT
     * @param { String } scriptType INSTALL|UNINSTALL
     */
    eachInstall ({ scriptType, row }) {
      const { softwareName, usableScript } = row
      if (!usableScript) return this.$alert(this.$v('해당 설치프로그램에 사용 가능한 스크립트가 없습니다.'))

      // 현재 VM에 {program} 를 설치하시겠습니까?
      this.$confirm(this.$t('service.INSTALL.ALERT.031', { program: softwareName }), {
        dangerouslyUseHTMLString: true,
        cancelButtonText: this.$t('common.BTN.cancel'), // 취소
        confirmButtonText: this.$t('service.INSTALL.install') // 설치
      }).then(() => {
        const payload = this.setTestPayload(row, { installType: 'SCRIPT', scriptType })
        this.programSetUp(payload)
        setTimeout(() => this.getVersionList(), 300)
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
      this.selectedRows = []
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
    }
  },
  destroyed () {
    clearTimeout(this.time)
  },
  data () {
    return {
      vmInfo: [
        { field: 'vmName', label: this.$v('VM(Host) 명') },
        { field: 'bits', label: this.$v('OS 버전(Bits)') },
        { field: 'status', label: this.$v('VM 상태') },
        { field: 'scriptexcute', label: this.$v('Script 수행 가능여부') },
        { field: 'spec', label: this.$v('기본 사양') },
        { field: 'location', label: this.$v('프로젝트 위치') }
      ],
      vmData: {},
      setVMInfo: {
        status: 'vm-status',
        spec: 'basic-spec',
        scriptexcute: 'script-execute'
      },
      // ====
      // ====
      // ====
      // ====
      // ====

      loading: false,
      filters: { companyIdx: null, groupIdx: null, projectIdx: null },
      filterText: undefined,
      version: {},
      updateList: [],
      label: {
        breadcrumb: undefined,
        title: undefined,
        listLabel: undefined
      },
      selectedRows: [],
      installHistoryColumn: [
        { header: this.$v('SW 명'), binding: 'location', customHtml: true },
        // { header: this.$v('SW 명'), binding: 'softwareName' },
        { header: this.$v('버전'), binding: 'version' },
        { header: this.$v('사용 Script 버전'), binding: 'scriptVersion' },
        { header: this.$v('주문번호'), binding: 'orderNo' },

        { header: this.$v('Script'), binding: 'installScript', width: 150, customHtml: true },
        { header: this.$v('Manual'), binding: 'installManual', width: 150, customHtml: true },
        { header: this.$v('Script'), binding: 'uninstallScript', width: 150, customHtml: true },
        { header: this.$v('Manual'), binding: 'uninstallManual', width: 150, customHtml: true },

        { header: this.$v('설치상태'), binding: 'statusLabel', width: 100, customHtml: true },

        { header: this.$v('설치 Script 수행 상태'), binding: 'installStatus', width: 150, customHtml: true },
        { header: this.$v('삭제 Script 수행 상태'), binding: 'uninstallStatus', width: 150, customHtml: true },
        { header: ' ', binding: 'install', customHtml: true, width: 110, cssClass: 'open-install', sorting: false }
      ],
      headerMergeColumns: {
        colSpan: [
          { startIdx: 4, endIdx: 5, header: this.$v('설치 Script 수행 여부') },
          { startIdx: 6, endIdx: 7, header: this.$v('삭제 Script 수행 여부') }
        ],
        rowSpan: ['location', 'version', 'scriptVersion', 'orderNo', 'statusLabel', 'installStatus', 'uninstallStatus', 'install']
      },
      installHistoryData: [],
      rawData: [],
      totalResultCnt: 0,
      sortedCol: null,

      /**
       * 참고 (https://docs.google.com/presentation/d/1Zfjt8PGQi1U6UDnm--xyHMkhfgxDxdbw/edit#slide=id.p21)
       *
       * 조건이 조금 까다롭습니다. ^^... (O 활성화, X 비활성화)
       *   0. 기본
       *       - 설치 Script (O) Manual (O) | 삭제 Script (X) Manual (X)
       *   1. Manual로만 설치 가능
       *       - 설치 Script (X) Manual (O) |  삭제 Script (X) Manual (X)
       *
       *   2. 설치 Script수행 { [Script] 클릭 => 진행중 => 성공/실패 }
       *       - 설치 Script (O) Manual (O) | 삭제 Script (X) Manual (X) [진행중]
       *       - 설치 Script (O) Manual (O) | 삭제 Script (O) Manual (X) [성공]
       *       - 설치 Script (O) Manual (O) | 삭제 Script (X) Manual (X) [실패]
       *
       *   3. 설치 Script 수행 { [Manual] 클릭 => 진행중 => 성공/실패 }
       *       - 설치 Script (O) Manual (X) | 삭제 Script (X) Manual (X) [진행중]
       *       - 설치 Script (O) Manual (X) | 삭제 Script (X) Manual (O) [성공]
       *       - 설치 Script (O) Manual (O) | 삭제 Script (X) Manual (X) [실패]
       *
       *
       *   4. 삭제 Script 수행 { [Script] 클릭 => 진행중 => 성공/실패 }
       *       - 설치 Script (O) Manual (O) | 삭제 Script (O) Manual (X) [진행중]
       *       - 설치 Script (O) Manual (O) | 삭제 Script (X) Manual (X) [성공]
       *       - 설치 Script (O) Manual (O) | 삭제 Script (O) Manual (X) [실패]
       *
       *   5. 삭제 Script 수행 { [Manual] 클릭 => 진행중 => 성공/실패 }
       *       - 설치 Script (O) Manual (X) | 삭제 Script (X) Manual (X) [진행중]
       *       - 설치 Script (O) Manual (O) | 삭제 Script (X) Manual (X) [성공]
       *       - 설치 Script (O) Manual (O) | 삭제 Script (X) Manual (O) [실패]
       *
       *   ** 예외 :: 사용가능 스크립트(usableScript)가 없다면 [Script] 로 설치 불가능
       *       - 설치 Script (X) Manual (#) | 삭제 Script (X) Manual (#)
       */

      setExecuteStatus (version) {
        const {
          installType, // MANUAL|SCRIPT
          scriptInstallStatus, // 설치 Script 수행 여부 - UNINSTALL (미설치), INSTALL (설치됨), IN_PROGRESS (설치중)
          manualInstallStatus, // 설치 Manual 수행 여부 - UNINSTALL (미설치), INSTALL (설치됨), IN_PROGRESS (설치중)
          scriptUninstallStatus, // 삭제 Script 수행 여부 - IN_PROGRESS (삭제중) => 삭제중일때만 표기됨
          manualUninstallStatus, // 삭제 Manual 수행 여부 - IN_PROGRESS (삭제중) => 삭제중일때만 표기됨

          installStatus, // 설치 Script 수행 상태 - IN_PROGRESS (진행중), SUCCESS (성공), FAILED (실패)
          uninstallStatus // 삭제 Script 수행 상태 - IN_PROGRESS (진행중), SUCCESS (성공), FAILED (실패)

          // status, // 설치 상태 - INSTALL (설치됨), UNINSTALL (미설치)
          // usableScript // 사용 가능 Script
        } = version

        // console.log(version)

        // 1. Manual 로만 설치 가능
        const isManual = installType === 'MANUAL'

        // 0. 기본  =>  disabled (true)
        let result = {
          installScript: isManual,
          installManual: false,
          uninstallScript: true,
          uninstallManual: true
        }

        const cases = [
          // 2. 설치 script 수행 (진행중, 성공, 실패)
          (scriptInstallStatus === 'IN_PROGRESS' && installStatus === 'IN_PROGRESS'),
          (scriptInstallStatus === 'INSTALL' && installStatus === 'SUCCESS'),
          (scriptInstallStatus === 'UNINSTALL' && installStatus === 'FAILED'),

          // 설치 manual 수행 (진행중, 성공, 실패)
          (manualInstallStatus === 'IN_PROGRESS' && installStatus === 'IN_PROGRESS'),
          (manualInstallStatus === 'INSTALL' && installStatus === 'SUCCESS'),
          (manualInstallStatus === 'UNINSTALL' && installStatus === 'FAILED'),

          // 삭제 script 수행 (진행중, 성공, 실패)
          (scriptUninstallStatus === 'IN_PROGRESS' && uninstallStatus === 'IN_PROGRESS'),
          (scriptUninstallStatus === null && uninstallStatus === 'SUCCESS'),
          (scriptUninstallStatus === null && uninstallStatus === 'FAILED'),

          // 삭제 manual 수행 (진행중, 성공, 실패)
          (manualUninstallStatus === 'IN_PROGRESS' && uninstallStatus === 'IN_PROGRESS'),
          (manualUninstallStatus === null && uninstallStatus === 'SUCCESS'),
          (manualUninstallStatus === null && uninstallStatus === 'FAILED')
        ]

        // 이렇게빢에 짤ㅅ수없었던 나를 원망하지마시오 ㅠ
        const setCase = [
          // 설치 script 수행 (진행중, 성공, 실패)
          { installScript: false, installManual: false, uninstallScript: true, uninstallManual: true },
          { installScript: false, installManual: false, uninstallScript: false, uninstallManual: true },
          { installScript: false, installManual: false, uninstallScript: true, uninstallManual: true },

          // 설치 manual 수행 (진행중, 성공, 실패)
          { installScript: false, installManual: true, uninstallScript: true, uninstallManual: true },
          { installScript: false, installManual: true, uninstallScript: true, uninstallManual: false },
          { installScript: false, installManual: false, uninstallScript: true, uninstallManual: true },

          // 삭제 script 수행 (진행중, 성공, 실패)
          { installScript: false, installManual: false, uninstallScript: false, uninstallManual: true },
          { installScript: false, installManual: false, uninstallScript: true, uninstallManual: true },
          { installScript: false, installManual: false, uninstallScript: false, uninstallManual: true },

          // 삭제 script 수행 (진행중, 성공, 실패)
          { installScript: false, installManual: true, uninstallScript: true, uninstallManual: true },
          { installScript: false, installManual: false, uninstallScript: true, uninstallManual: true },
          { installScript: false, installManual: false, uninstallScript: true, uninstallManual: false }
        ]

        // 경우를 찾으면~ㅎㅎㅎㅎㅎㅎ value 바인딩하기!!!!11ㅋ낄낄ㅋㄹㅋㄹ
        const findCase = cases.indexOf(type => type === true)
        if (findCase > -1) result = setCase[findCase]

        // ** 예외 (usableScript 없으면 동작이 안됨 ?)
        // if (!usableScript) result = { ...result, installScript: true, uninstallScript: true }

        // console.log(
        //   findCase,
        //   '\n- installType : ', installType,
        //   '\n- installStatus : ', installStatus,
        //   '\n- uninstallStatus : ', uninstallStatus,
        //   '\n- scriptInstallStatus : ', scriptInstallStatus,
        //   '\n- manualInstallStatus : ', manualInstallStatus,
        //   '\n- scriptUninstallStatus : ', scriptUninstallStatus,
        //   '\n- manualUninstallStatus : ', manualUninstallStatus
        // )

        // console.log(installType, installStatus, uninstallStatus)

        return result
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.install-program-vmsr {
  position: relative;

  .-title {
    font-size: 16px;
    margin-bottom: $gap;
  }

  .program-list-wrapper {
    .program-detail {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      margin-bottom: 40px;
      border-top: 1px solid $dark-slate;

    }
  }
}
</style>
