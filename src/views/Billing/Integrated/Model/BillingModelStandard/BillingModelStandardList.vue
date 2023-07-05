<!--
  * 파일명 : BillingModelStandardList.vue
  * 파일 기능 : [빌링 > 모델 > 과금모델] 과금모델 모든 리스트를 확인합니다. (2차)
  * 작성자 : 이경환
  * 최종 작성일 : 2021-07-05
  * License By Shinsegae I&C
  * 빌링 과금 모델 2차 UI 적용중
 -->

<template>
  <div
    class="billing-model-standard-list"
    v-loading="loading"
  >
    <dashboard-panel
      v-if="true"
      class="billing-panel left"
      :title="$t('bill.MODEL.applyBillModel')"
      :padding-top="14"
    >
      <template #headerPostfix>
        <span class="postfix">
          ({{ $t("bill.MODEL.newSwCount", { count: modelGroups.newSwCount }) }})
          <el-tooltip
            placement="top"
            effect="light"
            popper-class="new-sw-tooltip-info"
          >
            <i class="el-icon-warning-outline icon" />
            <template #content>
              <span>
                {{ $t("bill.MODEL.PLACEHOLDER.tooltip") }}
              </span>
            </template>
          </el-tooltip>
        </span>
      </template>

      <template #header>
        <div class="header-button-area">
          <button
            class="button"
            type="is-primary"
            @click="moveToNew"
          >
            {{ $t("bill.MODEL.newButton") }}
          </button>
        </div>
      </template>

      <billing-model
        :key="modelGroups.name"
        :model-data="modelGroups"
        billing-type="b"
        is-apply-model
        @active-model="updateActiveModel"
        @active-children-model="updateChildrenActiveModel"
      />

      <dashboard-panel
        v-loading="isLoadingNonApplyModel"
        class="billing-panel left down"
        :title="$t('bill.MODEL.allModel')"
        :padding-top="14"
      >
        <template #headerPostfix>
          <span
            class="postfix"
          >({{
            $t("bill.MODEL.allCount", { count: modelGroupsNonApply.length })
          }})</span>
        </template>

        <template #header>
          <div class="all-model-icons">
            <div
              v-if="!isOpenAllModel"
              @click="isOpenAllModel = true"
            >
              {{ $t("bill.MODEL.PLACEHOLDER.open") }}
              <i class="el-icon-arrow-down" />
            </div>
            <div
              v-else
              @click="isOpenAllModel = false"
            >
              {{ $t("bill.MODEL.PLACEHOLDER.close") }}
              <i class="el-icon-arrow-up" />
            </div>
          </div>
        </template>

        <div class="down-body">
          <div v-show="isOpenAllModel">
            <div
              class="billing-filter"
            >
              <div class="is-billing-text">
                {{ $t("bill.MODEL.filterBilling") }}
              </div>
              <div class="radio-group">
                <el-radio-group
                  v-model="filterOption"
                  class="filter-radio-group"
                >
                  <el-radio :label="2">
                    {{ $t("main.DASHBOARD.all") }}
                  </el-radio>
                  <el-radio :label="1">
                    Y
                  </el-radio>
                  <el-radio :label="0">
                    N
                  </el-radio>
                </el-radio-group>
              </div>
            </div>
            <template v-if="modelGroupsNonApply.length">
              <div class="billing-model-list-wrapper">
                <div
                  v-for="(model, modelIdx) in sortedNonApplyModels"
                  :key="model.id"
                  class="billing-model-list"
                >
                  <billing-model
                    :key="model.id"
                    :model-data="model"
                    :no-apply-index="modelIdx"
                    billing-type="b"
                    @active-model="updateActiveModel"
                    @active-children-model="updateChildrenActiveModel"
                    @delete-model-group="deleteModelGroup"
                    @update-apply="updateApply"
                  />
                </div>
              </div>
            </template>
            <template v-else>
              <div class="empty-data">
                {{ $t('common.PLACEHOLDER.noData') }}
              </div>
            </template>
          </div>
        </div>
      </dashboard-panel>
    </dashboard-panel>
    <dashboard-panel
      class="billing-panel right"
      :title="activeModelName"
      :padding-top="30"
    >
      <template #headerPostfix>
        <div
          v-if="activeModel.type === 3"
          class="aff-postfix"
        >
          <i class="el-icon el-icon-arrow-right" />
          <span class="aff-name">{{ activeModel.companyName }}</span>
        </div>
        <span class="standard-info">
          {{ $t("bill.MODEL.digits") }} :
          {{ digitMap[activeModel.farePositionalNumber] }},
          {{ roundMap[activeModel.roundType] }}
        </span>
      </template>
      <template #header>
        <div class="header-button-area">
          <button
            v-loading="isExcelGridLoading"
            class="button"
            @click="startXlsxConvert"
          >
            {{ $t("common.BTN.excelDownload") }}
            <i class="download-icon" />
          </button>
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
            v-if="!loading && activeModel"
            ref="detailTab"
            :key="tab.field"
            :tab-data="tab"
            :active-model="activeModel"
            :parent-model-group="activeModelGroup"
            :network-equip="networkEquip"
            @init-grid="initTabsGrid"
            @new-network="onCreateNetwork"
            @delete-network="onDeleteNetwork"
            @update-network="onUpdateNetwork"
          />
        </template>
      </g-tab>
    </dashboard-panel>
    <div
      v-if="isExcelGridLoading"
      v-show="false"
      class="hide-grid"
    >
      <billing-tabs
        v-for="item in tabData"
        ref="excelGridTabs"
        :key="item.type"
        :tab-data="item"
        :active-model="activeModel"
        :root-model-group="activeModelGroup"
        @init-grid="initExcelGrid"
      />
    </div>
  </div>
</template>

<script>
import API, { DashboardPanel } from '@sd-fe/cmp-core'
import BillingModel from '@/components/Billing/BillingModel.vue'
import BillingTabs from '@/components/Billing/Tabs/BillingTabs.vue'
import BillingModelMixins from '@/components/Billing/BillingModel.mixins'
import { flatten, cloneDeep } from 'lodash'
import {
  tabData,
  digitMap,
  roundMap
} from './BillingModelStandardList.column'
import * as wjGridXlsx from '@grapecity/wijmo.grid.xlsx'
import { mapGetters } from 'vuex'

export default {
  name: 'BillingModelStandardList',
  mixins: [BillingModelMixins],
  components: {
    'dashboard-panel': DashboardPanel,
    BillingModel,
    BillingTabs
  },
  computed: {
    ...mapGetters({
      cloud: 'cloud/getCloud'
    }),
    tabDataByModuleType () {
      const moduleType = {
        nutanix: 'NX',
        vmware: 'VMWARE'
      }[this.cloud]

      return this.tabData.filter(tab => tab.moduleType.includes(moduleType))
    },
    activeModelName () {
      return this.modelTypeMap[this.activeModel.type]
    },
    sortedNonApplyModels () {
      return [...this.modelGroupsNonApply].sort((a, b) => {
        if (a.confirm) return -1
        else if (b.confirm) return 1
        return b.createTime - a.createTime
      })
    }
  },
  watch: {
    filterOption (filterValue) {
      this.getModelGroupsByIsBilling(filterValue)
    },
    'excelGrid.length' (length) {
      if (length === 5) {
        this.isLoadedAllExcelGrid = true
        this.excelDownload()
      }
    }
  },
  async created () {
    await this.getNetworkEquip()
    await this.initModelGroups()
  },
  methods: {
    async onCreateNetwork (newNetwork) {
      this.activeModel.options.push(newNetwork)
      await API.billing.updateModelGroups({ ...this.activeModelGroup, fixedComputes: this.activeModelGroup.fixedComputes || [] })
      this.$refs.detailTab[0].refreshTabData()
    },
    async onDeleteNetwork (selectedRow) {
      if (selectedRow) {
        this.activeModel.options = this.activeModel.options.filter(option => option.id !== selectedRow.id)
        await API.billing.updateModelGroups({ ...this.activeModelGroup, fixedComputes: this.activeModelGroup.fixedComputes || [] })
        this.$refs.detailTab[0].refreshTabData()
      }
    },
    async onUpdateNetwork (selectedRow, updateNetwork) {
      if (selectedRow && updateNetwork) {
        const fi = this.activeModel.options.findIndex(option => option.id === selectedRow.id)
        if (fi !== -1) this.activeModel.options[fi] = updateNetwork
        await API.billing.updateModelGroups({ ...this.activeModelGroup, fixedComputes: this.activeModelGroup.fixedComputes || [] })
        this.$refs.detailTab[0].refreshTabData()
      }
    },
    async getNetworkEquip () {
      try {
        const res = await API.network.getEquipNetworks()
        this.networkEquip = res
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('네트워크 장비 조회에 실패하였습니다.'))
      }
    },
    initExcelGrid (grid) {
      this.excelGrid.push(grid)
    },
    initTabsGrid (grid) {
      this.isInitGrid = true
      this.noEditGrid = grid
    },
    xlsxConverter (allGrid, nameMap) {
      let book
      let books = null

      allGrid.forEach((grid, index) => {
        if (!grid) return

        book = wjGridXlsx.FlexGridXlsxConverter.saveAsync(grid, {
          includeColumnHeaders: true,
          formatItem: args => {
            const { row, xlsxCell } = args
            const realCol = args.getColumn(args.col)
            const realRow = args.getRow(row)

            // customHtml인 아이템
            // const customColumns = ['scope.standard', 'scope.cost']

            xlsxCell.style.vAlign = 1

            if (realRow.dataItem) {
              xlsxCell.style.font.color = '#000'
            }

            if (realRow.dataItem) {
              xlsxCell.value = 1
              const { dataItem: item } = realRow

              if (realCol.binding.endsWith('.cost')) {
                const allCost = item.fares.map(
                  fare => '₩ ' + fare.cost.toLocaleString()
                )
                xlsxCell.value = allCost.join('\n')
              } else if (realCol.binding.endsWith('.standard')) {
                const allRange = item.fares.map(fare =>
                  item.chargeType === 1
                    ? fare.standard
                    : `${fare.lowestLimit} ~ ${fare.upperLimit}`
                )
                xlsxCell.value = allRange.join('\n')
              } else if (realCol.binding === 'index') {
                xlsxCell.value = parseInt(item.index) + 1
              } else if (index === 1 && realCol.binding === 'category.name') {
                xlsxCell.value = `${item.billingModelCategory.name} / ${item.billingModelCategory.operatingSystem}`
              }
            }
          }
        })

        book.sheets[0].name = nameMap[index]

        if (!books) {
          books = book
        } else {
          books.sheets.push(book.sheets[0])
        }
      })

      books.saveAsync(this.activeModelGroup.name + '.xlsx')
    },
    excelDownload () {
      setTimeout(() => {
        this.xlsxConverter(
          this.$refs.excelGridTabs.map(tab => tab.noEditGrid),
          this.$refs.excelGridTabs.map(tab => tab.tabData.name)
        )
        this.isExcelGridLoading = false
        this.isLoadedAllExcelGrid = false
        this.excelGrid = []
      }, 1000)
    },
    startXlsxConvert () {
      this.isExcelGridLoading = true
    },
    async initModelGroups () {
      this.loading = true
      this.isLoadingNonApplyModel = true

      try {
        const applyModelGroup = await API.billing.getApplyModelGroup()

        API.billing.getModelGroups()
          .then(allModelGroups => {
            this.rawModelGroupsNonApply = allModelGroups.filter(
              modelGroup => !modelGroup.apply
            )
            this.modelGroupsNonApply = allModelGroups.filter(
              modelGroup => !modelGroup.apply
            )
            this.initExpandable(this.modelGroupsNonApply)
          })
          .catch(error => {
            this.$alert(
              this.$t('common.ALERT.BILL.002') + `<br/>${error.message}`,
              { dangerouslyUseHTMLString: true }
            )
          })
          .finally(() => {
            this.isLoadingNonApplyModel = false
          })

        this.rawModelGroups = applyModelGroup
        this.modelGroups = cloneDeep(applyModelGroup)
        this.setNonApplyActiveKey(this.modelGroupsNonApply)

        this.initExpandable(this.modelGroups)
        this.initActive()

        this.loading = false
      } catch (error) {
        console.error(error)
      }
    },
    updateApply (modelGroup) {
      this.$confirm(this.$t('common.CONFIRM.BILL.012')).then(async () => {
        try {
          const { id } = modelGroup
          await API.billing.applyModelGroup(id)
          this.$alert(this.$t('common.ALERT.BASE.019')) // 성공적으로 변경되었습니다.
          await this.initModelGroups()
        } catch (error) {
          this.$alert(this.$t('common.ALERT.BASE.020')) // 실패하였습니다.
        }
      })
    },
    deleteModelGroup (modelGroup) {
      // 정말 삭제하시겠습니까?
      this.$confirm(this.$t('common.CONFIRM.BASE.020')).then(async () => {
        try {
          const { id } = modelGroup
          await API.billing.deleteModelGroup(id)
          this.$alert(this.$t('common.ALERT.PROJECT.013')) // 삭제되었습니다. 목록을 갱신합니다.
          await this.initModelGroups()
        } catch (error) {
          this.$alert(this.$t('common.ALERT.BASE.020')) // 실패하였습니다.
        }
      })
    },
    setNonApplyActiveKey (modelGroups) {
      this.modelGroupsNonApply = modelGroups?.map(modelGroup => {
        const obj = {
          ...modelGroup
        }
        this.$set(obj, 'acitve', false)
        return obj
      })
    },
    async getModelGroupsByIsBilling (value) {
      try {
        this.loading = true
        const data = await API.billing.getModelGroupsNonApply(value)
        this.setNonApplyActiveKey(data)
        this.initExpandable(this.modelGroupsNonApply)
      } catch (error) {
        this.$alert(this.$t('common.ALERT.BILL.002')) // 과금 모델을 불러오는데 문제가 발생했습니다.
      } finally {
        this.loading = false
      }
    },
    initExpandable (target) {
      if (Array.isArray(target)) {
        target.forEach(item => this.initExpandable(item))
      } else if (target?.models && target?.models.length) {
        target.models.forEach(model => {
          if (model.type === 3) {
            this.$set(model, 'expandable', true)
            this.$set(model, 'expanded', false)
            model.models.forEach(innerModel => {
              this.$set(innerModel, 'active', false)
            })
          } else {
            this.$set(model, 'active', false)
          }
        })
      }
    },
    initActive () {
      if (this.modelGroups && this.modelGroups.models) {
        this.modelGroups.models.forEach((model, index) => {
          if (index === 0) {
            this.activeModel = model
            this.activeModelGroup = this.modelGroups
          }
          this.$set(model, 'active', index === 0)
        })
      }
    },
    moveToNew () {
      this.$router.push({
        name: 'nx-billing-model-standard-new-detail'
      })
    },
    unActiveModel (model) {
      if (model.type !== 3) {
        model.active = false
        if (model.models && model.models.length) {
          model.models.forEach(innerModel => (innerModel.active = false))
        }
      } else {
        model.expanded = false
        model.active = false
        model.models.forEach(innerModel => (innerModel.active = false))
      }
    },
    allUnActive () {
      // apply model
      this.modelGroups.models.forEach(model => this.unActiveModel(model))
      flatten(
        this.modelGroupsNonApply.map(modelGroups => modelGroups.models)
      ).forEach(modelGroups => this.unActiveModel(modelGroups))
    },
    updateChildrenActiveModel (item, isApplyModel, parentModel) {
      this.allUnActive()
      if (isApplyModel) {
        parentModel.expanded = true
        const notAffModels = this.modelGroups.models.filter(
          model => model.type !== 3
        )
        notAffModels.forEach(model => this.unActiveModel(model))
        parentModel.models.forEach(model => (model.active = false))
      } else {
        if (item.type === 3) parentModel.expanded = true
      }
      item.active = true
      this.activeModel = item
      this.findParentModelGroup(item)
    },
    updateActiveModel (model, modelIdx, isApplyModel, noApplyIdx) {
      const temp = model.expandable
        ? model.expanded
          ? 2 // 열려 있음
          : 3 // 닫혀 있음
        : false
      if (model.expandable) {
        model.expanded = temp !== 2
      } else {
        this.allUnActive()
        model.active = true
        this.activeModel = model
        this.findParentModelGroup(model)
      }
    },
    findParentModelGroup (model) {
      if (model.type === 3) {
        const allModels = [
          this.modelGroups,
          ...this.modelGroupsNonApply
        ].filter(modelGroup => modelGroup.models.length > 1)
        const target = allModels.find(parentModelGroup => {
          const affModels = parentModelGroup.models.find(
            innerModel => innerModel.type === 3
          )
          if (!affModels) return false
          else {
            return (
              affModels.models.findIndex(
                innerModel => innerModel.id === model.id
              ) !== -1
            )
          }
        })
        this.activeModelGroup = target
      } else {
        const allModels = [this.modelGroups, ...this.modelGroupsNonApply]
        const target = allModels.find(parentModelGroup => {
          const tModel = parentModelGroup.models.findIndex(
            innerModel => innerModel.type !== 3 && innerModel.id === model.id
          )
          return tModel !== -1
        })
        this.activeModelGroup = target
      }
    }
  },
  data: root => ({
    noEditGrid: false,
    isInitGrid: false,
    loading: true,
    filterOption: 2,
    rawModelGroups: null,
    rawModelGroupsNonApply: null,
    modelGroups: {},
    modelGroupsNonApply: [],
    activeModel: {},
    activeModelGroup: {},
    tabData: tabData(root),
    isOpenAllModel: false,
    digitMap: digitMap(root),
    roundMap: roundMap(root),
    excelGrid: [],
    isLoadedAllExcelGrid: false,
    isExcelGridLoading: false,
    isLoadingNonApplyModel: false,
    networkEquip: []
  })
}
</script>

<style lang="scss" scoped>
.billing-model-standard-list {
  display: flex;

  & .billing-panel {
    overflow: hidden;

    &.left {
      min-width: 385px;
      margin-right: $gap * 2;
      flex: 1 1 25%;

      &.down {
        margin-top: $gap * 2;

        & .all-model-icons {
          font-size: 12px;
          color: $light-gray;
          cursor: pointer;
          transition: color 250ms ease;

          &:hover {
            color: $white;
          }

          & i[class^="el-icon-"] {
            margin: 2px 0 3px 4px;
            font-weight: bolder;
            color: $white;
          }
        }

        & .billing-filter {
          display: flex;
          justify-content: space-between;
          margin-bottom: $gap;
          margin-top: $gap-s;

          & .is-billing-text {
            color: $light-gray;
            font-size: 12px;
          }

          & .filter-radio-group {
            &::v-deep > .el-radio {
              &:not(:last-child) {
                margin-right: $gap !important;
              }
            }
          }
        }

        & .billing-model-list-wrapper {
          padding-right: 10px;
          max-height: 700px;
          overflow-y: auto;
        }

        & .billing-model-list:not(:last-child) {
          margin-bottom: 8px;
        }
      }

      & span.postfix {
        color: #bbb;
        font-size: 12px;
        font-weight: normal;
        padding-left: 5px;

        & .icon {
          font-size: 16px;
          padding-left: 5px;
          vertical-align: text-bottom;
          color: $main-blue;
          transform: rotate(180deg);
        }
      }

      &::v-deep .panel-body {
        border-top: 1px solid $main-black;
      }
    }

    &.right {
      flex: 1 1 75%;

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

      & .header-button-area {
        & .download-icon {
          margin-left: $gap-s / 2;
          position: relative;
          top: 2px;
        }
      }

      &::v-deep .panel-body {
        border-color: transparent;
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

<style lang="scss">
.new-sw-tooltip-info {
  max-width: 120px;
}
</style>
