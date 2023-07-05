<template>
  <div
    v-loading="updating"
    class="billing-model-detail"
  >
    <dashboard-panel
      class="billing-panel left"
      :title="$t('bill.MODEL.modelName')"
      :padding-top="0"
    >
      <template #header>
        <div class="header-button-area">
          <button
            class="button"
            type="is-primary"
            @click="activeFetchModal = !activeFetchModal"
          >
            {{ $t('bill.MODEL.loadModel') }}
          </button>
        </div>
      </template>

      <template #headerPostfix>
        <span
          class="postfix"
          @click="resetModel"
        >
          <i class="mdi mdi-refresh" />
          <span>{{ $t('common.BTN.reset') }}</span>
        </span>
      </template>

      <div class="model-create-body">
        <div class="input-wrap">
          <el-input
            v-if="modelGroup"
            v-model="modelGroup.name"
            class="model-input"
            :placeholder="$t('bill.MODEL.PLACEHOLDER.enterModelName')"
          />
        </div>
        <div
          class="button-wrap"
          style="display: flex;"
        >
          <button
            class="button"
            type="is-anti"
            size="is-large"
            @click="cancelDetail"
          >
            {{ $t('common.BTN.cancel') }}
          </button>
          <button
            v-if="!isEdit"
            v-loading="enrollLoading"
            :disabled="enrollLoading"
            class="button"
            type="is-primary"
            size="is-large"
            @click="enrollModelGroup"
          >
            {{ $t('bill.MODEL.enrollModel') }}
          </button>
          <button
            v-else
            class="button"
            type="is-primary"
            size="is-large"
            @click="applyModelGroup"
          >
            {{ $t('common.BTN.apply') }}
          </button>
        </div>
        <div class="model-lists">
          <billing-model
            v-if="modelGroup && modelGroup.models"
            ref="billingModel"
            :model-data="modelGroup"
            is-edit
            is-detail
            is-apply-model
            @active-model="activeModel"
            @active-children-model="activeChildrenModel"
            @delete-model="deleteModel"
          />
          <div class="add-model-wrap">
            <div
              v-if="activeAddAff"
              class="add-aff"
            >
              <el-select v-model="affValue">
                <el-option
                  v-for="(value, key) in affMap"
                  :key="key"
                  :value="key"
                  :label="value.groupName"
                />
              </el-select>
              <div class="add-button">
                <button
                  class="button"
                  type="is-primary"
                  @click="addAff"
                >
                  {{ $t('common.BTN.enroll') }}
                </button>
              </div>
              <div
                class="close-icon"
                @click="closeAddAff"
              >
                <i class="el-icon el-icon-close" />
              </div>
            </div>
            <div
              v-loading="affLoading"
              class="add-model-card"
              @click="addAffModel"
            >
              <i class="el-icon el-icon-circle-plus-outline" />
              <span>
                {{ $t('bill.MODEL.addAffModel') }}
              </span>
            </div>
            <div
              v-if="!isCommonResModel"
              class="add-model-card"
              @click="addCommonResModel"
            >
              <i class="el-icon el-icon-circle-plus-outline" />
              <span>
                {{ $t('bill.MODEL.addCommonModel') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </dashboard-panel>
    <dashboard-panel
      class="billing-panel right"
      :title="modelTypeMap[activeModelObj && activeModelObj.type]"
      :padding-top="30"
    >
      <template #headerPostfix>
        <div
          v-if="activeModelObj && activeModelObj.companyName"
          class="aff-postfix"
        >
          <i class="el-icon el-icon-arrow-right" />
          <span class="aff-name">{{ activeModelObj.companyName }}</span>
        </div>
        <span class="standard-info">
          {{ $t('bill.MODEL.digits') }} : {{ farePositional }}, {{ roundType }}
        </span>
      </template>
      <template #header>
        <div class="detail-header">
          <div class="detail-header-digits">
            <span class="detail-header-digits__text">
              {{ $t('bill.MODEL.digits') }}
            </span>
            <el-select
              v-if="activeModelObj"
              v-model="activeModelObj.farePositionalNumber"
              :placeholder="$t('bill.selectUnit')"
              class="detail-header-digits__select"
            >
              <el-option
                v-for="item in digitOptions"
                :key="item.value"
                :value="item.value"
                :label="item.name"
              />
            </el-select>
            <el-radio-group
              v-if="activeModelObj"
              v-model="activeModelObj.roundType"
              class="detail-header-digits__radio"
            >
              <el-radio
                v-for="item in digitSetOptions"
                :key="item.value"
                :label="item.value"
              >
                {{ item.name }}
              </el-radio>
            </el-radio-group>
          </div>
          <div class="detail-header-excel">
            <!-- accept=".xlsx, .xlsm, .xls, .xltx" -->
            <el-upload
              v-loading="isLoadingUploadExcel"
              action=""
              ref="excel-upload"
              :limit="1"
              :on-change="uploadExcel"
              :multiple="false"
              :show-file-list="false"
              :auto-upload="false"
            >
              <button
                class="button"
                type="is-default"
              >
                {{ $t('config.IP.uploadExcel') }}
                <span class="upload-icon" />
              </button>
            </el-upload>
          </div>
        </div>
      </template>
      <g-tab
        :data="tabData"
        :padding-top="30"
        class="tab-list"
      >
        <template
          v-for="tab in tabData"
          v-slot:[tab.field]
        >
          <billing-tabs
            v-if="activeModelObj"
            :key="tab.field"
            :tab-data="tab"
            :active-model="activeModelObj"
            :parent-model-group="modelGroup"
            :network-equip="networkEquip"
            :aff-tree="affTree"
            is-edit
            @update-services="updateService"
            @update-services-fixed-compute="updateFixedComputeService"
            @delete-service="deleteService"
            ref="detailTabs"
          />
        </template>
      </g-tab>
    </dashboard-panel>
    <fetch-billing-model
      :active.sync="activeFetchModal"
      @close="activeFetchModal = false"
      @apply="copyModelGroup"
    />
    <!-- 과금모델 불러오기 팝업 -->
  </div>
</template>

<script>
import API, { DashboardPanel } from '@sd-fe/cmp-core'
import BillingTabs from '@/components/Billing/Tabs/BillingTabs.vue'
import BillingModel from '@/components/Billing/BillingModel.vue'
import BillingModelMixins from '@/components/Billing/BillingModel.mixins'
import FetchBillingModel from '@/components/Billing/Modals/FetchBillingModel.vue'

import {
  digitOptions,
  digitSetOptions,
  tabData,
  roundMap,
  digitMap
} from './BillingModelDetail.data'
import { cloneDeep, uniqueId } from 'lodash'
import { mapGetters } from 'vuex'

export default {
  name: 'BillingModelDetail',
  components: {
    DashboardPanel,
    BillingTabs,
    BillingModel,
    FetchBillingModel
  },
  mixins: [BillingModelMixins],
  computed: {
    ...mapGetters({
      cloud: 'cloud/getCloud'
    }),
    tabDataByModuleType () {
      const moduleType = this.getModuleType()
      return this.tabData.filter(tab => tab.moduleType.includes(moduleType))
    },
    // 공통 자원 과금모델 여부
    isCommonResModel () {
      return (
        this.modelGroup &&
        this.modelGroup.models &&
        this.modelGroup.models.length &&
        this.modelGroup.models.some(model => model.type === 2)
      )
    },
    farePositional () {
      return this.digitMap[
        this.activeModelObj && this.activeModelObj.farePositionalNumber
      ]
    },
    roundType () {
      return this.roundMap[this.activeModelObj && this.activeModelObj.roundType]
    }
  },
  watch: {
    activeModelObj (model) {
      if (this.$refs.detailTabs) {
        const tab = this.$refs.detailTabs[0]
        tab.syncMatchService()
      }
    }
  },
  async created () {
    const { isEdit } = this.$route.query
    // Breadcrumbs
    this.$store.commit('common/ADD_PARAMETERS', {
      label: !isEdit ? this.$t('common.BTN.enroll') : this.$t('common.BTN.modify'),
      path: ''
    })

    await this.getNetworkEquip()
    await this.getOperationManagement()
    await this.getFilesInfo()

    if (isEdit) {
      this.isEdit = true
      try {
        const modelGroups = await API.billing.getModelGroups()
        this.modelGroup = modelGroups.filter(
          group => group.id === parseInt(this.$route.query.id)
        )[0]
        this.initModels()
      } catch (error) {
        console.log(error)
      }
    } else {
      await this.copyRecentModel()
    }

    this.updating = false

    await this.getAllGroupTree()
  },
  methods: {
    /**
     * Files 서비스 정보 조회
     */
    async getFilesInfo () {
      try {
        const filesInfo = await API.billing.getFiles()
        if (filesInfo.length > 0) this.fsList = filesInfo
      } catch (error) {
        console.error(error)
        // console.log(error.response.data)
      }
    },
    /**
     * 네트워크 장비 조회
     */
    async getNetworkEquip () {
      try {
        const res = await API.network.getEquipNetworks()
        this.networkEquip = res
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('네트워크 장비 조회에 실패하였습니다.'))
      }
    },
    async getOperationManagement () {
      // const moduleType = this.getModuleType()

      try {
        // NX + VMWARE
        const { data: nxData } = await API.billing.getOperationGroup({
          moduleType: 'NX',
          isBilling: true,
          isDeleted: false
        })
        const { data: vmwData } = await API.billing.getOperationGroup({
          moduleType: 'VMWARE',
          isBilling: true,
          isDeleted: false
        })
        this.managementList = [].concat(nxData, vmwData)
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('운영그룹 조회에 실패하였습니다.'))
      }
    },
    /**
     * 운영그룹 설정
     */
    setOperationManagement (model) {
      if (!this.managementList || !this.managementList.length) return

      // 하드웨어 타입
      const hardwareOptions = model.options.filter(option => option.billingModelCategory.categoryType === 1)
      // 하드웨어 타입들의 manageGroupIdx
      const existManageGroupIdxs = [...new Set(hardwareOptions.map(option => option.billingModelCategory.manageGroupIdx))]

      this.managementList.forEach(manage => {
        if (existManageGroupIdxs.includes(manage.operatingGroupIdx)) return

        const serviceTypes = manage.operatingGroupType === 'COMPUTE'
          ? ['VCPUs', 'RAM', 'DISK']
          : ['-']

        // COMPUTE & STORAGE
        serviceTypes.forEach(serviceType => {
          model.options.push({
            chargeType: 1,
            chargeUnit: {
              VCPUs: 'Core',
              RAM: 'GB',
              DISK: 'GB',
              '-': 'GB'
            }[serviceType],
            network: null,
            fares: [
              {
                lowestLimit: null,
                upperLimit: null,
                standard: 1,
                cost: 1000
              }
            ],
            serviceIdx: uniqueId('service-id-'),
            billingModelCategory: {
              name: manage.operatingGroupType,
              serviceId: manage.operatingGroupName,
              manageGroupIdx: manage.operatingGroupIdx,
              categoryType: 1,
              serviceType,
              moduleType: manage.moduleType
            }
          })
        })
      })
    },
    setFiles (model) {
      if (!this.fsList || !this.fsList.length) return

      // 모델에 이미 들어있는 files 옵션들
      const filesOptions = model.options.filter(option => option.billingModelCategory.categoryType === 8)
      // 모델에 이미 들어있는 files 옵션들의 serviceId
      const existFsServiceId = [...new Set(filesOptions.map(option => option.billingModelCategory.serviceId))]
      console.log(existFsServiceId)
      this.fsList.forEach(fs => {
        if (existFsServiceId.includes(fs.serviceId)) return

        model.options.push({
          serviceIdx: fs.idx,
          billingModelCategory: {
            name: fs.name,
            idx: fs.idx,
            categoryType: 8
          },
          chargeUnit: 'GB',
          chargeType: 1,
          fares: [{
            cost: 1000,
            lowestLimit: 1,
            standard: 1,
            upperLimit: 1
          }]
        })
      })
    },
    /**
     * 모듈 타입 조회
     */
    getModuleType () {
      return {
        nutanix: 'NX',
        vmware: 'VMWARE'
      }[this.cloud]
    },
    // 엑셀 업로드
    async uploadExcel (file, fileList) {
      if (file.size > (1024 * 1024 * 100)) { // 100Mb 이하 파일만 업로드 가능
        return this.$alert(this.$t('common.ALERT.PROJECT.059', { size: '100Mb' }))
      }

      if (file && fileList.length) {
        this.isLoadingUploadExcel = true
        this.updating = true
        const formData = new FormData()
        formData.append('file', file.raw)

        try {
          const uploadedData = await API.billing.uploadExcel(formData)
          if (uploadedData && uploadedData.length) {
            this.activeModelObj.options = uploadedData
            this.$refs.detailTabs[0].refreshTabData()
          }
        } catch (error) {
          console.log('실패', error)
          this.$alert(this.$t('common.ALERT.BASE.033')) // 등록 실패하였습니다.
        } finally {
          this.$refs['excel-upload'].clearFiles()
          this.isLoadingUploadExcel = false
          this.updating = false
        }
      }
    },
    // 복사된 과금 모델 기준 범위 및 과금 단가 초기화
    initFareCost (model) {
      if (Array.isArray(model)) {
        model.forEach(m => this.initFareCost(m))
      } else {
        if (model.options && model.options.length) {
          model.options.forEach(option => {
            option.fares.forEach(fare => {
              if (option.chargeType === 2) {
                // 변동
                fare.lowestLimit = 0
                fare.upperLimit = 0
              } else {
                fare.standard = 0
              }
              fare.cost = 0
            })
          })
        }
      }
    },
    // 복사된 서비스 비고 지우기
    removeCopiedServicesNote () {
      const removeNote = (option) => (option.note = '')
      this.modelGroup.models.forEach(model => model.options.forEach(removeNote))
    },
    // 최근에 배치 확정된 과금 모델로 현재 등록 페이지 모델 수정
    async copyRecentModel () {
      try {
        const modelGroups = await API.billing.getModelGroups()
        const appliedGroups = modelGroups.filter(model => model.confirm)
        appliedGroups.sort((a, b) => b.batchDate - a.batchDate)
        if (!appliedGroups.length) {
          const temp = modelGroups.slice(0)
          temp.sort((a, b) => b.updateTime - a.updateTime)
          this.modelGroup = temp[temp.length - 1]
        } else {
          this.modelGroup = appliedGroups[0]
        }
        this.modelGroup.name = ''
        this.modelGroup.id = null
        this.$set(this.modelGroup, 'copying', true)
        this.initModels()
        // this.initFareCost(this.modelGroup.models)
        this.activeModelObj = this.modelGroup.models[0]
        this.removeCopiedServicesNote()
      } catch (error) {
        this.$alert(this.$t('common.ALERT.BILL.002')) // 과금 모델을 불러오는데 문제가 발생했습니다.
      }
    },
    async getAllGroupTree () {
      // 관계사별 과금모델 추가할 때 관계사 데이터 가져오기
      try {
        this.affLoading = true
        const tree = await API.iam.getGroupManageTree({ project: true })
        if (!tree || !tree.length) { throw new Error('API ERROR: IAM.getGroupManageTree') }
        this.affTree = tree
        this.resetAffList()
        this.updateAffList()
      } catch (error) {
        console.error(error)
      } finally {
        this.affLoading = false
      }
    },
    deleteService (service) {
      const idx = this.activeModelObj.options.findIndex(option => option.billingModelCategory.idx === service.billingModelCategory.idx)
      if (idx !== -1) this.activeModelObj.options.splice(idx, 1)
    },
    updateFixedComputeService (fixedComputes, columns) {
      this.modelGroup.fixedComputes = fixedComputes
    },
    updateService (services, activeModel) {
      if (!services || !services.length) return
      if (activeModel.type !== 3) {
        const modelGroup = this.modelGroup.models.find(group => group.type === activeModel.type)
        const modelGroupIdx = this.modelGroup.models.findIndex(group => group.type === activeModel.type)
        if (modelGroup) {
          const categoryType = services[0].billingModelCategory.categoryType
          const con = modelGroup.options.filter(option => option.billingModelCategory.categoryType !== categoryType)
          modelGroup.options = con.concat(services)
          this.modelGroup.models[modelGroupIdx] = modelGroup
        }
      } else {
        const modelGroup = this.modelGroup.models
          .find(group => group.type === 3)
        const modelGroupIdx = this.modelGroup.models
          .findIndex(group => group.type === 3)
        const companyModel = modelGroup.models.find(group => activeModel.companyId === group.companyId)
        const companyModelIndex = modelGroup.models.findIndex(group => activeModel.companyId === group.companyId)
        if (modelGroup && companyModel) {
          const categoryType = services[0].billingModelCategory.categoryType
          const con = companyModel.options.filter(option => option.billingModelCategory.categoryType !== categoryType)
          companyModel.options = con.concat(services)
          this.modelGroup.models[modelGroupIdx].models[companyModelIndex] = companyModel
        }
      }
    },
    deleteParentId (model) {
      if (model.type === 3 && model.models) {
        model.models.forEach(innerModel => this.deleteParentId(innerModel))
      }
      delete model.id
      delete model.billingModelGroupId
      delete model.billingModelId
      // delete model.billingServiceId
      delete model.upperBillingModelId
      delete model.createUserIdx
      delete model.createTime
      delete model.updateUserIdx
      delete model.updateTime
      // delete model.serviceIdx
      if (model.options && model.options.length) {
        model.options.forEach(option => this.deleteParentId(option))
      }
      if (model.fares && model.fares.length) {
        model.fares.forEach(fare => this.deleteParentId(fare))
      }
    },
    copyModelGroup (modelGroup) {
      const temp = this.modelGroup
      this.activeFetchModal = false
      modelGroup.models.forEach(model => this.deleteParentId(model))
      const copy = {
        models: modelGroup.models,
        copying: true,
        apply: false,
        billing: false,
        name: temp.name || ''
      }
      if (this.isEdit) {
        copy.id = temp.id
        copy.name = temp.name
      }
      this.modelGroup = copy
      this.initModels()
      this.removeCopiedServicesNote()
    },
    /**
     * 기댓값: [[1, 2], [3, 4], [5, 6], [7, 8]] - true
     * 기댓값: [[1, 2], [2, 6], [8, 11]] - false
     */
    validateAllBillingScope (scopeArray) {
      const fares = scopeArray.map(fare => [fare.lowestLimit, fare.upperLimit])
      const validate = (pairs) => pairs.slice(0, pairs.length - 1).every((pair, index) => pairs[index + 1][0] - pair[1] < 2)
      return validate(fares)
    },
    /**
     * 새로 생성된 커스텀 요금의 식별자 키를 제거한다.
     */
    removeUniqueKey () {
      // validation 통과 후 후처리
      // 새로 추가된 커스텀 요금의 경우
      // 고유한 식별자를 두기 위해 기존 아이템과 동일한 키를 사용하고 있던
      // 키를 API에 보내기 전 삭제한다.
      // serviceIdx, category.idx
      const removeNewUniqueKey = (model) => {
        if (model.options && model.options.length) {
          model.options.forEach(option => {
            if (option.billingModelCategory && [3, 4, 5, 6].includes(option.billingModelCategory.categoryType)) {
              if (option.ui_uuid) {
                option._serviceIdx = option.serviceIdx
                option.billingModelCategory._idx = option.billingModelCategory.idx
                delete option.serviceIdx
                delete option.billingModelCategory.idx
              }
            } else if (option.billingModelCategory.categoryType === 1) {
              // 하드웨어인 경우 운영그룹이 새로 생성되었을 때
              // UI에서 매핑한 serviceIdx 삭제
              if (option.serviceIdx) {
                if (typeof option.serviceIdx === 'string' && option.serviceIdx.startsWith('service-id-')) {
                  option._serviceIdx = option.serviceIdx
                  delete option.serviceIdx
                }
              }
            }
          })
        }
      }
      this.modelGroup.models.forEach(model => {
        if (model.type === 3) model.models.forEach(m => removeNewUniqueKey(m))
        else removeNewUniqueKey(model)
      })
    },
    /**
     * 새로 생성된 커스텀 요금의 식별자를 다시 매핑한다.
     * (API에서 생성/수정이 실패한 경우)
     */
    mappingUniqueKey () {
      // validation 통과 후 후처리
      // 새로 추가된 커스텀 요금의 경우
      // 고유한 식별자를 두기 위해 기존 아이템과 동일한 키를 사용하고 있던
      // 키를 API에 보내기 전 삭제한다.
      // serviceIdx, category.idx
      const mapNewUniqueKey = (model) => {
        if (model.options && model.options.length) {
          model.options.forEach(option => {
            if (option.billingModelCategory && [3, 4, 5, 6].includes(option.billingModelCategory.categoryType)) {
              if (option.ui_uuid) {
                option.serviceIdx = option._serviceIdx
                option.billingModelCategory.idx = option.billingModelCategory._idx
              }
            } else if (option.billingModelCategory.categoryType === 1) {
              // 하드웨어
              if (option._serviceIdx) {
                option.serviceIdx = option._serviceIdx
                delete option._serviceIdx
              }
            }
          })
        }
      }
      this.modelGroup.models.forEach(model => {
        if (model.type === 3) model.models.forEach(m => mapNewUniqueKey(m))
        else mapNewUniqueKey(model)
      })
    },
    /**
     * 모델 그룹 validation 처리
     */
    validationEnrollModelGroup () {
      return new Promise((resolve, reject) => {
        const fares = []
        const chargeUnits = []
        const modelNames = []
        const getFares = (model) => {
          model.options.forEach(option => fares.push(...option.fares.map(fare => ({ ...fare, chargeType: option.chargeType }))))
        }
        const getChargeUnit = (model) => {
          model.options.forEach(option => chargeUnits.push(option.chargeUnit))
        }
        const getCategoryName = (model) => {
          model.options.forEach(option => {
            if (option.billingModelCategory.categoryType === 6) {
              modelNames.push(option.billingModelCategory.name)
            }
          })
        }
        this.modelGroup.models.forEach(model => {
          if (model.type === 3) {
            model.models.forEach(m => getFares(m))
            model.models.forEach(m => getChargeUnit(m))
            model.models.forEach(m => getCategoryName(m))
          } else {
            getFares(model)
            getChargeUnit(model)
            getCategoryName(model)
          }
        })
        const isSuccessFareCost = fares.every(fare => {
          if (fare.chargeType === 2) {
            return fare.cost >= 0 && fare.upperLimit && fare.lowestLimit
          } else {
            return fare.cost >= 0 && fare.standard
          }
        })
        const isValidateAllUnits = chargeUnits.every(unit => unit)
        const variableBillingFares = fares.filter(fare => fare.chargeType === 2)
        const isPairLimits = this.validateAllBillingScope(variableBillingFares)
        const isAllCustomBillingName = modelNames.every(Boolean)
        if (!this.modelGroup.name) {
          reject(this.$t('common.ALERT.BILL.004')) // 모델 명을 입력해주세요.
        } else if (typeof this.modelGroup.name === 'string' && !this.modelGroup.name.trim()) {
          reject(this.$t('common.ALERT.BILL.004')) // 모델 명을 입력해주세요.
        } else if (!isSuccessFareCost) {
          reject(this.$t('common.ALERT.BILL.042')) // 기준 범위 또는 과금 단가를 입력해주세요.
        } else if (!isPairLimits) {
          reject(this.$t('common.ALERT.BILL.042')) // 기준 범위 또는 과금 단가를 입력해주세요.
        } else if (!isValidateAllUnits) {
          reject(this.$t('common.ALERT.BILL.001')) // 과금 단위를 확인해주세요.
        } else if (!isAllCustomBillingName) {
          reject(this.$v('커스텀 요금의 항목 이름을 입력해주세요.'))
        } else {
          this.removeUniqueKey()
          resolve()
        }
      })
    },
    // 과금모델 등록 (신규)
    async enrollModelGroup () {
      try {
        this.enrollLoading = true
        this.$refs.detailTabs[0].syncMatchService()
        await this.validationEnrollModelGroup()
        try {
          await API.billing.addModelGroups({ ...this.modelGroup, moduleType: this.getModuleType() })
          this.$alert(this.$t('common.ALERT.BASE.018')) // 성공적으로 등록되었습니다.
          this.$router.push({ name: 'nx-billing-model-standard' })
        } catch (error) {
          console.log(error)
          switch (error.code) {
            case 'BIL2001':
              this.$alert(this.$t('common.ALERT.BILL.015')) // 중복된 모델명입니다.
              break
            default:
              this.$alert(this.$t('common.ALERT.BASE.020')) // 실패하였습니다.
          }
          this.mappingUniqueKey()
        }
      } catch (message) {
        this.$alert(message, { dangerouslyUseHTMLString: true })
        this.mappingUniqueKey()
      } finally {
        this.enrollLoading = false
      }
    },
    cancelDetail () {
      this.$router.push({ name: 'nx-billing-model-standard' })
    },
    // 과금모델 업데이트
    applyModelGroup () {
      this.$confirm(this.$t('common.CONFIRM.BASE.019')) // 적용하시겠습니까?
        .then(async () => {
          try {
            this.updating = true
            this.$refs.detailTabs[0].syncMatchService()
            try {
              await this.validationEnrollModelGroup()
            } catch (validateMessage) {
              return this.$alert(validateMessage, { dangerouslyUseHTMLString: true })
            }
            // if (this.modelGroup) {
            //   console.log(this.modelGroup)
            //   return
            // }
            await API.billing.updateModelGroups({ ...this.modelGroup, moduleType: this.getModuleType() })
            this.$alert(this.$t('common.ALERT.BASE.047'))
              .then(() => this.$router.push({ name: 'nx-billing-model-standard' })) // 저장 성공
          } catch (error) {
            console.log(error)
            this.mappingUniqueKey()
            switch (error.code) {
              case 'BIL2001':
                this.$alert(this.$t('common.ALERT.BILL.015')) // 중복된 모델명입니다.
                break
              default:
                this.$alert(this.$t('common.ALERT.BASE.020')) // 실패하였습니다.
            }
          } finally {
            this.updating = false
          }
        })
        .catch(() => false)
    },
    initModels () {
      this.modelName = this.modelGroup.name
      // active
      this.modelGroup.models.forEach((model, index) => {
        if (model.type === 3) {
          this.$set(model, 'expandable', true)
          this.$set(model, 'expanded', false)
          model.models.forEach(innerModel =>
            this.$set(innerModel, 'active', false)
          )
        } else {
          if (index === 0) this.activeModelObj = model
          this.$set(model, 'active', index === 0)
        }
        /** 운영그룹 관리 */
        this.setOperationManagement(model)
        /** NX Files 설정 */
        this.setFiles(model)
      })
    },
    deleteModel (model) {
      if (model.type === 2) {
        // 공통자원 과금모델
        this.modelGroup.models.splice(this.modelGroup.models.findIndex(model => model.type === 2), 1)
      } else if (model.type === 3) {
        // 관계사별 과금모델 안에 모델
        if (model.active) {
          this.activeModel(this.modelGroup.models[0])
        }
        const affModel = this.modelGroup.models.find(model => model.type === 3)
        const { companyId } = model
        affModel.models.splice(affModel.models.findIndex(model => model.companyId === companyId), 1)
        const aff = this.affTree.find(a => a.groupIdx === companyId)
        this.$set(this.affMap, companyId, aff)
      }
    },
    // 그룹 리스트 초기화
    resetAffList () {
      this.affMap = {}
      this.affTree.forEach(data => {
        data.children = null // 필요없는데 사이즈 큰놈 GC 돌려
        this.affMap[data.groupIdx] = data
      })
    },
    // 그룹 리스트 업데이트 (이미 등록되어 있는 그룹 제거)
    updateAffList () {
      const affModel = this.modelGroup?.models?.find(model => model.type === 3)

      if (!affModel) return

      affModel.models
        .map(model => model.companyId)
        .forEach(groupIdx => {
          delete this.affMap[groupIdx]
        })
    },
    addAff () {
      const standardModel = this.modelGroup.models.find(model => model.type === 1)
      const affModel = this.modelGroup.models.find(model => model.type === 3)

      if (!affModel) return

      const copyOptions = []

      if (standardModel) {
        copyOptions.push(...cloneDeep(standardModel.options))
      }

      affModel.models.push({
        active: false,
        billingModelGroupId: this.modelGroup.id,
        companyId: parseInt(this.affValue),
        companyName: this.affMap[this.affValue].groupName,
        farePositionalNumber: 'THOUSANDS',
        models: [],
        options: copyOptions,
        roundType: 'ROUND',
        type: 3,
        adding: true
      })

      this.affValue = null
      this.updateAffList()
    },
    closeAddAff () {
      this.activeAddAff = false
    },
    // 과금모델 추가 (타입별)
    // 1 - 표준 과금모델 - 표준은 추가될 수 없음 항상 기본적으로 존재한다고 가정
    // 2 - 공통자원 과금모델
    // 3 - 관계사별 과금모델
    addModel (type) {
      this.$refs.detailTabs[0].syncMatchService()

      if (type === 2) {
        // 이미 존재하는 경우
        if (this.modelGroup.models.find(model => model.type === 2)) return

        const copyOptions = []
        const standardModel = this.modelGroup.models.find(model => model.type === 1)

        if (standardModel) {
          copyOptions.push(...cloneDeep(standardModel.options))
        }

        this.modelGroup.models.push({
          billingModelGroupId: this.modelGroup.id,
          active: false,
          models: null,
          roundType: 'ROUND',
          type: 2,
          farePositionalNumber: 'THOUSANDS',
          adding: true,
          options: copyOptions
        })
      } else {
        const affModel = this.modelGroup.models.find(model => model.type === 3)
        this.activeAddAff = true
        // 이미 존재하는 경우
        if (affModel) {
          affModel.expanded = true
        } else {
          this.modelGroup.models.push({
            billingModelGroupId: this.modelGroup.id,
            expandable: true,
            expanded: true,
            type: 3,
            models: [],
            roundType: 'ROUND',
            farePositionalNumber: 'THOUSANDS',
            adding: true
          })
        }
      }
    },
    // 관계사별 과금모델 추가
    addAffModel () {
      if (this.affLoading) return

      this.addModel(3)
    },
    // 공통자원 과금모델 추가
    addCommonResModel () {
      this.addModel(2)
    },
    // 과금모델 초기화
    resetModel () {
      const tempModels = this.modelGroup.models.filter(model => model.type === 1)
      this.modelGroup = {
        name: '',
        apply: false,
        billing: false,
        adding: true,
        models: [
          {
            type: 1,
            models: null,
            options: [],
            adding: true,
            active: true,
            farePositionalNumber: 'THOUSANDS',
            roundType: 'ROUND'
          }
        ]
      }
      this.modelGroup.models = tempModels
      if (this.isEdit) this.$set(this.modelGroup, 'id', this.$route.query.id)
      this.activeModelObj = this.modelGroup.models[0]
      this.activeAddAff = false
      this.resetAffList()
    },
    disableAllModel (skipEx) {
      this.modelGroup.models.forEach(model => {
        if (model.type === 3) {
          if (!skipEx) model.expanded = false
          model.models.forEach(innerModel => (innerModel.active = false))
        } else {
          model.active = false
        }
      })
    },
    activeModel (model, modelIdx, isApplyModel, noApplyIdx) {
      const temp = model.expandable ? (model.expanded ? 2 : 3) : false
      this.disableAllModel(false)
      if (model.type === 3) {
        model.expanded = temp !== 2
      } else {
        model.active = true
        this.activeModelObj = model
      }
    },
    activeChildrenModel (item) {
      this.disableAllModel(true)
      item.active = true
      this.activeModelObj = item
    }
  },
  data: root => ({
    affLoading: false,
    managementList: [], // 운영그룹 관리 리스트
    isLoadingUploadExcel: false,
    enrollLoading: false,
    updating: true,
    activeModelObj: null,
    modelGroup: null,
    affValue: null,
    affMap: null,
    activeAddAff: false, // 관계사별 과금모델 추가 상태
    activeFetchModal: false,
    modelName: '',
    digitMap: digitMap(root),
    roundMap: roundMap(root),
    digitOptions: digitOptions(root),
    digitSetOptions: digitSetOptions(root),
    isEdit: false,
    tabData: tabData(root),
    affTree: [],
    networkEquip: [],
    fsList: []
  })
}
</script>

<style lang="scss" scoped>
.billing-model-detail {
  display: flex;

  > .billing-panel {
    overflow: hidden;

    &.left {
      min-width: 400px;
      margin-right: $gap * 2;

      &::v-deep .panel-body {
        border-top: 1px solid transparent;
      }

      & .postfix {
        cursor: pointer;
        padding-left: 3px;
        font-weight: normal;

        & > * {
          display: inline-block;
          color: $text-lighter-gray;
          font-size: 11px;
        }

        & > .mdi-refresh {
          margin-left: 3px;
          transform: rotate(270deg);

          &::before {
            font-size: 14px;
          }
        }

        vertical-align: middle;
      }

      & .model-create-body {
        & .input-wrap {
          margin-bottom: $gap-s;

          & .model-input {
            &::v-deep .el-input__inner {
              padding: $gap;
            }
          }
        }

        & .button-wrap {
          display: flex;
          flex-wrap: nowrap;

          & > button {
            flex: 1 1 50%;

            &:first-of-type {
              margin-right: $gap-s;
            }
          }
        }

        & .model-lists {
          margin-top: $gap-s * 3;

          & .add-model-wrap {
            & .add-aff {
              display: flex;
              align-items: center;
              flex-wrap: nowrap;
              margin-top: $gap;
              margin-bottom: 15px;

              & > *:first-child {
                flex: 0 0 70%;
                margin-right: $gap-s / 2;
              }

              & > *:not(:first-child) {
                flex: 0 0 15%;
                margin-left: $gap-s / 2;
              }

              & .close-icon {
                cursor: pointer;
                margin-left: $gap-s;

                > i.el-icon {
                  font-size: 14px;
                  border-radius: 9999px;
                  background-color: #edeff2;
                  color: #22272b;
                  padding: 5px;
                }
              }
            }

            & .add-model-card {
              font-weight: normal;
              font-size: 14px;
              margin: $gap-s 0;
              padding: $gap-s;
              background-color: rgba(196, 196, 196, 0.05);
              text-align: center;
              border-radius: $radius;
              border: 1px dashed $gray;
              cursor: pointer;

              &:hover {
                & .el-icon {
                  color: $white;
                }
              }

              & span {
                vertical-align: middle;
              }

              & .el-icon {
                color: #9596a0;
                font-size: 25px;
                vertical-align: middle;
                margin-right: $gap-s * 0.5;
              }
            }
          }
        }
      }
    }

    &.right {
      width: 100%;
      overflow: hidden;

      & .detail-header {
        display: flex;
        align-items: center;

        &-digits {
          margin-right: $gap;
          display: flex;
          align-items: center;

          &__text {
            max-width: 100px;
          }

          &__select {
            max-width: 110px;
            margin-right: $gap;
          }

          &__radio {
            &::v-deep .el-radio {
              &:not(:last-of-type) {
                margin-right: $gap;
              }
            }
          }

          & > * + * {
            margin-left: $gap-s;
          }
        }

        &-excel {
          & .upload-icon {
            background: url('../../../../../assets/images/icon-upload.svg')
              no-repeat;
            padding-right: 20px;
            position: relative;
            left: 5px;
            bottom: 1px;
          }
        }
      }

      & .aff-postfix {
        > .el-icon {
          margin: 0 5px;
          color: $slate;
        }

        > .aff-name {
          font-weight: normal;
          font-size: 16px;
        }
      }

      & .standard-info {
        color: #bbb;
        font-size: 12px;
        font-weight: normal;
        padding-left: 15px;
      }

      &::v-deep .panel-body {
        border: none;
      }
    }
  }

  .tab-list {
    &::v-deep {
      .tab {
        width: 145px !important;
      }
    }
  }
}
</style>
