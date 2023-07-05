<template>
  <div
    class="billing-tab"
    :class="tabData.field"
    v-loading="tabLoading"
  >
    <template v-if="tabData.field === 'fixed-compute'">
      <fixed-compute
        ref="fixedCompute"
        :parent-model-group="parentModelGroup"
        :view-edit="isEdit"
        :aff-tree="affTree"
        @update-fixed-compute="onUpdateFixedCompute"
      />
    </template>
    <template v-else>
      <div class="billing-tab-header">
        <div class="billing-tab-header__search">
          <billing-model-search
            v-model="search"
            @change="onChangeSearchText"
            @search="testSearch"
            @reset="resetSearch"
          />
        <!-- <wj-flex-grid-search
          v-else
          id="editGridSearch"
          :search-all-columns="true"
          :placeholder="$t('common.PLACEHOLDER.searchEnter')"
        /> -->
        </div>
        <div
          v-if="isEdit && tabData.field === 'software'"
          class="billing-tab-header__new-sw"
        >
          <button
            class="button"
            type="is-primary"
            @click="addSwModalActive = true"
          >
            {{ $t("bill.MODEL.addSwLicense") }}
          </button>
        </div>
        <div
          v-if="isEdit && tabData.field === 'custom'"
          class="billing-tab-header__new-custom"
        >
          <button
            class="button"
            type="is-primary"
            @click="onClickAddCustomItem"
          >
            {{ $v('추가') }}
          </button>
        </div>
      </div>
      <template v-if="networkTab && !readonly">
        <div class="crud-action">
          <button
            class="button"
            type="is-anti"
            :disabled="!selectedNetworkRow"
            @click="onClickDeleteNetworkRow"
          >
            {{ $v('삭제') }}
          </button>
          <button
            class="button"
            type="is-black"
            :disabled="!selectedNetworkRow"
            @click="onClickChangeNetworkRow"
          >
            {{ $v('변경') }}
          </button>
          <button
            class="button"
            type="is-primary"
            :disabled="selectedNetworkRow"
            @click="onClickAddResource"
          >
            {{ $v('추가') }}
          </button>
        </div>
      </template>
      <div class="billing-tab-grid">
        <cmp-grid
          v-if="isEdit"
          :grid-id="isEdit ? 'cmp-billing-grid' : ''"
          :item-source="searchMode ? filteredGridSource : gridSource"
          :columns="gridHeaderDetail[tabData.field]"
          :header-merge="mergeHeader"
          :init-custom-action="gridInit"
          :paging-size="pageSize"
          ref="billingGrid"
          page-keeping
          :selectable="networkTab"
          @selectedRow="onSelectNetworkRow"
        >
          <template #billingModelCategoryname="{ row }">
            <template v-if="tabData.field !== 'custom'">
              <span
                v-if="row.isNew"
                class="new-tag"
              >
                NEW
              </span>
              <span
                v-if="tabData.type === 2"
              >{{ row.billingModelCategory.name }} /
                {{ row.billingModelCategory.operatingSystem }}</span>
              <span v-else>{{ row.billingModelCategory.name }}</span>
            </template>
            <template v-else>
              <el-input v-model="row.billingModelCategory.name" />
            </template>
          </template>
          <template #serviceIdx="{ row }">
            <div
              v-if="isEdit && isDeletableField(tabData.field)"
              class="edit-idx"
            >
              <button
                class="button"
                type="is-icon"
                @click="tabData.field === 'software' ? deleteRow(row) : onDeleteCustomItem(row)"
              >
                <i class="delete-icon" />
              </button>
              <span>{{ row.index + 1 }}</span>
            </div>
            <div v-else>
              {{ row.index + 1 }}
            </div>
          </template>
          <!-- No -->
          <template #serviceType="{ row }">
            <span>{{ row.billingModelCategory.serviceType }}</span>
          </template>
          <template #content="props">
            <span>
              {{ props.row.content }}
            </span>
          </template>
          <!-- 항목 -->
          <template #billingModelCategoryversion="{ row }">
            {{ row.billingModelCategory.version }}
          </template>
          <!-- 버전 -->
          <template
            v-if="networkTab"
            #billingModelCategoryequipmentList="{ row }"
          >
            <span v-if="row.billingModelCategory.equipmentList.length">
              <span v-if="row.billingModelCategory.equipmentList.length === 1">
                {{ row.billingModelCategory.equipmentList[0].equipmentName }}
              </span>
              <el-tooltip
                v-else
                effect="light"
              >
                <span>
                  {{ row.billingModelCategory.equipmentList[0].equipmentName }} 외 {{ row.billingModelCategory.equipmentList.length - 1 }}
                </span>
                <div slot="content">
                  <div
                    v-for="equip in row.billingModelCategory.equipmentList"
                    :key="equip.equipmentIdx"
                  >
                    {{ equip.equipmentName }}
                  </div>
                </div>
              </el-tooltip>
            </span>
          </template>
          <!-- 네트워크 자원 > 스위치 장비 -->
          <template #chargeUnit="{ row }">
            <el-select
              v-if="isEdit && !networkTab"
              v-model="row.chargeUnit"
              popper-class="selcet-billing-charge-unit"
            >
              <el-option
                v-for="label in billUnits"
                :key="label.name"
                :value="label.field"
                :label="label.label"
              />
            </el-select>
            <span v-else-if="isEdit && networkTab">
              개수
            </span>
            <span v-else>
              {{ row.chargeUnit }}
            </span>
          </template>
          <!-- 과금 단위 -->
          <template
            v-if="isEdit"
            #chargeType="props"
          >
            <el-radio-group
              v-model="props.row.chargeType"
              class="billing-system-radio"
              @change="e => onChangeBillingSystem(props, e)"
            >
              <el-radio
                v-for="system in editData.billingSystemOption"
                :key="system.value"
                :value="system.value"
                :label="system.value"
              >
                {{ system.name }}
              </el-radio>
            </el-radio-group>
          </template>
          <!-- 과금 체계 -->
          <template #scopestandard="{ row }">
            <span
              v-if="row.chargeType === 2"
              class="billing-scope-wrapper"
            >
              <div
                v-for="(fare, index) in row.fares"
                :key="index"
                :class="[
                  index === 0 && row.fares.length > 1 && 'range-first',
                  index === row.fares.length - 1 && 'range-end',
                  index !== 0 &&
                    index !== row.fares.length - 1 &&
                    'range-middle'
                ]"
              >
                <el-input-number
                  class="billing-scope-start scope billing"
                  v-model="fare.lowestLimit"
                  :min="handleStartScopeMin(row.fares, index)"
                  :max="handleStartScopeMax(row.fares, index)"
                  @change="(cur, old) => changeBillingScope(cur, old, fare)"
                />
                <span style="margin: 0 10px;">~</span>
                <el-input-number
                  class="billing-scope-end scope billing"
                  v-model="fare.upperLimit"
                  :min="handleEndScopeMin(row.fares, index) || 1"
                  :max="handleEndScopeMax(row.fares, index)"
                />
              </div>
            </span>
            <!-- 변동 과금 -->
            <span v-else-if="networkTab">
              <span>1</span>
            </span>
            <span v-else>
              <el-input-number
                class="billing-scope-start scope billing"
                v-model="row.fares[0].standard"
                :min="0"
              />
            </span>
          <!-- 고정 과금 -->
          </template>
          <!-- 기준 범위 -->
          <template #scopecost="{ row }">
            <span class="billing-scope-wrapper">
              <div
                v-for="(fare, index) in row.chargeType === 2 ? row.fares : row.fares.slice(0, 1)"
                :key="index"
                :class="row.chargeType === 2 ? [
                  index === 0 && row.fares.length > 1 && 'range-first',
                  index === row.fares.length - 1 && 'range-end',
                  index !== 0 && index !== row.fares.length - 1 &&
                    'range-middle'
                ] : []"
              >
                <span>
                  <el-input-number
                    class="billing-scope-price price billing"
                    v-model="fare.cost"
                    :step="10"
                    :min="0"
                    :max="100000000"
                    thousands-sep=","
                  />
                </span>
                <span
                  v-if="isEdit && row.chargeType === 2 && index !== 0"
                  class="button-wrap delete"
                >
                  <button
                    type="is-icon"
                    class="button"
                    @click="deleteBillingScope(row, index)"
                  >
                    <i class="delete-icon" />
                  </button>
                </span>
                <span
                  v-if="
                    row.fares.length - 1 === index &&
                      isEdit &&
                      row.chargeType === 2
                  "
                  class="button-wrap add"
                >
                  <button
                    type="is-icon"
                    class="button"
                    @click="addBillingScope(row, index)"
                  >
                    <i class="el-icon el-icon-circle-plus-outline" />
                  </button>
                </span>
              </div>
            </span>
          </template>
          <!-- 과금 단가 -->
          <template #comment="{ row }">
            <span v-if="row.comment">
              <span class="file-svg" />
            </span>
            <span v-else />
          </template>
        <!-- 비고 -->
        </cmp-grid>
        <cmp-grid
          v-else
          :item-source="gridSource"
          :columns="gridHeader[tabData.field]"
          :header-merge="mergeHeader"
          :init-custom-action="noEditGridInit"
          @selectedRow="selectRow"
          grid-id="no-edit-grid"
          :selectable="!readonly"
          class="no-edit-grid-wrapper"
          :force-render-grid="isExcelGrid"
          :paging-size="isExcelGrid ? 90000000 : 10"
        >
          <template #billingModelCategoryname="{ row }">
            <span
              v-if="tabData.type === 2"
            >{{ row.billingModelCategory.name }} /
              {{ row.billingModelCategory.operatingSystem }}</span>
            <span v-else>{{ row.billingModelCategory.name }}</span>
          </template>
          <template #index="{ row }">
            <div>{{ row.index + 1 }}</div>
          </template>
          <template #billingModelCategoryserviceType="{ row }">
            <span>
              {{ row.billingModelCategory.serviceType }}
            </span>
          </template>
          <template #content="{ row }">
            <span>{{ row.content }}</span>
          </template>
          <template #billingModelCategoryversion="{ row }">
            {{ row.billingModelCategory.version }}
          </template>
          <template #chargeUnit="{ row }">
            <span v-if="!networkTab">
              {{ row.chargeUnit }}
            </span>
            <span v-else-if="networkTab">
              개수
            </span>
          </template>
          <template
            v-if="networkTab"
            #billingModelCategoryequipmentList="{ row }"
          >
            <span v-if="row.billingModelCategory.equipmentList.length">
              <span v-if="row.billingModelCategory.equipmentList.length === 1">
                {{ findNetworkEquip(row.billingModelCategory.equipmentList[0].equipmentIdx) }}
              </span>
              <el-tooltip
                v-else
                effect="light"
              >
                <span>
                  {{ findNetworkEquip(row.billingModelCategory.equipmentList[0].equipmentIdx) }} 외 {{ row.billingModelCategory.equipmentList.length - 1 }}
                </span>
                <div slot="content">
                  <div
                    v-for="equip in row.billingModelCategory.equipmentList"
                    :key="equip.equipmentIdx"
                  >
                    {{ findNetworkEquip(equip.equipmentIdx) }}
                  </div>
                </div>
              </el-tooltip>
            </span>
          </template>
          <!-- 네트워크 자원 > 스위치 장비 -->
          <template #scopestandard="props">
            <div
              v-for="(fare, index) in props.row.fares"
              :key="index"
            >
              <div
                v-if="props.row.chargeType === 2"
                :class="[
                  index === 0 && props.row.fares.length > 1 && 'range-first',
                  index === props.row.fares.length - 1 && 'range-end',
                  index !== 0 && index !== props.row.fares.length - 1 &&
                    'range-middle'
                ]"
              >
                {{ fare.lowestLimit }} ~ {{ fare.upperLimit }}
              </div>
              <div v-else>
                {{ fare.standard }}
              </div>
            </div>
          </template>
          <template #fares[0]cost="{ row }">
            <span class="billing-scope-wrapper">
              <div
                v-for="(fare, index) in row.fares"
                :key="index"
              >
                <div
                  v-if="row.chargeType === 2"
                  :class="[
                    index === 0 && row.fares.length > 1 && 'range-first',
                    index === row.fares.length - 1 && 'range-end',
                    index !== 0 && index !== row.fares.length - 1 &&
                      'range-middle'
                  ]"
                >
                  &#8361; {{ fare.cost | priceFilter }}
                </div>
                <div v-else>
                  &#8361; {{ fare.cost | priceFilter }}
                </div>
              </div>
            </span>
          </template>
          <template #note="{ row }">
            <span v-if="row.note && !readonly">
              <!-- <span class="file-svg" /> -->
              <file-icon
                :width="20"
                :height="20"
                class="file-svg"
                is-button
                @click="onClickFile(row)"
              />
            </span>
            <span v-else-if="readonly">
              -
            </span>
          </template>
        </cmp-grid>
      </div>
    </template>
    <detail-resource-modal
      v-if="!readonly"
      :active="detailModalActive"
      :resource-type="tabData.field"
      :resource="selectedItem"
      :active-model="parentModelGroup"
      :bill-units="billUnits"
      @update="updateResource"
      @close="closeDetailResourceModal"
      @deleted="refreshTabData"
    />
    <!-- 자원 상세보기 팝업 (Only list) -->
    <add-sw-license-modal
      v-if="!readonly"
      :services="services"
      :active="addSwModalActive"
      :active-model="activeModel"
      :standard-model="standardModel"
      :model-group="parentModelGroup"
      @close="addSwModalActive = false"
      @apply="applyAddSwLicense"
    />
    <!-- S/W 라이선스 추가 팝업 (Only detail) -->
    <billing-load-balancer-edit
      v-if="networkTab && !readonly"
      :active="isActiveEditNetworkResource"
      :field="tabData.field"
      :registered-list="gridSource"
      :network-equip="networkEquip"
      :selected-row="selectedNetworkRow"
      :is-edit="isNetworkEdit"
      @save="onSaveNetwork"
      @close="isActiveEditNetworkResource = false"
    />
    <!-- 로드밸런서/방화벽 관련 C/U 팝업 -->
  </div>
</template>

<script>
import BillingModelSearch from '@/components/Billing/Search/BillingModelSearch.vue'
import DetailResourceModal from '@/components/Billing/Modals/DetailResource.vue'
import AddSwLicenseModal from '@/components/Billing/Modals/AddSWLicense.vue'
import { gridHeader, gridHeaderDetail } from './BillingTabs.data'
import API from '@sd-fe/cmp-core'
import { debounce, uniqueId, cloneDeep } from 'lodash'
import Fuse from 'fuse.js'
import FileIcon from '@/components/Icons/FileIcon.vue'
import BillingLoadBalancerEdit from '../Standard/BillingLoadBalancerEdit.vue'
import FixedCompute from '@/components/Billing/Standard/FixedCompute.vue'

export default {
  components: {
    BillingModelSearch,
    DetailResourceModal,
    AddSwLicenseModal,
    FileIcon,
    BillingLoadBalancerEdit,
    FixedCompute
  },
  props: {
    affTree: {
      type: Array,
      default: () => ([])
    },
    parentModelGroup: {
      type: Object,
      required: false,
      default: () => ({})
    },
    tabData: {
      type: Object,
      required: true
    },
    // 수정 모드 여부
    isEdit: {
      type: Boolean,
      required: false,
      default: false
    },
    // 액티브 모델
    activeModel: {
      type: Object,
      required: false,
      default: () => ({})
    },
    isExcelGrid: {
      type: Boolean,
      required: false,
      default: false
    },
    networkEquip: {
      type: Array,
      default: () => ([])
    },
    readonly: {
      type: Boolean,
      default: false
    }
  },
  filters: {
    priceFilter (price) {
      return price.toLocaleString()
    }
  },
  watch: {
    search (value) {
      if (!value || !value.length) {
        this.searchMode = false
      } else if (!this.searchMode) {
        this.searchMode = true
      }
    },
    activeModel () {
      this.refreshTabData(null)
      this.setColumnDataMap()
    }
  },
  computed: {
    switchTab () {
      return ['l4', 'l7'].includes(this.tabData?.field)
    },
    networkTab () {
      return ['l4', 'l7', 'firewall'].includes(this.tabData?.field)
    },
    standardModel () {
      return this.isEdit
        ? this.parentModelGroup.models.find(model => model.type === 1)
        : null
    },
    gridKeys () {
      return this.isEdit ? Object.keys(this.gridHeaderDetail) : Object.keys(this.gridHeader)
    },
    // 헤더 병합
    mergeHeader () {
      switch (this.tabData.field) {
        case 'hardware':
          return {
            colSpan: [
              {
                startIdx: this.isEdit ? 6 : 5,
                endIdx: this.isEdit ? 7 : 7,
                header: this.$t('bill.MODEL.quota')
              }
            ],
            rowSpan: [
              this.isEdit ? 'serviceIdx' : 'index',
              'billingModelCategory.name',
              'billingModelCategory.serviceId',
              'billingModelCategory.serviceType',
              'chargeUnit',
              'comment',
              'chargeType'
            ]
          }
        case 'software':
          return {
            colSpan: [
              {
                startIdx: this.isEdit ? 5 : 4,
                endIdx: this.isEdit ? 7 : 7,
                header: this.$t('bill.MODEL.quota')
              }
            ],
            rowSpan: [
              this.isEdit ? 'serviceIdx' : 'index',
              'billingModelCategory.name',
              'billingModelCategory.version',
              this.isEdit ? 'serviceType' : 'billingModelCategory.serviceType',
              'chargeType',
              'chargeUnit',
              'comment'
            ]
          }
        case 'l4':
        case 'l7':
          return {
            colSpan: [
              { startIdx: 5, endIdx: this.isEdit ? 6 : 7, header: this.$t('bill.MODEL.quota') }
            ],
            rowSpan: [
              this.isEdit ? 'serviceIdx' : 'index',
              'chargeType',
              'billingModelCategory.equipmentList',
              'billingModelCategory.name',
              'billingModelCategory.serviceType',
              'chargeUnit',
              'comment'
            ]
          }
          // return {
          //   colSpan: [
          //     { startIdx: 4, endIdx: this.isEdit ? 5 : 6, header: this.$t('bill.MODEL.quota') }
          //   ],
          //   rowSpan: [
          //     this.isEdit ? 'serviceIdx' : 'index',
          //     'billingModelCategory.name',
          //     this.isEdit ? 'serviceType' : 'billingModelCategory.serviceType',
          //     'chargeUnit',
          //     'comment',
          //     'chargeType'
          //   ]
          // }
        case 'firewall':
          return {
            colSpan: [
              { startIdx: 5, endIdx: this.isEdit ? 6 : 7, header: this.$t('bill.MODEL.quota') }
            ],
            rowSpan: [
              this.isEdit ? 'serviceIdx' : 'index',
              'billingModelCategory.name',
              'billingModelCategory.equipmentList',
              'billingModelCategory.serviceType',
              'chargeUnit',
              'comment',
              'chargeType'
            ]
          }
        case 'custom':
          return {
            colSpan: [
              {
                startIdx: this.isEdit ? 4 : 3,
                endIdx: this.isEdit ? 5 : 5,
                header: this.$t('bill.MODEL.quota')
              }
            ],
            rowSpan: [
              this.isEdit ? 'serviceIdx' : 'index',
              'billingModelCategory.name',
              // this.isEdit ? 'serviceType' : 'billingModelCategory.serviceType',
              'chargeUnit',
              'comment',
              'chargeType'
            ]
          }
        case 'nas':
          return {
            colSpan: [
              {
                startIdx: this.isEdit ? 5 : 4,
                endIdx: this.isEdit ? 6 : 6,
                header: this.$t('bill.MODEL.quota')
              }
            ],
            rowSpan: [
              this.isEdit ? 'serviceIdx' : 'index',
              'billingModelCategory.name',
              'billingModelCategory.serviceType',
              // this.isEdit ? 'serviceType' : 'billingModelCategory.serviceType',
              'chargeUnit',
              'comment',
              'chargeType'
            ]
          }
        default:
          return {
            colSpan: [],
            rowSpan: []
          }
      }
    }
  },
  async created () {
    if (this.isEdit) {
      this.gridKeys.forEach(key => {
        // 비고 없애기
        this.gridHeaderDetail[key].splice(this.gridHeaderDetail[key].length - 1, 1)
      })
    }

    await this.refreshTabData()
    await this.getBillingUnitTypes()

    this.mapNetworkEquipName()

    const currentKey = this.isEdit ? 'gridHeaderDetail' : 'gridHeader'

    this.gridKeys.forEach(key =>
      this[currentKey][key].forEach(t => (t.customHtml = true))
    )

    this.refreshGridSource()
  },
  beforeDestroy () {
    this.syncMatchService()
  },
  methods: {
    onClickFile (row) {
      this.detailModalActive = true
      this.selectedItem = row
    },
    mapNetworkEquipName () {
      if (!this.networkTab) return
      if (!this.networkEquip || !this.networkEquip.length) return

      this.services.forEach(service => {
        service.billingModelCategory.equipmentList.forEach(equip => {
          const findEquip = this.networkEquip.find(_eq => _eq.netIdx === equip.equipmentIdx)
          if (findEquip) {
            equip.equipmentName = findEquip.netName
          }
        })
      })
    },
    findNetworkEquip (idx) {
      const findNetworkEquip = this.networkEquip.find(t => t.netIdx === idx)
      return findNetworkEquip ? findNetworkEquip.netName : ''
    },
    onClickChangeNetworkRow () {
      if (!this.selectedNetworkRow) return
      this.isNetworkEdit = true
      this.isActiveEditNetworkResource = true
    },
    onSaveNetwork (form) {
      this.updateCurrentResource()

      const uid = uniqueId(form.field + '-')
      const newItem = {
        ui_uuid: uid,
        serviceIdx: uid,
        billingModelCategory: {
          categoryType: {
            l4: 3,
            l7: 4,
            firewall: 5
          }[form.field],
          equipmentList: form.equipmentList.map(equip => ({
            equipmentIdx: equip.netIdx,
            equipmentName: equip.netName,
            netType: equip.netType
          })),
          idx: uid,
          serviceId: form.name,
          serviceType: 'NETWORK',
          name: form.name
        },
        chargeType: 1,
        chargeUnit: 'Count',
        fares: [
          {
            upperLimit: null,
            lowestLimit: null,
            standard: 1,
            cost: form.price
          }
        ],
        network: {
          policyType: 'USE',
          resourceType: (form.field || '').toUpperCase()
        }
      }

      if (!this.isEdit) {
        if (form.isEdit) {
          this.$emit('update-network', this.selectedNetworkRow, {
            ...this.selectedNetworkRow,
            billingModelCategory: {
              ...this.selectedNetworkRow.billingModelCategory,
              equipmentList: form.equipmentList.map(equip => ({
                equipmentIdx: equip.netIdx,
                equipmentName: equip.netName,
                netType: equip.netType
              })),
              serviceId: form.name
            },
            fares: [
              {
                upperLimit: null,
                lowestLimit: null,
                standard: 1,
                cost: form.price
              }
            ]
          })
        } else {
          const directNewItem = cloneDeep(newItem)
          delete directNewItem.ui_uuid
          delete directNewItem.serviceIdx
          delete directNewItem.billingModelCategory.idx
          this.$emit('new-network', directNewItem)
        }
      } else {
        if (form.isEdit) {
          this.services[this.selectedNetworkRow.index] = {
            ...this.selectedNetworkRow,
            billingModelCategory: {
              ...this.selectedNetworkRow.billingModelCategory,
              equipmentList: form.equipmentList.map(equip => ({
                equipmentIdx: equip.netIdx,
                equipmentName: equip.netName,
                netType: equip.netType
              })),
              serviceId: form.name
            },
            fares: [
              {
                upperLimit: null,
                lowestLimit: null,
                standard: 1,
                cost: form.price
              }
            ]
          }
        } else {
          this.services.push(newItem)
        }
      }

      this.refreshGridSource()
    },
    onClickDeleteNetworkRow () {
      if (!this.selectedNetworkRow) return

      if (this.isEdit) {
        this.services.splice(this.selectedNetworkRow.index, 1)
        this.updateCurrentResource()
        this.matchServiceFromGrid()
        this.refreshGridSource()
        this.$emit('delete-service', this.selectedNetworkRow)
      } else {
        this.$emit('delete-network', this.selectedNetworkRow)
      }
      this.selectedNetworkRow = null
    },
    onSelectNetworkRow (row) {
      this.selectedNetworkRow = row?.dataItem
    },
    onUpdateFixedCompute (fixedCompute, columns) {
      this.$emit('update-services-fixed-compute', fixedCompute, columns)
    },
    /**
     * 네트워크 자원 - 추가 버튼 클릭시
     */
    onClickAddResource () {
      this.isNetworkEdit = false
      this.isActiveEditNetworkResource = true
    },
    /**
     * 커스텀 요금 아이템을 그리드에서 제거한다.
     */
    onDeleteCustomItem (row) {
      this.services = this.services.filter(source => source.ui_uuid !== row.ui_uuid)
      this.updateCurrentResource()
      this.matchServiceFromGrid()
      this.refreshGridSource()
      this.$emit('delete-service', row)
    },
    /**
     * 커스텀 요금 아이템을 그리드에 추가한다.
     */
    onClickAddCustomItem () {
      this.updateCurrentResource()

      const uid = uniqueId('custom-')

      this.services.push({
        ui_uuid: uid,
        serviceIdx: uid,
        billingModelCategory: {
          name: '',
          idx: uid,
          categoryType: 6
        },
        chargeUnit: null,
        chargeType: 1,
        fares: [{
          cost: 1000,
          lowestLimit: 1,
          standard: 1,
          upperLimit: 1
        }]
      })
      this.refreshGridSource()
    },
    isDeletableField (field) {
      return ['software', 'custom'].includes(field)
    },
    updateRowHeightByViewIndex (gridIndex, multi = false, count) {
      const viewIndex = this.$refs.billingGrid.page.currPage === 1 ? gridIndex : gridIndex - ((this.$refs.billingGrid.page.currPage - 1) * this.pageSize)
      if (multi) {
        this.grid.rows[viewIndex].height = count * 55 + 10
      } else {
        this.grid.rows[viewIndex].height = 80
      }
    },
    onChangeSearchText: debounce(function () {
      const fuse = new Fuse(this.gridSource, {
        threshold: 0.3,
        isCaseSensitive: false,
        keys: [
          'billingModelCategory.name',
          'billingModelCategory.version',
          'billingModelCategory.serviceType',
          'billingModelCategory.idx'
        ]
      })

      this.filteredGridSource = fuse.search(this.search).map(source => source.item)
    }, 500),
    noEditGridInit (grid) {
      this.noEditGrid = grid
      grid.loadedRows.addHandler(() => {
        grid.rows.forEach((row, index) => {
          if (grid.rows[index].dataItem.fares.length === 1) {
            this.$nextTick(() => {
              row.height = 40
            })
          } else {
            this.$nextTick(() => {
              row.height = row.dataItem.fares.length * 39 - (row.dataItem.fares.length > 5 ? 38 : 13)
            })
          }
        })
      })
      this.$emit('init-grid', grid)
    },
    /**
     * 범위 시작 값 및 최대 값 제한
     * 1 ~ 2 D (3 이상으로 올라가기 불가능)
     * 3 ~ 4 D (2 미만으로 내려가기 불가능)
     * 5 ~ 6 D (삭제 시 아래 값이 이전 값(최소, 최대)보다 1 큰 범위로 변경)
     * 7 ~ 8 D +
     */
    handleStartScopeMin (scope, idx) {
      // 최소 범위일 경우 1
      if (idx === 0) return 1
      return scope[idx - 1].upperLimit
    },
    handleStartScopeMax (scope, idx) {
      if (idx + 1 >= scope.length) {
        if (idx + 1 > scope.length) return Infinity
        if (idx + 1 === scope.length) return scope[idx - 1]?.upperLimit + 1
      }
      if (
        idx - 1 >= 0 &&
        scope[idx].lowestLimit - scope[idx - 1].upperLimit > 1
      ) { return scope[idx - 1].upperLimit + 1 }
      if (scope[idx].lowestLimit - scope[idx + 1].upperLimit > 1) { return scope[idx].lowestLimit }
      if (scope[idx].upperLimit + 1 >= scope[idx + 1].lowestLimit) { return scope[idx + 1].lowestLimit - 1 }
    },
    handleEndScopeMin (scope, idx) {
      if (
        !(idx + 1 >= scope.length) &&
        scope[idx + 1].lowestLimit - scope[idx].upperLimit >= 1
      ) { return scope[idx + 1].lowestLimit - 1 }
      return scope[idx]?.lowestLimit
    },
    handleEndScopeMax (scope, idx) {
      if (idx + 1 >= scope.length) return Infinity
      return scope[idx + 1].lowestLimit
    },
    updateBillingScope (scope = this.ownEditData.scope, isEnd) {
      if (isEnd) return // 배열의 양 끝에서 삭제가 일어날 경우

      scope.forEach((item, index) => {
        if (index === 0) return // 첫 데이터가 기준이므로 패스

        const validate = (pre, cur) => {
          if (cur.lowestLimit - pre.upperLimit > 1) return false
          return true
        }

        if (!validate(scope[index - 1], item)) {
          item.lowestLimit = scope[index - 1].upperLimit + 1
        }
      })
    },
    changeBillingScope (cur, old, scope) {
      if (cur > old) {
        // 증가
        scope.upperLimit++
      } else {
        // 감소
        scope.upperLimit--
      }
    },
    syncMatchService () {
      this.updateCurrentResource()
      this.matchServiceFromGrid()
      this.$emit('update-services', this.services, this.activeModel)
      if (this.$refs.fixedCompute) {
        this.$refs.fixedCompute.emitter()
      }
    },
    updateResource () {
      this.detailModalActive = false
      this.refreshTabData()
    },
    closeDetailResourceModal (requiredUpdate) {
      if (requiredUpdate) {
        // 목록 업데이트 필요
      }
      this.detailModalActive = false
    },
    async getBillingUnitTypes () {
      try {
        const units = await API.billing.getBillUnits()
        this.billUnits = units
      } catch (error) {
        this.$alert(error.response.data)
      }
    },
    async refreshTabData (searchKeyword = null) {
      /**
       * 고정 Compuete인 경우 모델에서 데이터를 가져온다.
       */
      if (this.tabData.field === 'fixed-compute') {
        if (this.isEdit) return
        // if (!this.parentModelGroup.apply) return // apply 아닌 애는 fixedComputes 가 있다!?

        const { data } = await API.billing.getFixedCompute(this.parentModelGroup.id)
        this.parentModelGroup.fixedComputes = data || []
        return
      }
      if (
        this.isEdit ||
        this.activeModel.adding ||
        this.parentModelGroup.copying
      ) {
        this.services = this.activeModel.options?.filter(
          option => option.billingModelCategory.categoryType === this.tabData.type
        )
        this.refreshGridSource()
        return
      }
      try {
        this.tabLoading = true
        this.services = await API.billing.getServicesByCategory(
          this.activeModel.id,
          this.tabData.type,
          searchKeyword
        )
        this.refreshGridSource()
      } catch (error) {
        console.log(error)
        this.$alert(this.$t('common.ALERT.BILL.002')) // 과금 모델을 불러오는데 문제가 발생했습니다.
      } finally {
        this.tabLoading = false
      }
    },
    updateCurrentResource () {
      if (this.services && this.services.length) {
        this.services.forEach(service => {
          const items = this.gridSource.filter(source => {
            return service.billingModelCategory.idx === source.billingModelCategory.idx
          })
          items.forEach((item, index) => {
            service.chargeType = item.chargeType
            service.chargeUnit = item.chargeUnit
            // service.fares[index] = item.scope
          })
        })
      }
    },
    applyAddSwLicense (gridData) {
      if (!gridData.length) return

      this.updateCurrentResource()

      const existMap = this.services.map(service => service.billingModelCategory.serviceId)
      const billingModelId = this.activeModel.id
      const billingModelCategoryIds = gridData.map(service => {
        if (!service.billingModelCategory) return service.serviceId
        return service.billingModelCategory.serviceId
      })

      this.services = this.services.filter(service => {
        return billingModelCategoryIds.includes(service.billingModelCategory.serviceId)
      })

      gridData = gridData.filter(data => {
        return !existMap.includes(data.serviceId)
      })

      const c = [ // 카테고리 키
        'categoryType',
        'createTime',
        'createUserIdx',
        'idx',
        'isUse',
        'name',
        'operatingSystem',
        'serviceId',
        'serviceType',
        'updateTime',
        'updateUserIdx',
        'version'
      ]

      const removedKey = [ // 삭제할 키
        'checkedRow',
        'no',
        // 'index',
        'scopeLength',
        'idx'
      ]

      gridData.forEach(data => {
        data.serviceIdx = data.idx
        data.billingModelCategory = {}
        data.billingModelId = billingModelId
        data.chargeUnit = this.billUnits[0].field
        data.note = ''
        c.forEach(key => {
          data.billingModelCategory[key] = data[key]
          delete data[key]
        })
        removedKey.forEach(key => delete data[key])
      })

      const defaultFare = {
        cost: 1000,
        lowestLimit: 1,
        standard: 1,
        upperLimit: 1
      }

      // fares null이면 배열로
      gridData.forEach(service => {
        service.chargeType = 1
        if (!service.fares) {
          service.fares = [{ ...defaultFare }]
        }
      })

      this.addSwModalActive = false
      if (gridData.length) this.services = this.services.concat(gridData)
      this.refreshGridSource()
      // this.$emit('update-services', this.services)
    },
    selectRow (row) {
      if (this.networkTab) {
        this.selectedNetworkRow = row?.dataItem
        return
      }
      if (row) {
        this.selectedItem = row.dataItem
      }
      this.detailModalActive = true
    },
    deleteBillingScope (row, index) {
      row.fares.splice(index, 1)
      const viewIndex = this.$refs.billingGrid.page.currPage === 1 ? row.index : row.index - ((this.$refs.billingGrid.page.currPage - 1) * this.pageSize)
      if (row.fares.length === 1) {
        this.grid.rows[viewIndex].height = 80
      } else {
        this.grid.rows[viewIndex].height = row.fares.length * 55 + 10
      }
    },
    addBillingScope (row, index) {
      const prev = row.fares[row.fares.length - 1]
      const removedPropertyScope = { ...prev }
      Object.keys(removedPropertyScope).forEach(key => {
        const targetKey = [
          'createTime',
          'createUserIdx',
          'id',
          'updateTime',
          'updateUserIdx'
        ]
        if (targetKey.includes(key)) {
          delete removedPropertyScope[key]
        }
      })
      row.fares.push({ ...removedPropertyScope, lowestLimit: prev.upperLimit + 1, upperLimit: prev.upperLimit + 1 })
      const viewIndex = this.$refs.billingGrid.page.currPage === 1 ? row.index : row.index - ((this.$refs.billingGrid.page.currPage - 1) * this.pageSize)
      this.grid.rows[viewIndex].height = row.fares.length * 55 + 10
    },
    matchServiceFromGrid () {
      this.services = this.services.map(service => {
        const sources = this.gridSource.filter(
          source => source.serviceIdx === service.serviceIdx
        )
        const one = sources[0]
        Object.keys(service.billingModelCategory).forEach(key => {
          delete service[key]
        })
        if (one) {
          return {
            ...one,
            serviceType: one.serviceType,
            chargeUnit: one.chargeUnit,
            chargeType: one.chargeType,
            billingModelCategory: {
              ...one.billingModelCategory,
              name: one.billingModelCategory.name,
              version: one.billingModelCategory.version
            }
          // fares: sources.map(source => source.scope)
          }
        } else { return service }
      })
    },
    refreshIdx (row) {
      const nodes = this.gridSource.filter(source => source.id === row.id)

      if (nodes.length) {
        nodes.forEach((data, index) => {
          data.scopeIdx = index
        })
      }
    },
    refreshScopeLength (source) {
      const mapIdx = this.gridSource.filter(
        data => source.billingModelCategory.idx === data.billingModelCategory.idx
      )
      source.scopeLength = mapIdx.length
    },
    refreshGridSource () {
      const sources = []

      if (this.services && this.services.length && this.isEdit) {
        this.services.forEach((data, _) => {
          sources.push({ ...data })
        })
      } else {
        this.services.forEach((data, _) => {
          sources.push({
            ...data,
            scopeLength: data.fares.length,
            billingModelCategory: {
              ...data.billingModelCategory
            }
          })
        })
      }

      this.gridSource = sources.map(source => {
        if (source.billingModelCategory.categoryType === 2) {
          return {
            ...source,
            isNew: this.$route.query.isEdit ? this.parentModelGroup.applyDate <= source.billingModelCategory.createTime : false
          }
        } else {
          return { ...source }
        }
        // return {...source, isNew: this.parentModelGroup.applyDate <= }
      })
      this.gridSource.forEach(this.refreshScopeLength)
      this.gridSource.sort((a, b) => {
        if (a.isNew && b.isNew) return 1
        if (a.isNew && !b.isNew) return -1
        if (!a.isNew && b.isNew) return 1
        return 0
      })
      this.setColumnDataMap()
    },
    // 고정 과금/변동 과금 변경 이벤트
    onChangeBillingSystem (props, e) {
      // const page = this.$refs.billingGrid.page.currPage
      const { row } = props

      const target = this.gridSource.filter((data, arrayIdx) => {
        data.arrayIdx = arrayIdx
        return data.serviceIdx === row.serviceIdx
      })

      if (target.length) {
        // 과금 체계 변경
        target.forEach(data => (data.chargeType = e))

        // 변동 과금 -> 고정 과금
        if (e === 1) {
          props.row.cache = [...props.row.fares]
          props.row.fares = [props.row.fares[0]]
          this.gridSource.forEach(this.refreshScopeLength)
        } else {
          if (props.row.cache) {
            props.row.fares = [...props.row.cache]
            delete props.row.cache
          }
        }
      }

      this.updateRowHeightByViewIndex(props.row.index, props.row.fares.length !== 1, e !== 1 ? props.row.fares.length : 1)
    },
    // Row 삭제
    deleteRow (row) {
      const pageTemp = this.$refs.billingGrid.page.currPage - 1
      const newSources = this.gridSource.filter(
        source => source.billingModelCategory.idx !== row.billingModelCategory.idx
      )
      const serviceIdx = this.services.findIndex(
        service => service.billingModelCategory.idx === row.billingModelCategory.idx
      )
      this.gridSource = newSources
      if (serviceIdx !== -1) this.services.splice(serviceIdx, 1)
      // this.syncMatchService()
      this.updateCurrentResource()
      this.matchServiceFromGrid()
      this.$emit('delete-service', row)
      this.$nextTick(() => {
        setTimeout(() => this.$refs.billingGrid.data.moveToPage(pageTemp), 0)
      })
    },
    // 검색(그리드)
    testSearch () {
      this.refreshTabData(this.search)
    },
    // 검색 내용 초기화
    resetSearch () {
      this.search = ''
      this.refreshTabData(null)
    },
    gridInit (grid) {
      this.grid = grid
      grid.loadedRows.addHandler(() => {
        grid.rows.forEach((row, index) => {
          if (grid.rows[index].dataItem.fares.length === 1) {
            requestAnimationFrame(() => {
              row.height = 80
            })
          } else {
            requestAnimationFrame(() => {
              row.height = row.dataItem.fares.length * 55 + 10
            })
          }
        })
      })
      // this.grid.mergeManager = new RestrictedMergeManager()
    },
    initColumnDataMap () {
      this.columnDataMap = {
        'billingModelCategory.name': [],
        chargeUnit: [],
        chargeType: [],
        serviceType: [],
        version: []
      }
    },
    setColumnDataMap () {
      this.initColumnDataMap()
      if (!this.isEdit) {
        this.gridSource.forEach(source => {
          this.columnDataMap.chargeUnit.push({ value: source.chargeUnit, caption: source.rawChargeUnit })
          this.columnDataMap.chargeType.push({ value: source.chargeType, caption: source.rawChargeType })
          this.columnDataMap.serviceType.push({ value: source.serviceType, caption: source.rawServiceType })
          this.columnDataMap['billingModelCategory.name'].push({ value: source.billingModelCategory.name, caption: source.billingModelCategory.rawName })
          if (this.tabData.type === 2) this.columnDataMap.version.push({ value: source.billingModelCategory.version, caption: source.billingModelCategory.rawVersion })
        })
      }
    }
  },
  data: root => ({
    isActiveEditNetworkResource: false,
    emptyExcelGrid: false, // 엑셀 그릴 때 그리드가 비어있을 때
    going: false,
    noEditGrid: null,
    billUnits: [],
    services: [],
    tabLoading: false,
    addSwModalActive: false,
    selectedItem: null,
    detailModalActive: false,
    gridSource: [],
    editData: {
      billingSystemOption: [
        {
          name: root.$t('bill.MODEL.fixed'),
          value: 1
        },
        {
          name: root.$t('bill.MODEL.variable'),
          value: 2
        }
      ],
      coreLabelOption: []
    },
    search: '',
    searchMode: false,
    filteredGridSource: [],
    grid: null,
    columnDataMap: {
      'billingModelCategory.name': [],
      chargeUnit: [],
      chargeType: [],
      serviceType: [],
      version: []
    },
    gridHeader: gridHeader(root),
    gridHeaderDetail: gridHeaderDetail(root),
    pageSize: 10,
    selectedNetworkRow: null,
    isNetworkEdit: false
  })
}
</script>

<style lang="scss">
#cmp-billing-grid.wj-flexgrid {
  & .wj-row:hover .wj-cell:not(.wj-header):not(.selected-row) {
    background-color: transparent !important;
    color: $white !important;
  }

  & .wj-cells {
    overflow: hidden;
  }

  & .wj-cell:not(.wj-header) {
    padding: 0 10px !important;

    &.no-padding-cell {
      padding: 10px 0 !important;
    }

    & > div {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    & .range-first,
    & .range-middle {
      border-bottom: 1px dashed $main-black;
    }

    & .range-first,
    & .range-middle,
    & .range-end {
      padding: $gap-s 0;
    }
  }
}

.selcet-billing-charge-unit {
  width: 100px;
}

#no-edit-grid {
  /* & .selected-row {
    background-color: transparent !important;
    color: $light-gray !important;

    & > * {
      color: $light-gray !important;
    }
  } */

  & .range-first,
  & .range-middle {
    border-bottom: 1px dashed $main-black;
  }

  & .range-first,
  & .range-middle,
  & .range-end {
    padding: $gap-s 0;
  }

  & .wj-cell:not(.wj-header) {
    padding: 0;
  }
}
</style>

<style lang="scss" scoped>
.billing-tab {
  display: flex;
  flex-wrap: wrap;

  .crud-action {
    margin-left: auto;
    margin-bottom: $gap;

    > .button + .button {
      margin-left: 5px;
    }
  }

  &-header {
    display: flex;
    justify-content: space-between;
    width: 100%;

    &__new-sw {
      margin-top: 30px;
    }
  }

  &-grid {
    width: 100%;
  }

  & .edit-idx {
    display: flex;
    align-items: center;
  }

  & .new-tag {
    padding: 2px 5px;
    font-size: 9px;
    background-color: #ca5b57;
    border-radius: 2px;
    color: white;
    margin-right: $gap-s;
  }

  & .billing-system-radio {
    flex-wrap: wrap;

    & .el-radio {
      align-items: unset;
    }

    :first-child {
      margin-bottom: $gap-s;
    }
  }

  & .billing-scope {
    &-start,
    &-end {
      min-width: 100px;
      width: 100px;

      &::v-deep .el-input__inner {
        padding: 0;
      }
    }

    &-price {
      width: 150px;
    }

    &-wrapper {
      position: relative;
      width: 100%;

      & .button-wrap {
        position: absolute;
        margin-top: 3px;

        &.add {
          margin-left: calc(#{$gap-s / 2} + 28px);
          color: $input-placeholder;
        }

        &.delete {
          margin-left: $gap-s / 2;
        }

        & .el-icon {
          font-size: 22px;
        }
      }
    }
  }

  /* & .file-svg {
    background: url("../../../assets/images/file.svg") no-repeat;
    display: inline-block;
    width: 20px;
    height: 20px;
  } */
  .no-edit-grid-wrapper {
    &::v-deep .wj-row:hover {
      .file-svg,
      .file-svg * {
        fill: $purple-gray;
      }
    }
  }
}
</style>
