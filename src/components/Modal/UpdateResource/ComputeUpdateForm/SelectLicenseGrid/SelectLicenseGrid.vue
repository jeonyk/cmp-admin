<template>
  <section class="select-node-grid">
    <!-- @selected="selectFilter"
    @reset-data="resetFilter" -->
    <filtering-component
      :data="filterData"
    >
      <search-component
        v-model="searchText"
        class="search-area"
        :placeholder="$v('라이선스명을 입력하세요')"
        @search="val => {
          filtering(val)
        }"
      />
    </filtering-component>

    <div class="table-area">
      <cmp-grid
        header-checkbox
        :item-source="tableData"
        :columns="columns"
        @selectedRow="selectRow"
        :init-auto-select-row="selectedItem"
        init-auto-select-row-key="nodeName"
        class="node-grid"
      />
    </div>

    <div class="button-area page-bottom -center modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="cancel"
      >
        {{ $v('취소') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="save"
      >
        {{ $v('추가') }}
      </button>
    </div>
  </section>
</template>

<script>
import { FilteringComponent } from '@sd-fe/cmp-core'

export default {
  name: 'SelectLicenseGrid',
  props: {
    gridData: {
      type: Array,
      default: () => []
    },
    initSelected: {
      type: Object,
      default: null
    },
    clusterName: {
      type: String,
      default: ''
    },
    useBtn: {
      type: Boolean,
      default: true
    }
  },
  components: {
    FilteringComponent
  },
  watch: {
    gridData: {
      immediate: true,
      handler (newData) {
        // console.log('@node Grid Data: ', this.tableData)
        // this.tableData = [...newData]
      }
    },
    selectedItem: {
      immediate: true,
      handler (newVal) {
        this.selectedItem = newVal
      }
    }
  },
  methods: {
    filtering (value) {
      // this.tableData = this.gridData.filter(row => row.nodeName.toLowerCase().includes(value.toLowerCase()))
    },
    /**
     * 로우 선택 이벤트
     */
    selectRow (row) {
      const data = row ? row._data : null
      this.selectedItem = data
      this.$emit('select', this.selectedItem)
    },
    /**
     * '취소' 클릭 시 발생 이벤트
     */
    cancel () {
      this.$emit('cancel')
      this.selectedItem = null
      this.searchText = ''
    },
    /**
     * '확인' 클릭 시 발생 이벤트
     */
    save () {
      if (!this.selectedItem) return this.$alert(this.$t('common.ALERT.COMP.049')) // 노드를 선택해주세요.
      this.$confirm(this.$t('common.ALERT.COMP.050')).then(async () => { // 해당 Node로 설정하시겠습니까?
        this.$emit('save', this.selectedItem)
        this.cancel()
      }).catch(() => false)
    }
  },
  data () {
    return {
      searchText: '',
      selectedItem: null,
      tableData: [
        { name: '', version: '', licenseType: '', osType: '', os: '', osVersion: '', purchageCnt: '', salesCnt: '' },
        { name: '', version: '', licenseType: '', osType: '', os: '', osVersion: '', purchageCnt: '', salesCnt: '' },
        { name: '', version: '', licenseType: '', osType: '', os: '', osVersion: '', purchageCnt: '', salesCnt: '' },
        { name: '', version: '', licenseType: '', osType: '', os: '', osVersion: '', purchageCnt: '', salesCnt: '' }
      ],
      filterData: [
        {
          field: 'state',
          label: '카테고리',
          placeholder: '상태 전체',
          selections: [
            { label: '전체', value: undefined },
            { label: '실행 중', value: 'running' },
            { label: '진행 중', value: 'pending' },
            { label: '종료 중', value: 'stopping' },
            { label: '정지', value: 'stopped' }
          ]
        }
      ],
      columns: [
        { header: '라이선스명', binding: 'name' },
        { header: '라이선스버전', binding: 'version' },
        { header: '라이선스유형', binding: 'licenseType' },
        { header: '운영체제유형', binding: 'osType' },
        { header: '운영체제', binding: 'os' },
        { header: '운영체제 버전', binding: 'osVersion' },
        { header: '구매수량', binding: 'purchageCnt' },
        { header: '판매수량', binding: 'salesCnt' }
      ]
    }
  }
}
</script>

<style lang="scss">
  .select-node-grid {
    .clustername-tag {
      position: absolute;
      top: 22px;
      left: 120px;
    }
    .node-grid {
      .wj-cells {
        .wj-cell {
          .incr-decr-text { display: none; }
          .incr-decr-bar { display: none; }
          &.selected-row {
            .incr-decr-text { display: inline-block; }
            .incr-decr-bar { display: inline-block; }
          }
        }
      }
    }
  }
</style>
