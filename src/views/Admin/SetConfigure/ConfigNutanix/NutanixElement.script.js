/**
  * 파일명 : NutanixElement.script.js
  * 파일 기능 : 뉴타닉스 Element 리스트 노출 및 관리(테스트, 추가, 변경, 삭제)
  * 작성자 : 정재은 외 3명
  * 최종 작성일 : 2021-02-22
  * License By Shinsegae I&C
  * 2021-02-22 Update: sorting 기능 유지 > Nutanix Central / Element / Era 모두 적용 및 destroy 시 interval 제거
 **/

import { cloneDeep } from 'lodash'
import API from '@sd-fe/cmp-core'
import SelectDatacenterCate from '@/components/Selectboxs/SelectDatacenterCate.vue'
import SyncComponent from '@/components/SyncComponent/SyncComponent'
import CheckIcon from '@/components/Icons/CheckIcon.vue'
import OTPModal from '@/components/Modal/OTPModal/OTPModal'
import Dayjs from 'dayjs'
import FileServerList from './NutanixFileServerList.vue'

export default {
  name: 'NutanixElement',
  components: {

    SelectDatacenterCate,
    'sync-component': SyncComponent,
    'otp-modal': OTPModal,
    CheckIcon,
    FileServerList
  },
  computed: {
    computedTableData () {
      const result = []
      for (let i = 0; i < this.tableData.length; i++) result.push(this.tableData[i])
      return result
    }
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
      if (val) {
        const isCreateModal = this.showModal.type === 'create'
        const selectedThres = isCreateModal ? undefined : this.selectedRow
        this.TESTobj = cloneDeep(this.convertThresholdsToObject(selectedThres))
        const addedThres = this.convertThresholdsToObj(this.TESTobj)
        this.newItem = { ...this.newItem, ...addedThres }
      }
    }
  },
  created () {
    this.getElementList()
    this.getNetworkCategoryTree()
  },
  methods: {
    callbackApi: API.compute.getElementConfig,
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
    startInterval  () {
      this.interval = setInterval(async () => {
        await this.getElementList()
      }, 10000)
    },
    /**
     * Element 전체 리스트를 가져옵니다.
     */
    async getElementList () {
      try {
        this.gridLoading = true
        const rawElements = await API.compute.getElementList()
        const elements = await this.settingElement([...rawElements])
        this.tableData = elements
      } catch (error) {
        this.tableData = []
        this.errorHandler(error)
        clearInterval(this.interval)
      } finally {
        this.gridLoading = false
      }
    },
    // 얘는 왜 있는지 모르겠어요..;
    findNetwort (list, obj, key) {
      for (let i = 0; i < list.length; i++) {
        if (!key || list[i].cateUpper === 0) {
          key = 'selectRelation'
        } else if (key === 'selectRelation') {
          key = 'selectGroup'
        } else {
          if (list[i].children && list[i].children.length > 0) {
            key = 'selectGroup'
          } else {
            key = 'selectProject'
          }
        }

        if (list[i].cateIdx === obj.cateIdx) {
          // cateIdx = list[i].cateIdx
          obj[key].cateIdx = list[i].cateIdx
          obj[key].cateName = list[i].cateName
          obj[key].cateKey = list[i].cateKey
          obj[key].cateCode = list[i].cateCode
          // obj[key].children = list[i].children
          obj.cateKey = list[i].cateKey
          obj.cateName = list[i].cateName
          return obj
        } else {
          const result = this.findNetwort(list[i].children, obj, JSON.stringify(key))
          if (result != null) {
            // obj[key] = list[i]
            // cateIdx = list[i].cateIdx
            if (Object.keys(obj[key]).length === 0) {
              obj[key].cateIdx = list[i].cateIdx
              obj[key].cateName = list[i].cateName
              obj[key].cateKey = list[i].cateKey
            }

            // obj[key].children = list[i].children
            return obj
          }
        }
      }
      return null
    },
    /**
     * Element 리스트를 가공하여 테이블 데이터를 만듭니다.
     * @param {Array} rawElements API로 가져온 Element 목록 데이터입니다.
     * @return {Array} tableData를 위한 데이터를 가공합니다.
     */
    settingElement (rawElements) {
      if (!rawElements) return

      const mappedTime = []
      let checkSyncStatus = 1

      const elemLists = rawElements.map(element => {
        const { jobs } = element
        // 인터벌주기
        element.intervalMin = element.connectInterval ? element.connectInterval / 60 : ''

        // 잡 관련 설정
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

          element.connectSuccessTime = Dayjs(biggestUpdateTime).format('YYYY.MM.DD HH:mm:ss')
          element.connectInterval = element.connectInterval / 60

          const time = new Date(Dayjs(element.connectSuccessTime).add(-9, 'hour').add(this.intervalMin, 'minute').format()).getTime()
          element.isSync = new Date().getTime() < time ? -1 : checkSyncStatus
        }

        // 네트워크 관련 설정
        if (element.cateIdx) {
          element.networkGroup = []

          // 하단 내용은 왜 있는지 모르겠어요... 일단 놔둠
          // const obj = { selectRelation: {}, selectGroup: {}, selectProject: {} }
          // obj.cateIdx = element.cateIdx
          // this.findNetwort(this.categories, obj)
          // element.cateName = obj.cateName // ?????....
        }

        mappedTime.push({
          value: element.connectSuccessTime,
          caption: this.$options.filters.date(element.connectSuccessTime)
        })

        // 결과 반환
        return {
          ...element,
          rackNo: Number(element.rackNo)
        }
      })

      this.columnDataMap.connectSuccessTime = Array.from(new Set(mappedTime))
      return elemLists
    },

    // ===================================
    // ========= 모달 내부 [테스트] ==========
    // ===================================

    /**
     * [테스트] 버튼을 클릭했을때 [항목추가] 인지 [변경] 인지 확인 후 해당 함수를 실행합니다.
     * @param {string} type 현재 [항목추가] 인지 [변경] 인지 확인
     * @returns {(Function|Boolean)}
     */
    async activeTest (type = this.showModal.type) {
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

        const element = await this.connectionTestElement(payload)
        this.testPassed = element.isConnected
        // 연결 테스트에 (this.testPassed ? '성공' : '실패') 하였습니다.
        const message = this.testPassed ? this.$t('common.ALERT.NUTA.005') : this.$t('common.ALERT.NUTA.006')

        // [기본 스토리지 컨테이너] 옵션 리스트를 가공합니다.
        if (!this.storageContainerOptions?.length) {
          this.storageContainerOptions = [] // 초기화
          this.storageContainerOptions = await element.storageContainers
        }
        // if (!this.newItem.subnets) this.newItem.subnets = element.subnets

        if (message) this.$alert(message, '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
      } catch (error) {
        console.error(error)
      } finally {
        this.isConnecting = false
      }
    },
    /**
     * [테스트] API 를 호출합니다
     * @param {Object} payload
     */
    async connectionTestElement (payload) {
      try {
        return await API.compute.connectionTestElement(payload)
      } catch (error) {
        this.errorHandler(error)
      }
    },

    // ==================================
    // ========= [네트워크 카테고리] =========
    // ==================================

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
      if (data.length > 0) this.newItem.cateIdx = data[0].cateIdx
    },
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

    // ===================================
    // ========== 모달 내용 저장 ============
    // ===================================

    async confirmUpdateItem (newItem = this.newItem) {
      const thresObj = this.convertThresholdsToObj(this.TESTobj) // 임계치 객체로 변환
      newItem = { ...newItem, ...thresObj }
      this.newItem = { ...newItem, ...thresObj }
      const valueCheck = [
        { displayName: '유저 이름', key: 'connectUsername', message: this.$v('유저 이름을 입력해주세요.') },
        { displayName: '유저 비밀번호', key: 'updateConnectPassword', message: this.$v('유저 비밀번호를 입력해주세요.') },
        { displayName: 'URL', key: 'connectUrl', message: this.$v('URL을 입력해주세요.') },
        { displayName: 'Rack No', key: 'rackNo', message: this.$v('Rack No을 입력해주세요.') },
        { displayName: 'Element 이름', key: 'elementName', message: this.$v('Element 명을 입력해주세요.') },
        { displayName: '인터벌 주기(분)', key: 'connectInterval', message: this.$v('인터벌 주기(분)을 입력해주세요.') },
        { displayName: '네트워크 조직', key: 'cateIdx', message: this.$v('네트워크 조직을 입력해주세요.') },
        { displayName: '관리 지표', key: 'cpuManageIndicator', message: this.$v('가상화율') + ' ' + this.$v('관리 지표를 입력해주세요.') },
        { displayName: '1차 가상화율 임계치', key: 'firstCpuPercent', message: this.$v('1차 가상화율 임계치를 입력해주세요.') },
        { displayName: '2차 가상화율 임계치', key: 'secondCpuPercent', message: this.$v('2차 가상화율 임계치를 입력해주세요.') },
        { displayName: '관리 지표', key: 'memoryManageIndicator', message: this.$v('메모리') + ' ' + this.$v('관리 지표를 입력해주세요.') },
        { displayName: '1차 메모리 임계치', key: 'firstMemoryPercent', message: this.$v('1차 메모리 임계치를 입력해주세요.') },
        { displayName: '2차 메모리 임계치', key: 'secondMemoryPercent', message: this.$v('2차 메모리 임계치를 입력해주세요.') },
        { displayName: '관리 지표', key: 'diskManageIndicator', message: this.$v('디스크') + ' ' + this.$v('관리 지표를 입력해주세요.') },
        { displayName: '1차 디스크 임계치', key: 'firstDiskPercent', message: this.$v('1차 디스크 임계치를 입력해주세요.') },
        { displayName: '2차 디스크 임계치', key: 'secondDiskPercent', message: this.$v('2차 디스크 임계치를 입력해주세요.') },
        { displayName: '기본 스토리지 컨테이너', key: 'scUuid', isCreate: true, message: this.$v('기본 스토리지 컨테이너를 입력해주세요.') }
      ]

      const fullfilled = valueCheck.every(cond => {
        const condition = newItem[cond.key]
        // isManage 는 값이 false일 수 있습니다.
        if (condition === undefined || condition === '' || condition === null || condition.length === 0) this.$alert(cond.message)
        if (condition === 0) this.$alert(this.$t('common.ALERT.NUTA.043')) // 임계치는 0 을 입력할 수 없습니다.
        return typeof condition === 'boolean' ? true : condition
      })

      // 1차 / 2차 임계치 비교
      const comparison = ['Cpu', 'Memory', 'Disk']
      const compareStandards = comparison.every(cond => {
        const indicator = newItem[`${cond.toLocaleLowerCase()}ManageIndicator`]
        const condition1 = newItem[`first${cond}Percent`]
        const condition2 = newItem[`second${cond}Percent`]

        return condition1 < condition2 && condition2 < indicator
      })

      if (!fullfilled) return false
      if (!compareStandards) {
        this.$alert(this.$v('관리지표는 2차 임계치보다 크고,<br/> 2차 임계치는 1차 임계치보다 커야 합니다.'), '알림', { dangerouslyUseHTMLString: true })
        return false
      }

      const confirm = (this.showModal.type === 'create') ? '021' : '015' // 해당 항목을 생성하시겠습니까? : 업데이트 하시겠습니까?

      return this.updateItemAction(this.$t(`common.CONFIRM.BASE.${confirm}`))
    },

    /**
     * [항목 추가/변경 > 확인] 시 Element가 추가/변경 되도록 하는 함수입니다.
     * @param {Object} item
     */
    async updateItemAction (message) {
      try {
        this.isLoadingModal = true
        const { networkGroup, cateIdx, updateConnectPassword, connectUrl, connectUsername, elementName, rackNo, isManage, scUuid, cpuManageIndicator, memoryManageIndicator, diskManageIndicator, firstCpuPercent, firstDiskPercent, firstMemoryPercent, secondCpuPercent, secondDiskPercent, secondMemoryPercent, subnets, connectInterval } = this.newItem
        const row = this.selectedRow
        const type = this.showModal.type

        const isConfirmed = await this.$confirm(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          cancelButtonText: this.$t('common.BTN.cancel')
        }).then(() => true).catch(() => false)

        if (isConfirmed) {
          const payload = {
            cateIdx,
            connectPassword: updateConnectPassword,
            connectUrl,
            connectUsername,
            name: elementName,
            rackNo,
            isManage,
            scUuid,
            cpuManageIndicator,
            memoryManageIndicator,
            diskManageIndicator,
            firstCpuPercent,
            firstDiskPercent,
            firstMemoryPercent,
            secondCpuPercent,
            secondDiskPercent,
            secondMemoryPercent,
            subnets,
            connectInterval: connectInterval * 60
          }
          // 네트워크 카테고리는 각 key 값으로 직접 입력하여 넘겨주어야 합니다
          if (networkGroup) {
            networkGroup.forEach(network => {
              for (const key in network) {
                payload[key] = network[key]
              }
            })
          }
          if (type === 'update') { // [변경]일 때
            await this.updateElement(row.elementIdx, { ...payload })
          } else { // [항목 추가]일 때
            await this.createElement({ ...payload })
          }

          await this.getElementList()
          return this.closeModal()
        }
      } catch (error) {
        console.error(error)
      }
    },

    /**
     * [항목 추가 > 확인] Element 추가 API 를 실행합니다
     * @param {Object} payload
     */
    async createElement (payload) {
      try {
        this.gridLoading = true
        const created = await API.compute.createElement(payload)
        if (created) this.$alert(this.$t('common.ALERT.BASE.026'), '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
      } catch (error) {
        this.errorHandler(error, this.$t('common.ALERT.NUTA.045')) // 항목을 추가하는 도중 문제가 발생했습니다. <br>
        throw new Error(error)
      } finally {
        this.isLoadingModal = false
        this.gridLoading = false
      }
    },
    /**
     * [변경 > 확인] Central 이 변경될 때 API를 실행합니다.
     * @param {Number} centralIdx 삭제할(선택된) row 의 인덱스
     * @param {Object} payload API 에 함께 전달할 데이터
     */
    async updateElement (elementIdx, payload) {
      try {
        this.gridLoading = true
        const updated = await API.compute.updateElement(elementIdx, payload)
        if (updated) this.$alert(this.$t('common.ALERT.BASE.056'), '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
      } catch (error) {
        this.errorHandler(error, this.$t('common.ALERT.NUTA.046')) // 변경하는 도중 문제가 발생했습니다. <br>
        throw new Error(error)
      } finally {
        this.gridLoading = false
      }
    },

    // ==========================
    // ========= [삭제] ==========
    // ==========================
    /**
     * [삭제] 버튼을 눌렀을 때, 선택한 row 데이터를 삭제 여부를 리턴합니다.
     * @return {Boolean} 삭제 성공 여부
     */
    applyRemove () {
      this.$confirm(this.$t('common.CONFIRM.BASE.032'), '삭제', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        await this.deleteElement(this.selectedRow.elementIdx)
        await this.getElementList()

        return this.closeModal()
      }).catch(() => false)
    },

    /**
     * 선택한 Element를 [삭제]할 때 발생합니다.
     * @param {Number} centralIdx 삭제할(선택된) row 의 인덱스
     */
    async deleteElement (elementIdx) {
      try {
        this.gridLoading = true
        const removed = await API.compute.deleteElement(elementIdx)
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
     * @param {Number} elementIdx
     */
    async syncElement (elementIdx) {
      try {
        return await API.compute.syncElement(elementIdx)
      } catch (error) {
        this.errorHandler(error)
      }
    },
    /**
     * [동기화] 버튼 클릭시 발생합니다. 동기화를 활성화시킵니다.
     */
    activeSync () {
      // 해당 항목(' + this.selectedRow.centralName + ')을<br>동기화 하시겠습니까?
      this.$confirm(this.$t('common.CONFIRM.NUTA.007', { centralName: this.selectedRow.elementName }), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel'),
        dangerouslyUseHTMLString: true
      }).then(async () => {
        await this.syncElement(this.selectedRow.elementIdx)
        // 동기화 작업을 요청하였습니다.
        this.$alert(this.$t('common.ALERT.NUTA.001'), '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
        return await this.getElementList()
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
      this.showModal = {
        view: true,
        type: 'create'
      }
      this.newItem = {
        connectInterval: 1,
        networkGroup: [],
        isManage: false
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

      this.newItem = cloneDeep(this.selectedRow)
      this.storageContainerOptions = [] // 초기화
      this.storageContainerOptions = [...this.selectedRow.storageContainers]

      this.testPassed = false
      this.newItem.networkGroup = []
      const { cateKey, cateIdx, cateName } = this.selectedRow
      if (this.selectedRow.cateIdx) this.newItem.networkGroup.push({ cateKey, cateIdx, cateName })
      this.showModal = {
        view: true,
        type: 'update'
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
      this.storageContainerOptions = []
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
      totalResultCnt: 0,
      otpModalActive: false,
      otp: false,
      intervalMin: 1,
      interval: null,

      gridLoading: false, // Element 리스트 그리드 로딩
      isConnecting: false, // [테스트] 진행중인지 로딩바
      isLoadingModal: false,
      showModal: { // [항목 추가 / 변경] 모달 visible 여부
        view: false,
        type: undefined
      },

      selectedRow: null, // 선택한 로우
      savedSelectedRow: null, // 선택한 로우 유지
      testPassed: false, // 테스트 성공 했는지 여부
      newItem: {
        networkGroup: []
      }, // [항목 추가/변경] 시 내부 입력된 데이터 저장

      storageContainerOptions: [], // [항목 추가 / 변경] 기본 스토리지 컨테이너 옵션 리스트들
      percentBinding: ['cpuManageIndicator', 'firstCpuPercent', 'secondCpuPercent', 'memoryManageIndicator', 'firstMemoryPercent', 'secondMemoryPercent', 'diskManageIndicator', 'firstDiskPercent', 'secondDiskPercent'],
      TESTobj: [],
      // 테이블 정보
      columns: [
        { header: 'Rack No', binding: 'rackNo', width: 70 },
        { header: 'Element 명', binding: 'elementName', width: 150, align: 'left', keyPath: 'common.GRID.NUTA.elementName' },
        { header: '클러스터 명', binding: 'clusterName', width: 100, align: 'left', keyPath: 'common.GRID.NUTA.clusterName' },
        { header: '운영 여부', binding: 'isManage', width: 100, customHtml: true, keyPath: 'admin.PREF.isOper' },
        { header: '동기화 상태', binding: 'isSync', width: 140, customHtml: true, keyPath: 'common.GRID.NUTA.syncState' },
        { header: 'URL', binding: 'connectUrl', width: 200, customHtml: true, align: 'left' },
        { header: '인터벌 주기(분)', binding: 'intervalMin', width: 150, customHtml: true, keyPath: 'common.GRID.NUTA.interval' },
        { header: '네트워크 조직', binding: 'cateName', width: 100, keyPath: 'common.REGCON.netOrg' },
        { header: '연결 Central', binding: 'centrals', width: 150, align: 'left', customHtml: true, keyPath: 'common.GRID.NUTA.connCentral' },
        { header: '기본 스토리지', binding: 'scUuid', width: 200, align: 'left', customHtml: true, keyPath: 'common.GRID.NUTA.basicStorage' },
        // 가상화율
        { header: this.$v('관리 지표'), binding: 'cpuManageIndicator', width: 100, customHtml: true },
        { header: '1차 임계치', binding: 'firstCpuPercent', width: 100, customHtml: true, keyPath: 'common.GRID.NUTA.firstThreshold' },
        { header: '2차 임계치', binding: 'secondCpuPercent', width: 100, customHtml: true, keyPath: 'common.GRID.NUTA.secondThreshold' },
        // { header: '가상화율 임계치', binding: 'cpuPercent', width: 100, customHtml: true, keyPath: 'common.GRID.NUTA.virtualRateThr' },
        // 메모리
        { header: this.$v('관리 지표'), binding: 'memoryManageIndicator', width: 100, customHtml: true },
        { header: '1차 임계치', binding: 'firstMemoryPercent', width: 100, customHtml: true, keyPath: 'common.GRID.NUTA.firstThreshold' },
        { header: '2차 임계치', binding: 'secondMemoryPercent', width: 100, customHtml: true, keyPath: 'common.GRID.NUTA.secondThreshold' },
        // { header: '메모리 임계치', binding: 'memoryPercent', width: 100, customHtml: true, keyPath: 'common.GRID.NUTA.memThr' },
        // 디스크
        { header: this.$v('관리 지표'), binding: 'diskManageIndicator', width: 100, customHtml: true },
        { header: '1차 임계치', binding: 'firstDiskPercent', width: 100, customHtml: true, keyPath: 'common.GRID.NUTA.firstThreshold' },
        { header: '2차 임계치', binding: 'secondDiskPercent', width: 100, customHtml: true, keyPath: 'common.GRID.NUTA.secondThreshold' },
        // { header: '디스크 임계치', binding: 'diskPercent', width: 100, customHtml: true, keyPath: 'common.GRID.NUTA.diskThr' },
        // { header: '기본 스토리지 컨테이너', binding: 'scUuid', width: '*', customHtml: true, keyPath: 'common.GRID.NUTA.basicStorage' },
        // { header: '인증 정보', binding: 'auth', width: 100, customHtml: true, keyPath: 'admin.PREF.authInfo', filtable: false },
        { header: '마지막 동기 시간', binding: 'connectSuccessTime', width: 150, dataType: 'Date', keyPath: 'common.GRID.lastSyncTime' }
      ],
      headerMergeColumns: {
        colSpan: [
          { startIdx: 10, endIdx: 12, header: '가상화율', keyPath: 'common.GRID.NUTA.virtualRate' },
          { startIdx: 13, endIdx: 15, header: '메모리', keyPath: 'common.GRID.NUTA.memory' },
          { startIdx: 16, endIdx: 18, header: '디스크', keyPath: 'common.GRID.NUTA.disk' }
        ],
        rowSpan: ['rackNo', 'elementName', 'clusterName', 'isManage', 'isSync', 'connectUrl', 'intervalMin', 'cateName', 'centrals', 'scUuid', 'connectSuccessTime']
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
              element: this.$v('이미 등록된 URL입니다.'),
              name: this.$v('이미 등록된 Element입니다.')
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
