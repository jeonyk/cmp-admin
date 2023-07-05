    <!--
  * 파일명 : MeteringReportModal.vue
  * 파일 기능 : [빌링 > 과금배치 > 리포트데이터 상세] 클릭시 열리는 모달입니다. 상세 리포트에관한 그리드가 노출됩니다.
  * 작성자 : 김예담 외 4명
  * 최종 작성일 : 2021-02-08
  * License By Shinsegae I&C
  * 2021-02-08 fix: 리포트 상세 필터링 관련 수정
 -->

<template>
  <el-dialog
    :title="title"
    :visible.sync="isActive"
    :width="width"
    top="10vh"
    :before-close="blockClose"
    @close="close"
    class="metering-report-modal"
  >
    <section
      class="modal-body"
      v-loading="loading"
      :element-loading-text="$t('common.ALERT.BASE.067')"
    >
      <template v-if="!detailPage">
        <filtering-component
          v-if="filteringOptions.length"
          ref="reportFilterComp"
          :data="filteringOptions"
          @selected="selectFilter"
          @reset-data="onResetFilter"
          :default-values="{
            format: 'cur',
            company: ''
          }"
        />

        <div class="table-top-wrap">
          <total-count
            v-if="tableTotal"
            :total-count="tableTotal"
          />
        </div>

        <div class="table-area">
          <cmp-grid
            :item-source="tableData"
            :columns="reportColumns"
            class="report-grid"
            :selectable="selectable"
            @selectedRow="setSelectedRow"
            :header-merge="headerMerge"
            :paging-size="8"
            :use-excel-download="true"
            :init-custom-action="onInitCustomAction"
            @total-count="count => tableTotal = count"
          >
            <!-- slot-scope="props" -->
            <!-- <slot slot-scope="props"> -->
            <template
              v-for="column in columnData"
              :slot="column.binding"
              slot-scope="props"
            >
              <div :key="column.binding">
                <span>{{ props.row[column.binding] | moneyFormat }}</span>
              </div>
            </template>
          <!-- </slot> -->
          <!-- <template
            v-for="column in columnData"
            :slot="column.binding"
            slot-scope="props"
          >
            <div :key="column.binding">
              <span v-if="props.row[column.binding + 'Dif']">{{ `${props.row[column.binding]} (${props.row[column.binding + 'Dif']})` }}</span>
              <span v-else>{{ props.row[column.binding] }}</span>
            </div>
          </template> -->
          </cmp-grid>
        </div>
      </template>
      <template v-else>
        <button
          class="button -prev-button"
          type="is-icon"
          @click="detailPage = false"
        >
          <i
            class="mdi mdi-chevron-left"
            size="is-large"
          />
        </button>
        <section class="table-area">
          <div
            class="product-title"
            style="text-align: center;"
          >
            {{ detail.title }}
          </div>
          <cmp-grid
            :item-source="detail.tableData"
            :columns="detailColumnData"
            selectable
            @selectedRow="setSelectedDetailRow"
            :init-auto-select-row="initAutoSelectRow"
            :init-auto-select-row-key="initAutoSelectRowKey"
            :paging-size="8"
          >
            <template
              v-for="column in columnData"
              :slot="column.binding"
              slot-scope="props"
            >
              <div :key="column.binding">
                <span v-if="typeof props.row[column.binding] === 'boolean'"><el-checkbox
                  v-model="props.row[column.binding]"
                  disabled
                /></span>
                <span v-else>{{ props.row[column.binding] }}</span>
              </div>
            </template>
          </cmp-grid>
        </section>
      </template>
    </section>
    <section class="modal-footer big-button-area">
      <button
        :disabled="!fullLoaded"
        class="button"
        type="is-anti"
        @click="close"
      >
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        :disabled="!fullLoaded"
        class="button"
        type="is-primary"
        @click="confirm"
      >
        {{ $t('common.BTN.confirm') }}
      </button>
    </section>
  </el-dialog>
</template>
<script>

/**
 * 더이상 안쓰는 컴포넌트, 추후에 삭제 예정
 */
export default {
  name: 'MeteringReportModal',
  components: {
  },
  props: {
    fullLoaded: {
      type: Boolean,
      default: false
    },
    active: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '리포트 상세'
    },
    currentData: {
      type: Array,
      default: () => []
    },
    compareData: {
      type: Array,
      default: () => []
    },
    columnData: {
      type: Array,
      default: () => []
    },
    width: {
      type: String,
      default: '50%'
    },
    selectable: {
      type: Boolean,
      default: false
    },
    filteringOptions: {
      type: Array,
      default: () => []
    },
    selectDetail: { // 그리드 로우 선택시, 상세 페이지가 있는가?
      type: Boolean,
      default: false
    },
    detailColumnData: {
      type: Array,
      default: () => []
    },
    initAutoSelectRow: { // 이전에 선택된 row의 dataItem - 그리드 시작시 해당 row 의 data 를 기반으로 Array에서 해당하는 row를 찾습니다.
      type: [Object, Array],
      default: () => {}
    },
    initAutoSelectRowKey: { // 그리드 시작 시, 자동 선택되는 로우를 알기 위한 고유 key 값
      type: String,
      default: ''
    },
    headerMerge: {
      type: Object,
      default: () => {}
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    active (newVal) {
      this.isActive = newVal
    },
    isActive (newVal) {
      this.active = newVal
      // 모달 꺼질 때 필터 초기화
      if (!newVal) this.$refs.reportFilterComp.resetData()
    },
    currentData (newVal) {
      this.tableData = newVal
    }
  },
  computed: {
    /**
     * 보정 내용을 삭제한 컬럼
     */
    reportColumns () {
      const originColumns = this.columnData.slice(0)

      // 보정 내용 삭제
      // 보정 전 비용, 서버 보정 비용, 관계사 보정 비용, 보정 후 비용
      for (let i = 0; i < 4; i++) originColumns.pop()

      originColumns.push({
        binding: 'beforeTotal',
        customHtml: true,
        field: 'beforeTotal',
        header: this.$t('bill.cost'),
        width: '*'
      })

      return originColumns
    }
  },
  mounted () {
    // if (this.columnData?.length) {
    //   this.columnData = this.columnData.map(col => {
    //     return {
    //       ...col,
    //       width: 100
    //     }
    //   })
    // }
  },
  methods: {
    onResetFilter () {
      this.selectFilter({
        format: 'cur',
        company: ''
      })

      this.tableData = []

      setTimeout(() => {
        this.tableData = this.currentData
      }, 0)
    },
    onInitCustomAction (grid) {
      this.grid = grid
    },
    blockClose (done) {
      if (!this.fullLoaded) return
      done()
    },
    selectFilter (selectedArr) {
      let targetTableData = selectedArr.format === 'pre'
        ? this.compareData
        : this.currentData

      if (selectedArr.company) {
        targetTableData =
          targetTableData.filter(table => table.companyName === selectedArr.company)
      }

      this.tableData = targetTableData
      // if (selectedArr.format) {
      //   if (selectedArr.company) {
      //     if (selectedArr.format === 'cur') {
      //       if (selectedArr.company) {
      //         this.tableData = this.currentData.filter(d => d.ownerCompany === selectedArr.company)
      //       } else {
      //         this.tableData = this.currentData
      //       }
      //     } else {
      //       if (selectedArr.company) {
      //         this.tableData = this.compareData.filter(d => d.ownerCompany === selectedArr.company)
      //       } else {
      //         this.tableData = this.compareData
      //       }
      //     }
      //   } else {
      //     if (selectedArr.format === 'cur') {
      //       this.tableData = this.currentData
      //     } else {
      //       this.tableData = this.compareData
      //     }
      //   }
      // }
      // if (selectedArr.company) {
      //   if (selectedArr.format) {
      //     if (selectedArr.format === 'cur') {
      //       if (selectedArr.company) {
      //         this.tableData = this.currentData.filter(d => d.ownerCompany === selectedArr.company)
      //       } else {
      //         this.tableData = this.currentData
      //       }
      //     } else {
      //       if (selectedArr.company) {
      //         this.tableData = this.compareData.filter(d => d.ownerCompany === selectedArr.company)
      //       } else {
      //         this.tableData = this.compareData
      //       }
      //     }
      //   } else {
      //     if (selectedArr.company) {
      //       this.tableData = this.currentData.filter(d => d.ownerCompany === selectedArr.company)
      //     } else {
      //       this.tableData = this.currentData
      //     }
      //   }
      // }
    },
    close () {
      this.$emit('close')
    },
    confirm () {
      if (this.selectable) {
        if (!this.selectedRow) {
          this.$alert(this.$t('common.ALERT.BILL.012'), '알림', {
            confirmButtonText: this.$t('common.BTN.confirm'),
            type: 'error'
          })
          return false
        } else {
          this.$emit('confirm', this.selectedRow)
        }
      } else {
        this.$emit('confirm')
      }
      this.close()
    },
    setSelectedRow (param) {
      if (this.selectDetail) {
        this.detailPage = true
        console.log(param.dataItem)
        if (param.dataItem.name) this.detail.title = param.dataItem.name
        if (param.dataItem.children) this.detail.tableData = [...param.dataItem.children]
      } else if (!this.selectDetail && this.selectable) {
        this.$emit('selectedRow', param)
        this.selectedRow = param
      }
    },
    setSelectedDetailRow (param) {
      if (this.selectDetail) {
        this.$emit('selectedRow', param)
        this.selectedRow = param
      }
    }
  },
  data () {
    return {
      tableTotal: null,
      isActive: this.active || false,
      selectedRow: null,
      tableData: [],
      detailPage: false,
      detail: {
        title: '',
        tableData: ''
      },
      grid: null
    }
  }
}
</script>
<style lang="scss">
  .metering-report-modal {
    margin-top: -50px;
    .table-area {
      overflow: hidden;
      max-width: 100%;
      .report-grid {
        .cmp-grid-inner {
          overflow: auto;
          max-width: 100%;
          min-height: 100px;
          #cmpGrid {
            width: 500%;
          }
        }
      }
    }
    .detail-area {
      position: relative;
      .-prev-button {
        position: absolute;
        top: 0;
        left: 0;
      }
    }
  }
</style>
