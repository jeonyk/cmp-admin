<template>
  <section class="select-node-grid">
    <el-tag
      v-if="clusterName"
      class="clustername-tag"
      :style="{
        left: $i18n.locale === 'en' ? '140px' : '120px'
      }"
    >
      {{ clusterName }}
    </el-tag>

    <search-component
      v-model="searchText"
      class="search-area"
      :placeholder="$t('common.PLACEHOLDER.searchNode')"
      @search="val => {
        filtering(val)
      }"
    />
    <div class="table-area">
      <cmp-grid
        :item-source="filteredNodes"
        :columns="columns"
        selectable
        @selectedRow="selectRow"
        :init-auto-select-row="selectedNode"
        init-auto-select-row-key="nodeName"
        class="node-grid"
        @loaded-rows="onLoadedRows"
      >
        <template #hypervisorCpuUsagePpm="props">
          <progress-bar
            :value="props.row.hypervisorCpuUsagePpm"
            :total="1000000"
            :incr-decr-rate="props.row.cpuIncrDecrRate"
            height="20px"
            :notice-percent="60"
            :alert-percent="80"
          />
        </template>
        <!-- CPU 사용량 -->

        <template #hypervisorMemoryUsagePpm="props">
          <progress-bar
            :value="props.row.hypervisorMemoryUsagePpm"
            :total="1000000"
            :incr-decr-rate="props.row.memoryIncrDecrRate"
            height="20px"
            :notice-percent="60"
            :alert-percent="80"
          />
        </template>
        <!-- Memory 사용량 -->

        <!-- <template #storageCapacityBytes="props">
          {{ props.row.storageCapacityBytes | byte }}
        </template>
        <template #storageUsageBytes="props">
          {{ props.row.storageUsageBytes | byte }}
        </template> -->
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
  </section>
</template>

<script>
import ProgressBar from '@/components/ProgressBar/ProgressBar'

export default {
  name: 'SelectNodeGrid',
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
    ProgressBar
  },
  watch: {
    gridData: {
      immediate: true,
      handler (newData) {
        console.log('@node Grid Data: ', this.filteredNodes)
        this.filteredNodes = [...newData]
      }
    },
    selectedNode: {
      immediate: true,
      handler (newVal) {
        this.selectedNode = newVal
      }
    }
  },
  methods: {
    filtering (value) {
      this.filteredNodes = this.gridData.filter(row => row.nodeName.toLowerCase().includes(value.toLowerCase()))
    },
    /**
     * 로우 선택 이벤트
     */
    selectRow (row) {
      const data = row ? row._data : null
      this.selectedNode = data
      this.$emit('select', this.selectedNode)
    },
    /**
     * '취소' 클릭 시 발생 이벤트
     */
    cancel () {
      this.$emit('cancel')
      this.selectedNode = null
      this.searchText = ''
    },
    /**
     * '확인' 클릭 시 발생 이벤트
     */
    save () {
      if (!this.selectedNode) return this.$alert(this.$t('common.ALERT.COMP.049')) // 노드를 선택해주세요.
      this.$confirm(this.$t('common.ALERT.COMP.050')).then(async () => { // 해당 Node로 설정하시겠습니까?
        this.$emit('save', this.selectedNode)
        this.cancel()
      }).catch(() => false)
    },
    onLoadedRows (grid, args) {
      this.$emit('loaded-rows', grid, args)
    }
  },
  data () {
    return {
      searchText: '',
      selectedNode: null,
      filteredNodes: [],
      columns: [
        { header: this.$t('common.REGCON.name'), binding: 'nodeName', width: 150 },
        { header: 'vm 수', binding: 'numVms', width: 80, keyPath: 'common.GRID.COMPUTE.numberOfVm' },
        { header: 'Node Serial', binding: 'serial' },
        { header: 'Block Serial', binding: 'blockSerial' },
        { header: 'Block Model', binding: 'blockModelName' },
        { header: this.$t('common.GRID.CLUSTER.usageCpu'), binding: 'hypervisorCpuUsagePpm', customHtml: true },
        { header: this.$t('common.GRID.COMPUTE.usageMemory'), binding: 'hypervisorMemoryUsagePpm', customHtml: true }
        // { header: this.$t('common.GRID.COMPUTE.diskTotal'), binding: 'storageCapacityBytes', customHtml: true },
        // { header: this.$t('common.GRID.CLUSTER.usageDisk'), binding: 'storageUsageBytes', customHtml: true }
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
