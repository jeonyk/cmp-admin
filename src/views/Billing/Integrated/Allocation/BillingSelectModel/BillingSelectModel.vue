<!--
  * 파일명 : BillingSelectModel.vue
  * 파일 기능 :
  * 작성자 : 김예담 외 2명
  * 최종 작성일 : 2021-01-06
  * License By Shinsegae I&C
  * 2021-01-06 fix: [빌링 - 과금 배치]- loading 추가
 -->

<template>
  <section class="billing-select-model">
    <div class="billing-select-model-contents">
      <dashboard-panel
        class="body-panel -left"
        :title="$t('bill.billModel')"
        :padding-top="0"
      >
        <div
          class="side-tree-area tiny-scroll"
          v-loading="loading"
        >
          <g-tree
            :data="treeData"
            @selected="setSelectTreeItem"
            :selectable-company="false"
            fold-icon="chevron"
            :selectable-roots-only="false"
          >
            <template #title="{ node }">
              <span>
                {{ node.label }}
              </span>
            </template>
          </g-tree>
        </div>
      </dashboard-panel>
      <!-- 사이드 트리 영역 -->

      <dashboard-panel
        class="body-panel -right"
        :title="$t('common.GRID.resInfo')"
      >
        <article
          v-if="selectedModel && rootModel"
          class="resource-contents"
        >
          <h5
            class="sub-title"
            v-if="selectedModel"
          >
            {{ selectedModel ? selectedModel.label : '' }}
          </h5>

          <g-tab
            :data="tabData"
            class="tab-list"
          >
            <template
              v-for="tab in tabData"
              v-slot:[tab.field]
            >
              <billing-tabs
                :key="tab.field"
                ref="detailTab"
                readonly
                :tab-data="tab"
                :active-model="selectedModel"
                :parent-model-group="rootModel"
                :network-equip="networkEquip"
              />
            </template>
          </g-tab>
        </article>
      </dashboard-panel>
    </div>

    <div class="button-area -center">
      <button
        class="button"
        type="is-anti"
        @click="cancel"
      >
        {{ $t('common.BTN.back') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="save"
      >
        {{ $t('common.BTN.apply') }}
      </button>
    </div>
  </section>
  <!-- /.modal-body -->
</template>
<script>
import API, { DashboardPanel, GTree } from '@sd-fe/cmp-core'
import { uniqueId } from 'lodash'
// import * as wjGrid from '@grapecity/wijmo.grid'
// import FileIcon from '@/components/Icons/FileIcon.vue'
import { tabData } from '@/views/Billing/Integrated/Model/BillingModelStandard/BillingModelStandardList.column'
import BillingTabs from '@/components/Billing/Tabs/BillingTabs.vue'

// class BillingMergeManager extends wjGrid.MergeManager {
//   getMergedRange (panel, r, c, clip = true) {
//     const rng = new wjGrid.CellRange(r, c)

//     if (panel.rows.length <= 1) return
//     if (!panel.grid || !panel.grid.itemsSource) return

//     // 그리드 데이터
//     const gridData = panel.grid.itemsSource.items
//     const currentData = gridData[r]

//     if (currentData.chargeType === 1) return
//     if (currentData.chargeType === 2 && currentData.fares.length === 1) return

//     if (c === 2) return

//     const deepSelect = (obj, query) => {
//       let undef
//       query = query.split('.')

//       while (obj && query[0]) {
//         obj = obj[query.shift()] || undef
//       }

//       return obj
//     }

//     const compareKey = c === 0 ? 'category.mixedName' : 'uniqueChargeUnit'

//     for (let i = rng.row; i < panel.rows.length - 1; i++) {
//       if (deepSelect(gridData[i], compareKey) !== deepSelect(gridData[i + 1], compareKey)) {
//         break
//       }
//       rng.row2 = i + 1
//     }

//     for (let i = rng.row; i > 0; i--) {
//       if (deepSelect(gridData[i], compareKey) !== deepSelect(gridData[i - 1], compareKey)) {
//         break
//       }
//       rng.row = i - 1
//     }

//     return rng
//   }
// }

const MODEL_TYPE_ENUM = {
  STD: 1,
  COMMON: 2,
  COMPANY: 3
}

export default {
  name: 'BillingSelectModel',
  components: {
    'dashboard-panel': DashboardPanel,
    'g-tree': GTree,
    // FileIcon,
    BillingTabs
  },
  props: {
    initAutoSelectRow: {
      type: Object,
      default: () => {}
    }
  },
  watch: {
    selectedModel: {
      immediate: true,
      deep: true,
      handler (model) {
        if (model) {
          if (!model.selectable) {
            this.rootModel = null
            return
          }

          let parent = model.parentNode || null

          while (parent) {
            if (!parent.parentNode) {
              break
            }
            parent = parent.parentNode || null
          }

          this.rootModel = parent || null
        } else {
          this.rootModel = null
        }
      }
    }
  },
  created () {
    this.getModelList()
    this.getNetworkEquip()
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
    init (grid) {
      this.grid = grid
      // this.grid.mergeManager = new BillingMergeManager()
    },
    async getModelList () {
      try {
        this.loading = true
        this.rawModelList = await API.billing.getModelGroups()
        this.rawModelList.sort((a, b) => (b.createTime - a.createTime))
        // this.setTreeData(this.rawModelList.filter(modelGroup => !modelGroup.confirm))
        this.setTreeData(this.rawModelList)
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.projectTreeData = []
        this.$alert(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
        this.loading = false
        throw error
      } finally {
        this.loading = false
      }
    },
    convertOptions (options) {
      const allOptions = []

      options.forEach(option => {
        if (option.chargeType === 2) {
          const uniqueName = uniqueId('billing-select-model')
          const uniqueChargeUnit = uniqueId('billing-select-model')
          allOptions.push({
            ...option,
            uniqueChargeUnit,
            category: {
              ...option.category,
              mixedName: uniqueName
            },
            fare: option.fares
          })
          option.fares.forEach(fare => {
            // allOptions.push({
            //   ...option,
            //   uniqueChargeUnit,
            //   category: {
            //     ...option.category,
            //     mixedName: uniqueName
            //   },
            //   fare
            // })
          })
        } else {
          allOptions.push({
            ...option,
            uniqueChargeUnit: uniqueId('billing-select-model'),
            category: {
              ...option.category,
              mixedName: uniqueId('billing-select-model')
            },
            fare: option.fares[0]
          })
        }
      })

      return allOptions
    },
    setTreeData (modelList) {
      this.treeData = modelList.map(model => {
        const temp = {
          selectable: false,
          id: model.id,
          label: model.name,
          isParent: true,
          // options: [...this.convertOptions(model.models.find(g => g.type === 1).options)],
          options: [],
          children: []
        }

        model.models.forEach(im => {
          if ([MODEL_TYPE_ENUM.STD, MODEL_TYPE_ENUM.COMMON].includes(im.type)) {
            temp.options.push({ type: im.type, items: this.convertOptions(im.options) })
          }
        })

        if (model.models && model.models.length) {
          model.models.forEach(innerModel => {
            switch (innerModel.type) {
              case MODEL_TYPE_ENUM.STD:
              case MODEL_TYPE_ENUM.COMMON:
                temp.children.push({
                  ...innerModel,
                  selectable: true,
                  label: innerModel.type === MODEL_TYPE_ENUM.STD ? '표준 과금모델' : '공통자원 과금모델',
                  // children: categories.map(category => ({
                  //   ...category,
                  //   modelId: model.id,
                  //   type: innerModel.type,
                  //   options: temp.options
                  // }))
                  children: []
                })
                break
              case MODEL_TYPE_ENUM.COMPANY:
                temp.children.push({
                  ...innerModel,
                  selectable: false,
                  label: '관계사별 과금모델',
                  children: innerModel.models.map(company => ({
                    ...company,
                    label: company.companyName,
                    selectable: true,
                    children: []
                    // children: categories.map(category => ({
                    //   ...category,
                    //   modelId: model.id,
                    //   type: innerModel.type,
                    //   options: this.convertOptions(company.options)
                    // }))
                  }))
                })
                break
              default:
                break
            }
          })
        }

        return temp
      })
    },
    /**
     * 트리 선택 이벤트
     */
    setSelectTreeItem (item) {
      this.selectedModel = item

      // if (item.children && item.children.length) return

      // if ([MODEL_TYPE_ENUM.STD, MODEL_TYPE_ENUM.COMMON].includes(item.type)) {
      //   const findOption = item.options.find(option => option.type === item.type)
      //   if (findOption) {
      //     this.standardGridData = findOption.items.filter(option => option.category.categoryType === item.cateId)
      //   }
      // } else {
      //   this.standardGridData = item.options.filter(option => option.category.categoryType === item.cateId)
      // }
    },
    setSelectItem (row) {
      if (row) this.selectedRow = row.dataItem
    },
    cancel () {
      this.$emit('cancel')
    },
    save () {
      console.log('save!!', this.selectedModel)
      if (!this.selectedModel) {
        this.$alert(this.$t('common.ALERT.BILL.005'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
        return false
      } else {
        if (this.selectedModel.parentNode) {
          this.$emit('save-model', this.selectedModel.parentNode)
        } else {
          this.$emit('save-model', this.selectedModel)
        }
      }
    }
  },
  data () {
    return {
      rootModel: null,
      selectedModel: undefined, // 트리에서 선택된 모델
      selectedRow: null, //  그리드에서 선택 로우의 정보
      rawModelList: [],
      networkEquip: [],
      loading: false,
      // 트리 데이터
      treeData: [],

      // 표준 과금 그리드 데이터
      // 테이블 정보
      columns: [
        { header: this.$t('common.TERMS.item'), binding: 'category.name', width: '*', customHtml: true },
        { header: this.$t('bill.standardBillUnit'), binding: 'chargeUnit', width: '*', customHtml: true },
        { header: this.$t('bill.billCostMonth'), binding: 'fare.cost', width: '*', customHtml: true },
        // { header: '과금 단가(년)', binding: 'price_year', width: '*', customHtml: true },
        { header: this.$t('common.PLACEHOLDER.remark'), binding: 'comment', width: '*', customHtml: true }
      ],
      standardGridData: [],
      tabData: tabData(this)
    }
  }
}
</script>

<style lang="scss" scoped>
.billing-select-model {
  &::v-deep .wj-row {
    &:hover {
      svg path {
        fill: $primary;
      }
    }
  }

  .billing-select-model-contents {
    display: flex;
    overflow-y: auto;
    max-height: 70vh;
    &::v-deep {
      div[wj-part=root] {
        overflow: hidden !important;
      }
    }

    .body-panel {
      // flex: 1 1 auto;
      &.-right {
        flex: 5 1 auto;
        margin-left: $gap * 2;
        min-width: calc(100% - 400px);
        padding-right: $gap;

        .sub-title {
          margin-bottom: $gap;
        }
      }
    }

    .fare-list-wrap {
      & > * + * {
        padding-top: $gap-s;
        border-top: 1px dashed $purple-gray;
      }

      .fare-item {
        padding: $gap-s 0;
      }
    }
  }

  .button-area {
    margin-top: $gap-m;
  }
}
</style>
