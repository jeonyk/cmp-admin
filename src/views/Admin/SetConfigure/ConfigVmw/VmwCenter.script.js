/**
  * 파일명 : NutanixCentral.script.js
  * 파일 기능 : 뉴타닉스 Central 리스트 노출 및 관리(테스트, 추가, 변경, 삭제)
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2021-02-25
  * License By Shinsegae I&C
  * 2021-02-25 Fix: network 변경 API 오류 수정
 **/

import { cloneDeep } from 'lodash'
import SyncComponent from '@/components/SyncComponent/SyncComponent'
import VmwCenterCluster from './VmwCenterCluster.vue'
// import API from '@/components/Apis'
import OTPModal from '@/components/Modal/OTPModal/OTPModal'
import { mapGetters } from 'vuex'
import API from '@sd-fe/cmp-core'
import CheckIcon from '@/components/Icons/CheckIcon.vue'
import VmwImageManage from '@/components/OSImage/VmwImageManage.vue'

export default {
  name: 'VmwCenter',
  components: {
    'sync-component': SyncComponent,
    'otp-modal': OTPModal,
    CheckIcon,
    VmwCenterCluster,
    VmwImageManage
  },
  computed: {
    /**
     * total count 를 입력하기 위해 사용합니다.
     */
    computedTableData () {
      const result = []
      for (let i = 0; i < this.tableData.length; i++) result.push(this.tableData[i])
      return result
    },
    ...mapGetters(['packageType'])
  },
  watch: {
    'newItem.id' () {
      this.testPassed = false
    },
    'newItem.connectPassword' () {
      this.testPassed = false
    },
    'newItem.connectUrl' () {
      this.testPassed = false
    },
    'showModal.view' (val) {
      if (!val) this.otp = false
      if (val) {
        const isCreateModal = this.showModal.type === 'create'
        const selectedThres = isCreateModal ? undefined : this.selectedRow
        this.TESTobj = cloneDeep(this.convertThresholdsToObject(selectedThres))
        const addedThres = this.convertThresholdsToObj(this.TESTobj)
        this.newItem = { ...this.newItem, ...addedThres }
      }
    },
    selectedRow (val) {
      console.log(val)
    }
  },
  created () {
    if (this.packageType !== 'ENT') {
      const index = this.columns.findIndex(col => col.onlyEnt)
      this.columns.splice(index, 1)
    }
  },
  async mounted () {
    await this.setGridItemSource()
    this.startInterval()
  },
  methods: {
    // 그리드 값(객체)를 받아서 DOM에 뿌려줄 수 있는 데이터(객체배열)로 반환
    convertThresholdsToObject (thresholds) {
      return [
        {
          groupName: '가상화율 임계치',
          children: [
            { label: '관리 지표', key: 'cpuManageIndicator', value: thresholds?.cpuManageIndicator || 0 },
            { label: '1차 임계치', key: 'firstCpuPercent', value: thresholds?.firstCpuPercent || 0 },
            { label: '2차 임계치', key: 'secondCpuPercent', value: thresholds?.secondCpuPercent || 0 }
          ]
        },
        {
          groupName: '메모리 임계치',
          children: [
            { label: '관리 지표', key: 'memoryManageIndicator', value: thresholds?.memoryManageIndicator || 0 },
            { label: '1차 임계치', key: 'firstMemoryPercent', value: thresholds?.firstMemoryPercent || 0 },
            { label: '2차 임계치', key: 'secondMemoryPercent', value: thresholds?.secondMemoryPercent || 0 }
          ]
        },
        {
          groupName: '디스크 임계치',
          children: [
            { label: '관리 지표', key: 'diskManageIndicator', value: thresholds?.diskManageIndicator || 0 },
            { label: '1차 임계치', key: 'firstDiskPercent', value: thresholds?.firstDiskPercent || 0 },
            { label: '2차 임계치', key: 'secondDiskPercent', value: thresholds?.secondDiskPercent || 0 }
          ]
        }
      ]
    },
    // API 호출전 DOM에 뿌리는 데이터 -> 객체값으로 임계치 반환
    convertThresholdsToObj (thresholdsArr) {
      const thresholdsObj = {}

      thresholdsArr.forEach(group => {
        group.children.forEach(item => {
          thresholdsObj[item.key] = item.value
        })
      })
      return thresholdsObj
    },
    /**
     * OTP 인증
     */
    async validatedOTP (test) {
      this.otpModalActive = false
      this.otp = true
      // const idx = this.selectedRow.idx
      // const payload = test
      // certNumber
      // this.updateConnectPassword =
      console.log('test', test)
      this.newItem.updateConnectPassword = test.password
      this.$nextTick(() => {
        // this.$refs.otpPasswordInput.passwordVisible = true
      })
    },

    /** API_HANDLER - (POST) OTP 인증성공 시 비밀번호를 응답받음 */
    async checkTheVcenterOTP (payload) {
      try {
        console.log('API: checkTheVcenterOTP')
        console.log(payload)
        console.log(this.selectedRow)
        const password = await API.vmware.vcenter.checkTheVcenterOTP(this.selectedRow.idx, payload)
        if (password) return password
      } catch (error) {
        this.$alert(this.$v('인증을 실패하였습니다.')
          , { dangerouslyUseHTMLString: true })
      }
    },
    /**
     * 동기화를 매 10 초마다 한번씩 진행합니다.
     */

    async startInterval () {
      this.interval = setInterval(() => {
        this.setGridItemSource()
      }, 10000)
    },
    /**
     * [네트워크 카테고리]를 세팅 합니다.
     */
    saveNetworkOrg (data) {
      // console.log(`%c 네트워크 카테고리:: ${data}`, 'color: #bada55')
      // console.log('@@ network data : ', data)
      this.newItem.networkGroup = data?.map(item => {
        const { cateIdx, cateKey, cateName } = item
        return { cateIdx, cateKey, cateName }
      })

      this.newItem.cateIdx = null
      this.newItem.cateKey = null
      this.newItem.cateName = null
      if (data.length > 0) {
        this.newItem.cateIdx = data[0].cateIdx
        this.newItem.cateKey = data[0].cateKey
        this.newItem.cateName = data[0].cateName
      }
    },
    /** API_HANDLER - (GET) vCenter 리스트 조회  */
    async getVcenterList () {
      try {
        let result = []
        this.gridLoading = true
        console.log('API: getVcenterList')
        const response = await API.vmware.vcenter.getVcenterList()
        const connectVcentertInfo = response
          .map(({ connectIdx, name, hostList, userConnectInfo, job }) => {
            return {
              idx: connectIdx,
              name: userConnectInfo.name,
              auth: {},
              url: userConnectInfo.url,
              id: userConnectInfo.id,
              cateName: userConnectInfo.cateName,
              cateKey: userConnectInfo.cateKey,
              cateIdx: userConnectInfo.cateIdx,
              password: userConnectInfo.password,
              connectedESXiList: hostList,
              isManage: userConnectInfo.isManage,
              isSync: job.state,
              syncInterval: userConnectInfo.syncInterval,
              connectSuccessTime: this.$options.filters.date(job.lastEndTime)
            }
          })
        this.vcenterAllData = response
        result = connectVcentertInfo

        return result
      } catch (error) {
        throw new Error(this.$v('vCenter 리스트를 조회할 수 없습니다.'))
      }
    },
    /** 리스트를 가져와서 그리드를 세팅합니다.
    */
    async setGridItemSource () {
      try {
        this.gridLoading = true
        this.itemSourceVcenterList = await this.getVcenterList()
      } catch (error) {
        clearInterval(this.interval)
      } finally {
        this.gridLoading = false
      }
    },

    /* -------------------------- SECTION vCenter 테스트 ------------------------- */
    /**
     * EVENT_HANDLER - (테스트) 인증정보로 테스트 실행
     * @param {string} type 현재 [항목추가] 인지 [변경] 인지 확인
     * @returns {(Function|Boolean)}
     */
    async handleClickToConnectionTest (type = this.showModal.type) {
      try {
        console.log('@handleClickToConnectionTest')
        const payload = this.setTestPayload(this.newItem)
        const element = await this.checkConnectVcenterTest(payload)
        // console.log('🚀 ~ file: VmwCenter.script.js:176 ~ handleClickToConnectionTest ~ element', element)
        if (!type) return false

        this.testPassed = element.isSuccess === true
        if (!this.testPassed) {
          const message = this.$v('연결 테스트에 실패하였습니다.')
          this.$alert(message, '알림', { confirmButtonText: this.$v('확인') })
        } else return false
      } catch (error) {
        console.error(error)
      } finally {
        this.isConnecting = false
      }
    },
    /**
     * 인스턴스를 생성합니다. (payload 값을 설정합니다.)
     * @param {Object} item
     */
    setTestPayload (item = this.newItem) {
      if (this.isConnecting || !this.newItem) return
      this.isConnecting = true
      const payload = {
        id: item.id,
        password: item.updateConnectPassword,
        url: item.url
      }
      return payload
    },

    /* -------------------------- !SECTION vCenter 테스트 ------------------------- */
    /** API_HANDLER - (POST)[테스트] API 를 호출합니다
     * @param {Object} payload
     */
    async checkConnectVcenterTest (payload) {
      try {
        return await API.vmware.vcenter.checkConnectVcenterTest(payload)
      } catch (error) {
        this.errorHandler(error, '에러발생')
      }
    },
    // ===================================
    // ========== 모달 내용 저장 ============
    // ===================================

    /** EVENT_HANDLER - [항목 추가 / 변경] > [확인] vCenter
     * [항목 추가 / 변경] > [확인] 클릭시 발생하는 이벤트를 다룹니다.
     * 같은 모달을 사용하므로, 함수 두개로 분리시킵니다
     */
    async handleClickUpdateVCenter (newItem = this.newItem) {
      if (this.packageType !== 'ENT') newItem.isCalm = false // 마켓플레이스는 ENTER 버전에서 지원하므로 기본값 false 로 고정
      const thresObj = this.convertThresholdsToObj(this.TESTobj) // 임계치 객체로 변환
      newItem = { ...newItem, ...thresObj }
      this.newItem = { ...newItem, ...thresObj }
      let valueCheck = [
        { displayName: this.$t('admin.PREF.userName'), key: 'id' }, // 유저 이름
        { displayName: this.$t('admin.PREF.userPw'), key: 'updateConnectPassword' }, // 유저 비밀번호
        { displayName: 'URL', key: 'url' },
        { displayName: 'vCenter 명', key: 'name' }, // Prism-Central 이름
        { displayName: '인터벌 주기(분)', key: 'syncInterval' },
        { displayName: this.$t('admin.PREF.isOper'), key: 'isManage' } // 운영 여부
      ]
      const syncValue = [
        { displayName: '네트워크 조직', key: 'cateIdx' },
        // { displayName: '가상화율', key: 'virtualPercent' },
        { displayName: '관리 지표', key: 'cpuManageIndicator' },
        { displayName: '1차 가상화율 임계치', key: 'firstCpuPercent' },
        { displayName: '2차 가상화율 임계치', key: 'secondCpuPercent' },
        { displayName: '관리 지표', key: 'memoryManageIndicator' },
        { displayName: '1차 메모리 임계치', key: 'firstMemoryPercent' },
        { displayName: '2차 메모리 임계치', key: 'secondMemoryPercent' },
        { displayName: '관리 지표', key: 'diskManageIndicator' },
        { displayName: '1차 디스크 임계치', key: 'firstDiskPercent' },
        { displayName: '2차 디스크 임계치', key: 'secondDiskPercent' }]

      if (this.showModal.type === 'create') {
        valueCheck = [...valueCheck, ...syncValue]
        const fullfilled = valueCheck.every(cond => {
          const condition = newItem[cond.key]
          // isManage 는 값이 false일 수 있습니다.
          if (condition === undefined || condition === '' || condition === null || condition.length === 0) this.$alert(this.$t('common.ALERT.BASE.003', { displayName: cond.displayName }), '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
          if (condition === 0) this.$alert(this.$t('common.ALERT.NUTA.043')) // 임계치는 0 을 입력할 수 없습니다.
          return typeof condition === 'boolean' ? true : condition
        })

        // 1차 / 2차 임계치 및 관리지표 크기 벨리데이션 (관리지표 > 2차 > 1차)
        const comparison = ['Cpu', 'Memory', 'Disk']
        const isSuccessCompare = comparison.every(cond => {
          const indicator = newItem[`${cond.toLocaleLowerCase()}ManageIndicator`]
          const condition1 = newItem[`first${cond}Percent`]
          const condition2 = newItem[`second${cond}Percent`]

          return condition1 < condition2 && condition2 < indicator
        })

        if (!fullfilled) return false
        if (!isSuccessCompare) {
          this.$alert(this.$v('관리지표는 2차 임계치보다 크고,<br/> 2차 임계치는 1차 임계치보다 커야 합니다.'), '알림', { dangerouslyUseHTMLString: true })
          return false
        }
      }

      const confirm = (this.showModal.type === 'create') ? '021' : '015' // 해당 항목을 생성하시겠습니까? : 업데이트 하시겠습니까?
      const result = await this.updateItemAction(this.$t(`common.CONFIRM.BASE.${confirm}`))
      if (result) this.closeModal()
    },
    /** EVENT_HANDLER - (모달 닫기) 항목 추가/변경 */
    handleClickCloseModal () {
      this.closeModal()
    },
    /**
     * [항목 추가/변경 > 확인] 시 central 이 추가/변경 되도록 하는 함수입니다.
     * @param {String} message
     */
    async updateItemAction (message) {
      try {
        const item = this.newItem
        const row = this.selectedRow
        const type = this.showModal.type

        const isConfirmed = await this.$confirm(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          cancelButtonText: this.$t('common.BTN.cancel')
        }).then(() => true).catch(() => false)

        if (isConfirmed) {
          this.isConnecting = true
          const payload = this.newItem
          payload.password = this.newItem.updateConnectPassword

          if (type === 'update') { // [변경]일 때
            payload.isDeleted = item.isDeleted
            return await this.updateTheVcenter({ ...row, ...payload })
          } else { // [항목 추가]일 때
            return await this.createTheVcenter({ ...payload })
          }
        }
        return true
      } catch (error) {
        this.$alert(error.message)
      } finally {
        this.isConnecting = false
      }
    },

    /** API_HANDLER - (POST) vCenter 항목 생성
     * @param {object} payload
     */
    async createTheVcenter (payload) {
      try {
        this.gridLoading = true
        console.log('API: createTheVcenter')
        const response = await API.vmware.vcenter.createTheVcenter(payload)
        if (response) this.$alert(this.$t('common.ALERT.BASE.026'), '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
      } catch (error) {
        throw new Error(this.$v('vCenter 항목을 생성하는 도중 문제가 발생했습니다.'))
      } finally {
        this.gridLoading = false
      }
    },
    /** API_HANDLER - (POST) vCenter 변경
     * @param {Number} centralIdx 삭제할(선택된) row 의 인덱스
     * @param {Object} payload API 에 함께 전달할 데이터
     */
    async updateTheVcenter (payload) {
      try {
        this.gridLoading = true
        const updated = await API.vmware.vcenter.updateTheVcenter(payload)
        if (updated) return await this.$alert(this.$t('common.ALERT.BASE.056'), '알림', { confirmButtonText: this.$t('common.BTN.confirm') }).then(() => true).catch(() => false)
      } catch (error) {
        this.errorHandler(error, this.$t('common.ALERT.NUTA.046')) // 변경하는 도중 문제가 발생했습니다. <br>
      } finally {
        this.gridLoading = false
      }
    },
    /** EVENT_HANDLER - (삭제)  vcenter 항목 삭제
     * @param {object} payload
     */
    async handleClickDeleteVcnter (payload) {
      this.$confirm(this.$v('common.CONFIRM.BASE.032'), '삭제', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        await this.deleteTheVcenter(this.selectedRow.idx)
        await this.setGridItemSource()
        return this.closeModal()
      }).catch(() => false)
    },
    /** API_HANDLER - (delete) vCenter 항목 생성
     * @param {object} payload
     */
    async deleteTheVcenter (payload) {
      try {
        this.gridLoading = true
        console.log('API: deleteTheVcenter')
        const response = await API.vmware.vcenter.deleteTheVcenter(payload)
        if (response) this.$alert(this.$v('common.ALERT.BASE.026'), '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
      } catch (error) {
        throw new Error(this.$v('vCenter 항목을 생성하는 도중 문제가 발생했습니다.'))
      } finally {
        this.gridLoading = false
      }
    },

    // ==========================
    // ========= [동기화] =========
    // ==========================
    /**
    /** EVENT_HANDLER - [동기화] 버튼 클릭시 발생합니다. 동기화를 활성화시킵니다.
     */

    // ============================
    // ========= 모달 open =========
    // ============================
    /**
     * EVENT_HANDLER - [항목추가] 버튼을 클릭시 해당 모달을 띄웁니다.
     */
    handleClickOpenAddModal () {
      this.isConnecting = false
      this.newItem = {}
      this.showModal = {
        view: true,
        type: 'create'
      }
      this.newItem = {
        connectInterval: 1,
        isManage: false,
        isCalm: undefined
      }
      this.testPassed = false
      this.newItem.networkGroup = []
      if (this.selectedRow) {
        const { cateKey, cateIdx, cateName } = this.selectedRow
        if (this.selectedRow.cateIdx) this.newItem.networkGroup.push({ cateKey, cateIdx, cateName })
      }
    },
    /**
     * [변경] 버튼을 클릭시 해당 모달을 띄웁니다.
     * 선택된 row 의 데이터를 가지고 변경을 시도합니다.
     * @param {Object} item 선택된 row 데이터
     */
    handleClickOpenUpdateModal (item) {
      console.log(item)
      if (item !== undefined) this.selectedRow = item
      this.isConnecting = false
      this.newItem = {}
      this.showModal = {
        view: true,
        type: 'update'
      }
      this.newItem = cloneDeep(item)
      this.testPassed = false
    },
    /**
     * API_HANDLER - 동기화 처리 API 를 호출합니다
     * @param {Number} idx
     */
    async runSyncTheVcenter (hostUuid) {
      try {
        return await API.vmware.vcenter.runSyncTheVcenter(hostUuid)
      } catch (error) {
        this.errorHandler(error)
      }
    },
    /** EVENT_HANDLER - [동기화] 버튼 클릭시 발생합니다. 동기화를 활성화시킵니다.
    */
    handleClickRunSyncVcenter () {
      // 해당 항목(' + this.selectedRow.centralName + ')을<br>동기화 하시겠습니까?
      this.$confirm(this.$t('common.CONFIRM.NUTA.007', { centralName: this.selectedRow.name }), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel'),
        dangerouslyUseHTMLString: true
      }).then(async () => {
        console.log(this.selectedRow)
        await this.runSyncTheVcenter(this.selectedRow.idx)
        // 동기화 작업을 요청하였습니다.
        this.$alert(this.$t('common.ALERT.NUTA.001'), '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
        return await this.setGridItemSource()
      }).catch(() => false)
    },
    /**
     * [항목추가 / 변경] 모달을 닫습니다.
     */
    closeModal () {
      this.isConnecting = false
      this.showModal = {
        view: false,
        type: undefined
      }
      this.newItem = {}
      this.testPassed = false
      this.gridRefresh(this.grid)
      this.selectedRow = null
      this.selectedRowIdx = undefined
    },

    /**
     * 그리드 설정 - 인터벌시에도 선택된 데이터가 계속 유지되도록 합니다.
     * @param {Object} grid
     */
    init (grid) {
      this.grid = grid

      // sorting 이벤트 발생할 경우 저장
      grid.sortingColumn.addHandler((s, e) => {
        const col = s.columns[e.col]
        const asc = col.currentSort !== '+'

        this.sortedCol = { binding: col.binding, asc }
      })

      // 선택된 row 를 유지합니다.
      grid.addEventListener(grid.hostElement, 'click', (e) => {
        const ht = grid.hitTest(e) // HitTestInfo
        const rows = grid.cells.rows // 클릭한 rows의 data
        const selectedRow = rows[ht.row]
        if (ht.cellType === 1) {
          // 동기화 되도 저장할 수 있도록 합니다
          // 선택된 row를 한번 더 클릭하면 선택을 해제합니다
          if (this.selectedRowIdx === undefined || this.selectedRowIdx !== selectedRow.index) {
            this.selectedRow = selectedRow ? selectedRow.dataItem : null
            this.selectedRowIdx = selectedRow.index
          } else {
            this.selectedRowIdx = undefined
            this.selectedRow = null
          }
        }
      })
    },
    gridRefresh (grid) {
      const cv = grid.collectionView
      cv.refresh()
    },
    routeTo (to) {
      this.$router.push(to)
    }
  },
  beforeDestroy () {
    clearInterval(this.interval)
  },
  data () {
    return {
      TESTobj: [],
      itemSourceVcenterList: [],
      vcenterAllData: [],
      totalResultCnt: 0,
      otpModalActive: false,
      otp: false,
      intervalMin: 1,
      interval: null,

      gridLoading: false, // Central 목록 로딩바
      isConnecting: false, // [테스트] 진행중인지 로딩바

      showModal: { // [항목 추가 / 변경] 모달 visible 여부
        view: false,
        type: undefined
      },
      selectedRow: null, // 선택된 로우
      selectedRowIdx: undefined, // 선택한 로우 유지
      testPassed: false, // 테스트 성공 했는지 여부
      newItem: {}, // [항목 추가/변경] 시 내부 입력된 데이터 저장
      // 테이블 정보
      columns: [

        { header: 'ID', binding: 'idx', width: 80 },
        { header: 'vCenter 이름', binding: 'name', width: 200, customHtml: true, align: 'left' },
        { header: this.$v('인터벌 주기(분)'), binding: 'syncInterval', width: 100, customHtml: true },
        { header: 'URL', binding: 'url', width: '*', customHtml: true },
        { header: '연결된 ESXi', binding: 'connectedESXiList', width: '*', customHtml: true },
        { header: '운영 여부', binding: 'isManage', width: 100, customHtml: true, keyPath: 'admin.PREF.isOper' },
        { header: '동기화 상태', binding: 'isSync', width: 160, customHtml: true, keyPath: 'common.GRID.NUTA.syncState' },
        { header: '마지막 동기 시간', binding: 'connectSuccessTime', width: 150, dataType: 'Date', keyPath: 'common.GRID.lastSyncTime' }
      ],
      tableData: [],
      sortedCol: null,
      columnDataMap: {
        isSync: [
          { value: 0, caption: this.$t('common.fail') },
          { value: 1, caption: this.$t('common.success') },
          { value: -1, caption: this.$t('common.syncing') }
        ],
        isManage: [
          { value: true, caption: this.$t('common.oper') },
          { value: false, caption: this.$t('common.noOper') }
        ],
        isCalm: [
          { value: true, caption: this.$t('service.INSTALL.STATUS.use') },
          { value: false, caption: this.$t('service.INSTALL.STATUS.noUse') }
        ],
        connectSuccessTime: null
      },
      syncStatus (isSync) {
        return {
          SUCCESS: { contents: this.$t('common.success'), type: 'is-complete' },
          FAIL: { contents: this.$t('common.fail'), type: 'is-fail' }
        }[isSync]
      },
      errorHandler (error, koMsg) {
        if (error.response) {
          if (error.response.data.code === 'IAM002') return false

          const message = (error.response && error.response.data) ? error.response.data.message : error.message
          this.$alert(koMsg + message, '알림', {
            confirmButtonText: this.$t('common.BTN.confirm'),
            dangerouslyUseHTMLString: true
          })
          return false
        }
      }
    }
  }
}
