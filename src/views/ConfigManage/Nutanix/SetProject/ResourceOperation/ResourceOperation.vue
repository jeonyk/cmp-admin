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
      <!-- <button
        class="button"
        type="is-primary"
        @click="unregistExcelModal = true"
      >
        {{ $v('미등록 자원 Excel 업로드') }}
      </button> -->
      <button
        class="button"
        type="is-primary"
        @click="resourceHistModal = true"
      >
        {{ $v('이관') }}&nbsp;History
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
          {{ $v('이관 장바구니') }}
        </button>
      </el-badge>
    </div>

    <resource-filter-component
      cloud-type="private"
      module-type="NX"
      @search="setGroupProjectFilter"
      @reset="() => {
        filteredResourceType = ''
        filteredProjectInfo = null
      }"
      popper-class="resource-operation-dropdown-popper"
    >
      <!-- <section class="filter-form">
        <span class="filter-name">
          {{ $v('자원 분류') }}
        </span>
        <div class="filter-options">
          <el-select
            v-model="filteredResourceType"
            :placeholder="$v('자원 분류 선택')"
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
      </section> -->
    </resource-filter-component>

    <section
      class="process-steps"
      :class="{ '-long': $i18n.locale !== 'ko' }"
    >
      <resource-operation-steps
        v-if="loadSuccess.isGetWorkflow"
        ref="resourceSteps"
        :data="workFlowSteps"
        :active="stepNum"
        @change="changeStep"
      />
      <span
        class="empty-data"
        v-else
      >
        서비스 조회에 문제가 발생했습니다.<br>
        관리자에게 문의하세요.
      </span>
    </section>

    <section class="table-top-wrap">
      <search-component
        v-model="searchInputText"
        class="search-area"
        ref="searchComponentRef"
        type="autocomplete"
        :placeholder="$t('common.PLACEHOLDER.searchEnter')"
        :search-full-name="selectedSearchFullName"
        :input-width="200"
        @fetch="fetchSearchOption"
        @select="filterByText"
        @search="filterByText"
      />

      <div
        class="flex-wrap -flex-end"
        style="gap: 20px;"
      >
        <el-checkbox
          v-model="isMyResource"
          @change="filterByText(searchAutocompleteObj)"
        >
          {{ $v('내가 체크한 자원만 보기') }}
        </el-checkbox>

        <button
          class="button"
          type="is-primary"
          @click="putInTransBasket()"
          :disabled="!isChangedSelectItem"
        >
          {{ $v('이관 자원 담기') }}
        </button>
      </div>
    </section>

    <resource-operation-compute
      v-if="activeStep === 'compute'"
      ref="resourceGrid"
      :data="filteredComputeData"
      :loading="loading.isGetVmList || loading.isGetTransResource || loading.isGetOtherTransResource"
      :deletable="false"
      :checked-resources="checkedResources.compute"
      :init-auto-select-row="isChangedSelectItem
        ? checkedResources.compute
        : myTransBasketData && myTransBasketData.compute ? myTransBasketData.compute : []"
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
      :checked-resources="checkedResources.storage"
      :init-auto-select-row="isChangedSelectItem
        ? checkedResources.storage
        : myTransBasketData && myTransBasketData.storage ? myTransBasketData.storage : []"
      @checkedRowsData="items => saveCheckedResource(items, 'storage')"
    />
    <resource-operation-network
      v-if="activeStep === 'network'"
      ref="resourceGrid"
      @changeInput="networkTabHandler()"
      :data="filteredNetworkData"
      :host-names-in-basket="[...allVmsHostName, ...allDbsHostName]"
      :loading="loading.isGetVrserverList ||
        loading.isGetCsvrserverList ||
        loading.isGetTransResource ||
        loading.isGetOtherTransResource"
      :deletable="false"
      :checked-resources-l4="checkedResources.vrserver"
      :checked-resources-l7="checkedResources.csvrserver"
      :init-auto-select-row="isChangedSelectItem
        ? checkedResources.network
        : myTransBasketData && myTransBasketData.network ? myTransBasketData.network : []"
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
      :checked-resources="checkedResources.security"
      :init-auto-select-row="isChangedSelectItem
        ? checkedResources.security
        : myTransBasketData && myTransBasketData.security ? myTransBasketData.security : []"
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
      :checked-resources="checkedResources.database"
      :init-auto-select-row="isChangedSelectItem
        ? checkedResources.database
        : myTransBasketData && myTransBasketData.database ? myTransBasketData.database : []"
      @checkedRowsData="items => saveCheckedResource(items, 'database')"
    />

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
import GridModal from '@/components/Modal/GridModal/GridModal'

import {
  getVmList,
  // getUnregistersVms,
  getVolumeGroups,
  // getUnregistersVolumeGroups,
  getVrserver,
  getCsvrserver,
  getSgGroup,
  // getUnregistersgroup,
  getDatabasesSimple
  // getUnregistersDatabase
} from './ResourceOperationGetAll'

export default {
  name: 'ResourceOperation',
  components: {
    ResourceOperationSteps,
    ResourceOperationCompute,
    ResourceOperationStorage,
    ResourceOperationNetwork,
    ResourceOperationSecurity,
    ResourceOperationDatabase,
    GridModal,
    ResourceFilterComponent
  },
  async created () {
    await this.getServiceList()
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

        const ref = this.$refs.searchComponentRef
        if (ref) {
          ref.reset()
        }
        await this.init()
      }
    },
    otherTransBasketData (newVal) {
      if (newVal) this.disableRow()
    }
  },
  methods: {
    async init () {
      await Promise.all([
        this.refreshTransBasket(), // 이관 장바구니 관련

        this.resetCurrentData()
      ]).then(async () => {
        this.networkData = [...this.vrserverData, ...this.csvrserverData]
        await this.filterByText(this.searchAutocompleteObj)
      })
    },
    async networkTabHandler () {
      await this.init()
      console.log(this.$refs.resourceGrid?.view)
    },
    /**
     * 현 라이센스 버전에 포함되는 서비스 조회
     */
    async getServiceList () {
      try {
        this.loading.isGetWorkflow = true
        const services = await API.work_v3.getVersionServiceList()

        const groupedByCsp = groupBy(services, 'module') || []
        // { NUTAIX: [...], VMWARE: [...], NETWORK: [...] }

        const steps = []
        groupedByCsp.NUTANIX.forEach(item => {
          if (!item || item.service === 'MARKET') return false
          else {
            steps.push({ label: this.capitalize(item.service), value: item.service.toLowerCase() })
          }
        })

        groupedByCsp.NETWORK.forEach(item => {
          if (item.service.includes('NETWORK')) {
            steps.push({
              label: 'Network(L4/L7)', value: 'network'
            })
          } else {
            steps.push({ label: this.capitalize(item.service), value: item.service.toLowerCase() })
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
        console.error(error)
        this.loading.isGetWorkflow = false
        this.loadSuccess.isGetWorkflow = false
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
        // let unregistVmList = []

        const setResourceList = async () => { // 기등록
          vmList = await getVmList({
            ...this.filteredProjectInfo,
            filterChargeDate: true,
            filterDeleteDate: true
          })
        }

        // const setUnregList = async () => { // 미등록
        //   unregistVmList = this.filteredProjectInfo ? [] : await getUnregistersVms()
        // }

        await Promise.all([
          setResourceList()
          // setUnregList()
        ])

        // this.computeData = [...vmList, ...unregistVmList]
        this.computeData = [...vmList]
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
        // let unregistList = []
        const setResourceList = async () => { // 기등록
          resourceList = await getVolumeGroups({
            ...this.filteredProjectInfo,
            filterChargeDate: true,
            filterDeleteDate: true
          })
        }

        // const setUnregList = async () => { // 미등록
        //   unregistList = this.filteredProjectInfo ? [] : await getUnregistersVolumeGroups()
        // }

        await Promise.all([
          setResourceList()
          // setUnregList()
        ])

        // this.storageData = [...resourceList, ...unregistList]
        this.storageData = [...resourceList]
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

        const setResourceList = async () => { // 기등록
          resourceList = await getVrserver({
            ...this.filteredProjectInfo
          })
        }
        // const setResourceList = async () => { // 기등록
        //   resourceList = await getAllVrserver({
        //     ...this.filteredProjectInfo,
        //     ...(this.searchInputText && { searchKeyword: this.searchInputText })
        //   })
        // }

        await setResourceList()

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

        const setResourceList = async () => { // 기등록
          resourceList = await getCsvrserver({
            ...this.filteredProjectInfo
          })
        }
        // const setResourceList = async () => { // 기등록
        //   resourceList = await getAllCsvrserver({
        //     ...this.filteredProjectInfo,
        //     ...(this.searchInputText && { searchKeyword: this.searchInputText })
        //   })
        // }
        await setResourceList()

        this.csvrserverData = [...resourceList]
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
        // let unregistList = []
        const setResourceList = async () => { // 기등록
          resourceList = await getSgGroup(this.filteredProjectInfo)
        }

        // const setUnregList = async () => { // 미등록
        //   unregistList = this.filteredProjectInfo ? [] : await getUnregistersgroup()
        // }

        await Promise.all([
          setResourceList()
          // setUnregList()
        ])

        // this.securityData = [...resourceList, ...unregistList]
        this.securityData = [...resourceList]
      } catch (error) {
        console.error('@ 자원 조회 Error: 보안 그룹')
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
        // let unregistList = []
        const setResourceList = async () => { // 기등록
          resourceList = await getDatabasesSimple({
            ...this.filteredProjectInfo
          })
        }

        // const setUnregList = async () => { // 미등록
        //   unregistList = this.filteredProjectInfo ? [] : await getUnregistersDatabase()
        // }

        await Promise.all([
          setResourceList()
          // setUnregList()
        ])

        // this.databaseData = [...resourceList, ...unregistList]
        this.databaseData = [...resourceList]
      } catch (error) {
        console.error('@ 자원 조회 Error: Database')
      } finally {
        this.loading.isGetDatabaseList = false
      }
    },

    /**
     * API : 이관 장바구니 카운트 조회
     */
    async getTransBasketCount (csp = this.activeModule, userId = this.user.userId) {
      try {
        this.loading.isGetHistory = true
        const data = await API.work_v3.getTransBasketCount({ csp, userId })
        this.transBasketCount = data || 0
      } catch (error) { console.error(error) } finally { this.loading.isGetHistory = false }
    },
    /**
     * API : 이관 장바구니 히스토리 조회
     */
    async getTransBasketHistory (csp = this.activeModule, userId = this.user.userId) {
      try {
        this.loading.isGetHistory = true
        const data = await API.work_v3.getTransBasketHistory({ csp, userId })
        this.historyData = data.map(row => {
          const service = {
            COMPUTE: 'Compute',
            STORAGE: 'Storage',
            NETWORK_L4: 'Network',
            NETWORK_L7: 'Network',
            SECURITY: 'Security',
            DATABASE: 'Database'
          }[row.service]
          row.service = service
          return {
            ...row,
            // workCate: row.type === 'GENERAL' ? this.$v('일반 자원') : this.$v('미등록 자원'),
            moveTime: this.$options.filters.date(row.createdTime, 'YYYY.MM.DD HH:mm')
          }
        }).sort((a, b) => {
          if (a.createTime < b.createTime) return 1
          else if (a.createTime > b.createTime) return -1
          else return 0
        })
      } catch (error) { console.error(error) } finally { this.loading.isGetHistory = false }
    },
    /**
     * API : 이관 장바구니 자원 조회
     */
    async getTransBasket (csp = this.activeModule, userId = this.user.userId) {
      try {
        this.loading.isGetTransResource = true
        let response = []
        response = await API.work_v3.getTransBasket({ csp, userId })

        console.log(response, 'res')

        if (response) {
          const vmHostNames = [] // 장바구니에 담긴 VM 자원 호스트명 모음
          const dbHostNames = [] // 장바구니에 담긴 DB 자원 호스트명 모음

          const flatData = response.map(row => {
            if (row.resourceData.workType === 'COMPUTE')vmHostNames.push(row.resourceData.hostname)
            if (row.resourceData.workType === 'DATABASE')dbHostNames.push(row.resourceData.hostname)

            return {
              ...row,
              ...row.resourceData
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
    async getTransBasketOtherUser (csp = this.activeModule, userId = this.user.userId) {
      try {
        this.loading.isGetOtherTransResource = true
        let response = []
        response = await API.work_v3.getTransBasketOtherUser({ csp, userId })
        if (response) {
          this.otherTransBasketData = this.groupByResourceType(response) // { compute: [...], storage: [...], network: [...] } 요런 형태
          console.log('다른 최고 관리자: ', this.otherTransBasketData)
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

        let networkText = '' || null

        if (this.$refs.resourceGrid?.view) {
          networkText = `_${this.$refs.resourceGrid.view.replace(/^./, this.$refs.resourceGrid.view[0].toUpperCase())}`
        }

        const service = {
          compute: 'COMPUTE',
          storage: 'STORAGE',
          network: `NETWORK${networkText}`,
          security: 'SECURITY',
          database: 'DATABASE'
        }[this.activeStep]

        const payload = data.map(item => {
          const mapData = {
            ...item,
            networkList: item.nics || item.networkList,
            resourceIdx: item.userVmIdx || item.userDbIdx || item.userVgIdx || item.userShareIdx || item.csVrserverIdx || item.vrserverIdx
          }

          return {
            // data: JSON.stringify(mapData),
            reqUserId: userId,
            resourceData: mapData,
            resourceIdx: item.userVmIdx || item.userDbIdx || item.userVgIdx || item.userShareIdx || item.csVrserverIdx || item.vrserverIdx,
            resourceName: item.resourceName,
            startPointIdx: item.projectIdx,
            startPointName: item.projectName,
            userId,
            service,
            workType: item.workType
          }
        })

        const result = await API.work_v3.saveTransResource(userId, service, payload)
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
        }[row.service]
        // if (resourceType === 'network') row.frontNetIdx = row.vrserverIdx || row.csVrserverIdx

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
        const ids = this.checkedResources[step].map(item => item.resourceIdx)

        data = data.map(row => {
          return {
            ...row,
            checked: ids.includes(row.resourceIdx)
          }
        })
      }
    },
    /**
     * 이관 할 자원 체크 시, 발생 이벤트
     * @param {Array} checkedItems 체크 한 자원
     * @param {field} field 자원 분류 ('compute', 'storage', 'vrserver'(L4), 'csvrserver'(L7), 'security', 'database')
     */
    saveCheckedResource (checkedItems, field) {
      console.log(checkedItems)
      this.checkedResources[field] = [...checkedItems]

      if (field === 'vrserver' || field === 'csvrserver') this.checkedResources.network = [...this.checkedResources.vrserver, ...this.checkedResources.csvrserver] // 네트워크 정보 세팅

      this.isChangedSelectItem = true
    },
    /**
     * [이관 자원 담기] 클릭 시, 담을 자원 저장
     */
    putInTransBasket (activeStep = this.activeStep) {
      if (!activeStep) return
      this.$confirm(this.$v('{count}개 자원을<br>이관 장바구니에 담으시겠습니까?', { count: this.checkedResources[activeStep].length }), { dangerouslyUseHTMLString: true })
        .then(async () => {
          this.transResources[activeStep] = this.checkedResources[activeStep]
          console.log('@이관할 자원들: ', this.transResources[activeStep])
          const result = await this.saveTransResource(this.transResources[activeStep])
          if (result) {
            if (result.notRegisterList) this.$alert(this.$v('이관 장바구니 추가 실패한 자원이 있습니다.'))
            else {
              // const self = this

              this.$confirm(this.$v('{count}개의 자원을<br>이관 장바구니에 저장했습니다.<br>지금 이관 장바구니로 이동하시겠습니까?<br><br><span style="color: #d95252;">* 확인 클릭 시 이관 장바구니 페이지로 이동합니다.</span>', {
                count: this.checkedResources[activeStep].length
              }), '', {
                dangerouslyUseHTMLString: true
              }).then(() => {
                this.goToBasket()
              }).catch(async () => await this.init())

              // this.$alert(this.$v('{count}개의 자원을<br>이관 장바구니에 저장했습니다.', { count: this.checkedResources[activeStep].length }), {
              //   dangerouslyUseHTMLString: true,
              //   callback: async () => {
              //     // this.resetCheckedItems()
              //     const stepRef = self.$refs?.resourceSteps
              //     if (stepRef) {
              //       if (this.stepNum < stepRef.steps.length - 1) this.stepNum += 1
              //       else this.goToBasket()
              //     }
              //     await this.init()
              //   }
              // })
            }
          } else return this.$alert(this.$v('자원 저장을 실패했습니다.'), () => false)
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
        const resourceIdsInCart = this.otherTransBasketData[step].map(row => row.resourceData.resourceId)
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
      // if (!searchText) return callback(null)
      const createFilter = (queryString) => {
        return (link) => {
          return (includes(link.text?.toLowerCase(), queryString?.toLowerCase()))
        }
      }

      const baseGridData = this[this.activeStep + 'Data']
      const options = [{ text: searchText, value: `${this.$v('전체')}: ${searchText}`, binding: null }]
      const resourceComp = this.$refs.resourceGrid // 현재 활성화 한 자원 그리드 ref
      if (!resourceComp) return

      baseGridData.forEach(row => {
        for (const [key, value] of Object.entries(row)) {
          const sameCol = resourceComp.searchableColumns.find(col => col.binding === key)
          if (!sameCol) continue
          const jsonValue = JSON.stringify(value)

          if (sameCol?.binding === 'appTaskUsersName') { // APP 담당자
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
            if (includes(jsonValue.toLowerCase(), searchText?.toLowerCase())) {
              const findedVal = value.find(item => includes(item?.toLowerCase(), searchText?.toLowerCase()))

              options.push({
                text: findedVal,
                value: sameCol.label + ': ' + findedVal,
                binding: sameCol.binding
              })
            }
          } else {
            if (includes(value?.toLowerCase(), searchText?.toLowerCase())) {
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
      this.loading.isGetTransResource = true
      const step = this.activeStep // 활성화 스텝
      const gridDataText = `filtered${step.replace(/^./, step[0].toUpperCase())}Data`
      const origin = await this.filtering(this[step + 'Data']) // 선택한 자원 분류에 따른 필터링

      if (!searchObj) {
        this[gridDataText] = [...origin]
        this.selectedSearchFullName = ''
      } else {
        // 텍스트 검색 후 enter쳤을 때.
        if (typeof searchObj === 'string' || searchObj.binding === null) {
          this[gridDataText] = origin.filter(row => {
            const text = (typeof searchObj === 'string') ? searchObj : searchObj.text

            const data = this.searchableValuesAllColumns(row)
            const jsonValue = JSON.stringify(data)

            if (includes(jsonValue.toLowerCase(), text?.toLowerCase())) return row
          })
        } else {
          // 텍스트 검색 후 아래에 뜨는 항목 중 하나 선택 했을 때
          // this.searchInputText = searchObj.text

          if (searchObj.binding === 'appTaskUsersName') { // APP 담당자
            this[gridDataText] = origin.filter(row => {
              const usersName = row.appTaskUser?.map(usr => {
                return usr.appTaskUserName + '(' + '**' + usr.appTaskUserId?.substring(2) + ')'
              }) || ''
              const jsonNames = JSON.stringify(usersName)
              if (includes(jsonNames, searchObj.text)) return row
            })
          } else {
            const binding = searchObj.binding
            this[gridDataText] = origin.filter(row => {
              const jsonValue = JSON.stringify(row[binding])
              if (Array.isArray(row[binding]) && includes(jsonValue, searchObj.text)) return row
              else if (includes(row[binding], searchObj.text)) return row
            })
          }
        }
      }

      this.searchAutocompleteObj = searchObj

      if (searchObj) this.selectedSearchFullName = searchObj?.value ? searchObj.value : `${this.$v('전체')}: ${searchObj}`
      this.$nextTick(function () {
        // 이관 장바구니에 있는 자원 disable row 처리
        this.disableRow()
      })
      this.loading.isGetTransResource = false
    },
    /**
     * 가타 필터링
     * 1. 자원 분류 (기등록/미등록)
     * 2. 내가 체크한 자원만 보기
     */
    filtering (data) {
      const afterFiltering = data.filter(item => {
        let result = true
        // 1. 자원 분류
        if (this.filteredResourceType) result = (item.resourceData.resourceType === this.filteredResourceType)

        // 2. 내가 체크한 자원만 보기
        if (this.isMyResource) {
          const myCheckedResource = this.isChangedSelectItem
            ? this.checkedResources[this.activeStep]
            : this.myTransBasketData[this.activeStep]
          const myCheckedResourceIds = myCheckedResource?.map(item => item.resourceId) || []
          //   : []

          result = myCheckedResourceIds.includes(item.resourceId)
        }

        return result
      })
      return afterFiltering
    },
    /**
     * [전체] 대상으로 검색 시, 검색 할 row 정보를 가공합니다.
     * 검색은 이 row 정보와 입력 text를 비교합니다.
     */
    searchableValuesAllColumns (row) {
      const resourceComp = this.$refs.resourceGrid // 현재 활성화 한 자원 그리드 ref
      const columns = resourceComp.defaultColumns

      const searchRowData = []
      columns.forEach(col => {
        if (['createTime', 'deleting', 'specInfo', 'startTime', 'endTime'].includes(col.binding)) return
        searchRowData.push(row[col.binding])
      })
      return searchRowData
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
      activeModule: 'NUTANIX',
      isChangedSelectItem: false, // 체크한 자원이 변경되었는지? 변경 되었으면 => 이관 자원 담기 버튼 활성화
      selectedSearchFullName: '',
      filteredProjectInfo: null, // 필터링 : 관-조-프
      filteredResourceType: null, // 필터링 : 자원 분류 선택
      resourceOption: [
        { label: this.$v('전체'), value: null }, // 전체
        { label: this.$t('config.TRANSFER.generalResource'), value: 'GENERAL' }, // 일반 자원
        { label: this.$t('service.PLACEHOLDER.unEnrollSrc'), value: 'UNREGISTERED' } // 미등록 자원
        // { label: this.$t('config.TRANSFER.temporaryResource'), value: 'CUSTOM' } // 임의 변경 자원 => ITSM과 CMDB가 일치하지 않는 자원
      ],
      stepNum: 0,
      activeStepInfo: null, // 현재 활성화 된 스텝의 정보
      searchInputText: '', // [키워드 찾기] 키워드 input 입력 값
      searchAutocompleteObj: undefined, // [키워드 찾기] input > autocomplete 목록에서 선택한 키워드 Object
      isMyResource: false, // 내가 체크한 자원만 보기

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
      // 로드
      loadSuccess: {
        isGetWorkflow: true
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
        // { header: '자원분류', binding: 'workCate', width: 100, keyPath: 'common.GRID.resourceCate' },
        { header: '자원종류', binding: 'service', width: 100, keyPath: 'common.GRID.resourceType' },
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
      workFlowSteps: [],
      capitalize (val) {
        if (!val) return ''
        return this.$options.filters.capitalize(val)
      }
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
      gap: 10px;
      padding: 32px 160px;
      background: $dark-navy;
      border-radius: $radius;
      .empty-data { text-align: center; }
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

    // 인터벌 + 페이지네이션 때 알 수 없는 스크롤바 생김 방지
    .resource-operation-grid {
      .wj-content {
        & > div {
          div[wj-part=root] {
            overflow: hidden !important;
          }
        }
      }
    }
  }

  .resource-operation-dropdown-popper.el-dropdown-menu.el-popper[x-placement^=bottom] {
    z-index: 9 !important;
  }

  .custom-select-popper { z-index: 9 !important; }
</style>
