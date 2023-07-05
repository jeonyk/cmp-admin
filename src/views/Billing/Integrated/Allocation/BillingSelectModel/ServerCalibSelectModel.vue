<!--
  * 파일명 : ServerCalibSelectModel.vue
  * 파일 기능 : 빌링 > 과금 배치 > 서버 보정 선택 모달
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
        :title="$t('bill.serverCorrModel')"
        :padding-top="0"
      >
        <div
          class="side-tree-area tiny-scroll"
          v-loading="loading.tree"
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

          <!-- <cmp-grid
            :item-source="standardGridData"
            :columns="columns"
            selectable
            @selectedRow="setSelectItem"
            :init-custom-action="init"
            init-auto-select-row-key="id"
            :init-auto-select-row="initAutoSelectRow"
          /> -->

          <billing-model-calib-content
            v-if="selectedModel"
            from-batch
            from-select-modal
            route-title="서버별 보정 모델"
            type="server"
            :batch-select-id="selectedModel.id"
            :model-list="rawModelList"
          />
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
import API, { GTree, DashboardPanel } from '@sd-fe/cmp-core'
import { mapGetters } from 'vuex'
import BillingModelCalibContent from '@/views/Billing/Integrated/Correction/BillingModelCalibContent.vue'

export default {
  name: 'ServerCalibSelectModel',
  components: {
    'dashboard-panel': DashboardPanel,
    'g-tree': GTree,
    BillingModelCalibContent
  },
  computed: {
    ...mapGetters({
      moduleType: 'cloud/getModuleType'
    })
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
    moneyFormat (v) {
      return this.$options.filters.moneyFormat(v)
    },
    async getModelList () {
      try {
        this.loading.tree = true
        const { data } = await API.billing.getServerCorrModelList()
        this.rawModelList = data
        if (!this.rawModelList) return
        this.setTreeData(this.rawModelList)
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.projectTreeData = []
        this.$alert(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
        throw error
      } finally {
        this.loading.tree = false
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
      this.selectedModel = item
      // this.standardGridData = []
      // this.rawModelList.filter(e => {
      //   return e.id === this.selectedModel.id
      // }).map(m => {
      //   m.serverInfo.map(o => {
      //     this.standardGridData.push({
      //       id: o.id,
      //       modelId: m.id,
      //       groupIdx: o.groupIdx,
      //       center: o.center,
      //       groupName: o.groupName,
      //       hostName: o.hostName,
      //       taskInfo: o.taskInfo,
      //       discountPrice: this.moneyFormat(o.discountPrice), // 보정 금액
      //       discountReason: o.discountReason,
      //       discountKinds: o.discountKinds,
      //       hoeseon: this.moneyFormat(o.hoeseon), // 회선
      //       sosan: this.moneyFormat(o.sosan) // 소산
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
      loading: {
        tree: false
      },
      // 트리 데이터
      treeData: [],

      // 표준 과금 그리드 데이터
      // 테이블 정보
      columns: [
        { header: this.$t('common.GRID.center'), binding: 'center', width: 50, customHtml: true }, // 센터
        { header: this.$t('admin.ORG.affName'), binding: 'groupName', width: 150, customHtml: true }, // 관계사 명
        { header: this.$t('admin.WF.task'), binding: 'taskInfo', width: '*', customHtml: true }, // 업무
        { header: this.$t('common.GRID.hostName'), binding: 'hostName', width: '*', customHtml: true }, // 호스트 명
        { header: this.$t('bill.corrMethod'), binding: 'discountKinds', width: 100, customHtml: true }, // 보정 방식
        { header: this.$t('bill.corrCost'), binding: 'discountPrice', width: '*', customHtml: true }, // 보정 비용
        { header: this.$t('bill.circuit'), binding: 'hoeseon', width: '*', customHtml: true }, // 회선
        { header: this.$t('bill.diss'), binding: 'sosan', width: '*', customHtml: true } // 소산
      ],
      standardGridData: []
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
