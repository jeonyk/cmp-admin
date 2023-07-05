/**
  * 파일명 : NutanixCentral.script.js
  * 파일 기능 : 뉴타닉스 Central 리스트 노출 및 관리(테스트, 추가, 변경, 삭제)
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2021-02-25
  * License By Shinsegae I&C
  * 2021-02-25 Fix: network 변경 API 오류 수정
 **/

import { cloneDeep } from 'lodash'
import API from '@sd-fe/cmp-core'

import SyncComponent from '@/components/SyncComponent/SyncComponent'
import NutanixCentralImageList from './NutanixCentralImageList.vue'
import CheckIcon from '@/components/Icons/CheckIcon.vue'
import OTPModal from '@/components/Modal/OTPModal/OTPModal'
import Dayjs from 'dayjs'
import { mapGetters } from 'vuex'

export default {
  name: 'NutanixCentral',
  components: {
    'sync-component': SyncComponent,
    NutanixCentralImageList,
    'otp-modal': OTPModal,
    CheckIcon
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
    'newItem.connectUsername' () {
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
    }
  },
  created () {
    if (this.packageType !== 'ENT') {
      const index = this.columns.findIndex(col => col.onlyEnt)
      this.columns.splice(index, 1)
    }
  },
  async mounted () {
    this.getCentralList()
    this.startInterval()
  },
  methods: {
    callbackApi: API.compute.getCentralConfig,
    /**
     * OTP 인증
     */
    validatedOTP (data) {
      if (data?.isOtpAuth) this.$set(this.newItem, 'updateConnectPassword', data?.password)
      else this.$alert(this.$t('common.ALERT.PROJECT.022'))

      this.otpModalActive = false
      this.otp = true

      this.$nextTick(() => {
        this.$refs.otpPasswordInput.passwordVisible = false
      })
    },
    /**
     * 동기화를 매 10 초마다 한번씩 진행합니다.
     */
    async startInterval () {
      this.interval = setInterval(() => {
        this.getCentralList()
      }, 10000)
    },
    /**
     * Central 전체 리스트를 가져옵니다.
     */
    async getCentralList () {
      try {
        this.gridLoading = true
        const rawCentral = await API.compute.getCentralList()
        this.tableData = await this.settingCentral(rawCentral)
      } catch (error) {
        this.errorHandler(error)
        this.tableData = []
        clearInterval(this.interval)
      } finally {
        this.gridLoading = false
      }
    },
    /**
     * Central 리스트를 가공합니다.
     * @param {Array} rawCentral API로 가져온 Central 목록 데이터입니다.
     * @return {Array} tableData를 위한 데이터를 가공합니다.
     */
    settingCentral (rawCentral) {
      if (!rawCentral) return

      const mappedTime = []
      // let jobOnceUpdateTime = null
      // let jobSimpleUpdateTime = null
      let checkSyncStatus = 1 // 0 실패, -1 진행중, 1 성공

      const centralLists = rawCentral.map(central => {
        const { jobs } = central

        // 인터벌주기
        central.intervalMin = central.connectInterval ? central.connectInterval / 60 : ''

        if (jobs) {
          let biggestUpdateTime = null
          let jobType = null
          checkSyncStatus = 1

          jobs.forEach(job => {
            // job 들 중, 가장 최근 updateTime / jobType 을 저장합니다.
            if (biggestUpdateTime === null || biggestUpdateTime < job.updateTime) {
              biggestUpdateTime = job.updateTime
              jobType = job.jobType
            }

            if (job.apiRunTime < 1) checkSyncStatus = -1 // 동기화 진행중
          })

          // updateTime 이 가장 큰 jobType 을 가진 job들 사이에서
          // apiIsSuccess(동기화 상태) 가 모두 true => 동기화 성공 || 하나라도 false => 동기화 실패
          // apiRunTime :: 동기화 시간이 얼마나 걸렸는지에 대한 값 => 0인 경우 ? 아직 동기화중이기 때문에 응답이 없음
          const comparison = jobs.filter(job => job.jobType === jobType)
          const apiIsSuccess = Number(comparison.every(job => job.apiIsSuccess))
          checkSyncStatus = (checkSyncStatus === -1) ? -1 : apiIsSuccess // 동기화중 :: 동기화 성공/실패

          central.connectSuccessTime = Dayjs(biggestUpdateTime).format('YYYY.MM.DD HH:mm:ss')
          central.connectInterval = central.connectInterval / 60

          const time = new Date(Dayjs(central.connectSuccessTime).add(-9, 'hour').add(this.intervalMin, 'minute').format()).getTime()
          central.isSync = new Date().getTime() < time ? -1 : checkSyncStatus
        }
        if (central.centralClusters?.lnegth) central.centralClusterFirstEl = central.centralClusters[0].elementName

        mappedTime.push({
          value: central.connectSuccessTime,
          caption: this.$options.filters.date(central.connectSuccessTime)
        })
        this.columnDataMap.connectSuccessTime = Array.from(new Set(mappedTime))

        return central
      })

      return centralLists
    },

    // ===================================
    // ========= 모달 내부 [테스트] ==========
    // ===================================

    /**
     * [테스트] 버튼을 클릭했을때 [항목추가] 인지 [변경] 인지 확인 후 해당 함수를 실행합니다.
     * @param {string} type 현재 [항목추가] 인지 [변경] 인지 확인
     * @returns {(Function|Boolean)}
     */
    activeTest (type = this.showModal.type) {
      if (type) return this.activeTestCreate(this.newItem)
      else return false
    },
    /**
     * [항목 추가/변경 > 테스트] 버튼이 connection 이 연결될 경우 활성화 시킵니다.
     * 연결여부를 알려주고 하단 작업이 가능하도록 설정합니다.
     * @param {Object} item
     */
    async activeTestCreate (item = this.newItem) {
      try {
        if (this.isConnecting || !this.newItem) return
        this.isConnecting = true

        const payload = {
          connectPassword: item.updateConnectPassword,
          connectUrl: item.connectUrl,
          connectUsername: item.connectUsername,
          name: item.centralName,
          isCalm: item.isCalm
        }

        // 🔥 API ㅇㅕ기루?
        const testPassed = await this.connectionTestCentral(payload)
        this.testPassed = testPassed.isConnected
        // 연결 테스트에 (this.testPassed ? '성공' : '실패') 하였습니다.
        if (!this.testPassed) {
          const message = this.$t('common.ALERT.NUTA.006')
          this.$alert(message, '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
        }
      } catch (error) {
        this.errorHandler(error)
      } finally {
        this.isConnecting = false
      }
    },
    /**
     * [테스트] API 를 호출합니다
     * @param {Object} payload
     */
    async connectionTestCentral (payload) {
      try {
        return await API.compute.connectionTestCentral(payload)
      } catch (error) {
        this.errorHandler(error)
      }
    },

    // ===================================
    // ========== 모달 내용 저장 ============
    // ===================================

    /**
     * [항목 추가 / 변경] > [확인] 클릭시 발생하는 이벤트를 다룹니다.
     * 같은 모달을 사용하므로, 함수 두개로 분리시킵니다
     */
    async confirmUpdateItem (newItem = this.newItem) {
      if (this.packageType !== 'ENT') newItem.isCalm = false // 마켓플레이스는 ENTER 버전에서 지원하므로 기본값 false 로 고정

      const valueCheck = [
        { displayName: 'Prism-Central 이름', key: 'centralName', message: this.$v('Prism-Central 이름을 입력해주세요.') },
        { displayName: '유저 이름', key: 'connectUsername', message: this.$v('유저 이름을 입력해주세요.') },
        { displayName: '유저 비밀번호', key: 'updateConnectPassword', message: this.$v('유저 비밀번호을 입력해주세요.') },
        { displayName: 'URL', key: 'connectUrl', message: this.$v('URL을 입력해주세요.') },
        { displayName: '마켓플레이스 사용 가능 여부', key: 'isCalm', message: this.$v('마켓플레이스 사용 가능 여부를 입력해주세요.') },
        { displayName: '운영 여부', key: 'isManage', message: this.$v('운영 여부를 입력해주세요.') }
      ]

      const fullfilled = valueCheck.every(cond => {
        const condition = newItem[cond.key]
        // isManage 는 값이 false일 수 있습니다.

        if (condition === undefined || condition === '') this.$alert(cond.message)
        return typeof condition === 'boolean' ? true : condition
      })

      if (!fullfilled) return false

      const confirm = (this.showModal.type === 'create') ? '021' : '015' // 해당 항목을 생성하시겠습니까? : 업데이트 하시겠습니까?
      return this.updateItemAction(this.$t(`common.CONFIRM.BASE.${confirm}`))
    },

    /**
     * [항목 추가/변경 > 확인] 시 central 이 추가/변경 되도록 하는 함수입니다.
     * @param {String} message
     */
    updateItemAction (message) {
      const item = this.newItem
      const row = this.selectedRow
      const type = this.showModal.type

      this.$confirm(message, '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        const payload = {
          name: item.centralName,
          connectUsername: item.connectUsername,
          connectPassword: item.updateConnectPassword,
          isManage: item.isManage,
          isCalm: item.isCalm,
          connectUrl: item.connectUrl,
          connectInterval: item.connectInterval * 60
        }

        if (type === 'update') { // [변경]일 때
          payload.isDeleted = item.isDeleted

          await this.updateCentral(row.centralIdx, payload)
        } else { // [항목 추가]일 때
          await this.createCentral(payload)
        }

        await this.getCentralList()
        return this.closeModal()
      }).catch(() => false)
    },

    /**
     * [항목 추가 > 확인] Central 추가 API 를 실행합니다
     * @param {Object} payload
     */
    async createCentral (payload) {
      try {
        this.isConnecting = true
        const created = await API.compute.createCentral(payload)
        if (created) this.$alert(this.$t('common.ALERT.BASE.026'), '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
      } catch (error) {
        this.errorHandler(error, this.$v('항목을 추가하는 도중 문제가 발생했습니다. <br>'))
      } finally {
        this.isConnecting = false
      }
    },

    /**
     * [변경 > 확인] Central 이 변경될 때 API를 실행합니다.
     * @param {Number} centralIdx 삭제할(선택된) row 의 인덱스
     * @param {Object} payload API 에 함께 전달할 데이터
     */
    async updateCentral (centralIdx, payload) {
      try {
        this.isConnecting = true
        const updated = await API.compute.updateCentral(centralIdx, payload)
        if (updated) this.$alert('업데이트 하였습니다.', '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
      } catch (error) {
        this.errorHandler(error, this.$v('변경하는 도중 문제가 발생했습니다. <br>'))
      } finally {
        this.isConnecting = false
      }
    },

    // ==========================
    // ========= [삭제] ==========
    // ==========================

    /**
     * [삭제] 버튼을 눌렀을 때, 선택한 row 데이터를 삭제 여부를 리턴합니다.
     * @return {void} 삭제 성공 여부
     */
    applyRemove () {
      this.$confirm(this.$t('common.CONFIRM.BASE.032'), '삭제', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        const payload = { isDeleted: true }

        await this.deleteCentral(this.selectedRow.centralIdx, payload)
        await this.getCentralList()

        // this.gridRefresh(this.grid)
        // this.selectedRow = null
        this.closeModal()
      }).catch(() => false)
    },
    /**
     * 선택한 Central을 [삭제]할 때 발생합니다.
     * @param {Number} centralIdx 삭제할(선택된) row 의 인덱스
     * @param {Object} payload API 에 함께 전달할 데이터
     */
    async deleteCentral (centralIdx, payload) {
      try {
        this.gridLoading = true // loading
        const removed = await API.compute.deleteCentral(centralIdx, payload)
        if (removed) this.$alert(this.$t('common.ALERT.BASE.017'), '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
      } catch (error) {
        this.errorHandler(error)
      } finally {
        this.gridLoading = false
      }
    },

    // ==========================
    // ========= [동기화] =========
    // ==========================
    /**
     * 동기화 처리 API 를 호출합니다
     * @param {*} centralIdx
     */
    async syncCentral (centralIdx) {
      try {
        return await API.compute.syncCentral(centralIdx)
      } catch (error) {
        this.errorHandler(error)
      }
    },
    /**
     * [동기화] 버튼 클릭시 발생합니다. 동기화를 활성화시킵니다.
     */
    activeSync () {
      // 해당 항목(' + this.selectedRow.centralName + ')을<br>동기화 하시겠습니까?
      this.$confirm(this.$t('common.CONFIRM.NUTA.007', { centralName: this.selectedRow.centralName }), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel'),
        dangerouslyUseHTMLString: true
      }).then(async () => {
        await this.syncCentral(this.selectedRow.centralIdx)
        // 동기화 작업을 요청하였습니다.
        this.$alert(this.$t('common.ALERT.NUTA.001'), '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
        return await this.getCentralList()
      }).catch(() => false)
    },

    // ============================
    // ========= 모달 open =========
    // ============================
    /**
     * [항목추가] 버튼을 클릭시 해당 모달을 띄웁니다.
     */
    addModalOpen () {
      this.isConnecting = false
      this.newItem = {}
      this.showModal = {
        view: true,
        type: 'create'
      }
      this.newItem = {
        connectInterval: 1,
        isManage: undefined,
        isCalm: undefined
      }
      this.testPassed = false
    },
    /**
     * [변경] 버튼을 클릭시 해당 모달을 띄웁니다.
     * 선택된 row 의 데이터를 가지고 변경을 시도합니다.
     * @param {Object} item 선택된 row 데이터
     */
    updateModalOpen (item) {
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

      // newItem: {
      //   id: this.updateItem ? this.updateItem.id : 'id' + Math.random().toString(36).substr(2),
      //   name: this.updateItem ? this.updateItem.name : '',
      //   auth: {
      //     userName: this.updateItem ? this.updateItem.auth.userName : '',
      //     userPw: this.updateItem ? this.updateItem.auth.userPw : ''
      //   },
      //   url: this.updateItem ? this.updateItem.url : '',
      //   element: this.updateItem ? this.updateItem.element : '',
      //   syncCycle: this.updateItem ? this.updateItem.syncCycle : '',
      //   useMp: this.updateItem ? this.updateItem.useMp : 'Y',
      //   state: this.updateItem ? this.updateItem.state : true,
      //   time: new Date()
      // },

      // 테이블 정보
      columns: [
        { header: 'ID', binding: 'centralIdx', width: 80 },
        { header: 'Prism-Central 이름', binding: 'centralName', width: 200, customHtml: true, align: 'left', keyPath: 'common.GRID.NUTA.prismCentralName' },
        // { header: '인증 정보', binding: 'auth', width: 150, customHtml: true, keyPath: 'admin.PREF.authInfo' },
        { header: 'URL', binding: 'connectUrl', customHtml: true },
        { header: '인터벌 주기(분)', binding: 'intervalMin', width: 150, customHtml: true, keyPath: 'common.GRID.NUTA.interval' },
        { header: '연결 Element', binding: 'centralClusterFirstEl', width: '*', customHtml: true, keyPath: 'common.GRID.NUTA.connElement' },
        { header: '마켓플레이스 사용 가능 여부', binding: 'isCalm', width: 180, customHtml: true, keyPath: 'common.GRID.NUTA.isMarket', onlyEnt: true },
        { header: '운영 여부', binding: 'isManage', width: 100, customHtml: true, keyPath: 'admin.PREF.isOper' },
        { header: '동기화 상태', binding: 'isSync', width: 130, customHtml: true, keyPath: 'common.GRID.NUTA.syncState' },
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
          1: { contents: this.$t('common.success'), type: 'is-complete' },
          0: { contents: this.$t('common.fail'), type: 'is-fail' }
        }[isSync]
      },
      errorHandler (error, koMsg) {
        if (error.response) {
          if (error.response.data.code === 'IAM002') return false

          // 기타 에러값
          // COMMON0001 : central/ element / era 등록 시 필수 값 null 일 경우
          // COMMON0012 : element 가상화율 및 임계치 퍼센트 등록 시 0 보다 작게 입력할 경우
          // COMMON0011 : element 2차 임계치가 1차 임계치보다 작을 경우
          // COMMON0003 : central / element 연결 실패 시

          const { code: errorCode, message: errorMsg } = error.response?.data

          const code = {
            COMMON0006: {
              central: this.$v('이미 등록된 URL입니다.'),
              name: this.$v('이미 등록된 Central입니다.')
            }[errorMsg?.split(': ')[1]]
          }

          const customMessage = code[errorCode]
          const defaultMessage = koMsg + (error.response && error.response.data) ? error.response.data.message : error.message

          const message = customMessage || defaultMessage
          this.$alert(message, '알림', {
            confirmButtonText: this.$t('common.BTN.confirm'),
            dangerouslyUseHTMLString: true
          })
          return false
        }
      }
    }
  }
}
