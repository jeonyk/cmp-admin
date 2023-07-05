<!--
  * 파일명 : VMwareStorageUpdateForm.vue
  * 파일 기능 : Storage 자원 이관 시, 정보 수정 form
  * 작성자 : 김예담
  * 최종 작성일 : 2021-09-23
  * License By Shinsegae I&C
  * 2021-02-17 [자원 이관 - Volumegroup] 데이터 세팅
 -->

<template>
  <div class="storage-update-form">
    <section
      class="form-wrapper"
      :style="{ maxHeight: height }"
    >
      <vertical-table
        :data="vgInfo"
        :columns="columns"
      >
        <template #projectInfo>
          <resource-filter-component
            v-if="!data"
            cloud-type="private"
            :is-replace-filtering-component="false"
            :init-company-idx="selectedProject ? selectedProject.companyIdx : undefined"
            :init-group-idx="selectedProject && selectedProject.groupIdx ? selectedProject.groupIdx : undefined"
            :init-project-idx="selectedProject ? selectedProject.projectIdx : undefined"
            @change="changeGroupProject"
          />
          <span v-else>{{ `${data.companyName} > ${data.groupName} > ${data.projectName}` }}</span>
        </template>
        <!-- 프로젝트 선택 -->

        <el-input
          slot="storageName"
          :placeholder="$t('common.GRID.COMPUTE.volumeGroupName')"
          v-model="vgInfo.storageName"
          maxlength="25"
          show-word-limit
        />
        <!-- Volume 그룹명 -->

        <el-input
          slot="storageDesc"
          :placeholder="$t('common.PLACEHOLDER.enterDesVolume')"
          v-model="vgInfo.storageDesc"
        />
        <!-- Volume 설명 -->

        <div
          slot="hostInfo"
          v-loading="loading.getVm"
        >
          <cmp-grid
            v-if="data ? true : vgInfo.projectInfo && vgInfo.projectInfo.project"
            :item-source="data ? initVms : vms"
            :columns="storageColumns"
            :use-excel-download="false"
            :init-auto-select-row="selectConnectInfo"
            init-auto-select-row-key="userVmIdx"
            :selectable="!data"
            @selectedRow="row => {
              selectConnectInfo = row ? row.dataItem : null
              saveConnectionRow()
            }"
          />
          <span
            v-else
            class="empty-data"
          >{{ $t('admin.PREF.selectProject') }}</span>
        <!-- 프로젝트를 선택해주세요. -->
        </div>
        <!-- 연결 정보 -->

        <div slot="optionsConnectVm">
          <cmp-grid
            :item-source="data ? initOptionVms : optionVms"
            :columns="addStorageColumns"
            :init-custom-action="flex => this.addVmGrid = flex"
            :header-checkbox="!data"
            :init-auto-select-row="selectOptionConnectInfo"
            init-auto-select-row-key="userVmIdx"
            @checkedRowsData="saveOptionConnectionRow"
          />
        </div>
        <!-- /. 추가 연결 정보 -->

        <sc-range-input
          slot="externalDisk"
          :app-range="{ min: 50, max: 500 }"
          :step="50"
          :disks="vgInfo.diskList"
          :editable="!data"
          only-volume
          @range-data="param => vgInfo.diskList = param"
          :is-slider="!isUnregistered"
        />
        <!-- 할당 용량 -->

        <template #chargeDate>
          <el-date-picker
            class="service-date-pick"
            v-model="chargeDate"
            type="date"
            :placeholder="$t('common.GRID.billStart')"
            @change="(val) => { if(val) vgInfo.chargeDate = +new Date(chargeDate) }"
          />
        </template>
        <!-- /. 과금 시작일 -->
      </vertical-table>
    </section>

    <section class="modal-footer modal-button-area">
      <button
        class="button -modal-button"
        type="is-anti"
        @click="$emit('close')"
      >
        <!-- 취소 -->
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button -modal-button"
        @click="save"
        type="is-primary"
        disabled
      >
        <!-- {{ data ? '변경' : '생성' }} -->
        {{ data ? $t('common.BTN.change') : $t('common.BTN.create') }}
      </button>
    </section>
  </div>
</template>
<script>
import API, { VerticalTable } from '@sd-fe/cmp-core'
import { mapState } from 'vuex'
import SCRangeInput from '@/components/cmp-components/SCRangeInput.vue'
import ResourceFilterComponent from '@/components/ResourceFilterComponent/ResourceFilterComponent'
import { isEmpty, uniqBy } from 'lodash'

export default {
  name: 'VMwareStorageUpdateForm',
  components: {
    'sc-range-input': SCRangeInput,
    'vertical-table': VerticalTable,
    ResourceFilterComponent
  },
  props: {
    data: {
      type: Object,
      default () {
        return {}
      }
    },
    selectedProject: { // 선택한 관-조-프 정보가 있을 때 사용 -> 생성 시!
      type: Object,
      default () {
        return undefined
      }
    },
    height: { // 콘텐츠에 스크롤 생기기 시작 높이
      type: String,
      default: '72vh'
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    }),
    isUnregistered () { // 미등록 자원인지?
      if (!this.data) return false
      return (this.data.chargeDate === undefined)
    },
    columns () {
      const chargeDateCol = { header: '과금시작일', binding: 'chargeDate', keyPath: 'common.REGCON.billStart', required: true, customHtml: true }

      const defaultColumn = this.isUnregistered ? [...this.resouceColumns, { ...chargeDateCol }] : this.removeColumn('chargeDate')

      const columns = this.data
        ? this.initOptionVms.length ? defaultColumn : this.removeColumn('optionsConnectVm')
        : this.selectConnectInfo && this.optionVms.length ? defaultColumn : this.removeColumn('optionsConnectVm')
      return uniqBy(columns, 'binding')
    }
  },
  watch: {
    data: {
      async handler (newData) {
        if (newData) {
          await this.init(newData) // 초기 데이터 세팅
        }
      }
    },
    isUnregistered: {
      immediate: true,
      handler (flag) {
        if (flag && this.resouceColumns[this.resouceColumns.length - 1].binding !== 'chargeDate') {
          const chargeDateCol = { header: '과금시작일', binding: 'chargeDate', keyPath: 'common.REGCON.billStart', required: true, customHtml: true }
          this.resouceColumns.push(chargeDateCol)

          this.$forceUpdate()
        }
      }
    }
  },
  async created () {
    await this.init()
  },
  methods: {
    async init () {
      this.loading.initData = true

      if (this.data) {
        await this.setInitData(this.data)
        this.setInitVms() // 수정 시, 연결 정보 / 추가 연결 정보 세팅
      }

      this.loading.initData = false
    },
    /**
     * 초기 데이터 세팅
     */
    async setInitData (data) {
      const projectInfo = await this.settingProjectIdx(data)
      // this.initProjectInfo = projectInfo

      const initVgData = Object.assign({
        projectInfo: projectInfo,
        storageName: data.storageName || data.vgName,
        storageDesc: data.storageDesc || data.vgDesc,
        diskList: this.settingExternalDisk(data)
      }, data)
      this.vgInfo = initVgData
      console.log('init: ', this.vgInfo)
    },
    /**
     * 수정 시, 연결 vm 정보 / 추가 연결 vm 정보를 세팅합니다.
     */
    setInitVms () {
      const vms = this.vgInfo.vms
      if (!vms) return
      vms.forEach((vm, idx) => {
        if (idx === 0) { this.initVms.push(vm) } else this.initOptionVms.push(vm)
      })
      this.selectConnectInfo = this.initVms[0]
      this.selectOptionConnectInfo = [...this.initOptionVms]
    },
    /**
     * [연결정보] VM 정보들을 가져옵니다.
     */
    async getVmList (projectIdx) {
      try {
        this.vms = []
        if (projectIdx === undefined) return
        this.loading.getVm = true
        const data = await API.configManage.vm.getVmList({ projectIdx })
        this.vms = data
      } catch (error) {
        this.vms = []
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.$alert(message)
      } finally {
        this.loading.getVm = false
      }
    },
    /**
     * 프로젝트 선택 > 관-조-프 변경 시 이벤트
     * @param {Object} param 선택한 관-조-프 정보
     */
    async changeGroupProject (param) {
      this.vgInfo.projectInfo = param
      this.vms = [] // 연결 정보 데이터 비워줌
      this.optionVms = [] // 추가 연결 정보 데이터 비워줌
      if (param.project?.projectIdx) {
        await this.getVmList(param.project.projectIdx)
      }
    },
    /**
     * 변경 > 초기 [연결정보 / 추가 연결정보]를 세팅합니다.
     */
    initSelectConnectInfo (data) {
      // [연결정보 / 추가 연결정보]
      const vmList = data.vms // 해당 자원에 등록된 vms 들
      const vmNames = this.vms.map(vm => vm.computeName)

      const addVms = []
      if (vmList?.length) {
        // 선택된 [연결정보 / 추가 연결정보] 세팅
        vmList.forEach((vm, idx) => {
          if (idx === 0) { // 연결정보
            const hasConnected = vmNames.includes(vm.computeName) // 연결된 VM이 있는지 없는지 확인
            if (hasConnected) this.selectConnectInfo = vm
          } else { // 추가 연결정보
            if (!vm.deleted) addVms.push(vm)
          }
        })

        // 선택된 연결정보 + 추가 연결정보 데이터 저장
      }
      this.saveConnectionRow()
      this.saveOptionConnectionRow(addVms)
    },
    /**
     * 관-조-프 Idx 세팅
     */
    settingProjectIdx (data) {
      if (!data) return this.vgInfo.projectInfo

      const groupProjectInfo = {
        company: {
          companyCode: data.companyId,
          groupName: data.companyName,
          groupIdx: data.companyIdx
        },
        group: {
          groupName: data.groupName,
          groupIdx: data.groupIdx
        },
        project: {
          projectName: data.projectName,
          projectIdx: data.projectIdx
        }
      }
      return groupProjectInfo
    },
    /**
     * [연결 정보] disks 정보에서 -> diskList 정보로 변환
     */
    settingExternalDisk (data) {
      if (!data?.disks) return []

      const externalDisk = data.disks.filter(disk => !disk.deleted)
        .map(item => {
          return {
            size: this.$options.filters.byteToGb(item.vmDiskSizeBytes),
            name: item.vgDiskIndex,
            diskId: item.vgDiskIndex,
            default: item.vgDiskIndex !== undefined,
            min: this.$options.filters.byteToGb(item.vmDiskSizeBytes)
          }
        })
      return externalDisk
    },
    /**
     * 선택된 [연결정보] 저장
     * from 사용자.
     */
    saveConnectionRow (primeConnect = this.selectConnectInfo) {
      if (primeConnect) {
        // this.selectConnectInfo = primeConnect
        const { userVmIdx, elementIdx } = primeConnect

        const sameEls = this.vms.filter(vm => vm.userVmIdx !== userVmIdx && vm.elementIdx === elementIdx)
        this.optionVms = sameEls
      } else {
        // this.selectConnectInfo = null
        this.optionVms = []
        this.selectOptionConnectInfo = []
      }
    },
    /**
     * 선택된 [추가 연결정보] 저장
     * from 사용자.
     */
    saveOptionConnectionRow (rows) {
      this.selectOptionConnectInfo = [...rows]
    },
    /**
     * 모달창 [저장]
     */
    save () {
      const {
        projectInfo, // 프로젝트 정보
        storageName, // Volume 그룹명
        storageDesc, // Volume 설명
        diskList, // externalDisk
        userVgIdx,
        createUserId,
        createUserName,
        chargeDate
      } = this.vgInfo

      console.log('vgInfo: ', this.vgInfo)

      const vmList = [
        { ...this.selectConnectInfo },
        ...this.selectOptionConnectInfo
      ]

      const checkSpace = (str) => { if (str.search(/\s/) === -1) { return true } else { return false } }
      const checkKorean = (str) => { return !this.koreanRegex.test(str) }

      let checkValidItems
      if (!this.data) { // 생성
        checkValidItems = [
          { projectInfo: [projectInfo.company, projectInfo.group, projectInfo.project].every(info => info) },
          { storageName: storageName?.trim() },
          { storageNameCheckSpace: checkSpace(storageName) }, // 공백 문자
          { storageNameCheckKorean: checkKorean(storageName) }, // 한글
          { storageNameCheckUnderbar: !storageName.includes('_') }, // 언더바
          { vmConnectInfo: this.selectConnectInfo },
          { externalDisk: diskList }
        ]
      } else { // 수정
        checkValidItems = [
          { storageName: storageName?.trim() },
          { storageNameCheckSpace: checkSpace(storageName) },
          { storageNameCheckKorean: checkKorean(storageName) },
          { storageNameCheckUnderbar: !storageName.includes('_') },
          { externalDisk: diskList },
          { chargeDate: this.isUnregistered ? chargeDate : true }
        ]
      }
      if (!this.noEmptyContents(checkValidItems)) return

      const emitData = Object.assign({
        userId: this.user.userId,
        userName: this.user.userName,
        userPosition: this.user.userPosition,
        groupIdx: projectInfo.group.groupIdx,
        groupName: projectInfo.group.groupName,
        orderData: {
          storageName,
          storageDesc,
          vmList,
          createUserId,
          createUserName,
          chargeDate,
          diskList: diskList.filter(dsk => !dsk.default).map(item => {
            return {
              ...item,
              diskSize: item.size
            }
          }),
          chargeVmUuid: this.selectConnectInfo.vmUuid || undefined,
          clusterName: this.selectConnectInfo.clusterName || undefined,
          clusterUuid: this.selectConnectInfo.clusterUuid || undefined,
          companyId: projectInfo.company.groupIdx,
          companyName: projectInfo.company.groupName,
          groupId: projectInfo.group.groupIdx,
          groupName: projectInfo.group.groupName,
          projectId: projectInfo.project.projectIdx,
          projectName: projectInfo.project.projectName,
          userId: this.user.userId,
          userName: this.user.userName,
          isShared: true
          // ownerCompanyId: projectInfo.company.groupIdx, // ?
          // ownerCompanyName: projectInfo.company.groupName // ?
          // price: 150000, // ? -> 플러스 버전에서는 관리자만 나타나므로 우선 담에 처리
          // beforePrice: 0 // ? -> 플러스 버전에서는 관리자만 나타나므로 우선 담에 처리
        }
      }, {})
      let orderData
      if (this.data) { // 수정
        const { vmList, createUserId, createUserName, chargeVmUuid, clusterName, clusterUuid, companyId, companyName, groupId, groupName, projectId, projectName, userId, userName, isShared, ...rest } = emitData.orderData

        rest.elementIdx = this.vgInfo.elementIdx

        orderData = {
          ...rest,
          updateUserId: this.user.userId,
          updateUserName: this.user.userName,
          userVgIdx: userVgIdx
        }
      } else { // 생성
        orderData = {
          ...emitData.orderData,
          createUserId: this.user.userId,
          createUserName: this.user.userName,
          chargeDate: +new Date(Date.now())
        }
      }

      emitData.orderData = orderData

      console.log(emitData, '=====payload')

      this.$emit('save', emitData)
    },
    /**
     * vertical table에서 column을 제거합니다.
     * @param {String} binding 제거 할 column의 binding 키
     */
    removeColumn (binding) {
      const filteredColumns = this.resouceColumns.filter(col => col.binding !== binding)
      return filteredColumns
    },
    /**
   * 빈 항목이 있으면 alert 메세지 출력
   * @param {Array} checkItems 체크할 키 : 값 모음
   * @return {Boolean} 빈 항목이 유무 리턴, 빈 항목이 있으면 false 반환
   */
    noEmptyContents (checkItems) {
      if (!checkItems?.length) return
      const message = {
        projectInfo: 'admin.PREF.selectProject', // 프로젝트를 선택해주세요.
        storageName: 'common.ALERT.PROJECT.048', // Volume 그룹명을 먼저 입력해주세요.
        storageNameCheckSpace: 'common.ALERT.PROJECT.047', // Volume 그룹명에 공백 문자는 들어 갈 수 없습니다.
        storageNameCheckKorean: 'common.ALERT.PROJECT.052', // Volume 그룹명에 한글이 들어 갈 수 없습니다.
        storageNameCheckUnderbar: 'common.ALERT.PROJECT.053', // Volume 그룹명에 \'_\' (언더바)가 들어 갈 수 없습니다.
        vmConnectInfo: 'common.ALERT.COMP.023', // vm 연결 정보를<br>선택해주세요.
        externalDisk: 'common.ALERT.PROJECT.055', // 용량을 확인해주세요.
        chargeDate: 'common.ALERT.COMP.063' // 과금 시작일을 설정해주세요.
      }

      let pass = true

      for (let i = 0; i < checkItems.length; i++) {
        const key = Object.keys(checkItems[i])[0]
        const value = checkItems[i][key]
        const flag = value === '' ||
          value === false ||
          value === null ||
          value === undefined ||
          (value && typeof value === 'object' && isEmpty(value)) ||
          (Array.isArray(value) && !value.length)

        if (flag) { // value가 비어있을 때 alert창을 띄워줍니다. flag가 있을때.. flag 조건 추가
          this.$alert(this.$t(message[key]), { dangerouslyUseHTMLString: true })
          pass = false
          break
        }
      }
      return pass
    }
  },
  data () {
    return {
      koreanRegex: /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/,
      chargeDate: '', // 과금 시작일
      loading: {
        initData: false, // 초기 데이터 세팅
        getVm: false
      },
      vgInfo: {
        projectInfo: { // 프로젝트 설정
          company: null,
          group: null,
          project: null
        },
        storageName: '', // Volume 그룹명
        storageDesc: '', // Volume 설명
        connectedVms: null, // 연결 정보
        diskList: [] // 할당 용량
      },
      initProjectInfo: { // 초기 세팅 관-조-프
        company: null,
        group: null,
        project: null
      },
      vms: [], // 연결 정보에 뿌려질 vm 리스트
      optionVms: [], // 추가 연결 정보에 뿌려질 vm 리스트
      initVms: [], // 수정 시, 연결 정보
      initOptionVms: [], // 수정 시, 추가 연결 정보
      selectConnectInfo: null, // 선택한 연결 정보
      selectOptionConnectInfo: [], // 선택한 추가 연결 정보
      storageColumns: [{ binding: 'vmName', header: '호스트명', keyPath: 'common.REGCON.hostName' }], // 연결 정보 columns
      addStorageColumns: [{ binding: 'vmName', header: '호스트명', keyPath: 'common.REGCON.hostName' }],
      resouceColumns: [
        { header: '프로젝트 선택', binding: 'projectInfo', required: true, keyPath: 'common.PLACEHOLDER.selectProject' },
        { header: 'Volume 그룹명', binding: 'storageName', required: true, keyPath: 'common.PLACEHOLDER.volumeGroup' },
        { header: 'Volume 설명', binding: 'storageDesc', keyPath: 'common.REGCON.volumeExp' },
        { header: '연결 정보', binding: 'hostInfo', required: true, keyPath: 'common.REGCON.connInfo' },
        { header: '추가 연결 정보', binding: 'optionsConnectVm', keyPath: 'common.MODAL.additionalSetCon' },
        { header: '신청 용량', binding: 'externalDisk', required: true, keyPath: 'common.GRID.STORAGE.appCapa', subTitle: this.$t('common.ALERT.COMP.071', { size: '50GB', field: this.$t('common.GRID.STORAGE.appCapa') }) }
      ]
    }
  }
}
</script>
<style lang="scss">
  .storage-update-form {
    .register-contents {
      .contents-title {
        min-width: 150px;
      }
      .service-date-pick {
        .el-input__suffix { top: 2px; right: -5px; }
      }
    }
  }
</style>

<style lang="scss" scoped>
  .storage-update-form {
    .form-wrapper {
      overflow-y: auto;
      overflow-x: hidden;
    }
  }
</style>
