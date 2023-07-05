<!--
  * 파일명 : StorageUpdateForm.vue
  * 파일 기능 : Storage 자원 이관 시, 정보 수정 form
  * 작성자 : 김예담
  * 최종 작성일 : 2021-09-23
  * License By Shinsegae I&C
  * 2021-02-17 [자원 이관 - Volumegroup] 데이터 세팅
 -->

<template>
  <div
    class="storage-update-form"
    v-loading="loading.isGroupTree"
  >
    <section
      class="form-wrapper"
      :style="{ maxHeight: height }"
      v-loading="loading.initData || loading.isCheckAvailableName"
    >
      <vertical-table
        :data="vgInfo"
        :columns="columns"
      >
        <el-checkbox
          slot="isUrgent"
          v-model="vgInfo.isUrgent"
        >
          긴급
        </el-checkbox>
        <!-- :columns="data ?
          initOptionVms.length ? createColumns : removeColumn('optionsConnectVm')
          : selectConnectInfo && optionVms.length ? createColumns : removeColumn('optionsConnectVm')" -->
        <template #projectInfo>
          <div class="flex-wrap">
            <button
              class="button"
              type="is-primary"
              @click="visibleProject = true"
              style="min-width: 140px;"
              ref="projectTrigger"
            >
              {{ vgInfo.projectInfo.company !== null ? $v('프로젝트 변경'): $v('프로젝트 선택') }}
            </button>

            <text-display
              v-if="vgInfo.projectInfo.company !== null"
              style="margin-left:10px;"
              :content01="vgInfo.projectInfo.company.groupName"
              :content02="vgInfo.projectInfo.group.groupName"
              :content03="vgInfo.projectInfo.project.projectName"
            />
          </div>
          <div
            v-if="visibleProject"
            class="custom-popup -app-manager"
          >
            <select-from-tree
              type="project"
              :search-title="$v('프로젝트를 검색하세요.')"
              :header="$v('프로젝트 리스트')"
              v-if="visibleProject"
              class="-body"
              @close="visibleProject = false"
              :group-tree-data="groupTreeData"
              :loading="loading.isGroupTree"
              :user-group-idx="user.userGroup"
              :selected-project-info="vgInfo.projectInfo ? vgInfo.projectInfo.project : {}"
              :trigger-btn="$refs"
              @select="changeGroupProject"
            />
          </div>
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
          <span v-if="data">
            {{ initVms.length ? initVms[0].vmName : '-' }}
          </span>
          <cmp-grid
            v-else-if="vgInfo.projectInfo && vgInfo.projectInfo.project"
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
          <template v-if="data">
            <div v-if="initOptionVms.length">
              <p
                v-for="vm in initOptionVms"
                :key="vm.vmName"
              >
                {{ vm.vmName }}
              </p>
            </div>
            <span
              v-else
              style="color: #727797;"
            >-</span>
          </template>
          <cmp-grid
            v-else
            :item-source="optionVms"
            :columns="addStorageColumns"
            :init-custom-action="flex => this.addVmGrid = flex"
            :header-checkbox="!data"
            :init-auto-select-row="selectOptionConnectInfo"
            init-auto-select-row-key="userVmIdx"
            @checkedRowsData="saveOptionConnectionRow"
          />
        </div>
        <!-- /. 추가 연결 정보 -->

        <resource-range-input
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
          <!-- :picker-options="serviceOpenDateOptions" -->

          <!-- <el-select
            v-model="chargeDate.time"
            :placeholder="$i18n.locale === 'en' ? 'time' : '시'"
            :popper-append-to-body="false"
            class="service-time-select"
          >
            <el-option
              v-for="time in 24"
              :key="'time' + time"
              :label="(time - 1) < 10 ? '0' + (time-1) : time - 1"
              :value="time - 1"
            />
          </el-select>
          &ensp;{{ $i18n.locale === 'en' ? ' : ' : '시' }}
          <el-select
            v-model="serviceDate.min"
            :placeholder="$i18n.locale === 'en' ? 'min' : '분'"
            :popper-append-to-body="false"
            class="service-time-select"
          >
            <el-option
              v-for="min in [0, 10, 20, 30, 40, 50]"
              :key="'min' + min"
              :label="min < 10 ? '0' + min : min"
              :value="min"
            />
          </el-select>
          <span v-if="$i18n.locale !== 'en'">&ensp;분</span> -->
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
      >
        <!-- {{ data ? '변경' : '생성' }} -->
        {{ data ? $t('common.BTN.change') : $t('common.BTN.create') }}
      </button>
    </section>
  </div>
</template>
<script>
import API, { VerticalTable, ResourceRangeInput, SelectFromTree } from '@sd-fe/cmp-core'
import { mapState } from 'vuex'
import { isEmpty, uniqBy } from 'lodash'
import TextDisplay from '@/components/Text/TextDisplay.vue'

export default {
  name: 'StorageUpdateForm',
  components: {
    VerticalTable,
    ResourceRangeInput,
    SelectFromTree,
    TextDisplay
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

      const baseColumns = this.data ? this.updateColumns : this.createColumns
      // 미등록 자원 => 과금시작일 영역 추가
      const setChargeDateColumn = this.isUnregistered
        ? [...baseColumns, { ...chargeDateCol }]
        : this.removeColumn(baseColumns, 'chargeDate')

      const columns = this.data
        ? this.initOptionVms.length ? setChargeDateColumn : this.removeColumn(setChargeDateColumn, 'optionsConnectVm')
        : this.selectConnectInfo && this.optionVms.length ? setChargeDateColumn : this.removeColumn(setChargeDateColumn, 'optionsConnectVm')
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
        if (flag && this.createColumns[this.createColumns.length - 1].binding !== 'chargeDate') {
          const chargeDateCol = { header: '과금시작일', binding: 'chargeDate', keyPath: 'common.REGCON.billStart', required: true, customHtml: true }
          this.createColumns.push(chargeDateCol)

          this.$forceUpdate()
        }
      }
    }
  },
  async created () {
    await this.init()
  },
  methods: {
    async getManageTree () {
      try {
        this.loading.isGroupTree = true
        const response = await API.iam.getGroupManageTree({ project: true })
        if (!response) return
        this.groupTreeData = [...response]
      } catch (error) {
        this.groupTreeData = []
        this.loading.isGroupTree = false
        console.error(error)
      } finally {
        this.loading.isGroupTree = false
      }
    },
    async init () {
      this.loading.initData = true
      this.getManageTree()
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
        const data = await API.compute.getVms({ projectIdx })
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
            size: this.$options.filters.byteToGb(item.vmDiskSizeBytes) || item.diskSize,
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
     * 자원 명 중복 체크 후, 사용 가능 여부를 리턴합니다.
     */
    async isAvailableResourceName (inBasket) {
      const insertName = this.vgInfo.storageName?.trim()
      if (!insertName) return

      const originResourceName = this.data?.storageName
      if (this.data && (originResourceName === insertName)) return true

      try {
        this.loading.isCheckAvailableName = true
        if (!inBasket) {
          const vgList = await API.compute.getVolumeGroupsList({
            projectIdx: this.vgInfo.projectInfo.project.projectIdx,
            filterChargeDate: true,
            filterDeleteDate: true
          })
          const projectResourceName = vgList ? vgList.map(item => item.storageName) : []

          if (projectResourceName.includes(insertName)) return false
          else return true
        } else {
          // 장바구니/주문함/사전협의/할일(작업완료되기전)에 동일 자원 명 있는 지 검사 (True: 존재 o)
          const { data } = await API.work.isExistOrderedResource(
            this.vgInfo.projectInfo.project.projectIdx,
            'storageName',
            insertName
          )
          return !data
        }
      } catch (error) {
        console.log(error)
      } finally {
        this.loading.isCheckAvailableName = false
      }
    },
    /**
     * 모달창 [저장]
     */
    async save () {
      const {
        isUrgent,
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
          { availableNameInResource: await this.isAvailableResourceName(false) }, // 자원 명 중복 체크(생성 자원))
          { availableNameInBasket: await this.isAvailableResourceName(true) }, // 자원 명 중복 체크(장바구니/주문함/사전협의/할일(작업완료되기전))
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
        beforePrice: 0,
        price: 0,
        isUrgent: isUrgent,
        projectIdx: projectInfo.project.projectIdx,
        groupIdx: projectInfo.group.groupIdx,
        groupName: projectInfo.group.groupName,
        userId: this.user.userId,
        userName: this.user.userName,
        service: 'STORAGE',
        requestData: {
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
        const { vmList, createUserId, createUserName, chargeVmUuid, clusterName, clusterUuid, companyId, companyName, groupId, groupName, projectId, projectName, userId, userName, isShared, ...rest } = emitData.requestData

        rest.elementIdx = this.vgInfo.elementIdx

        orderData = {
          ...rest,
          updateUserId: this.user.userId,
          updateUserName: this.user.userName,
          userVgIdx: userVgIdx
        }
      } else { // 생성
        orderData = {
          ...emitData.requestData,
          createUserId: this.user.userId,
          createUserName: this.user.userName,
          chargeDate: +new Date(Date.now())
        }
      }

      emitData.requestData = orderData

      console.log(emitData, '=====payload')

      this.$emit('save', emitData)
    },
    /**
     * vertical table에서 column을 제거합니다.
     * @param {Array} columns 제거 할 columns
     * @param {String} binding 제거 할 column의 binding 키
     */
    removeColumn (columns, binding) {
      const filteredColumns = columns.filter(col => col.binding !== binding)
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
        chargeDate: 'common.ALERT.COMP.063', // 과금 시작일을 설정해주세요.
        availableNameInResource: 'common.ALERT.BASE.073', // 선택하신 프로젝트에 동일한 이름을 가진<br>자원이 존재합니다.
        availableNameInBasket: 'common.ALERT.BASE.074' // 동일한 이름으로 주문 진행중인<br>자원이 있습니다.
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
  data (root) {
    return {
      groupTreeData: [],
      visibleProject: false,
      koreanRegex: /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/,
      chargeDate: '', // 과금 시작일
      loading: {
        initData: false, // 초기 데이터 세팅
        getVm: false,
        isGroupTree: false,
        isCheckAvailableName: false
      },
      vgInfo: {
        isUrgent: false,
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
      storageColumns: [{ binding: 'vmName', header: root.$v('호스트 명') }], // 연결 정보 columns
      addStorageColumns: [{ binding: 'vmName', header: root.$v('호스트 명') }],
      createColumns: [
        { header: '긴급', binding: 'isUrgent' },
        { header: root.$v('프로젝트 선택'), binding: 'projectInfo', required: true },
        { header: root.$v('Volume 그룹명'), binding: 'storageName', required: true },
        { header: root.$v('Volume 설명'), binding: 'storageDesc' },
        { header: root.$v('연결 정보'), binding: 'hostInfo', required: true },
        { header: root.$v('추가 연결 정보'), binding: 'optionsConnectVm' },
        { header: root.$v('신청 용량'), binding: 'externalDisk', required: true, subTitle: this.$t('common.ALERT.COMP.071', { size: '50GB', field: this.$t('common.GRID.STORAGE.appCapa') }) }
      ],
      updateColumns: [
        { header: '긴급', binding: 'isUrgent' },
        { header: root.$v('프로젝트 선택'), binding: 'projectInfo' },
        { header: root.$v('Volume 그룹명'), binding: 'storageName', required: true },
        { header: root.$v('Volume 설명'), binding: 'storageDesc' },
        { header: `${root.$v('연결 정보')} (${root.$v('호스트 명')})`, binding: 'hostInfo' },
        { header: `${root.$v('추가 연결 정보')} (${root.$v('호스트 명')})`, binding: 'optionsConnectVm' },
        { header: root.$v('신청 용량'), binding: 'externalDisk', required: true, subTitle: this.$t('common.ALERT.COMP.071', { size: '50GB', field: this.$t('common.GRID.STORAGE.appCapa') }) }
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
  .-reference {
    margin-top: 5px;
    color: $input-placeholder;
    i {
      color: $main-red;
    }
  }
  }
</style>
