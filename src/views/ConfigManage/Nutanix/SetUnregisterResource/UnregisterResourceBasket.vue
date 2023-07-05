<!--
  * 파일명 : UnregisterResourceBasket.vue
  * 파일 기능 : Nutanix / VMware > 구성관리 > 미등록 자원 관리 > 미등록 자원 등록 장바구니
  * 작성자 : 김예담
  * License By Shinsegae I&C
 -->
<template>
  <div class="unregister-resource-trans-basket">
    <back-before-page class="before-page-btn" />

    <section
      class="resource-basket-contents"
      v-loading="loading.isGetServiceList
        || loading.isGetUnregisterBasket
        || loading.deleteResource
        || loading.runRegister"
      :element-loading-text="$v('데이터 로딩중\n잠시만 기다려 주십시오.')"
    >
      <h6 class="small-title">
        {{ $v('등록 예정 자원') }}
        &ensp;<small>({{ $v('총') }} {{ totalCount }}{{ $v('건') }})</small>
      </h6>

      <div
        class="empty-data resource-wrapper"
        v-if="!totalCount"
      >
        {{ $v('등록 예정 자원이 없습니다.') }}
      </div>

      <div
        class="resource-wrapper"
        v-if="basketData.COMPUTE && basketData.COMPUTE.length"
      >
        <unregister-nutanix-vm-list
          :data="basketData.COMPUTE"
          class="resource-grid"
          @updateSingleRow="item => updateSingleRow(item, 'COMPUTE', 'vmUuid')"
          @checkedRowsData="items => saveCheckedResource(items, 'COMPUTE')"
          @delete-row="row => deleteResourceFromBasket([row])"
          editable
        />
      </div>
      <!-- COMPUTE -->

      <div
        class="resource-wrapper"
        v-if="basketData.STORAGE && basketData.STORAGE.length"
      >
        <unregister-nutanix-storage-list
          :data="basketData.STORAGE"
          class="resource-grid"
          @updateSingleRow="item => updateSingleRow(item, 'STORAGE', 'vgUuid')"
          @checkedRowsData="items => saveCheckedResource(items, 'STORAGE')"
          @delete-row="row => deleteResourceFromBasket([row])"
          editable
        />
      </div>
      <!-- STORAGE -->

      <div
        class="resource-wrapper"
        v-if="basketData.DATABASE && basketData.DATABASE.length"
      >
        <unregister-nutanix-database-list
          :data="basketData.DATABASE"
          class="resource-grid"
          @updateSingleRow="item => updateSingleRow(item, 'DATABASE', 'databaseUuid')"
          @checkedRowsData="items => saveCheckedResource(items, 'DATABASE')"
          @delete-row="row => deleteResourceFromBasket([row])"
          editable
        />
      </div>
      <!-- DATABASE -->

      <div
        class="resource-wrapper"
        v-if="basketData.FILE_SERVER && basketData.FILE_SERVER.length"
      >
        <unregister-nutanix-share-list
          :data="basketData.FILE_SERVER"
          class="resource-grid"
          @updateSingleRow="item => updateSingleRow(item, 'FILE_SERVER', 'shareUuid')"
          @checkedRowsData="items => saveCheckedResource(items, 'FILE_SERVER')"
          @delete-row="row => deleteResourceFromBasket([row])"
          editable
        />
      </div>
      <!-- FILE_SERVER -->

      <div
        class="resource-wrapper"
        v-if="basketData.VM && basketData.VM.length"
      >
        <unregister-vmware-vm-list
          :data="basketData.VM"
          class="resource-grid"
          @updateSingleRow="item => updateSingleRow(item, 'VM', 'vmUuid')"
          @checkedRowsData="items => saveCheckedResource(items, 'VM')"
          @delete-row="row => deleteResourceFromBasket([row])"
          editable
        />
      </div>
      <!-- VM -->

      <div
        class="resource-wrapper"
        v-if="basketData.VSAN_ISCSI && basketData.VSAN_ISCSI.length"
      >
        <unregister-vsan-iscsi-list
          :data="basketData.VSAN_ISCSI"
          class="resource-grid"
          @updateSingleRow="item => updateSingleRow(item, 'VSAN_ISCSI', 'vsanObjectUuid')"
          @checkedRowsData="items => saveCheckedResource(items, 'VSAN_ISCSI')"
          @delete-row="row => deleteResourceFromBasket([row])"
          editable
        />
      </div>
      <!-- VSAN_ISCSI -->

      <div
        class="resource-wrapper"
        v-if="basketData.NETWORK_L4 && basketData.NETWORK_L4.length"
      >
        <unregister-network-switch-list
          :data="basketData.NETWORK_L4"
          switch-type="L4"
          class="resource-grid"
          @updateSingleRow="item => updateSingleRow(item, 'NETWORK_L4', 'vrserverIdx')"
          @checkedRowsData="items => saveCheckedResource(items, 'NETWORK_L4')"
          @delete-row="row => deleteResourceFromBasket([row])"
          editable
        />
      </div>
      <!-- NETWORK L4 -->

      <div
        class="resource-wrapper"
        v-if="basketData.NETWORK_L7 && basketData.NETWORK_L7.length"
      >
        <unregister-network-switch-list
          :data="basketData.NETWORK_L7"
          switch-type="L7"
          class="resource-grid"
          @updateSingleRow="item => updateSingleRow(item, 'NETWORK_L7', 'csVrserverIdx')"
          @checkedRowsData="items => saveCheckedResource(items, 'NETWORK_L7')"
          @delete-row="row => deleteResourceFromBasket([row])"
          editable
        />
      </div>
      <!-- NETWORK L7 -->

      <div
        class="resource-wrapper"
        v-if="basketData.SECURITY && basketData.SECURITY.length"
      >
        <unregister-network-security-list
          :data="basketData.SECURITY"
          class="resource-grid"
          @updateSingleRow="item => updateSingleRow(item, 'SECURITY', 'resourceIdx')"
          @checkedRowsData="items => saveCheckedResource(items, 'SECURITY')"
          @delete-row="row => deleteResourceFromBasket([row])"
          editable
        />
      </div>

      <div
        class="button-area -center"
        v-if="totalCount"
      >
        <button
          class="button -delete-button"
          :disabled="!checkedResources.all.length"
          @click="deleteResourceFromBasket(checkedResources.all)"
        >
          <i class="delete-icon -not-hoverable" />
          <b>{{ checkedResources.all.length }}</b>
          {{ $v('건') }}
          &nbsp;
          {{ $v('장바구니에서 삭제') }}
        </button>
        <button
          class="button -expand-button"
          type="is-primary"
          :disabled="!checkedResources.all.length"
          @click="confirmRegister"
        >
          <b>{{ checkedResources.all.length }}</b>
          {{ $v('건') }}
          &nbsp;
          {{ $v('자원') }}&nbsp;{{ $v('등록') }}
        </button>
      </div>
    </section>
    <!-- 이관 예정 작업 -->
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
import { mapState, mapGetters } from 'vuex'
import { groupBy, mapValues } from 'lodash'
import dayjs from 'dayjs'
import BackBeforePage from '@/components/BackBeforePage/BackBeforePage'

import UnregisterNutanixVmList from './NutanixUnregisterResources/UnregisterNutanixVmList.vue'
import UnregisterNutanixStorageList from './NutanixUnregisterResources/UnregisterNutanixStorageList.vue'
import UnregisterNutanixDatabaseList from './NutanixUnregisterResources/UnregisterNutanixDatabaseList.vue'
import UnregisterNutanixShareList from './NutanixUnregisterResources/UnregisterNutanixShareList.vue'

import UnregisterVmwareVmList from './VMwareUnregisterResources/UnregisterVmwareVmList.vue'
import UnregisterVsanIscsiList from './VMwareUnregisterResources/UnregisterVsanIscsiList.vue'

import UnregisterNetworkSwitchList from './NetworkUnregisterResources/UnregisterNetworkSwitchList.vue'
import UnregisterNetworkSecurityList from './NetworkUnregisterResources/UnregisterNetworkSecurityList.vue'

export default {
  name: 'UnregisterResourceBasket',
  components: {
    BackBeforePage,
    UnregisterNutanixVmList,
    UnregisterNutanixStorageList,
    UnregisterNutanixDatabaseList,
    UnregisterNutanixShareList,
    UnregisterVmwareVmList,
    UnregisterVsanIscsiList,
    UnregisterNetworkSwitchList,
    UnregisterNetworkSecurityList
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    }),
    ...mapGetters({
      cloud: 'cloud/getCloud'
    })
  },
  beforeRouteLeave (to, from, next) {
    this.$confirm(this.$v('페이지를 이동하면 임시 저장된 데이터가 모두 초기화됩니다.<br>그래도 이동하시겠습니까?'), { dangerouslyUseHTMLString: true })
      .then(() => next())
      .catch(() => false)
  },
  async created () {
    await this.getServiceList()
    this.$store.dispatch('metadata/getAllMetaDataForm')

    this.init()
  },
  methods: {
    init () {
      Promise.all([
        this.getUnregisterBasket()
        // this.getUnregisterBasketCount() // 미등록 장바구니 count 조회
      ])
    },
    /**
     * 현 라이센스 버전에 포함되는 서비스 조회
     */
    async getServiceList () {
      try {
        this.loading.isGetServiceList = true
        const serviceList = []
        const services = await API.work_v3.getVersionServiceList()

        const moduleType = {
          nutanix: 'NUTANIX',
          vmware: 'VMWARE'
        }[this.cloud]

        services.forEach(item => {
          if (item.module === 'AWS' || item.service === 'MARKET') return // 마켓은 COMPUTE에 포함

          if (item.module === moduleType || item.module === 'NETWORK') serviceList.push(item.service)
        })

        this.serviceList = serviceList
      } catch (error) {
        console.error(error)
      } finally {
        this.loading.isGetServiceList = false
      }
    },
    /**
     * 이관 장바구니에서 자원 제거
     * @param {Array} items 제거할 자원들 정보
     */
    deleteResourceFromBasket (items) {
      if (!items?.length) return

      this.$confirm(this.$v('해당 항목을 등록 장바구니에서<br>삭제하시겠습니까?'), { dangerouslyUseHTMLString: true })
        .then(async () => {
          const resourceIdArr = []
          const serviceArr = []
          items.forEach(row => {
            resourceIdArr.push(row.resourceIdx || row.resourceData.csVrserverIdx)
            if (!serviceArr.includes(row.service))serviceArr.push(row.service)
          })

          const resourceIdxList = resourceIdArr?.join(',')
          const serviceList = serviceArr?.join(',')

          const payload = {
            resourceIdxList,
            serviceList,
            userId: this.user.userId
          }
          const result = await this.deleteUnregisterBasket(payload)
          if (result) {
            this.$alert(this.$v('삭제되었습니다.'), () => false)
            // await this.init()
            await this.resetCheckedItems()
            this.removeDeletedItemsFromBasket(items)
            this.removeDeletedItemsFromChecked(items)
          } else {
            this.$alert(this.$v('삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.'), {
              dangerouslyUseHTMLString: true,
              callback: () => false
            })
          }
        }).catch(() => {
          return false
        })
    },
    /**
     * 등록 장바구니에서 삭제된 자원을 제거합니다. (API 재조회하면 임시 저장한 데이터가 다 날라가서 이렇게 처리 ㅠㅠ)
     */
    removeDeletedItemsFromBasket (resources) {
      resources.forEach(row => {
        if (!row.service) return

        const arr = this.basketData[row.service]
        const afterArr = arr.filter(item => `${item.resourceIdx}` !== `${row.resourceIdx}`)

        this.basketData[row.service] = afterArr
      })
    },
    /**
     * 체크된 항목 중에서 삭제된 자원을 제거합니다.
     */
    removeDeletedItemsFromChecked (resources) {
      resources.forEach(row => {
        if (!row.service) return

        const arr = this.checkedResources[row.service]
        const afterArr = arr.filter(item => item.resourceIdx !== row.resourceIdx)

        this.saveCheckedResource(afterArr, row.service)
      })
    },
    /**
     * 자원 체크 시, 발생 이벤트
     * @param {Array} checkedItems 체크 한 자원
     * @param {field} field 자원 분류 ('COMPUTE', 'STORAGE', 'DATABASE', 'NETWORK_L4', ...)
     */
    saveCheckedResource (checkedItems, field) {
      this.checkedResources[field] = [...checkedItems]

      this.checkedResources.all = []
      const allItems = Object.values(this.checkedResources).flat()
      this.checkedResources.all = [...allItems] // 자원에 상관 없이 한 배열에 넣어줌
    },
    /**
     * API : 미등록 장바구니 자원 조회
     */
    async getUnregisterBasket (userId = this.user.userId) {
      try {
        this.loading.isGetUnregisterBasket = true
        let response = []
        response = await API.work_v3.getUnregisterBasket({ userId })

        this.setUnregisterBasketByService(response)
      } catch (error) {
        console.error(error)
      } finally { this.loading.isGetUnregisterBasket = false }
    },
    /**
     * 등록장바구니 데이터를 서비스 별로 세팅합니다.
     */
    setUnregisterBasketByService (data) {
      if (!data) return
      const flatData = data
        .filter(resource => this.serviceList.includes(resource.service))
        .map(row => {
          return {
            ...row.resourceData,
            isUrgent: true,
            resourceIdx: row.resourceIdx,
            service: row.service,
            idx: row.idx
          }
        })

      this.totalCount = flatData.length

      this.basketData = groupBy(flatData, 'service') // { VM: [...], VSAN_ISCS: [...], NETWORK_L4: [...] } 요런 형태
    },
    // /**
    //  * API : 미등록 장바구니 카운트 조회
    //  */
    // async getUnregisterBasketCount (userId = this.user.userId) {
    //   try {
    //     this.loading.isGetItemCount = true
    //     const data = await API.work_v3.getUnregisterBasketCount({ userId })

    //     this.totalCount = data || 0
    //   } catch (error) { console.error(error) } finally { this.loading.isGetItemCount = false }
    // },
    /**
     * API : 이관 장바구니에서 자원 삭제
     */
    async deleteUnregisterBasket (params) {
      try {
        this.loading.deleteResource = true

        const result = await API.work_v3.deleteUnregisterBasket(params)
        return result
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('등록 장바구니에서 삭제 실패했습니다.<br>관리자에게 문의하세요.'), {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
      } finally {
        this.loading.deleteResource = false
      }
    },
    /**
     * [자원 등록 작업 실행] 버튼 실행 이벤트
     */
    async confirmRegister () {
      const payload = await this.setRunPayload()
      if (!payload) return
      console.log('@@@ payload :: ', payload)

      if (payload) {
        this.$confirm(this.$v('{count}개 자원을 등록하는 작업을 실행하시겠습니까?', { count: this.checkedResources.all.length })
        )
          .then(async () => { // 6개 자원을 이관하시겠습니까?
            try {
              this.loading.runRegister = true

              const response = await API.work_v3.excuteUnregisterBasket(payload, { userId: this.user.userId })

              if (response) {
                const failItems = response.failRes

                const allCheckedLeng = this.checkedResources.all.length // 이관 장바구니에서 선택한 자원 갯수
                const successItmLeng = failItems?.length
                  ? allCheckedLeng - failItems.length
                  : allCheckedLeng // 성공한 자원 갯수

                // 전체 다 성공했을 때
                const successMsg = this.$v('{count}개 자원이 성공적으로 등록되었습니다.', {
                  count: successItmLeng
                })

                let message = successMsg

                // 성공 자원 / 실패 자원 다 있을 때
                if (failItems?.length) message += `<br>(${this.$t('common.fail')}: ${failItems.length} EA)` // 실패: ...

                // 전체 다 실패했을 때
                if (!successItmLeng) {
                  message = this.$v('{count}개 자원 등록을 실패했습니다.', {
                    count: allCheckedLeng
                  })
                } // `${allCheckedLeng}개 자원 이관을 실패했습니다.`

                this.$alert(message, { dangerouslyUseHTMLString: true })
                if (successItmLeng === allCheckedLeng) {
                  await this.init()
                  await this.resetCheckedItems()
                }
              } else {
                this.$alert(this.$v('자원 등록을 실패했습니다.<br>관리자에게 문의하세요.'), {
                  dangerouslyUseHTMLString: true,
                  callback: () => false

                })
              }
            } catch (error) {
              console.error(error)
              this.$alert(this.$v('자원 등록을 실패했습니다.<br>관리자에게 문의하세요.'), {
                dangerouslyUseHTMLString: true,
                callback: () => false

              })
            } finally {
              this.loading.runRegister = false
            }
          }).catch(() => false)
      }
    },
    /**
     * 자원 이관 requestBody 정보 세팅
     */
    setRunPayload (data = this.checkedResources.all) {
      let payload = []

      for (let i = 0; i < data.length; i++) {
        const item = data[i]

        const resultInfo = Object.assign(item, {
          ...item,
          createUserId: item.createUserId || this.user.userId,
          createUserName: item.createUserName || this.user.userName,
          updateUserId: item.updateUserId || this.user.userId,
          updateUserName: item.updateUserName || this.user.userName
        })

        // 필수 validation ***************************
        if (
          resultInfo.service === 'VM' &&
          resultInfo.projectId &&
          resultInfo.imageId &&
          !resultInfo?.networkList.every(net => !!net.cateIdx)
        ) {
          this.$alert(`네트워크 > 네트워크 카테고리 정보가 필요합니다.<br><br>* 서비스: Compute<br>* 자원 명: ${resultInfo.resourceName}`, {
            dangerouslyUseHTMLString: true,
            callback: () => false
          })
          payload = undefined
          return false
        } else if (
          resultInfo.service === 'COMPUTE' &&
          !resultInfo.nicIps?.length &&
          !resultInfo?.networkIp
        ) {
          this.$alert(`IP 정보가 필요합니다.<br><br>* 서비스: Compute<br>* 자원 명: ${resultInfo.resourceName}`, {
            dangerouslyUseHTMLString: true,
            callback: () => false
          })
          payload = undefined
          return false
        } else {
          let noDataRow
          if (resultInfo.requiredColumnArr?.length) {
            noDataRow = resultInfo.requiredColumnArr.find(col => !resultInfo[col.binding] || resultInfo[col.binding]?.data === null)
          }
          if (noDataRow) {
            this.$alert(`${noDataRow.header} 정보가 필요합니다.<br><br>* 서비스: ${this.serviceName[resultInfo.service]}<br>* 자원 명: ${resultInfo.resourceName}`, {
              dangerouslyUseHTMLString: true,
              callback: () => false
            })
            payload = undefined
            return false
          }
        }
        // ******************************************

        const {
          // [공통]
          idx,
          isUrgent,
          chargeDate: resourceChargeDate,
          projectName,
          projectIdx,
          projectId,
          cateIdx,
          cateId,
          ipCategoryIdx,
          service,
          resourceName,
          resourceIdx,
          metaInfo,
          tagInfo,

          // [COMPUTE + VM]
          vmUuid,
          imageId,
          installProgramList,
          licenseList,
          manageGroupIdx,
          hostname,
          // [only VM]
          // networkAdapterList,
          networkList,

          // [STORAGE]
          vgUuid,
          storageName,

          // [DATABASE]
          databaseUuid,
          databaseName,

          // [FILE_SERVER]
          shareUuid,
          shareName,

          // [VSAN_ISCSI]
          connectName,
          connectIdx,
          clusterName,
          clusterId,
          alias,

          // [L4 + L7]
          resourceId,
          vrserverName,
          csVrserverName,
          companyIdx,
          groupIdx,

          // [SECURITY]
          securityGroupName,
          comment,
          policyIdxs
          //  companyIdx,
          // groupIdx,
          // ipCategoryIdx,
        } = resultInfo

        const chargeDate = dayjs(resourceChargeDate).toISOString()

        const resourceOtherData = {
          COMPUTE: {
            vmUuid,
            vmName: hostname,
            imageId,
            installProgramList: installProgramList?.map(p => p.versionId),
            licenseSwIdxList: licenseList?.map(p => p.swIdx),
            manageGroupIdx
          },
          STORAGE: {
            vgUuid,
            storageName,
            manageGroupIdx
          },
          DATABASE: {
            databaseUuid,
            databaseName,
            // projectIdx,
            installProgramList: installProgramList?.map(p => p.versionId),
            licenseSwIdxList: licenseList?.map(p => p.swIdx),
            // cateId,
            // chargeDate,
            manageGroupIdx
            // isUrgent
          },
          FILE_SERVER: {
            shareUuid,
            shareName
            // projectIdx,
            // cateId,
            // chargeDate,
            // isUrgent
          },
          VM: {
            vmUuid,
            vmName: hostname,
            // projectId,
            imageId,
            installProgramList: installProgramList?.map(p => p.versionId),
            licenseSwIdxList: licenseList?.map(p => p.swIdx),
            networkList: networkList?.map(({ name, unitNumber, cateIdx }) => ({ name, unitNumber, cateIdx })),
            // chargeDate,
            manageGroupIdx
            // isUrgent
          },
          VSAN_ISCSI: {
            connectName,
            connectIdx,
            clusterName,
            clusterId,
            alias,
            // projectIdx,
            // cateIdx,
            // chargeDate,
            manageGroupIdx
            // isUrgent
          },
          NETWORK_L4: {
            resourceId: resourceIdx,
            vrserverName,
            companyIdx,
            groupIdx
            // projectIdx,
            // ipCategoryIdx: ,
            // isUrgent,
            // chargeDate
          },
          NETWORK_L7: {
            resourceId: resourceIdx,
            csVrserverName,
            companyIdx,
            groupIdx
            // projectIdx,
            // ipCategoryIdx,
            // isUrgent,
            // chargeDate
          },
          SECURITY: {
            securityGroupName,
            companyIdx,
            groupIdx,
            // projectIdx,
            // ipCategoryIdx,
            comment,
            // isUrgent,
            // chargeDate,
            policyIdxs
          }
        }[resultInfo.service]

        const resourceCommonData = {
          idx,
          isUrgent,
          chargeDate,
          service,
          resourceName,
          projectName,
          metaInfo: metaInfo || '',
          tagInfo,
          // 프로젝트 IDX
          ...(projectId && { projectId }),
          ...(projectIdx && { projectIdx }), // compute, vm

          // 네트워크 카테고리 IDX
          ...(cateIdx && { cateIdx }),
          ...(cateId && { cateId }), // database, file_server
          ...(ipCategoryIdx && { ipCategoryIdx }), // L4, L7, 보안그룹

          // resource Id
          ...(resourceId && { resourceId }), // L4, L7
          ...(resourceIdx && { resourceIdx })
        }

        const resourceData = {
          ...resourceCommonData,
          ...resourceOtherData
        }

        console.log('%c * basketData 가공 전 :: ', 'color: yellow', resultInfo)

        const basketData = {
          COMPUTE: this.getComputeBasketData(resultInfo),
          STORAGE: this.getStorageBasketData(resultInfo),
          DATABASE: this.getDatabaseBasketData(resultInfo),
          FILE_SERVER: undefined,
          VM: this.getVmBasketData(resultInfo),
          VSAN_ISCSI: this.getVsanIscsiBasketData(resultInfo),
          NETWORK_L4: undefined,
          NETWORK_L7: undefined,
          SECURITY: undefined
        }[resultInfo.service]

        console.log('%c * basketData 가공 후 ===> ', 'color: #a4f644; background-color: purple;', basketData)

        payload.push({
          idx: resourceData?.idx,
          endPointIdx: resourceData?.projectIdx || resourceData?.projectId,
          endPointName: resourceData?.projectName,
          isUrgent: !!resourceData.isUrgent,
          resourceData, // 미등록 등록용
          basketData, // 장바구니용
          resourceIdx: resourceData.resourceIdx || resourceData.resourceId,
          resourceName: resourceData.resourceName,
          service: resourceData.service,
          success: true,
          urgent: !!resourceData.isUrgent,
          userId: this.user.userId
        })
      }

      return payload
    },
    /**
     * [Compute] 자원 이관 시 resourceData 가공 => 구성관리에서 보내는 데이터 형식으로 맞춘다.
     */
    getComputeBasketData (info) {
      const {
        companyIdx, companyName, groupIdx, groupName, projectId, projectName,
        externalDiskList: externalDisks,
        hostname,
        memory, rootDiskSize, numVcpus, numSockets,
        networkList: networkCateList,
        selectImage, imageId, osBit, osName, osType, osVersion, osSystem,
        installProgramList,
        licenseList,
        manageGroupIdx,
        vmUuid,

        clusterUuid, nicIps,
        tagInfo,
        metaInfo,
        chargeDate
      } = info
      return {
        beforePrice: 0,
        price: 0,
        ownerCompanyId: companyIdx,
        ownerCompanyName: companyName,
        companyId: companyIdx,
        companyName,
        groupId: groupIdx,
        groupName,
        projectId,
        projectName,
        externalDiskList: externalDisks?.length
          ? externalDisks.map(disk => ({
            ...disk,
            size: disk?.sizeGb || 0,
            diskSize: disk?.sizeGb || 0
          }))
          : [],
        hostname,

        memory,
        rootDiskSize,
        vcpu: numVcpus,
        socket: numSockets,
        osBit,
        osName,
        osType,
        osVersion,
        osSystem,
        reqUserId: this.user.userId,

        networkList: (networkCateList?.length && nicIps?.length)
          ? nicIps.map(nic => {
            const { cateCode, cateId, cateKey, cateName } = networkCateList[0]
            return {
              ...nic,
              clusterUuid,
              cateCode,
              cateId,
              cateKey,
              cateName
            }
          })
          : (networkCateList?.length ? networkCateList : []),

        vmUuid,
        vmName: hostname,
        imageId,
        installProgramList,
        licenseList,
        manageGroupIdx,

        // 진짜 필요한 지?
        cateKey: networkCateList?.length ? networkCateList[0].cateKey : '',

        imageName: osName,
        imageDescription: selectImage?.osDesc,

        tagInfo,
        metaInfo,
        chargeDate
        // 줄 수 없는 데이터, IP가 여러개인 경우, subnetUuid도 여러개로 들어갈 수 있다. vlanId 정보는... 없음
        // subnetName,
        // subnetUuid,
        // vlanId,

      }
    },
    /**
     * [Storage] 자원 이관 시 resourceData 가공 => 구성관리에서 보내는 데이터 형식으로 맞춘다.
     */
    getStorageBasketData (info) {
      const {
        vgUuid,
        companyIdx, companyName, groupIdx, groupName, projectId, projectName,
        disks, clusterUuid,
        vgName, vgDesc,
        isShared,
        attachments,
        manageGroupIdx,
        chargeDate,
        tagInfo,
        metaInfo
      } = info
      return {
        beforePrice: 0,
        price: 0,
        vgUuid,
        ownerCompanyId: companyIdx,
        ownerCompanyName: companyName,
        companyId: companyIdx,
        companyName,
        groupId: groupIdx,
        groupName,
        projectId,
        projectName,
        storageName: vgName,
        storageDesc: vgDesc,
        vgName,
        vgDesc,

        chargeVmUuid: attachments?.length ? attachments[0].vmUuid : '',
        clusterUuid,
        diskList: disks,
        // elementIdx, 이거는 정보가 없넴
        isShared,
        reqUserId: this.user.userId,
        userId: this.user.userId,
        vmList: attachments,
        manageGroupIdx,
        tagInfo,
        metaInfo,
        chargeDate
      }
    },
    /**
     * [Database] 자원 이관 시 resourceData 가공 => 구성관리에서 보내는 데이터 형식으로 맞춘다.
     */
    getDatabaseBasketData (info) {
      const {
        databaseUuid,
        companyIdx, companyName, groupIdx, groupName, projectIdx, projectName,
        networkList,

        eraDbInfo, // DB 정보
        eraDbServerInfo, // DB 서버 정보
        port,

        installProgramList,
        licenseList,
        manageGroupIdx,
        chargeDate,
        tagInfo,
        metaInfo
      } = info
      return {
        beforePrice: 0,
        price: 0,
        databaseUuid,
        ownerCompanyId: companyIdx,
        ownerCompanyName: companyName,
        companyId: companyIdx,
        companyName,
        groupId: groupIdx,
        groupName,
        projectId: projectIdx,
        projectName,
        networkList,

        databaseName: eraDbInfo?.databaseName,
        engineType: eraDbInfo?.engineType,
        initialDbName: eraDbInfo?.initialDbName,
        hostname: eraDbServerInfo?.dbserverName,
        imageUuid: eraDbServerInfo?.swProfileUuid,
        imageVersionUuid: eraDbServerInfo?.swProfileVersionUuid,
        profileUuid: eraDbServerInfo?.computeProfileUuid,
        port,
        vcpu: eraDbServerInfo?.numVcpu,
        memory: this.$options.filters.byteToGb(eraDbServerInfo?.memoryByte || 0),

        installProgramList,
        licenseList,
        reqUserId: this.user.userId,
        userId: this.user.userId,
        manageGroupIdx,
        tagInfo,
        metaInfo,
        chargeDate

        // 줄 수 없는 정보
        // dbId, dbPassword, dbParameterId,
        // imageId, projectId
      }
    },
    /**
     * [VM] 자원 이관 시 resourceData 가공 => 구성관리에서 보내는 데이터 형식으로 맞춘다.
     */
    getVmBasketData (info) {
      const {
        vmUuid,
        companyIdx, companyName, groupIdx, groupName, projectId, projectName,
        hostname,

        hostUuid,
        scsiControllerList,
        externalDiskList,
        imageId,
        installProgramList,
        licenseList,
        networkList,
        // datastoreId, => 정보가 없넹

        cpuCores, socket, memorySizeGB,
        rootDiskSize,

        manageGroupIdx,
        tagInfo,
        metaInfo,
        chargeDate
      } = info
      return {
        vmUuid,
        companyIdx,
        companyName,
        groupIdx,
        groupName,
        projectIdx: projectId,
        projectName,
        reqUserId: this.user.userId,
        userId: this.user.userId,
        hostname,
        hostUuid,
        scsiControllerList,
        externalDiskList,
        imageId,
        installProgramList,
        licenseList,
        networkList,

        manageGroupIdx,
        tagInfo,
        metaInfo,
        chargeDate,

        beforePrice: 0,
        price: 0,
        vcpu: cpuCores,
        memory: memorySizeGB,
        socket,
        rootDiskSize

        // datastoreId,
      }
    },
    /**
     * [VSAN_ISCSI] 자원 이관 시 resourceData 가공 => 구성관리에서 보내는 데이터 형식으로 맞춘다.
     */
    getVsanIscsiBasketData (info) {
      const {
        vsanObjectUuid,
        companyIdx, companyName, groupIdx, groupName, projectIdx, projectName,

        alias,
        authSpecAutoType,
        authSpecUserNameAttachToTarget: userNameAttachToTarget,
        authSpecUserSecretAttachToTarget: userSecretAttachToTarget,
        authSpecUserNameAttachToInitiator: userNameAttachToInitiator, authSpecUserSecretAttachToInitiator: userSecretAttachToInitiator,
        cateIdx,
        port,
        clusterId, connectIdx,
        iqn,
        lunList,
        initiatorList,
        networkInterface,
        spbmProfileName, spbmProfileUuid,

        networkCateInfo,

        manageGroupIdx,
        tagInfo,
        metaInfo,
        chargeDate
      } = info
      return {
        vsanObjectUuid,
        companyIdx,
        companyName,
        groupIdx,
        groupName,
        projectIdx,
        projectName,
        reqUserId: this.user.userId,
        userId: this.user.userId,

        alias,
        authType: {
          authentication: authSpecAutoType,
          ...(['CHAP', 'MUTUAL_CHAP'].includes(authSpecAutoType) && {
            userNameAttachToTarget, // 수신 CHAP 사용자
            ...(userSecretAttachToTarget && { userSecretAttachToTarget }), // 수신 CHAP 암호
            ...(authSpecAutoType === 'MUTUAL_CHAP' && {
              userNameAttachToInitiator, // 송신 CHAP 사용자
              ...(userSecretAttachToInitiator && { userSecretAttachToInitiator }) // 송신 CHAP 암호
            })
          })
        },
        cateIdx,
        tcpPort: port,
        clusterId,
        connectIdx,
        iqn,
        lunList,
        initiatorList,
        network: networkInterface,
        spbmProfileName,
        spbmProfileUuid,

        networkList: [networkCateInfo],

        beforePrice: 0,
        price: 0,
        manageGroupIdx,
        tagInfo,
        metaInfo,
        chargeDate
      }
    },
    /**
     * 전체 체크했던 row 리셋시킵니다.
     */
    resetCheckedItems () {
      this.checkedResources = mapValues(this.checkedResources, () => [])
    },
    /**
     * check하지 않은 자원을 단일 업데이트 했을 경우
     */
    updateSingleRow (updatedData, service, uuidKey) {
      if (!updatedData || !service || !uuidKey) return
      for (let i = 0; i < this.basketData[service].length; i++) {
        const item = this.basketData[service][i]
        if (item[uuidKey] === updatedData[uuidKey]) {
          this.basketData[service][i] = updatedData
          break
        }
      }
    }
  },
  data: (root) => ({
    basketData: {
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
      all: [],
      COMPUTE: [],
      STORAGE: [],
      DATABASE: [],
      FILE_SERVER: [],

      VM: [],
      VSAN_ISCSI: [],

      NETWORK_L4: [],
      NETWORK_L7: [],
      SECURITYL: []
    },

    totalCount: 0,

    loading: {
      isGetServiceList: false, // 서비스 목록 조회
      isGetUnregisterBasket: false, // 장바구니 조회
      isGetItemCount: false, // 장바구니에 담긴 자원 갯수
      runRegister: false,
      deleteResource: false // 장바구니에서 삭제
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
.before-page-btn { display: inline-block; }
.resource-basket-contents {
  margin-top: $gap;
  min-height: 800px;
  .resource-wrapper {
    margin-bottom: 60px;
  }
  .button-area { // 자원 이관 버튼 영역
    position: sticky;
    bottom: 0;
    padding: 45px 0;
    background-color: rgba(31, 30, 50, 0.7);
    .-delete-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 25%;
      height: 60px;
      .delete-icon {
        margin-right: $gap-s;
      }
    }
    .-expand-button {
      width: 75%;
      height: 60px;
    }
  }

  .resource-grid::v-deep {
    .basket-title-wrap {
      align-items: center;
      gap: $gap;
      height: 32px;
      > span {
        margin: 0;
      }
    }
    .cmp-grid-wrapper.unregister-resource-grid {
      div[wj-part="root"] {
        overflow: hidden !important;
        .wj-cell > div { white-space: nowrap !important; }
      }
      &:not(.-storage):not(.-file-server) .cmp-grid-inner {
        overflow: auto;
        max-width: 100%;
        #cmpGrid {
          width: 110% !important;
        }
      }
    }
  }
}
</style>
