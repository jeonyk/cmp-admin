/**
  * 파일명 : VmwEsxi.script.js
  * 파일 기능 : VMware Esxi 리스트 노출 및 관리(테스트, 추가, 변경, 삭제)
  * 작성자 : 이유준
  * 최종 작성일 : 2022-09-22
  * License By Shinsegae I&C
 **/

import { cloneDeep } from 'lodash'
import API, { NetworkCategoryTreeSelectionBtn } from '@sd-fe/cmp-core'
import CheckIcon from '@/components/Icons/CheckIcon'
import SyncComponent from '@/components/SyncComponent/SyncComponent'
import OTPModal from '@/components/Modal/OTPModal/OTPModal'
import SelectDatacenterCate from '@/components/Selectboxs/SelectDatacenterCate.vue'
// import Dayjs from 'dayjs'

export default {
  name: 'VmwEsxi',
  components: {
    NetworkCategoryTreeSelectionBtn,
    SelectDatacenterCate,
    'sync-component': SyncComponent,
    'otp-modal': OTPModal,
    CheckIcon
  },
  watch: {
    'newItem.id' () {
      this.testPassed = false
    },
    'newItem.connectPassword' () {
      this.testPassed = false
    },
    'newItem.url' () {
      this.testPassed = false
    },
    'showModal.view' (val) {
      if (!val) this.otp = false
    }
  },
  async created () {
    // 호스트 리스트 조회
    this.setGridItemSource()
    this.getNetworkCategoryTree()
  },
  computed: {
    isConnectedVC () {
      if (this.selectedRow?.vcenterUuid) return true
      return false
    }
  },
  methods: {
    /* ----------------------- SECTION - 메서드 리펙토링 및 수정작업중 ----------------------- */
    /** EVENT_HANDLER (카테고리 저장) 네트워크 모달에 '확인' 버튼 클릭시 동작
     * 선택되어진 카테고리를 변수에 동기시킵니다.
    */
    // handleSaveNctSelected (data) {
    //   this.selectedCateList = data
    //   this.newItem.cateIdx = null
    //   this.newItem.cateCate = null
    //   this.newItem.cateName = null
    //   if (data.length > 0) {
    //     this.newItem.cateIdx = data[0].cateIdx
    //     this.newItem.cateCate = data[0].cateCate
    //     this.newItem.cateName = data[0].cateName
    //   }
    // },
    /** EVENT_HANDLER (변경) 데이터센터 변경  */
    handleChangeDcenter (data) {
      const networkGroups = data
      this.newItem.networkGroup = networkGroups?.map(item => {
        const { cateIdx, cateKey, cateName } = item
        return { cateIdx, cateKey, cateName }
      })

      this.newItem.cateIdx = null
      if (networkGroups.length > 0) this.newItem.cateIdx = networkGroups[0].cateIdx
    },
    /** API_HANDLER - (GET) ESXi 리스트 조회  */
    async getESXiList () {
      try {
        let result = []
        console.log('API: getESXiList')
        const response = await API.vmware.host.getVmwareHostList()
        console.log(response)
        const connectHostInfo = response
          .map(({ connectIdx, name, hostUuid, vcenterUuid, job, userConnectInfo, userConnectDetailInfo }) => {
            return {
              idx: connectIdx,
              name: userConnectDetailInfo.name,
              hostName: name,
              hostUuid: hostUuid,
              isManage: userConnectInfo.isManage,
              isSync: job.state,
              url: userConnectInfo.url,
              id: userConnectInfo.id,
              password: userConnectInfo.password,
              cateName: userConnectDetailInfo.cateName,
              cateKey: userConnectDetailInfo.cateKey,
              cateIdx: userConnectDetailInfo.cateIdx,
              syncInterval: userConnectInfo.syncInterval,
              vcenterName: userConnectInfo.type === 'VCENTER' ? userConnectInfo.name : userConnectDetailInfo.vcenterName,
              vcenterUuid: vcenterUuid,
              defaultDatastoreName: userConnectDetailInfo.defaultDatastoreName,
              defaultDatastoreUuid: userConnectDetailInfo.defaultDatastoreUuid,
              connectSuccessTime: this.$options.filters.date(job.lastEndTime)
            }
          })
        result = connectHostInfo

        return result
      } catch (error) {
        throw new Error(this.$v('ESXi 리스트를 조회할 수 없습니다.'))
      }
    },
    /** 리스트를 가져와서 그리드를 세팅합니다.
    */
    async setGridItemSource () {
      try {
        this.gridLoading = true
        console.log('Method: setGridItemSource')
        this.itemSourceEsxiList = await this.getESXiList()
      } catch (error) {
        this.tableData = []
        clearInterval(this.interval)
      } finally {
        this.gridLoading = false
      }
    },
    /** API_HANDLER - (POST) ESXi 항목 생성
     * @param {object} payload
     */
    async createTheESXi (payload) {
      try {
        this.gridLoading = true
        console.log('API: createTheESXi')
        const response = await API.vmware.host.createTheEsxi(payload)
        if (response) this.$alert(this.$t('common.ALERT.BASE.026'), '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
      } catch (error) {
        throw new Error(this.$v('ESXi 항목을 생성하는 도중 문제가 발생했습니다.'))
      } finally {
        this.gridLoading = false
      }
    },
    /* ----------------------- !SECTION - 메서드 리펙토링 및 수정작업중 ---------------------- */
    /**
     * OTP 인증
     */
    validatedOTP (test) {
      this.otpModalActive = false
      this.otp = true
      this.newItem.updateConnectPassword = test.password
      this.$nextTick(() => {
        // this.$refs.otpPasswordInput.passwordVisible = true
      })
    },
    /** API_HANDLER -  */
    async checkTheEsxiOTP (payload) {
      console.log('@checkTheEsxiOTP')
      try {
        // console.log(idx, payload)
        console.log(this.selectedRow)
        const password = await API.vmware.host.checkTheEsxiOTP(this.selectedRow.idx, payload)
        if (password) return password
      } catch (error) {
        this.$alert(this.$v('인증을 실패하였습니다.')
          , { dangerouslyUseHTMLString: true })
      }
    },
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
    /** API_HANDLER - (POST) OTP 인증성공 시 비밀번호를 응답받음 */
    async checkTheVcenterOTP (payload) {
      try {
        console.log('API: checkTheVcenterOTP')
        // console.log(idx, payload)
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
    startInterval  () {
      this.interval = setInterval(async () => {
        await this.setGridItemSource()
      }, 10000)
    },
    /**
     * EVENT_HANDLER - (테스트) 인증정보로 테스트 실행
     * @param {string} type 현재 [항목추가] 인지 [변경] 인지 확인
     * @returns {(Function|Boolean)}
     */
    async handleClickToConnectionTest (type = this.showModal.type) {
      try {
        console.log('@handleClickToConnectionTest')
        const payload = this.setTestPayload(this.newItem)
        let element = null
        if (this.isConnectedVC) {
          element = await this.checkConnectVcenterTest(payload)
        } else {
          element = await this.checkConnectHostTest(payload)
          this.saveDStoreAsTest(element)
        }
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
    /** API_HANDLER - (POST)[테스트] API 를 호출합니다
     * @param {Object} payload
     */
    async checkConnectHostTest (payload) {
      try {
        return await API.vmware.host.checkConnectHostTest(payload)
      } catch (error) {
        this.errorHandler(error)
      }
    },
    /* ---------------------------- SECTION 네트워크 카테고리 --------------------------- */
    /**
     * [네트워크 카테고리]와 Element 전체 리스트를 가져옵니다.
     */
    async getNetworkCategoryTree () {
      try {
        this.categories = await API.network.getNetworkCategoryTree()
        this.startInterval()
      } catch (error) {
        this.errorHandler(error)
      }
    },
    /* --------------------------- !SECTION 네트워크 카테고리 --------------------------- */
    /** EVENT_HANDLER - (항목 생성) ESXi 항목 생성버튼 클릭
     * @param {Object} payload
     */
    async handleClickUpadateESXi (newItem = this.newItem) {
      const valueCheck = [
        { displayName: '유저 이름', key: 'id' },
        { displayName: '유저 비밀번호', key: 'updateConnectPassword' },
        { displayName: 'URL', key: 'url' },
        { displayName: 'ESXi(HOST) 명', key: 'name' },
        { displayName: '인터벌 주기(분)', key: 'syncInterval' },
        { displayName: '네트워크 조직', key: 'cateIdx' },
        { displayName: '데이터 스토어', key: 'defaultDatastoreUuid', isCreate: true }
      ]

      const fullfilled = valueCheck.every(cond => {
        const condition = newItem[cond.key]
        // isManage 는 값이 false일 수 있습니다.

        if (condition === undefined || condition === '' || condition === null || condition.length === 0) {
          this.$alert(this.$t('common.ALERT.ACCOUNT.026')) // 필수값을 입력해주세요
        }
        return typeof condition === 'boolean' ? true : condition
      })

      if (!fullfilled) return false

      const confirm = (this.showModal.type === 'create') ? '021' : '015' // 해당 항목을 생성하시겠습니까? : 업데이트 하시겠습니까?
      const result = await this.updateItemAction(this.$t(`common.CONFIRM.BASE.${confirm}`))
      // await this.getElementList()
      if (result) {
        this.closeModal()
      }
    },
    /** 노출할 데이터스토어 리스트 저장
     * 연결정보 입력 > 테스트 완료 후 동기 데이터스토어의 정보를 selectebox 의 옵션으로 노출
     * @param {object} testResult
     */
    saveDStoreAsTest (testResult) {
      console.log('METHOD: saveDSasTest')
      // [기본 스토리지 컨테이너] 옵션 리스트를 가공합니다.
      if (!this.dataStoreOptions?.length) this.dataStoreOptions = testResult.syncDatastoreList
      // testResult.
    },

    /**
     * [항목 추가/변경 > 확인] 시 ESXi가 추가/변경 되도록 하는 함수입니다.
     * @param {string} message
     */
    async updateItemAction (message) {
      try {
        const {
          networkGroup, cateIdx, updateConnectPassword, url, id, name,
          isManage, defaultDatastoreUuid, hostUuid, subnets, syncInterval
        } = this.newItem
        const row = this.selectedRow
        const type = this.showModal.type

        const isConfirmed = await this.$confirm(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          cancelButtonText: this.$t('common.BTN.cancel')
        }).then(() => true).catch(() => false)

        if (isConfirmed) {
          this.isConnecting = true
          const payload = {
            password: updateConnectPassword,
            url,
            id,
            name,
            isManage,
            defaultDatastoreUuid,
            subnets,
            syncInterval: syncInterval,
            cateIdx,
            hostUuid
          }

          // 네트워크 카테고리는 각 key 값으로 직접 입력하여 넘겨주어야 합니다
          if (networkGroup) {
            networkGroup.forEach(network => {
              for (const key in network) {
                payload[key] = network[key]
              }
            })
          }
          // if (this.selectedCateList) {
          //   this.selectedCateList.forEach(network => {
          //     for (const key in network) {
          //       payload[key] = network[key]
          //     }
          //   })
          // }

          if (type === 'update') { // [변경]일 때
            if (this.isConnectedVC) {
              /// api/cmp/v1/vmware/host/connect/vcenter-connect 호출
              await this.updateVcenterESXi({ ...row, ...payload })
            } else {
              await this.updateTheESXi({ ...row, ...payload })
            }
          } else { // [항목 추가]일 때
            await this.createTheESXi(payload)
          }
        }
        return true
      } catch (error) {
        return false
      }
    },
    /** API_HANDLER - (POST) ESXi 변경
     * @param {Number} centralIdx 삭제할(선택된) row 의 인덱스
     * @param {Object} payload API 에 함께 전달할 데이터
     */
    async updateVcenterESXi (payload) {
      try {
        this.gridLoading = true
        const updated = await API.vmware.host.updateVcenterESXi(payload)
        if (updated) return await this.$alert(this.$t('common.ALERT.BASE.056'), '알림', { confirmButtonText: this.$t('common.BTN.confirm') }).then(() => true).catch(() => false)
      } catch (error) {
        this.errorHandler(error, this.$t('common.ALERT.NUTA.046')) // 변경하는 도중 문제가 발생했습니다. <br>
      } finally {
        this.gridLoading = false
      }
    },
    /** API_HANDLER - (POST) ESXi 변경
     * @param {Number} centralIdx 삭제할(선택된) row 의 인덱스
     * @param {Object} payload API 에 함께 전달할 데이터
     */
    async updateTheESXi (payload) {
      try {
        this.gridLoading = true
        const updated = await API.vmware.host.updateTheEsxi(payload)
        if (updated) return await this.$alert(this.$t('common.ALERT.BASE.056'), '알림', { confirmButtonText: this.$t('common.BTN.confirm') }).then(() => true).catch(() => false)
      } catch (error) {
        this.errorHandler(error, this.$t('common.ALERT.NUTA.046')) // 변경하는 도중 문제가 발생했습니다. <br>
      } finally {
        this.gridLoading = false
      }
    },
    /**
     * [변경 > 확인] Central 이 변경될 때 API를 실행합니다.
     * @param {Number} centralIdx 삭제할(선택된) row 의 인덱스
     * @param {Object} payload API 에 함께 전달할 데이터
     */
    async updateElement (idx, payload) {
      try {
        this.gridLoading = true
        const updated = await API.admin.settings.updateElement(idx, payload)
        if (updated) this.$alert(this.$t('common.ALERT.BASE.056'), '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
      } catch (error) {
        this.errorHandler(error, this.$t('common.ALERT.NUTA.046')) // 변경하는 도중 문제가 발생했습니다. <br>
      } finally {
        this.gridLoading = false
      }
    },

    /** EVENT_HANDLER - (삭제) ESXi 항목 삭제 버튼 클릭 */
    handleClickDeleteESXi () {
      this.$confirm(this.$t('common.CONFIRM.BASE.032'), '삭제', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        await this.deleteTheESXi(this.selectedRow.idx)
        await this.setGridItemSource()
        return this.closeModal()
      }).catch(() => false)
    },

    /**
     * 선택한 Element를 [삭제]할 때 발생합니다.
     * @param {Number} centralIdx 삭제할(선택된) row 의 인덱스
     */
    async deleteTheESXi (idx) {
      try {
        this.gridLoading = true
        const removed = await API.vmware.host.deleteTheEsxi(idx)
        if (removed) this.$alert(this.$t('common.ALERT.BASE.017'), '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
      } catch (error) {
        this.$alert(this.$v('삭제에 실패하였습니다.'))
        // this.errorHandler(error)
      } finally {
        this.gridLoading = false
      }
    },
    /**
     * API_HANDLER - 동기화 처리 API 를 호출합니다
     * @param {Number} idx
     */
    async runSyncTheVcenter (idx) {
      try {
        this.gridLoading = true
        return await API.vmware.vcenter.runSyncTheVcenter(idx)
      } catch (error) {
        this.errorHandler(error)
      }
    },
    /**
     * API_HANDLER - 동기화 처리 API 를 호출합니다
     * @param {Number} idx
     */
    async runSyncTheEsxi (idx) {
      try {
        this.gridLoading = true
        return await API.vmware.host.runSyncTheEsxi(idx)
      } catch (error) {
        this.errorHandler(error)
      }
    },
    /** EVENT_HANDLER - [동기화] 버튼 클릭시 발생합니다. 동기화를 활성화시킵니다.
     */
    handleClickRunSyncESXi () {
      console.log(this.selectedRow)
      // 해당 항목(' + this.selectedRow.centralName + ')을<br>동기화 하시겠습니까?
      this.$confirm(this.$t('common.CONFIRM.NUTA.007', { centralName: this.selectedRow.name }), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel'),
        dangerouslyUseHTMLString: true
      }).then(async () => {
        if (!this.selectedRow.vcenterUuid) {
          await this.runSyncTheEsxi(this.selectedRow.idx)
        } else await this.runSyncTheVcenter(this.selectedRow.idx)
        // 동기화 작업을 요청하였습니다.
        this.$alert(this.$t('common.ALERT.NUTA.001'), '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
        return await this.setGridItemSource()
      }).catch(() => false)
    },

    // ============================
    // ========= 모달 open =========
    // ============================

    /** EVENT_HANDLER - (모달오픈) 항목추가 모달
     */
    handleClickOpenAddModal () {
      this.isConnecting = false
      this.showModal = {
        view: true,
        type: 'create'
      }
      this.newItem = {
        syncInterval: 1,
        networkGroup: [],
        isManage: undefined
      }
      this.testPassed = false
    },

    /** EVENT_HANDLER - (변경) 버튼을 클릭시 해당 모달을 띄웁니다.
     ** 선택된 row 의 데이터를 가지고 변경을 시도합니다.
     * @param {Object} item 선택된 row 데이터
     */
    async handleOpenESXiUpdate (item) {
      if (item !== undefined) this.selectedRow = item

      this.isConnecting = false
      this.newItem = {}
      this.showModal = {
        view: true,
        type: 'update'
      }
      this.newItem = cloneDeep(this.selectedRow)
      // const { cateIdx, cateName, cateKey } = item
      // this.selectedCateList = [{ cateIdx, cateName, cateKey }]

      /** Vcenter에 연결되어 있는 HOST일 경우에는 데이터 스토어를 따로 호출해서
       * 옵션을 세팅해줍니다.(단독 HOST일경우는 연동 테스트때 받습니다.)
       **/
      if (this.isConnectedVC) {
        this.dataStoreOptions = await this.getDatastoreList(this.selectedRow.idx) // datastorage 목록 조회
      }
      this.newItem.networkGroup = []
      const { cateKey, cateIdx, cateName } = this.selectedRow
      if (this.selectedRow.cateIdx) this.newItem.networkGroup.push({ cateKey, cateIdx, cateName })
      this.testPassed = false
    },

    /**
     * API_HANDLER (GET Datastore 조회 (연결 IDX 로 데이터스토어를 조회합니다.)
     */
    async getDatastoreList (connectIdx = this.selectedRow.idx) {
      try {
        this.isLoadingDc = true
        const data = await API.vmware.datastore.getDatastoreList({ connectIdx })
        return data
      } catch (error) {
        console.error(error)
        return this.$alert('Datastore 조회에 문제가 발생했습니다.')
      } finally {
        this.isLoadingDc = false
      }
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
      this.dataStoreOptions = []
      this.setGridItemSource()
    },

    /**
     * 그리드 설정 - 인터벌시에도 선택된 데이터가 계속 유지되도록 합니다.
     * @param {Object} grid
     */
    init (grid, data) {
      this.grid = grid
      this.gridCollectionView = data

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
      /* ---------------------------- SECTION 추가되는 데이터 ---------------------------- */
      itemSourceEsxiList: [],
      /* ---------------------------- !SECTION 추가되는 데이터 --------------------------- */
      totalResultCnt: 0,
      otpModalActive: false,
      otp: false,
      intervalMin: 1,
      interval: null,

      gridLoading: false, // Element 리스트 그리드 로딩
      isLoadingDc: false, // 데이터스토어 옵션 로딩
      isConnecting: false, // [테스트] 진행중인지 로딩바

      showModal: { // [항목 추가 / 변경] 모달 visible 여부
        view: false,
        type: undefined
      },

      selectedRow: null, // 선택한 로우,
      selectedRowIdx: undefined,
      savedSelectedRow: null, // 선택한 로우 유지
      testPassed: false, // 테스트 성공 했는지 여부
      newItem: {}, // [항목 추가/변경] 시 내부 입력된 데이터 저장

      // 내트워크 카테고리
      isOpenNctSelection: false,
      selectedCateList: [],

      dataStoreOptions: [],
      storageContainerOptions: [], // [항목 추가 / 변경] 기본 스토리지 컨테이너 옵션 리스트들

      // 테이블 정보
      columns: [
        { header: this.$v('이름'), binding: 'name', width: 150, align: 'left' },
        { header: this.$v('ESXi 명'), binding: 'hostName', width: 150, align: 'left' },
        { header: this.$v('운영 여부'), binding: 'isManage', width: 100, customHtml: true },
        { header: this.$v('동기화 상태'), binding: 'isSync', width: 140, customHtml: true },
        { header: this.$v('인터벌 주기(분)'), binding: 'syncInterval', width: 100, customHtml: true },
        { header: 'URL', binding: 'url', width: '*', customHtml: true, align: 'left' },
        { header: this.$v('네트워크 조직'), binding: 'cateKey', width: 100 },
        { header: this.$v('연결된 vCenter 명'), binding: 'vcenterName', width: 150, align: 'left', customHtml: true },
        { header: this.$v('데이터스토어'), binding: 'defaultDatastoreName', width: 200, align: 'left', customHtml: true },
        { header: '마지막 동기 시간', binding: 'connectSuccessTime', width: 150, customHtml: true, dataType: 'Date' }
      ],
      headerMergeColumns: {
        rowSpan: ['name', 'hostName', 'syncInterval', 'isManage', 'isSync', 'url', 'cateName', 'vcenterName', 'defaultDatastoreName', 'auth', 'connectSuccessTime']
      },

      tableData: [],
      sortedCol: null,

      // 모달 트리데이터
      categories: [],
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
