<!--
  * 파일명 : DistSelectModel.vue
  * 파일 기능 :
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2021-01-06
  * License By Shinsegae I&C
  * 2021-01-06 fix: [빌링 - 과금 배치]- loading 추가
 -->

<template>
  <section class="billing-select-model">
    <div class="billing-select-model-contents">
      <dashboard-panel
        class="body-panel -left"
        title="공통 배분 모델"
        :padding-top="0"
      >
        <div
          class="side-tree-area tiny-scroll"
          v-loading="loading"
        >
          <g-tree
            :data="treeData"
            @selected="setSelectTreeItem"
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
        title="공통 배분 정보"
      >
        <article class="resource-contents">
          <h5
            class="sub-title"
            v-if="selectedModel"
          >
            {{ selectedModel ? selectedModel.label : '' }}
          </h5>

          <cmp-grid
            :item-source="standardGridData"
            :columns="columns"
            selectable
            @selectedRow="setSelectItem"
            :init-custom-action="init"
            init-auto-select-row-key="id"
            :init-auto-select-row="initAutoSelectRow"
          >
            <template #core="props">
              <span>{{ props.row.core.unit_val }} {{ props.row.core.unit }} / 월</span>
            </template>
            <template #price_month="props">
              <a>{{ props.row.price_month | locale }} won</a>
            </template>
            <template #price_year="props">
              <a>{{ props.row.price_year | locale }} won</a>
            </template>
          </cmp-grid>
        </article>
      </dashboard-panel>
    </div>

    <div class="button-area -center">
      <button
        class="button"
        type="is-anti"
        @click="cancel"
      >
        뒤로
      </button>
      <button
        class="button"
        type="is-primary"
        @click="save"
      >
        적용
      </button>
    </div>
  </section>
  <!-- /.modal-body -->
</template>
<script>
import API, { DashboardPanel, GTree } from '@sd-fe/cmp-core'

export default {
  name: 'BillingSelectModel',
  components: {
    'dashboard-panel': DashboardPanel,
    'g-tree': GTree
  },
  props: {
    initAutoSelectRow: {
      type: Object,
      default: () => {}
    }
  },
  created () {
    this.getModelList()
  },
  methods: {
    init (grid) {
      this.grid = grid
    },
    async getModelList () {
      try {
        this.loading = true

        this.rawModelList = await API.billing.getDistModel()
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
    setTreeData (modelList) {
      const tempTreeData = []
      modelList.forEach(element => {
        tempTreeData.push({
          id: element.id,
          label: element.name,
          deletable: element.deletable,
          billingUpper: 0,
          children: element.distributeProjects.map(p => {
            return {
              ...p,
              label: p.projectName
            }
          })
        })
      })
      console.log(tempTreeData)
      this.treeData = tempTreeData
    },
    setSelectTreeItem (item) {
      // console.log('this.rawModelList', this.rawModelList)
      // console.log('선택 모델: ', item)
      this.selectedModel = item
      const tempTableData = []
      // 합계 구하기
      let amountSum = 0
      if (item.distributeGroups) {
        item.distributeGroups.forEach(e => {
          if (!e.parentGroupName) {
            amountSum += e.amount
          }
        })
        console.log(amountSum)
        item.distributeGroups.forEach(e => {
          if (!e.parentGroupName) {
            tempTableData.push({
              id: item.id,
              model: item.title,
              relationComp: e.groupName,
              amount: e.amount,
              percentage: ((e.amount / amountSum) * 100).toFixed(2)
            })
          }
        })
      }
      console.log(tempTableData)
      this.standardGridData = tempTableData
    },
    setSelectItem (row) {
      if (row) this.selectedRow = row.dataItem
    },
    cancel () {
      this.$emit('cancel')
    },
    save () {
      // console.log('save!!', this.selectedModel)
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
      selectedModel: undefined, // 트리에서 선택된 모델
      selectedRow: null, //  그리드에서 선택 로우의 정보
      rawModelList: [],
      loading: false,
      // 트리 데이터
      treeData: [
      ],

      // 표준 과금 그리드 데이터
      // 테이블 정보
      columns: [
        { header: '관계사', binding: 'relationComp', width: '*' },
        { header: '배부기준 값', binding: 'amount', width: '*', customHtml: true },
        { header: '백분율(%)', binding: 'percentage', width: '*', customHtml: true }
      ],
      standardGridData: [
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.billing-select-model {
  .billing-select-model-contents {
    display: flex;
    overflow-y: auto;
    max-height: 70vh;
    .body-panel {
      &.-right {
        flex: 5 1 auto;
        margin-left: $gap * 2;
        min-width: calc(100% - 400px);
      }
    }
  }

  .button-area {
    margin-top: $gap-m;
  }
}
</style>
