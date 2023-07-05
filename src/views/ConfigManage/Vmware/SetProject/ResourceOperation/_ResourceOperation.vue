<!--
  * 파일명 : ResourceOperation.vue
  * 파일 기능 : 구성관리 > 프로젝트 관리 > 자원운용
  * 작성자 : 김예담
  * 최종 작성일 : 2021-08-23
  * License By Shinsegae I&C
 -->

<template>
  <div
    class="resource-operation"
    v-loading="loading.isSavedTransResource || loading.isGetWorkflow"
  >
    <div
      class="button-area -right header-trans-button"
      :class="{ '-long': $i18n.locale !== 'ko' }"
    >
      <button
        class="button"
        type="is-primary"
        @click="unregistExcelModal = true"
      >
        <!-- 미등록 자원 Excel 업로드 -->
        {{ $t('admin.PREF.resExcel') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="resourceHistModal = true"
      >
        <!-- 이관 History -->
        {{ $t('config.TRANSFER.transfer') }}&nbsp;History
      </button>
      <el-badge
        :value="transBasketCount"
        :max="99"
        style="margin-left: 10px;"
      >
        <button
          class="button"
          type="is-primary"
          @click="goToBasket"
        >
          <!-- 이관 장바구니 -->
          {{ $t('config.TRANSFER.transferBasket') }}
        </button>
      </el-badge>
    </div>

    <resource-filter-component
      cloud-type="private"
      @search="setGroupProjectFilter"
      @reset="() => {
        filteredResourceType = ''
        filteredProjectInfo = null
      }"
      popper-class="resource-operation-dropdown-popper"
    >
      <section class="filter-form">
        <!-- 자원 분류 -->
        <span class="filter-name">
          <!-- 자원 분류 -->
          {{ $t('config.TRANSFER.resourceType') }}
        </span>
        <div class="filter-options">
          <el-select
            v-model="filteredResourceType"
            :placeholder="$t('config.TRANSFER.selectResourceType')"
            :popper-append-to-body="false"
            popper-class="custom-select-popper"
            @change="filterByText(searchAutocompleteObj)"
          >
            <el-option
              v-for="option in resourceOption"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>
      </section>
    </resource-filter-component>

    <section
      class="process-steps"
      :class="{ '-long': $i18n.locale !== 'ko' }"
    >
      <resource-operation-steps
        ref="resourceSteps"
        :data="workFlowSteps"
        :active="stepNum"
        @change="changeStep"
      />
    </section>

    <section class="table-top-wrap">
      <search-component
        v-model="searchInputText"
        class="search-area"
        ref="searchComponentRef"
        type="autocomplete"
        :placeholder="$t('common.PLACEHOLDER.searchEnter')"
        @fetch="fetchSearchOption"
        @select="filterByText"
      />

      <button
        class="button"
        type="is-primary"
        @click="putInTransBasket()"
        :disabled="!isChangedSelectItem"
      >
        <!-- 이관 자원 담기 -->
        {{ $t('config.TRANSFER.addTransferBasket') }}
      </button>
    </section>

    <resource-operation-compute
      v-if="activeStep === 'compute'"
      ref="resourceGrid"
      :data="filteredComputeData"
      :loading="loading.isGetVmList || loading.isGetTransResource || loading.isGetOtherTransResource"
      :disable-rows="checkedResources.compute"
      :deletable="false"
      :init-auto-select-row="myTransBasketData && myTransBasketData.compute ? myTransBasketData.compute : []"
      @checkedRowsData="items => saveCheckedResource(items, 'compute')"
    />
    <!-- :init-auto-select-row="checkedResources.compute" -->
    <resource-operation-storage
      v-if="activeStep === 'storage'"
      ref="resourceGrid"
      :data="filteredStorageData"
      :host-names-in-basket="[...allVmsHostName, ...allDbsHostName]"
      :loading="loading.isGetVgList ||
        loading.isGetTransResource ||
        loading.isGetOtherTransResource"
      :deletable="false"
      :init-auto-select-row="myTransBasketData && myTransBasketData.storage ? myTransBasketData.storage : []"
      @checkedRowsData="items => saveCheckedResource(items, 'storage')"
    />
    <resource-operation-network
      v-if="activeStep === 'network'"
      ref="resourceGrid"
      :data="filteredNetworkData"
      :host-names-in-basket="[...allVmsHostName, ...allDbsHostName]"
      :loading="loading.isGetVrserverList ||
        loading.isGetCsvrserverList ||
        loading.isGetTransResource ||
        loading.isGetOtherTransResource"
      :deletable="false"
      :init-auto-select-row="myTransBasketData && myTransBasketData.network ? myTransBasketData.network : []"
      @checkedRowsL4Data="items => saveCheckedResource(items, 'vrserver')"
      @checkedRowsL7Data="items => saveCheckedResource(items, 'csvrserver')"
    />
    <resource-operation-security
      v-if="activeStep === 'security'"
      ref="resourceGrid"
      :data="filteredSecurityData"
      :host-names-in-basket="[...allVmsHostName, ...allDbsHostName]"
      :loading="loading.isGetSecurityList ||
        loading.isGetTransResource ||
        loading.isGetOtherTransResource"
      :deletable="false"
      :init-auto-select-row="myTransBasketData && myTransBasketData.security ? myTransBasketData.security : []"
      @checkedRowsData="items => saveCheckedResource(items, 'security')"
    />
    <resource-operation-database
      v-if="activeStep === 'database'"
      ref="resourceGrid"
      :data="filteredDatabaseData"
      :loading="loading.isGetDatabaseList ||
        loading.isGetTransResource ||
        loading.isGetOtherTransResource"
      :deletable="false"
      :init-auto-select-row="myTransBasketData && myTransBasketData.database ? myTransBasketData.database : []"
      @checkedRowsData="items => saveCheckedResource(items, 'database')"
    />

    <!-- 모달 -->
    <!-- 미등록 자원 등록 미리보기 모달 -->
    <el-dialog
      :visible.sync="unregistExcelModal"
      :title="$t('admin.PREF.resExcel')"
      width="80%"
      @close="closeUnregistExcelModal"
    >
      <unregister-resource-list
        ref="unregistExcelModal"
        @close="closeUnregistExcelModal"
        :other-trans-basket-data="otherTransBasketData"
      />
    </el-dialog>

    <!-- 이관 History 히스토리 모달 -->
    <grid-modal
      :active.sync="resourceHistModal"
      :title="`${$t('config.TRANSFER.transfer')} History`"
      :table-data="historyData"
      :column-data="histColumns"
      :use-cancel-btn="false"
      :loading="loading.isGetHistory"
      width="90%"
      @close="resourceHistModal = false"
    />
  </div>
</template>
<script>
import { mapState } from 'vuex'
import { includes, uniqBy, groupBy, mapValues } from 'lodash'
import API, { ResourceFilterComponent } from '@sd-fe/cmp-core'

import ResourceOperationSteps from './ResourceOperationSteps.vue'
import ResourceOperationCompute from './ResourceOperationCompute.vue'
import ResourceOperationStorage from './ResourceOperationStorage.vue'
import ResourceOperationNetwork from './ResourceOperationNetwork.vue'
import ResourceOperationSecurity from './ResourceOperationSecurity.vue'
import ResourceOperationDatabase from './ResourceOperationDatabase.vue'
import UnregisterResourceList from './UnregisterResourceList.vue'
import GridModal from '@/components/Modal/GridModal/GridModal'

import { getVmList, getUnregistersVms, getVolumeGroups, getUnregistersVolumeGroups, getAllVrserver, getCsvrserver, getUnregistersCsvrserver, getSgGroup, getUnregistersgroup, getDatabasesSimple, getUnregistersDatabase } from './ResourceOperationGetAll'

export default {
  name: 'ResourceOperation',
  components: {
    ResourceOperationSteps,
    ResourceOperationCompute,
    ResourceOperationStorage,
    ResourceOperationNetwork,
    ResourceOperationSecurity,
    ResourceOperationDatabase,
    UnregisterResourceList,
    GridModal,
    ResourceFilterComponent
  },
  async created () {
    await this.getWorkFlowTaskList()
    // await this.init()
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      packageType: state => state.auth.packageType
    }),
    activeStep () { // 활성화 스텝
      if (this.activeStepInfo) return this.activeStepInfo.value
      else return 'compute'
    }
    // allCheckedResourcesCnt () { // 체크된 자원 갯수
    //   const all = Object.values(this.checkedResources)?.flat()
    //   if (all) return all.length
    //   else return 0
    // }
  },
  watch: {
    activeStep: {
      immediate: true,
      async handler (newVal) {
        this.searchInputText = ''
        this.isChangedSelectItem = false

        // this.filterByText()
        // this.resetCheckedItems()

        const ref = this.$refs.searchComponentRef
        if (ref) {
          ref.reset()
        }
        await this.init()
      }
    },
    searchInputText (newVal) { console.log('###', newVal) },
    otherTransBasketData (newVal) {
      // const step = this.activeStep // 활성화 스텝
      if (newVal) this.disableRow()
    }
  },
  methods: {
    async init () {
      await Promise.all([
        this.refreshTransBasket(), // 이관 장바구니 관련

        // this.getAllVmList(), // vm
        // this.getAllVgList(), // storage
        // this.getAllL4List(), // L4
        // this.getAllL7List(), // L7
        // this.getAllSecurityList(), // 보안 그룹
        // this.getAllDatabaseList()// DB
        this.resetCurrentData()
      ]).then(async () => {
        this.networkData = [...this.vrserverData, ...this.csvrserverData]
        await this.filterByText(this.searchAutocompleteObj)
      })
    },
    async getWorkFlowTaskList () {
      try {
        this.loading.isGetWorkflow = true
        const workFlowTaskList = await API.work.getWorkFlowTaskList()
        if (!workFlowTaskList) return

        const steps = []
        workFlowTaskList.forEach(item => {
          if (!item.workFlowTaskName) return

          if (item.workFlowTaskName === 'Market') return

          if (item.workFlowTaskCode.includes('NETWORK')) {
            steps.push({
              label: 'Network(L4/L7)', value: 'network'
            })
          } else {
            steps.push({ label: item.workFlowTaskName, value: item.workFlowTaskName.toLowerCase() })
          }
        })
        const uniqueSteps = uniqBy(steps, 'value')
        this.workFlowSteps = uniqueSteps.map((step, idx) => {
          return {
            stepNo: idx,
            ...step
          }
        })
      } catch (error) {
        console.error('Error: workFlow Error ::', error)
      } finally {
        this.loading.isGetWorkflow = false
      }
    },
    /**
     * 현재 활성화 스텝 데이터 다시 불러옴
     */
    async resetCurrentData (activeStep = this.activeStep) {
      const refreshing = {
        compute: async () => { await this.getAllVmList() }, // vm
        storage: async () => { await this.getAllVgList() }, // storage
        network: async () => {
          await this.getAllL4List()
          await this.getAllL7List()
        }, // network
        security: async () => { await this.getAllSecurityList() }, // 보안 그룹
        database: async () => { await this.getAllDatabaseList() }
      }
      return refreshing[activeStep]()
    },

    /**
     * VM(Compute) 자원 조회 (기등록 + 미등록)
     */
    async getAllVmList () {
      try {
        this.loading.isGetVmList = true

        let vmList = []
        let unregistVmList = []

        const setResourceList = async () => { // 기등록
          vmList = await getVmList({
            ...this.filteredProjectInfo,
            filterChargeDate: true,
            filterDeleteDate: true
          })
        }

        const setUnregList = async () => { // 미등록
          unregistVmList = this.filteredProjectInfo ? [] : await getUnregistersVms()
        }

        await Promise.all([
          setResourceList(),
          setUnregList()
        ])

        this.computeData = [...vmList, ...unregistVmList]
      } catch (error) {
        console.error('@ 자원 조회 Error: Compute', error)
      } finally {
        this.loading.isGetVmList = false
      }
    },
    /**
     * VG (Storage) 자원 조회 (기등록 + 미등록)
     */
    async getAllVgList () {
      try {
        this.loading.isGetVgList = true

        let resourceList = []
        let unregistList = []
        const setResourceList = async () => { // 기등록
          resourceList = await getVolumeGroups({
            ...this.filteredProjectInfo,
            filterChargeDate: true,
            filterDeleteDate: true
          })
        }

        const setUnregList = async () => { // 미등록
          unregistList = this.filteredProjectInfo ? [] : await getUnregistersVolumeGroups()
        }

        await Promise.all([
          setResourceList(),
          setUnregList()
        ])

        // const resourceList = await getVolumeGroups({
        //   ...this.filteredProjectInfo,
        //   filterChargeDate: true,
        //   filterDeleteDate: true
        // })
        // const unregistList = this.filteredProjectInfo ? [] : await getUnregistersVolumeGroups()

        this.storageData = [...resourceList, ...unregistList]
      } catch (error) {
        console.error('@ 자원 조회 Error: Storage')
      } finally {
        this.loading.isGetVgList = false
      }
    },
    /**
     * L4 자원 조회 (기등록 + 미등록)
     */
    async getAllL4List () {
      try {
        this.loading.isGetVrserverList = true

        let resourceList = []
        // let unregistList = []
        const setResourceList = async () => { // 기등록
          resourceList = await getAllVrserver({
            ...this.filteredProjectInfo,
            searchKeyword: this.searchInputText
          })
        }

        // const setUnregList = async () => { // 미등록
        //   unregistList = this.filteredProjectInfo ? [] : await getUnregistersVrserver()
        // }

        // await Promise.all([
        await setResourceList()
        // setUnregList()
        // ])

        // const resourceList = await getVrserver(this.filteredProjectInfo)
        // const unregistList = this.filteredProjectInfo ? [] : await getUnregistersVrserver()

        this.vrserverData = [...resourceList]
      } catch (error) {
        console.error('@ 자원 조회 Error: L4')
      } finally {
        this.loading.isGetVrserverList = false
      }
    },
    /**
     * L7 자원 조회 (기등록 + 미등록)
     */
    async getAllL7List () {
      try {
        this.loading.isGetCsvrserverList = true

        let resourceList = []
        let unregistList = []
        const setResourceList = async () => { // 기등록
          resourceList = await getCsvrserver(this.filteredProjectInfo)
        }

        const setUnregList = async () => { // 미등록
          unregistList = this.filteredProjectInfo ? [] : await getUnregistersCsvrserver()
        }

        await Promise.all([
          setResourceList(),
          setUnregList()
        ])

        // const resourceList = await getCsvrserver(this.filteredProjectInfo)
        // const unregistList = this.filteredProjectInfo ? [] : await getUnregistersCsvrserver()

        this.csvrserverData = [...resourceList, ...unregistList]
      } catch (error) {
        console.error('@ 자원 조회 Error: L7')
      } finally {
        this.loading.isGetCsvrserverList = false
      }
    },
    /**
     * 보안그룹 자원 조회 (기등록 + 미등록)
     */
    async getAllSecurityList () {
      try {
        this.loading.isGetSecurityList = true

        let resourceList = []
        let unregistList = []
        const setResourceList = async () => { // 기등록
          resourceList = await getSgGroup(this.filteredProjectInfo)
        }

        const setUnregList = async () => { // 미등록
          unregistList = this.filteredProjectInfo ? [] : await getUnregistersgroup()
        }

        await Promise.all([
          setResourceList(),
          setUnregList()
        ])

        // const resourceList = await getSgGroup(this.filteredProjectInfo)
        // const unregistList = this.filteredProjectInfo ? [] : await getUnregistersgroup()

        this.securityData = [...resourceList, ...unregistList]
      } catch (error) {
        console.error('@ 자원 조회 Error: SecurtyGroup')
      } finally {
        this.loading.isGetSecurityList = false
      }
    },
    /**
     * 데이터베이스 자원 조회 (기등록 + 미등록)
     */
    async getAllDatabaseList () {
      try {
        this.loading.isGetDatabaseList = true

        let resourceList = []
        let unregistList = []
        const setResourceList = async () => { // 기등록
          resourceList = await getDatabasesSimple({
            ...this.filteredProjectInfo
          })
        }

        const setUnregList = async () => { // 미등록
          unregistList = this.filteredProjectInfo ? [] : await getUnregistersDatabase()
        }

        await Promise.all([
          setResourceList(),
          setUnregList()
        ])

        // const resourceList = await getDatabasesSimple({
        //   ...this.filteredProjectInfo,
        //   isUser: true
        // })
        // const unregistList = this.filteredProjectInfo ? [] : await getUnregistersDatabase()

        this.databaseData = [...resourceList, ...unregistList]
      } catch (error) {
        console.error('@ 자원 조회 Error: Database')
      } finally {
        this.loading.isGetDatabaseList = false
      }
    },

    /**
     * API : 이관 장바구니 카운트 조회
     */
    async getTransBasketCount (userId = this.user.userId) {
      try {
        this.loading.isGetHistory = true
        const data = await API.work.getTransBasketCount(userId)
        this.transBasketCount = data || 0
      } catch (error) { console.error(error) } finally { this.loading.isGetHistory = false }
    },
    /**
     * API : 이관 장바구니 히스토리 조회
     */
    async getTransBasketHistory (userId = this.user.userId) {
      try {
        this.loading.isGetHistory = true
        const data = await API.work.getTransBasketHistory(userId)
        this.historyData = data.map(row => {
          // const startEndInfo = row.mapData.startEndInfo

          // if (startEndInfo) {
          //   row.startInfo = startEndInfo.startCompanyName &&
          //   startEndInfo.startGroupName &&
          //    row.startPointName
          //     ? `${startEndInfo.startCompanyName} > ${startEndInfo.startGroupName} > ${row.startPointName}`
          //     : '-'
          //   row.endInfo = `${startEndInfo.endCompanyName} > ${startEndInfo.endGroupName} > ${row.endPointName}`
          // } else {
          // row.startPointName = row.startPointName
          // row.endInfo = row.endPointName
          // }

          const cate = {
            COMPUTE: 'Compute',
            STORAGE: 'Storage',
            NETWORK_L4: 'Network',
            NETWORK_L7: 'Network',
            SECURITY: 'Security',
            DATABASE: 'Database'
          }[row.workType]
          row.workTypeCate = cate

          return {
            ...row,
            workCate: row.type === 'GENERAL' ? this.$t('config.TRANSFER.generalResource') : this.$t('service.PLACEHOLDER.unEnrollSrc'), // '일반 자원' : '미등록 자원'
            moveTime: this.$options.filters.date(row.createTime, 'YYYY.MM.DD HH:mm')
          }
        })
          .sort((a, b) => {
            if (a.createTime < b.createTime) return 1
            else if (a.createTime > b.createTime) return -1
            else return 0
          })
      } catch (error) { console.error(error) } finally { this.loading.isGetHistory = false }
    },
    /**
     * API : 이관 장바구니 자원 조회
     */
    async getTransBasket (userId = this.user.userId) {
      try {
        this.loading.isGetTransResource = true
        let response = []
        response = await API.work_v3.getTransBasket({ userId })

        if (response) {
          const vmHostNames = [] // 장바구니에 담긴 VM 자원 호스트명 모음
          const dbHostNames = [] // 장바구니에 담긴 DB 자원 호스트명 모음

          const flatData = response.map(row => {
            if (row.workType === 'COMPUTE')vmHostNames.push(row.mapData.hostname)
            if (row.workType === 'DATABASE')dbHostNames.push(row.mapData.hostname)

            return {
              ...row,
              ...row.mapData
            }
          })
          this.allVmsHostName = [...vmHostNames]
          this.allDbsHostName = [...dbHostNames]

          this.myTransBasketData = this.groupByResourceType(flatData) // { compute: [...], storage: [...], network: [...] } 요런 형태
          this.checkedItems = this.myTransBasketData

          console.log('## 내 자원바구니: ', this.myTransBasketData)
        }
      } catch (error) {
        console.error(error)
      } finally { this.loading.isGetTransResource = false }
    },
    /**
     * API : 타 최고 관리자 계정의 이관 장바구니 조회
     */
    async getTransBasketOtherUser (userId = this.user.userId) {
      try {
        this.loading.isGetOtherTransResource = true
        let response = []
        response = await API.work.getTransBasketOtherUser(userId)

        if (response) {
          this.otherTransBasketData = this.groupByResourceType(response) // { compute: [...], storage: [...], network: [...] } 요런 형태
          // console.log('다른 최고 관리자: ', this.otherTransBasketData)
        }
      } catch (error) {
        console.error(error)
      } finally { this.loading.isGetOtherTransResource = false }
    },
    /**
     * API : 이관 장바구니에 자원 저장
     */
    async saveTransResource (data) {
      try {
        this.loading.isSavedTransResource = true
        if (!data) return

        const userId = this.user.userId

        const field = {
          compute: 'vm',
          storage: 'vg',
          network: 'network',
          security: 'security',
          database: 'db'
        }[this.activeStep]

        const payload = data.map(item => {
          const mapData = {
            ...item,
            networkList: item.nics || item.networkList
          }

          return {
            mapData,
            // data: JSON.stringify(mapData),
            resourceId: item.resourceId,
            resourceName: item.resourceName,
            type: item.resourceType,
            userId,
            workType: item.workType,
            // "endPointIdx": 0,
            // "endPointName": "string",
            startPointIdx: item.projectIdx,
            startPointName: item.projectName
          }
        })

        const result = await API.work.saveTransResource(userId, field, payload)
        return result
      } catch (error) {
        console.error(error)
      } finally {
        this.loading.isSavedTransResource = false
      }
    },

    /**
    * 섞여 들어오는 자원을 { compute: [...], storage: [...], network: [...] } 요런 형태로 바꿔줍니다.
    */
    groupByResourceType (data) {
      const mappedData = data.map(row => {
        const resourceType = {
          COMPUTE: 'compute',
          STORAGE: 'storage',
          SECURITY: 'security',
          NETWORK_L4: 'network',
          NETWORK_L7: 'network',
          DATABASE: 'database'
        }[row.workType]

        if (resourceType === 'network') row.frontNetIdx = row.vrserverIdx || row.csVrserverIdx

        return {
          ...row,
          resourceType
        }
      })

      const grouping = groupBy(mappedData, 'resourceType')

      return grouping
    },

    /**
   * 상단 스텝 변경 이벤트
   */
    changeStep (step) {
      this.activeStepInfo = step
      this.filterByText(this.searchAutocompleteObj)
      this.stepNum = step.stepNo
    },
    initSetCheckedItems (data) {
      const step = this.activeStep
      if (this.checkedResources[step]) {
        const ids = this.checkedResources[step].map(item => item.resourceId)

        data = data.map(row => {
          console.log('IDS:', ids)
          return {
            ...row,
            checked: ids.includes(row.resourceId)
          }
        })
      }
    },
    /**
     * 이관 할 자원 체크 시, 발생 이벤트
     * @param {Array} checkedItems 체크 한 자원
     * @param {field} field 자원 분류 ('compute', 'vrserver'(L4), 'csvrserver'(L7), 'security', 'database')
     */
    saveCheckedResource (checkedItems, field) {
      this.checkedResources[field] = [...checkedItems]
      if (field === 'vrserver' || field === 'csvrserver') this.checkedResources.network = [...this.checkedResources.vrserver, ...this.checkedResources.csvrserver] // 네트워크 정보 세팅

      this.isChangedSelectItem = true
    },
    /**
     * [이관 자원 담기] 클릭 시, 담을 자원 저장
     */
    putInTransBasket (activeStep = this.activeStep) {
      if (!activeStep) return
      // {n}개의 자원을<br>이관 장바구니에 담으시겠습니까?
      this.$confirm(this.$t('common.CONFIRM.TRANSFER.002', { count: this.checkedResources[activeStep].length }), { dangerouslyUseHTMLString: true })
        .then(async () => {
          this.transResources[activeStep] = this.checkedResources[activeStep]
          // console.log('@이관할 자원들: ', this.transResources[activeStep])
          const result = await this.saveTransResource(this.transResources[activeStep])
          if (result) {
            if (result.notRegisterList) this.$alert(this.$t('common.ALERT.TRANSFER.004')) // 이관 장바구니 추가 실패한 자원이 있습니다.
            else {
              const self = this
              // ${this.checkedResources[activeStep].length}개의 자원을<br>이관 장바구니에 저장했습니다.
              this.$alert(this.$t('common.ALERT.TRANSFER.005', { count: this.checkedResources[activeStep].length }), {
                dangerouslyUseHTMLString: true,
                callback: async () => {
                  // this.resetCheckedItems()
                  const stepRef = self.$refs?.resourceSteps
                  if (stepRef) {
                    if (this.stepNum < stepRef.steps.length - 1) this.stepNum += 1
                    else this.goToBasket()
                  }
                  await this.init()
                }
              })

            // await this.init()
            }
          } else return this.$alert(this.$t('common.ALERT.TRANSFER.006')) // 자원 저장을 실패했습니다.
        }).catch(() => {
          return false
        })
    },
    /**
     * 이관 장바구니 관련 정보를 재조회 합니다.
     */
    async refreshTransBasket () {
      await this.getTransBasket() // 이관 장바구니 자원 조회
      await this.getTransBasketOtherUser() // 타 최고 관리자 계정의 이관 장바구니 조회
      await this.getTransBasketCount() // 이관 장바구니 count 조회
      await this.getTransBasketHistory() // 이관 장바구니 히스토리 조회
    },
    /**
     *  타 최고 관리자 계정의 이관 장바구니 자원들을 disable 처리합니다.
     * @param {Array} data disable 처리 할 데이터
     */
    disableRow (data = this[`filtered${this.activeStep.replace(/^./, this.activeStep[0].toUpperCase())}Data`]) {
      const step = this.activeStep
      const uniqKey = {
        compute: 'vmUuid',
        storage: 'vgUuid',
        network: 'frontNetIdx',
        security: 'securityGroupIdx',
        database: 'databaseUuid'
      }[step]
      if (this.otherTransBasketData[step]) {
        const resourceIdsInCart = this.otherTransBasketData[step].map(row => row.resourceId)
        data = data.map(row => {
          this.$set(row, 'isSelectable', !includes(resourceIdsInCart, row[uniqKey]))
          return row
        })

        // const resourceComp = this.$refs.resourceGrid // 현재 활성화 한 자원 그리드 ref
      // this.gridRefresh(resourceComp.grid)
      }
    },
    async setGroupProjectFilter (value) {
      this.filteredProjectInfo = value

      const allSelectEmpty = Object.values(this.filteredProjectInfo).every(val => val === null) // 리셋 일 때 true
      if (allSelectEmpty) this.filteredProjectInfo = null

      await this.init()
    },
    /**
     * searchComponent가 autocomplete일 때, 옵션에 뜨는 데이터를 세팅해줍니다.
     */
    fetchSearchOption ({ searchText, callback }) {
      if (!searchText) return callback(undefined)
      const createFilter = (queryString) => {
        return (link) => {
          return (includes(link.text, queryString))
        }
      }

      const baseGridData = this[this.activeStep + 'Data']
      const options = []
      const resourceComp = this.$refs.resourceGrid // 현재 활성화 한 자원 그리드 ref
      if (!resourceComp) return

      baseGridData.forEach(row => {
        for (const [key, value] of Object.entries(row)) {
          const sameCol = resourceComp.searchableColumns.find(col => col.binding === key)
          if (!sameCol) continue
          const jsonValue = JSON.stringify(value)

          if (sameCol.binding === 'appTaskUsersName') { // APP 담당자
            const usersName = row.appTaskUser?.map(usr => {
              return usr.appTaskUserName + '(' + '**' + usr.appTaskUserId?.substring(2) + ')'
            }) || ''
            const jsonNames = JSON.stringify(usersName)

            if (includes(jsonNames, searchText)) {
              const findedName = usersName?.find(name => includes(name, searchText))
              options.push({
                text: findedName,
                value: sameCol.label + ': ' + findedName,
                binding: sameCol.binding
              })
            }
          } else if (Array.isArray(value)) { // 배열
            if (includes(jsonValue, searchText)) {
              const findedVal = value.find(item => includes(item, searchText))

              options.push({
                text: findedVal,
                value: sameCol.label + ': ' + findedVal,
                binding: sameCol.binding
              })
            }
          } else {
            if (includes(value, searchText)) {
              options.push({
                text: value,
                value: sameCol.label + ': ' + value,
                binding: sameCol.binding
              })
            }
          }
        }
      })
      const results = searchText ? options.filter(createFilter(searchText)) : options
      const uniqResult = uniqBy(results, 'value')

      callback(uniqResult)
    },
    /**
     * search text 입력 후, 필터링을 적용합니다.
     */
    async filterByText (searchObj) {
      const step = this.activeStep // 활성화 스텝
      const origin = await this.filtering(this[step + 'Data']) // 선택한 자원 분류에 따른 필터링

      if (!searchObj) {
        this[`filtered${step.replace(/^./, step[0].toUpperCase())}Data`] = [...origin]
      } else {
        this.searchInputText = searchObj.text

        if (searchObj.binding === 'appTaskUsersName') { // APP 담당자
          this[`filtered${step.replace(/^./, step[0].toUpperCase())}Data`] = origin.filter(row => {
            const usersName = row.appTaskUser?.map(usr => {
              return usr.appTaskUserName + '(' + '**' + usr.appTaskUserId?.substring(2) + ')'
            }) || ''
            const jsonNames = JSON.stringify(usersName)
            if (includes(jsonNames, searchObj.text)) return row
          })
        } else {
          this[`filtered${step.replace(/^./, step[0].toUpperCase())}Data`] = origin.filter(row => {
            const jsonValue = JSON.stringify(row)
            if (includes(jsonValue, searchObj.text)) return row
          })
        }
      }

      this.searchAutocompleteObj = searchObj

      this.$nextTick(function () {
        // 이관 장바구니에 있는 자원 disable row 처리
        this.disableRow()
      })
    },
    /**
     * 자원 분류 필터링
     */
    filtering (data) {
      const afterFiltering = data.filter(item => {
        let result = true
        if (this.filteredResourceType) result = result && (item.resourceType === this.filteredResourceType)

        return result
      })
      return afterFiltering
    },
    // ------- 미등록 자원 ---------
    /**
    * 미등록 vms Excel 파일 업로드
    */
    async uploadExcel (file, fileList) {
      try {
        const fileForm = new FormData()
        fileForm.append('file', file.raw)
        // fileForm.file = file.raw
        const result = await API.compute.uploadExcelVm(fileForm)
        console.log(result)
        if (result) {
          await this.getVmsExcelList()
        }
      } catch (error) {
        console.error(error)
      }
    },
    /**
    * [이관장바구니] 로 이동
    */
    goToBasket () {
      this.routeTo({
        name: 'resource-operation-basket'
      })
    },
    /**
     * 전체 체크했던 row 리셋시킵니다.
     */
    resetCheckedItems () {
      this.checkedResources = mapValues(this.checkedResources, () => [])
    },
    routeTo (to) {
      this.$router.push(to)
    },
    closeUnregistExcelModal () {
      // console.log(this.$refs.unregistExcelModal)
      // this.$refs.unregistExcelModal.activeTab = { field: 'compute', name: 'Compute', workType: 'COMPUTE' }
      this.unregistExcelModal = false
    }
  },
  data () {
    return {
      isChangedSelectItem: false, // 체크한 자원이 변경되었는지? 변경 되었으면 => 이관 자원 담기 버튼 활성화
      filteredProjectInfo: null, // 필터링 : 관-조-프
      filteredResourceType: '', // 필터링 : 자원 분류 선택
      resourceOption: [
        { label: this.$t('config.TRANSFER.generalResource'), value: 'GENERAL' }, // 일반 자원
        { label: this.$t('service.PLACEHOLDER.unEnrollSrc'), value: 'UNREGISTERED' } // 미등록 자원
        // { label: this.$t('config.TRANSFER.temporaryResource'), value: 'CUSTOM' } // 임의 변경 자원 => ITSM과 CMDB가 일치하지 않는 자원
      ],
      stepNum: 0,
      activeStepInfo: null, // 현재 활성화 된 스텝의 정보
      searchInputText: '', // [키워드 찾기] 키워드 input 입력 값
      searchAutocompleteObj: undefined, // [키워드 찾기] input > autocomplete 목록에서 선택한 키워드 Object

      // origin 자원 데이터
      computeData: [], // Compute
      storageData: [],
      vrserverData: [], // L4
      csvrserverData: [], // L7
      networkData: [], // (L4 + L7)
      securityData: [], // 보안그룹
      databaseData: [], // 데이터베이스
      // 필터링 된 자원 데이터
      filteredComputeData: [],
      filteredStorageData: [],
      filteredNetworkData: [],
      filteredSecurityData: [], // 보안그룹
      filteredDatabaseData: [], // 데이터베이스

      // 이관 할 자원
      transResources: {
        compute: [],
        storage: [],
        network: [], // L4 + L7
        security: [],
        database: []
      },

      // 체크한 자원
      checkedResources: {
        compute: [],
        storage: [],
        vrserver: [], // L4
        csvrserver: [], // L7
        network: [],
        security: [],
        database: []
      },

      allVmsHostName: [], // 이관 장바구니에 있는 vm들의 호스트명 모음
      allDbsHostName: [], // 이관 장바구니에 있는 DB vm들의 호스트명 모음

      // 로딩
      loading: {
        isGetWorkflow: false, // 워크플로우 리스트 조회

        isGetVmList: false, // compute
        isGetVrserverList: false, // L4
        isGetCsvrserverList: false, // L7
        isGetVgList: false, // 스토리지 > VolumeGroup
        isGetSecurityList: false, // 보안 그룹

        isGetHistory: false, // 이관 장바구니 히스토리
        isGetTransResource: false, // 이관 장바구니 자원 조회
        isSavedTransResource: false, // 이관 장바구니 자원 저장
        isGetOtherTransResource: false // 타 최고 관리자 이관 장바구니 자원 조회
      },

      // 미등록 자원
      unregistExcelModal: false, // 미등록 자원 Excel 업로드 미리보기 모달

      // 이관 History
      resourceHistModal: false, // 이관 히스토리 모달
      historyData: [
        { moveTime: '', startProject: '', destProject: '일반', resourceType: 'Compute', resourceName: 'test' }
      ],
      histColumns: [
        { header: '이관 일자', binding: 'moveTime', width: 150, keyPath: 'common.GRID.transTime' },
        { header: '출발지', binding: 'startPointName', width: '*', keyPath: 'common.GRID.NETWORK.origin', customHtml: true },
        { header: '목적지', binding: 'endPointName', keyPath: 'common.GRID.NETWORK.dest', customHtml: true },
        { header: '자원분류', binding: 'workCate', width: 100, keyPath: 'common.GRID.resourceCate' },
        { header: '자원종류', binding: 'workTypeCate', width: 100, keyPath: 'common.GRID.resourceType' },
        { header: '자원 명', binding: 'resourceName', width: 250, align: 'left', keyPath: 'common.GRID.resourceName' }
      ],

      // 이관 장바구니
      transBasketCount: 0,
      otherTransBasketData: [], // 다른 유저 이관 장바구니 내에 있는 모든 자원
      myTransBasketData: { // 내 이관 장바구니 내에 있는 모든 자원
        compute: [],
        storage: [],
        network: [],
        security: [],
        database: []
      },
      originWorkFlowList: [],
      workFlowSteps: []
    }
  }
}
</script>
<style lang="scss">
  .resource-operation {
    position: relative;
    .header-trans-button {
      position: absolute;
      top: 40px;
      right: 0;
      z-index: 1;
      &.-long { top: 100px; }
    }

    .process-steps {
      margin-bottom: 50px;
      &.-long { margin-top: 80px; }
    }
    .table-top-wrap { margin-bottom: $gap-m; }

    // 자원 그리드
    .hostname-name-wrap {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .join-comma-list {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      > span {
        &:not(:last-child) {
          &::after { content: ',' }
        }
      }
    }
    .grid-wrap + .grid-wrap { margin-top: 50px; }
  }

  .resource-operation-dropdown-popper.el-dropdown-menu.el-popper[x-placement^=bottom] {
    z-index: 9 !important;
  }

  .custom-select-popper { z-index: 9 !important; }
</style>
