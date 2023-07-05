<!--
  * 파일명 : SetPrivateUnregisterResource.vue
  * 파일 기능 : Private (Nutanix/VMware) > 구성관리 > 미등록 자원 관리
  * 작성자 : 김예담
  * License By Shinsegae I&C
 -->

<template>
  <div
    class="set-private-unregister-resource"
    v-if="activeService"
    v-loading="loading.isGetWorkflow || loading.isGetUnregisterData"
    :element-loading-text="$v('데이터 로딩중\n잠시만 기다려 주십시오.')"
  >
    <g-tab
      :data="tabData"
      @click="tab => {
        activeService = tab.service
        activeServiceName = tab.name
      }"
      :padding-top="20"
    />
    <div class="button-area -right header-regist-button">
      <el-badge
        :value="myBasketData.all.length"
        :max="99"
        style="margin-left: 10px;"
      >
        <button
          class="button"
          type="is-primary"
          @click="goToBasket"
        >
          {{ $v('등록 장바구니') }}
        </button>
      </el-badge>
    </div>

    <div class="button-area -right">
      <button
        class="button"
        type="is-primary"
        @click="putInBasket()"
      >
        {{ $v('등록 장바구니 담기') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="unregistExcelModal = true"
      >
        {{ $v('미등록 자원 Excel 업로드') }}
      </button>
    </div>

    <component
      :is="activeServiceList"
      :data="allData[activeService]"
      :init-auto-select-row="myBasketData[activeService]"
      @checkedRowsData="items => saveCheckedResource(items, activeService)"
      :editable="false"
      :switch-type="activeService === 'NETWORK_L4' ? 'L4' : 'L7'"
      class="unregister-resource-list"
    />

    <!-- 모달 -->
    <!-- 미등록 자원 등록 미리보기 모달 -->
    <el-dialog
      :visible.sync="unregistExcelModal"
      :title="`${activeServiceName} ${$v('미등록 자원 Excel 업로드')}`"
      width="1000px"
      @close="() => unregistExcelModal = false"
    >
      <unregister-resource-excel-upload
        ref="unregistExcelModal"
        @close="() => unregistExcelModal = false"
        :service="activeService"
        :my-regist-basket-data="myBasketData"
        :other-regist-basket-data="otherUserBasketData"
      />
    </el-dialog>

    <!-- 등록 History 히스토리 모달 -->
    <!-- <grid-modal
      :active.sync="histModal"
      :title="`${$v('등록')} History`"
      :table-data="historyData"
      :column-data="histColumns"
      :use-cancel-btn="false"
      :loading="loading.isGetHistory"
      width="1000px"
      @close="histModal = false"
    /> -->
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import { groupBy, uniqBy, isEmpty } from 'lodash'
import { v4 } from 'uuid'
import API, { GTab } from '@sd-fe/cmp-core'
import UnregisterResourceExcelUpload from './UnregisterResourceExcelUpload.vue'

import UnregisterNutanixVmList from './NutanixUnregisterResources/UnregisterNutanixVmList.vue'
import UnregisterNutanixStorageList from './NutanixUnregisterResources/UnregisterNutanixStorageList.vue'
import UnregisterNutanixDatabaseList from './NutanixUnregisterResources/UnregisterNutanixDatabaseList.vue'
import UnregisterNutanixShareList from './NutanixUnregisterResources/UnregisterNutanixShareList.vue'
import UnregisterVmwareVmList from './VMwareUnregisterResources/UnregisterVmwareVmList.vue'
import UnregisterVsanIscsiList from './VMwareUnregisterResources/UnregisterVsanIscsiList.vue'
import UnregisterNetworkSwitchList from './NetworkUnregisterResources/UnregisterNetworkSwitchList.vue'
import UnregisterNetworkSecurityList from './NetworkUnregisterResources/UnregisterNetworkSecurityList.vue'

import GridModal from '@/components/Modal/GridModal/GridModal.vue'

import { getUnregistersVms, getUnregistersVolumeGroups, getUnregistersVrserver, getUnregistersCsvrserver, getUnregistersgroup, getUnregistersDatabase, getUnregisteredFileServerList } from '../SetProject/ResourceOperation/ResourceOperationGetAll'

export default {
  name: 'SetPrivateUnregisterResource',
  components: {
    GTab,
    UnregisterResourceExcelUpload,
    UnregisterNutanixVmList,
    UnregisterNutanixStorageList,
    UnregisterNutanixDatabaseList,
    UnregisterNutanixShareList,

    UnregisterVmwareVmList,
    UnregisterVsanIscsiList,

    UnregisterNetworkSwitchList,
    UnregisterNetworkSecurityList,
    GridModal
  },
  watch: {
    activeService: {
      immediate: true,
      async handler (newVal) {
        await this.init()
      }
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      moduleInfo: state => state.cloud.moduleInfo
    }),
    ...mapGetters({
      cloud: 'cloud/getCloud'
    }),
    activeServiceList () {
      return {
        COMPUTE: UnregisterNutanixVmList,
        STORAGE: UnregisterNutanixStorageList,
        DATABASE: UnregisterNutanixDatabaseList,
        FILE_SERVER: UnregisterNutanixShareList,
        VM: UnregisterVmwareVmList,
        VSAN_ISCSI: UnregisterVsanIscsiList,
        NETWORK_L4: UnregisterNetworkSwitchList,
        NETWORK_L7: UnregisterNetworkSwitchList,
        SECURITY: UnregisterNetworkSecurityList
      }[this.activeService]
    }
  },
  created () {
    this.getServiceList()
    this.$store.dispatch('metadata/getAllMetaDataForm')
  },
  methods: {
    async init () {
      await this.refreshRegistBasket() // 등록 장바구니 관련장바구니 조회
      await this.resetCurrentResourceData() // 자원 조회
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
        // 서비스 순서가 정렬된 Csp별 자원 목록
        const orderedResourceCsp = this.setServiceOrder(groupedByCsp)

        const steps = []
        const privateCsp = {
          nutanix: 'NUTANIX',
          vmware: 'VMWARE'
        }[this.cloud]

        orderedResourceCsp[privateCsp].forEach(item => {
          if (item.service === 'MARKET') return

          steps.push({
            field: item.service.toLowerCase(),
            service: item.service,
            name: this.serviceName[item.service]
          })
        })

        orderedResourceCsp.NETWORK.forEach(item => {
          steps.push({
            field: item.service.toLowerCase(),
            service: item.service,
            name: this.serviceName[item.service]
          })
        })

        const uniqServices = uniqBy(steps, 'service')
        this.tabData = uniqServices

        this.serviceList = uniqServices.map(s => s.service)

        // 최초 선택
        if (this.tabData?.length) {
          this.activeService = this.tabData[0].service
          this.activeServiceName = this.tabData[0].name
        }
      } catch (error) {
        console.error(error)
      } finally {
        this.loading.isGetWorkflow = false
      }
    },
    /**
     * 서비스 목록을 순서 정렬 (기반: Cloud.store > moduleInfo > .serviceResources)
     */
    setServiceOrder (groupedByCsp) {
      if (!isEmpty(this.moduleInfo)) {
        const moduleServices = {}
        for (const [key, value] of Object.entries(groupedByCsp)) {
          const basic = this.moduleInfo[key.toLowerCase()].serviceResources.map(({ id }) => ({
            module: key,
            service: id
          }))
          const serviceList = value.map(item => item.service)
          moduleServices[key] = basic.filter(item => serviceList.includes(item.service))
        }
        return moduleServices
      } else return groupedByCsp
    },
    /**
     * 현재 활성화 탭 자원의 미등록 자원을 조회합니다.
     */
    async resetCurrentResourceData (active = this.activeService) {
      if (!active) return
      try {
        this.loading.isGetUnregisterData = true

        const refreshing = {
          COMPUTE: async () => { return await getUnregistersVms() },
          STORAGE: async () => { return await getUnregistersVolumeGroups() },
          DATABASE: async () => { return await getUnregistersDatabase() },
          FILE_SERVER: async () => { return await getUnregisteredFileServerList() },

          VM: async () => { return await API.vmware.vm.getVmwareUnregisterVmList() },
          VSAN_ISCSI: async () => { return await API.vmware.vsan.getUnregisterVsanIscsiList() },

          NETWORK_L4: async () => { return await getUnregistersVrserver() },
          NETWORK_L7: async () => { return await getUnregistersCsvrserver() },
          SECURITY: async () => { return await getUnregistersgroup() }
        }
        const list = await refreshing[active]()
        this.allData[active] = list

        this.disableRow()
      } catch (error) {
        console.error(error)
      } finally {
        this.loading.isGetUnregisterData = false
      }
    },
    /**
     * 미등록 장바구니 관련 정보를 재조회 합니다.
     */
    async refreshRegistBasket () {
      await this.getUnregisterBasket() // 미등록 장바구니 자원 조회
      await this.getUnregisterBasketOtherUser() // 타 최고 관리자 계정의 미등록 장바구니 조회
      // await this.getUnregisterBasketCount() // 미등록 장바구니 count 조회
      // await this.getUnregisterBasketHistory() // 이관 히스토리 조회
    },
    /**
     * 이관 할 자원 체크 시, 발생 이벤트
     * @param {Array} checkedItems 체크 한 자원
     * @param {field} field 자원 분류 ('compute', 'storage', 'vrserver'(L4), 'csvrserver'(L7), 'security', 'database')
     */
    saveCheckedResource (checkedItems, field) {
      this.checkedResources[field] = [...checkedItems]

      console.log(field, ' @@체크된 친구들: ', this.checkedResources[field])

      this.isChangedSelectItem = true
    },
    /**
     * API : 미등록 장바구니 자원 조회
     */
    async getUnregisterBasket (userId = this.user.userId) {
      try {
        this.loading.isGetUnregisterResource = true
        let response = []
        response = await API.work_v3.getUnregisterBasket({ userId })

        if (response) {
          const flatData = response
            .filter(resource => this.serviceList.includes(resource.service))
            .map(row => {
              return {
                ...row.resourceData,
                resourceIdx: row.resourceIdx,
                service: row.service
              }
            })

          this.myBasketData = groupBy(flatData, 'service') // { COMPUTE: [...], DATABASE: [...], NETWORK_L4: [...] } 요런 형태
          this.myBasketData.all = flatData

          this.checkedResources = this.myBasketData

          console.log('## 내 자원바구니: ', this.myBasketData)
          this.$forceUpdate()
        }
      } catch (error) {
        console.error(error)
      } finally { this.loading.isGetUnregisterResource = false }
    },
    /**
     * API : 타 최고 관리자 계정의 미등록 장바구니 조회
     */
    async getUnregisterBasketOtherUser (userId = this.user.userId) {
      try {
        this.loading.isGetOtherUnregisterResource = true
        let response = []
        response = await API.work_v3.getUnregisterBasketOtherUser({ userId })

        if (response) {
          this.otherUserBasketData = groupBy(response, 'service') // { COMPUTE: [...], DATABASE: [...], NETWORK_L4: [...] } 요런 형태

          console.log('다른 최고 관리자: ', this.otherUserBasketData)
        }
      } catch (error) {
        console.error(error)
      } finally { this.loading.isGetOtherUnregisterResource = false }
    },
    // /**
    //  * API : 등록 장바구니 카운트 조회
    //  */
    // async getUnregisterBasketCount (userId = this.user.userId) {
    //   try {
    //     this.loading.isGetHistory = true
    //     const data = await API.work_v3.getUnregisterBasketCount({ userId })
    //     this.basketCount = data || 0
    //   } catch (error) { console.error(error) } finally { this.loading.isGetHistory = false }
    // },
    /**
     * API : 등록 장바구니 담기
     */
    async saveUnregisterBasket (data) {
      try {
        this.loading.isSavedTransResource = true

        const payload = data.map(item => {
          const { service, index, checked, ...rest } = item

          return {
            resourceData: { ...rest },
            resourceIdx: rest?.resourceIdx,
            resourceName: rest?.resourceName,
            service,
            userId: this.user.userId,
            createTime: +new Date()
          }
        })

        const params = {
          userId: this.user.userId,
          service: this.activeService
        }

        await API.work_v3.saveUnregisterBasket(payload, params)

        this.$confirm(this.$v('{count}개의 자원을<br>등록 장바구니에 저장했습니다.<br>지금 등록 장바구니로 이동하시겠습니까?<br><br><span style="color: #d95252;">* 확인 클릭 시 등록 장바구니 페이지로 이동합니다.</span>', { count: this.activeService === 'SECURITY' ? 1 : data.length }), '', {
          dangerouslyUseHTMLString: true
        }).then(() => {
          this.goToBasket()
        }).catch(async () => await this.init())
      } catch (error) {
        console.error(error)
        this.$alert('등록 장바구니 담기에 실패했습니다.<br>관리자 문의 부탁드립니다.', {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
      } finally { this.loading.isSavedTransResource = false }
    },
    /**
     * [등록 장바구니 담기] 클릭 시, 담을 자원 저장
     */
    async putInBasket (activeService = this.activeService) {
      if (!activeService) return

      // 선택 자원 갯수
      const count = this.checkedResources[activeService].length

      // 이관할 자원들
      let registerItems = this.checkedResources[activeService]

      // 장바구니 담기 alert 메세지
      let message = this.$v('{count}개 자원을<br>등록 장바구니에 담으시겠습니까?', { count })

      // *** 보안그룹의 경우, 임시 보안그룹 생성 후 장바구니에 담아야 함 ***
      if (activeService === 'SECURITY') {
        registerItems = [await this.setNewSecurityGroup()]

        message = this.$v('선택하신 {count}개의 정책이 하나의 보안 그룹 자원으로 생성됩니다.<br>등록 장바구니에 담으시겠습니까?', { count })
      }
      // *** ***

      console.log('@이관할 자원들: ', registerItems)
      this.$confirm(message, { dangerouslyUseHTMLString: true })
        .then(async () => {
          await this.saveUnregisterBasket(registerItems)
        }).catch(() => {
          return false
        })
    },
    /**
    * [등록 장바구니] 로 이동
    */
    goToBasket () {
      this.$router.push({
        name: 'unregister-resource-basket'
      })
    },
    /**
     *  타 최고 관리자 계정의 이관 장바구니 자원들을 disable 처리합니다.
     * @param {Array} data disable 처리 할 데이터
     */
    disableRow (data = this.allData[this.activeService]) {
      const service = this.activeService
      const uniqKey = {
        COMPUTE: 'vmUuid',
        STORAGE: 'vgUuid',
        DATABASE: 'databaseUuid',
        FILE_SERVER: 'shareUuid',
        VM: 'vmUuid',
        VSAN_ISCSI: 'vsanObjectUuid',
        NETWORK_L4: 'vrserverIdx',
        NETWORK_L7: 'csVrserverIdx',
        SECURITY: 'policyIdx'
      }[service]

      let resourceIdsInCart = []
      if (this.otherUserBasketData[service]) {
        resourceIdsInCart = this.otherUserBasketData[service].map(row => row.resourceIdx)
      }

      // 보안그룹: 내 장바구니 + 다른 장바구니에 담긴 정책 disable
      if (service === 'SECURITY') {
        const otherPolicyList = this.otherUserBasketData?.SECURITY?.length
          ? this.otherUserBasketData.SECURITY.map(item => item.policyList).flat()
          : []

        const myPolicyList = this.myBasketData?.SECURITY?.length
          ? this.myBasketData.SECURITY.map(item => item.policyList).flat()
          : []

        resourceIdsInCart = [...otherPolicyList, ...myPolicyList].map(p => p.policyIdx)
      }

      data = data.map(row => {
        this.$set(row, 'isSelectable', !resourceIdsInCart.includes(row[uniqKey]))
        return row
      })
    },
    /**
     * 방화벽 정책 등록 장바구니로 이관 시, 임시 보안그룹을 생성합니다.
     * 임시 자원이므로 resourceIdx 는 난수로 생성
     */
    setNewSecurityGroup (policyList = this.checkedResources.SECURITY) {
      const resourceData = {
        resourceIdx: v4(), // 난수 생성
        resourceName: '',
        securityGroupName: '',
        tempSecurityGroupName: this.$v('임시 보안그룹 명') + (this.myBasketData?.SECURITY ? this.myBasketData?.SECURITY.length + 1 : 1), // 임시 보안그룹 명
        service: 'SECURITY',
        policyList
      }
      return resourceData
    }
  },
  data: (root) => ({
    unregistExcelModal: false,
    tabData: [],
    activeService: '', // ['VM', 'VSAN_ISCSI', 'NETWORK_L4', 'NETWORK_L7', 'SECURITY]
    activeServiceName: '',
    basketCount: 0,

    // 미등록 자원 데이터
    allData: {
      COMPUTE: [],
      STORAGE: [],
      DATABASE: [],
      FILE_SERVER: [],

      VM: [],
      VSAN_ISCSI: [],

      NETWORK_L4: [],
      NETWORK_L7: [],
      SECURITY: []
    },

    // 체크한 자원
    checkedResources: {
      all: [], // 전체
      COMPUTE: [],
      STORAGE: [],
      DATABASE: [],
      FILE_SERVER: [],

      VM: [],
      VSAN_ISCSI: [],

      NETWORK_L4: [],
      NETWORK_L7: [],
      SECURITY: []
    },

    // 내 장바구니에 있는 자원
    myBasketData: {
      all: [], // 전체
      COMPUTE: [],
      STORAGE: [],
      DATABASE: [],
      FILE_SERVER: [],

      VM: [],
      VSAN_ISCSI: [],

      NETWORK_L4: [],
      NETWORK_L7: [],
      SECURITY: []
    },

    otherUserBasketData: [], // 다른 유저 이관 장바구니 내에 있는 모든 자원

    loading: {
      isGetWorkflow: false, // 현재 활성화 서비스 조회
      isGetUnregisterData: false,

      isGetHistory: false, // 미등록 장바구니 히스토리
      isGetUnregisterResource: false, // 미등록 장바구니 자원 조회
      isSavedTransResource: false, // 미등록 장바구니 자원 저장
      isGetOtherUnregisterResource: false // 타 최고 관리자 미등록 장바구니 자원 조회
    },
    capitalize (val) {
      if (!val) return ''
      return this.$options.filters.capitalize(val)
    },
    serviceList: [], // 선택 csp에서 볼 수 있는 service 목록
    serviceName: {
      COMPUTE: 'Compute',
      STORAGE: 'Storage',
      DATABASE: 'Database',
      FILE_SERVER: 'NAS (Files)',
      VM: 'Compute',
      VSAN_ISCSI: 'Storage',
      NETWORK_L4: 'Network L4',
      NETWORK_L7: 'Network L7',
      SECURITY: root.$v('보안그룹')
    }
  })
}
</script>

<style lang="scss" scoped>
.set-private-unregister-resource {
   position: relative;
  .header-regist-button {
    position: absolute;
    top: 7px;
    right: 0;
  }

  .unregister-resource-list {
    min-height: 500px;
    &::v-deep .cmp-grid-wrapper {
      div[wj-part="root"] {
        overflow: hidden !important;
        .wj-cell > div { white-space: nowrap !important; }
      }
    }
  }

  .change-common-form {
    overflow-y: auto;
    max-height: 65vh;
    &-contents:last-child {
      margin-top: $gap * 2;
    }
  }
}
</style>
