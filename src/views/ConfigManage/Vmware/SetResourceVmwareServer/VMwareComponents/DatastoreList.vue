<template>
  <cmp-grid
    v-loading="loading"
    selectable
    :init-auto-select-row="initAutoSelectRow"
    :init-custom-action="flex => grid = flex"
    init-auto-select-row-key="datastoreId"
    :item-source="datastoreList"
    :columns="datastoreColumns"
    :use-excel-download="false"
    @loaded-rows="onLoadedRows"
    :use-column-filter="false"
    @selectedRow="selectDatastore"
  >
    <template #usagePpm="{ row }">
      <el-tooltip
        v-if="!isNaN(parseFloat(row.capacity)) && !isNaN(parseFloat(row.freeSpace))"
        placement="top"
        effect="light"
      >
        <template #content>
          <span>
            {{ row.capacity - row.freeSpace | byte }}&nbsp;/&nbsp;{{ row.capacity | byte }}
          </span>
        </template>
        <progress-bar
          class="capacity-progressbar"
          :value="row.capacity - row.freeSpace"
          :total="row.capacity"
          :incr-decr-rate="(
            selectedRow &&
            selectedRow.datastoreId === row.datastoreId &&
            willAddedDiskSizeByte
          )
            ? (+willAddedDiskSizeByte / row.capacity * 100).toFixed(2)
            : undefined"
          height="20px"
          :notice-percent="60"
          :alert-percent="80"
        />
      </el-tooltip>
    </template>

    <template #freeSpace="{ row }">
      {{ row.freeSpace | byte }}&nbsp;
      <small
        class="free-space"
        v-if=" selectedRow &&
          selectedRow.datastoreId === row.datastoreId &&willAddedDiskSizeGb"
      >(&nbsp;-{{ willAddedDiskSizeGb }}GB&nbsp;)</small>
    </template>
  </cmp-grid>
</template>

<script>
import { cloneDeep } from 'lodash'
import { Tooltip } from '@grapecity/wijmo'

export default {
  name: 'DatastoreList',
  props: {
    initAutoSelectRow: {
      type: Object,
      default: undefined
    },
    datastoreList: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    willAddedDiskSizeGb: { // 추가 될 디스크 사이즈(GB)
      type: [Number],
      default: 0
    }
  },
  watch: {
    willAddedDiskSizeGb: {
      immediate: true,
      handler () {
        this.willAddedDiskSizeByte = this.$options.filters.gbToByte(this.willAddedDiskSizeGb)
        // this.gridRefresh()
      }
    },
    initAutoSelectRow: {
      handler (after, before) {
        // if (before) this.gridRefresh()
      }
    }
  },
  methods: {
    selectDatastore (rowGroup) {
      const emitRow = rowGroup?._data ? rowGroup._data : null
      this.selectedRow = emitRow
      this.$emit('select', emitRow)
    },
    /**
    * disabled row 설정 -> 용량 초과 예정이면 선택 불가능 처리
    */
    onLoadedRows (grid) {
      this.$nextTick(function () {
        for (let i = 0; i < grid.rows.length; i++) {
          const row = grid.rows[i]
          const item = row.dataItem
          const cssList = cloneDeep(row.cssClass)

          if (item.freeSpace - this.willAddedDiskSizeByte < 0) {
            item.isSelectable = false
            row.cssClass = cssList + ' is-disable-row'
          } else {
            item.isSelectable = true
            row.cssClass = cssList?.replace(' is-disable-row', '') || ''
          }
        }

        grid.formatItem.addHandler((s, e) => {
          const rowData = s.rows[e.row]?._data
          if (!rowData?.isSelectable) {
            this.tooltip.setTooltip(e.cell,
              '<small>* 사용 가능 용량이 부족합니다.</small>')
          }
        })
        this.$forceUpdate()
      })
    },
    gridRefresh (grid = this.grid) {
      if (!grid) return
      const cv = grid?.collectionView
      cv.refresh()
    }
  },
  data: () => ({
    datastoreColumns: [
      { binding: 'name', header: '이름' },
      { binding: 'usagePpm', header: '사용량', customHtml: true },
      { binding: 'freeSpace', header: '사용 가능 용량', customHtml: true, width: 170 },
      { binding: 'type', header: '유형', width: 100 }
    ],
    tooltip: new Tooltip({
      showAtMouse: true,
      showDelay: 200
    }),
    selectedRow: null,
    willAddedDiskSizeByte: undefined // willAddedDiskSizeGb -> byte로 변환 값
  })
}
</script>

<style lang="scss" scoped>
  .capacity-progressbar { max-width: 100%; }
  small.free-space { font-size: 12px !important; }
</style>
