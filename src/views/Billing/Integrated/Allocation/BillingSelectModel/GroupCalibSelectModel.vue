<!--
  * 파일명 : GroupCalibSelectModel.vue
  * 파일 기능 : 빌링 > 과금 배치 > 관계사 보정 선택 모달
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2021-01-06
  * License By Shinsegae I&C
  * 2021-01-06 fix: [빌링 - 과금 배치]- loading 추가
 -->

<template>
  <section
    v-loading="isLoadingCorrectionModel"
    class="billing-select-model"
  >
    <div class="billing-select-model-contents">
      <dashboard-panel
        class="body-panel -left"
        :title="$t('bill.affCorrectionModel')"
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
        :title="$t('bill.billInfo')"
      >
        <article class="resource-contents">
          <h5
            class="sub-title"
            v-if="selectedModel"
          >
            {{ selectedModel ? selectedModel.label : '' }}
          </h5>

          <billing-model-calib-content
            v-if="selectedModel"
            from-batch
            from-select-modal
            route-title="관계사별 보정 모델"
            type="company"
            :batch-select-id="selectedModel.id"
            :model-list="rawModelList"
          />

          <!-- <cmp-grid
            :item-source="standardGridData"
            :columns="columns"
            selectable
            @selectedRow="setSelectItem"
            :init-custom-action="init"
            init-auto-select-row-key="id"
            :init-auto-select-row="initAutoSelectRow"
          /> -->
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
import { mapGetters } from 'vuex'
import BillingModelCalibContent from '@/views/Billing/Integrated/Correction/BillingModelCalibContent.vue'

export default {
  name: 'BillingSelectModel',
  components: {
    'dashboard-panel': DashboardPanel,
    'g-tree': GTree,
    BillingModelCalibContent
  },
  props: {
    initAutoSelectRow: {
      type: Object,
      default: () => {}
    }
  },
  computed: {
    ...mapGetters({
      moduleType: 'cloud/getModuleType'
    })
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

        const { data } = await API.billing.getGroupCorrModelList()
        this.rawModelList = data
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
      this.treeData = []
      this.standardGridData = []
      modelList.map(m => {
        this.treeData.push({
          id: m.id,
          label: m.name,
          deleteAble: m.deleteAble,
          billingUpper: 0
        })
      })
    },
    setSelectTreeItem (item) {
      // console.log('this.rawModelList', this.rawModelList)
      // console.log('선택 모델: ', item)
      this.selectedModel = item
      // this.standardGridData = []
      // this.rawModelList.filter(e => {
      //   return e.id === this.selectedModel.id
      // }).map(m => {
      //   m.groupInfo.map(o => {
      //     this.standardGridData.push({
      //       id: o.id,
      //       modelId: m.id,
      //       center: o.center,
      //       groupName: o.groupName,
      //       hostName: o.hostName,
      //       taskInfo: o.taskInfo,
      //       discountPrice: this.$options.filters.moneyFormat(o.discountPrice),
      //       discountReason: o.discountReason,
      //       discountKinds: o.discountKinds
      //     })
      //   })
      // })
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
      isLoadingCorrectionModel: false,
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
        { header: this.$t('common.GRID.center'), binding: 'center', width: 50, customHtml: true },
        { header: this.$t('admin.ORG.affName'), binding: 'groupName', width: 150, customHtml: true },
        { header: this.$t('bill.corrMethod'), binding: 'discountKinds', width: '*', customHtml: true },
        { header: this.$t('bill.corrCost'), binding: 'discountPrice', width: '*', customHtml: true }, // 보정 금액
        { header: this.$t('bill.reasonCorr'), binding: 'discountReason', width: '*', customHtml: true } // 보정 사유
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
