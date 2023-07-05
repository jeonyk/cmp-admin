<template>
  <div class="select-cluster-grid">
    <search-component
      class="search-area"
      v-model="searchText"
      :placeholder="$t('common.PLACEHOLDER.searchCluster')"
      @search="val => {
        filtering(val)
      }"
    />
    <!-- 클러스터 검색 -->

    <div class="table-area">
      <cmp-grid
        v-loading="loading || filterLoading"
        :item-source="filteredNodes"
        :columns="columns.default"
        :header-merge="columns.headerMergeColumns"
        selectable
        @selectedRow="selectRow"
        :init-auto-select-row="selectedCluster"
        init-auto-select-row-key="elementIdx"
        class="cluster-grid"
        @loaded-rows="onLoadedRows"
      >
        <template #highVal="props">
          <el-tag size="small">
            {{ props.row.highVal }}
          </el-tag>
        </template>
        <!-- 고사양 -->

        <template #vcpuUsagePercent="props">
          <progress-bar
            class="size-progress-bar"
            :value="props.row.hypervisorCpuUsagePpm"
            :total="100"
            height="20px"
            :notice-percent="60"
            :alert-percent="80"
          />
        </template>
        <!-- vCPU 사용량 -->

        <template #assignPercentvcpuCnt="props">
          <el-tooltip
            :content="props.row.assignPercentText.vcpuCnt"
            placement="top"
            effect="light"
          >
            <progress-bar
              class="size-progress-bar"
              :value="props.row.assign.vcpuCnt.size"
              :total="props.row.assign.vcpuCnt.all"
              :incr-decr-rate="props.row.vcpuIncrDecrRate"
              :notice-percent="props.row.firstCpuPercent"
              :alert-percent="props.row.secondCpuPercent"
              height="20px"
            />
          </el-tooltip>
        </template>
        <!-- 할당량.가상화율 임계치 -->

        <template #assignPercentmemory="props">
          <el-tooltip
            :content="props.row.assignPercentText.memory"
            placement="top"
            effect="light"
          >
            <progress-bar
              class="size-progress-bar"
              :value="props.row.assign.memory.size"
              :total="props.row.assign.memory.all"
              :incr-decr-rate="props.row.memoryIncrDecrRate"
              :notice-percent="props.row.firstMemoryPercent"
              :alert-percent="props.row.secondMemoryPercent"
              height="20px"
            />
          </el-tooltip>
        </template>
        <!-- 할당량.Memory 임계치-->

        <template #assignPercentdisk="props">
          <el-tooltip
            :content="props.row.assignPercentText.disk"
            placement="top"
            effect="light"
          >
            <progress-bar
              class="size-progress-bar"
              :value="props.row.assign.disk.size"
              :total="props.row.assign.disk.all"
              :incr-decr-rate="props.row.diskIncrDecrRate"
              :notice-percent="props.row.firstDiskPercent"
              :alert-percent="props.row.secondDiskPercent"
              height="20px"
            />
          </el-tooltip>
        </template>
      <!-- 할당량.Disk 임계치-->
      </cmp-grid>
    </div>

    <div
      class="button-area page-bottom -center modal-button-area"
      v-if="useBtn"
    >
      <button
        class="button"
        type="is-anti"
        @click="cancel"
      >
        <!-- 취소 -->
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="save"
      >
        <!-- 확인 -->
        {{ $t('common.BTN.confirm') }}
      </button>
    </div>
  </div>
</template>

<script>
import { cloneDeep } from 'lodash'
export default {
  name: 'SelectClusterGrid',
  props: {
    gridData: {
      type: Array,
      default: () => []
    },
    initSelected: {
      type: Object,
      default: null
    },
    useBtn: {
      type: Boolean,
      default: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    gridData: {
      immediate: true,
      handler (newData) {
        this.filteredNodes = [...newData]
      }
    },
    initSelected: {
      immediate: true,
      handler (newRow) {
        this.selectedCluster = newRow
      }
    }
  },
  methods: {
    filtering (value) {
      this.filterLoading = true
      this.filteredNodes = this.gridData.filter(row => row.name.toLowerCase().includes(value.toLowerCase()))
      this.filterLoading = false
    },
    /**
    * disabled row 설정 -> 선택한 사양과 다른 사양의 클러스터
    */
    onLoadedRows (grid) {
      this.$nextTick(function () {
        for (let i = 0; i < grid.rows.length; i++) {
          const row = grid.rows[i]
          const item = row.dataItem
          const cssList = cloneDeep(row.cssClass)
          if (item.isSelectable === false) {
            item.disable = true
            row.cssClass = cssList + ' is-disable-row'
          } else {
            item.disable = false
            row.cssClass = cssList?.replace(' is-disable-row', '') || ''
          }
        }
      })
    },
    /**
     * 로우 선택 이벤트
     */
    selectRow (row) {
      const data = row ? row._data : null
      this.selectedCluster = data
      this.$emit('select', this.selectedCluster)
    },
    /**
     * '취소' 클릭 시 발생 이벤트
     */
    cancel () {
      this.$emit('cancel')
      this.selectedCluster = null
      this.searchText = ''
    },
    /**
     * '확인' 클릭 시 발생 이벤트
     */
    save () {
      if (!this.selectedCluster) return this.$alert(this.$t('common.ALERT.NUTA.011')) // 클러스터를 선택하세요.
      this.$confirm(this.$t('common.CONFIRM.COMP.002')).then(async () => { // 해당 클러스터로 설정하시겠습니까?
        this.$emit('save', this.selectedCluster)
        this.cancel()
      }).catch(() => false)
    }
  },
  data () {
    return {
      filterLoading: false,
      searchText: '',
      filteredNodes: [],
      selectedCluster: null, // 선택 한 클러스터
      columns: {
        default: [
          { header: this.$t('common.REGCON.name'), binding: 'name', width: 150 },
          { header: 'IPAM ON', binding: 'ipamOnCnt', width: 80 },
          { header: 'Node', binding: 'node', width: 50, customHtml: true },
          { header: 'VM', binding: 'vm', width: 60, customHtml: true },
          { header: this.$t('common.GRID.COMPUTE.highSpec'), binding: 'highVal', width: 120, customHtml: true },
          { header: this.$t('common.GRID.NUTA.virtualRate'), binding: 'virtualPercent', width: 70, customHtml: true },
          { header: this.$t('common.GRID.DATABASE.usageCpu'), binding: 'vcpuUsagePercent', customHtml: true },
          { header: this.$t('common.GRID.NUTA.virtualRate'), binding: 'assignPercent.vcpuCnt', customHtml: true },
          { header: 'Memory', binding: 'assignPercent.memory', customHtml: true },
          { header: 'Disk', binding: 'assignPercent.disk', customHtml: true }
        ],
        headerMergeColumns: {
          colSpan: [
            { startIdx: 6, endIdx: 9, header: '임계치(%)', keyPath: 'main.DASHBOARD.threshold' }
          ],
          rowSpan: ['name', 'ipamOnCnt', 'node', 'vm', 'highVal', 'virtualPercent', 'vcpuUsagePercent']
        }
      }
    }
  }
}
</script>

<style lang="scss">
  .select-cluster-grid {
    .cluster-grid {
      .wj-cells {
        .wj-cell {
          .incr-decr-text { display: none; }
          .incr-decr-bar { display: none; }
          &.selected-row {
            .incr-decr-text { display: inline-block; }
            .incr-decr-bar { display: block; }
          }
        }
      }
    }
  }
</style>
