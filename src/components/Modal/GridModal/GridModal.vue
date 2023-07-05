<!--
  * 파일명 : GridModal.vue
  * 파일 기능 : 특별한 요소 없이 그리드만 보여주고 row를 선택하여 데이터를 외부로 보낼 수 있는 모달입니다.팝업이 뜰 때 그려줄 grid 데이터를 외부에서 받아 grid를 그려줍니다.
  * 작성자 : 김진범 외 2명
  * 최종 작성일 : 2021-02-08
  * License By Shinsegae I&C
  * 2021-02-08 push~
 -->

<template>
  <el-dialog
    :title="title"
    :visible.sync="isActive"
    :width="width"
    :top="top"
    @close="close"
    class="grid-modal"
  >
    <section
      class="modal-body"
      v-if="!detailPage"
    >
      <filtering-component
        v-if="filteringOptions.length"
        :data="filteringOptions"
        @selected="selectFilter"
      />

      <div class="table-top-wrap">
        <total-count :total-count="totalResultCnt" />
      </div>

      <div class="table-area">
        <cmp-grid
          v-if="isActive"
          :item-source="tableData"
          :header-checkbox="headerCheckbox"
          :header-merge="headerMerge"
          :columns="columnData"
          class="report-grid"
          :selectable="selectable"
          :changing-page-reset="changingPageReset"
          v-loading="loading"
          :element-loading-text="$t('common.PLACEHOLDER.loading')"
          :loading="loading"
          :init-auto-select-row="initAutoSelectRow"
          :init-auto-select-row-key="initAutoSelectRowKey"
          @selectedRow="setSelectedRow"
          @checkedRowsData="setCheckedRow"
          @total-count="cnt => totalResultCnt = cnt"
        >
          <!-- <slot slot-scope="props"> -->
          <template
            v-for="column in columnData"
            :slot="column.binding"
            :name="column.binding"
            slot-scope="props"
          >
            <div
              v-if="column.customHtml"
              :key="column.binding"
            >
              <!-- <span v-if="props.row[column.binding]">{{ props.row[column.binding] }}</span> -->
              <slot
                :row="props.row"
                :name="column.binding"
              >
                {{ props.row[column.binding] }}
              </slot>
            </div>
            <div
              v-else
              :key="column.binding"
            >
              <span v-if="props.row[column.binding]">{{ props.row[column.binding] }}</span>
            </div>
          </template>
          <!-- </slot> -->
        </cmp-grid>
      </div>
    </section>

    <section
      class="modal-area detail-area"
      v-if="detailPage"
    >
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
    </section>
    <section class="modal-footer big-button-area">
      <slot name="button">
        <button
          v-if="useCancelBtn"
          class="button"
          type="is-anti"
          @click="close"
        >
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          class="button"
          type="is-primary"
          @click="confirm"
        >
          {{ $t('common.BTN.confirm') }}
        </button>
      </slot>
    </section>
  </el-dialog>
</template>
<script>

export default {
  name: 'GridModal',
  components: {
  },
  props: {
    active: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '리포트 상세'
    },
    tableData: {
      type: Array,
      default: () => []
    },
    columnData: {
      type: Array,
      default: () => []
    },
    headerCheckbox: {
      type: Boolean,
      default: false
    },
    headerMerge: {
      type: Object,
      default: () => {}
    },
    width: {
      type: String,
      default: '50%'
    },
    top: {
      type: String,
      default: '7vh'
    },
    changingPageReset: {
      type: Boolean,
      default: true
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
    loading: {
      type: Boolean,
      default: false
    },
    useCancelBtn: { // '취소'버튼 사용 유무
      type: Boolean,
      default: true
    }
  },
  watch: {
    active (newVal) {
      this.isActive = newVal
    },
    isActive (newVal) {
      this.active = newVal
    }
  },
  methods: {
    selectFilter (selectedArr) {
      // console.log('*필터링: ', selectedArr)
    },
    close () {
      this.$emit('close')
    },
    confirm () {
      if (this.selectable) {
        if (!this.selectedRow) {
          this.$alert(this.$t('common.ALERT.BILL.012'), '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
          return false
        } else {
          this.$emit('confirm', this.selectedRow)
        }
      } else if (this.headerCheckbox) {
        this.$emit('confirm', this.checkedRows)
      } else {
        this.$emit('confirm')
      }
      this.close()
    },
    setSelectedRow (param) {
      if (this.selectDetail) {
        this.detailPage = true
        // console.log(param.dataItem)
        if (param.dataItem.name) this.detail.title = param.dataItem.name
        if (param.dataItem.children) this.detail.tableData = [...param.dataItem.children]
      } else if (!this.selectDetail && this.selectable) {
        this.$emit('selectedRow', param)
        this.selectedRow = param
      }
    },
    setCheckedRow (param) {
      this.checkedRows = [...param]
      this.$emit('checkedRows', param)
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
      totalResultCnt: 0,
      isActive: this.active || false,
      selectedRow: null,
      checkedRows: [],

      detailPage: false,
      detail: {
        title: '',
        tableData: ''
      }
    }
  }
}
</script>
<style lang="scss">
  .grid-modal {
    .table-area {
      max-width: 100%;
      .report-grid {
        width: 100%;
        min-height: 100px;
        div[wj-part=root] {
          overflow: auto;
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
