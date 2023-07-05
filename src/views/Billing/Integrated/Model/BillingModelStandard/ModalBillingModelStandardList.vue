<!--
  * 파일명 : BillingModelStandardList.vue
  * 파일 기능 : [빌링 > 모델 > 과금모델] 과금모델 모든 리스트를 확인합니다. (2차)
  * 작성자 : 이유준
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
      v-loading="isLoadingNonApplyModel"
      class="billing-panel left tiny-scroll"
      :padding-top="0"
    >
      <div class="down-body">
        <div
          class="billing-filter"
        />
        <template v-if="modelGroupsNonApply.length">
          <div
            v-for="(model, modelIdx) in allModels"
            :key="model.id"
            class="billing-model-list"
          >
            <billing-model
              ref="billingModel"
              :model-data="model"
              :is-apply-model="false"
              :init-open="model.apply"
              @active-model="updateActiveModel"
              @active-children-model="updateChildrenActiveModel"
              @open-model="(model) => onOpenModel(model, modelIdx)"
              billing-type="c"
              no-icon
            />
          </div>
        </template>
        <template v-else>
          <div class="empty-data">
            {{ $t('common.PLACEHOLDER.noData') }}
          </div>
        </template>
      </div>
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

      <g-tab
        :data="tabData"
        :padding-top="30"
      >
        <template
          v-for="tab in tabData"
          v-slot:[tab.field]
        >
          <billing-tabs
            v-if="!loading && activeModel"
            :key="tab.field"
            :tab-data="tab"
            :active-model="activeModel"
            :root-model-group="activeModelGroup"
            :network-equip="networkEquip"
            readonly
          />
        </template>
      </g-tab>
    </dashboard-panel>
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

export default {
  name: 'ModalBillingModelStandardList',
  mixins: [BillingModelMixins],
  components: {
    'dashboard-panel': DashboardPanel,
    BillingModel,
    BillingTabs
  },
  computed: {
    activeModelName () {
      return this.modelTypeMap[this.activeModel.type]
    }
  },
  watch: {
    filterOption (filterValue) {
      this.getModelGroupsByIsBilling(filterValue)
    }
  },
  async created () {
    await this.initModelGroups()
    await this.getNetworkEquip()
  },
  methods: {
    async getNetworkEquip () {
      try {
        const res = await API.network.getEquipNetworks()
        this.networkEquip = res
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('네트워크 장비 조회에 실패하였습니다.'))
      }
    },
    onOpenModel (model, modelIdx) {
      if (this.selectedModelIdx !== -1) {
        this.$refs.billingModel[this.selectedModelIdx].isOpenNoApplyModel = false
      }
      this.selectedModelIdx = modelIdx
      this.selectedModel = model
      this.$emit('change-selected-model', this.selectedModel)

      this.updateActiveModel(model.models[0])
    },
    async initModelGroups () {
      this.loading = true
      this.isLoadingNonApplyModel = true

      try {
        // const applyModelGroup = await API.billing.getApplyModelGroup()
        const allModelGroups = await API.billing.getModelGroups()

        this.rawModelGroupsNonApply = allModelGroups.filter(
          modelGroup => !modelGroup.apply
        )
        this.modelGroupsNonApply = allModelGroups.filter(
          modelGroup => !modelGroup.apply
        )
        this.initExpandable(allModelGroups)

        this.allModels = allModelGroups
        this.allModels.sort((a, b) => {
          if (a.apply) return -1
          else if (b.apply) return 1
          return b.createTime - a.createTime
        })

        const applyModelGroup = allModelGroups.find(m => m.apply)

        this.rawModelGroups = applyModelGroup
        this.modelGroups = cloneDeep(applyModelGroup)
        this.setNonApplyActiveKey(this.modelGroupsNonApply)

        // this.initExpandable(this.modelGroups)
        this.initActive()

        this.loading = false
      } catch (error) {
        console.error(error)
      } finally {
        this.isLoadingNonApplyModel = false
      }
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
      // this.modelGroups.models.forEach(model => this.unActiveModel(model))
      flatten(
        this.allModels.map(modelGroups => modelGroups.models)
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
    selectedModel: null,
    selectedModelIdx: -1,
    allModels: [],
    loading: true,
    filterOption: 2,
    rawModelGroups: null,
    rawModelGroupsNonApply: null,
    modelGroups: {},
    modelGroupsNonApply: [],
    activeModel: {},
    activeModelGroup: {},
    tabData: tabData(root),
    isOpenAllModel: true,
    digitMap: digitMap(root),
    roundMap: roundMap(root),
    isLoadingNonApplyModel: false,
    networkEquip: []
  })
}
</script>

<style lang="scss" scoped>
.billing-model-standard-list {
  display: flex;
  min-height: 800px;

  & .billing-panel {
    &::v-deep {
      .panel-head {
        display: none;
      }
    }
    &.left {
      max-height: 800px;
      overflow-y: auto;
      min-width: 385px;
      flex: 1 1 25%;
      margin-right: 40px;
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

        & .billing-model-list:not(:last-child) {
          margin-bottom: 8px;
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
    }

    &.right {
      overflow-x: auto;
      flex: 1 1 75%;
      flex-direction: row;

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
}
</style>

<style lang="scss">
.new-sw-tooltip-info {
  max-width: 120px;
}
</style>
