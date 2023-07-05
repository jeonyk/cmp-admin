<!--
  * 파일명 : SetEraClusterModal.vue
  * 파일 기능 :
  * 작성자 : dikim 외 2명
  * 최종 작성일 : 2020-10-30
  * License By Shinsegae I&C
  * 2020-10-30 API 호출 부분 생성
 -->

/* eslint-disable vue/require-valid-default-prop */
<template>
  <el-dialog
    :title="$v('자원할당설정')"
    :visible.sync="isActive"
    :width="width"
    @close="close"
    class="set-era-cluster-modal"
    top="5vh"
  >
    <section class="modal-body">
      <article
        class="node-contents -cluster"
        v-if="type==='both' || type === 'cluster'"
      >
        <h5 class="modal-sub-title sub-title">
          클러스터 선택
        </h5>
        <div class="table-area">
          <cmp-grid
            :item-source="clusterGridData"
            :columns="clusterColumns"
            :header-merge="clusterHeaderMergeColumns"
            selectable
            @selectedRow="setSelectedCluster"
            :init-custom-action="initClusterGrid"
          >
            <!-- 이름 -->
            <!-- <template #name="props">
              <div class="cell-flex-wrap">
                <cmp-status-tag
                  :contents="props.row.type"
                  v-if="props.row.type"
                />
                {{ props.row.name }}
              </div>
            </template> -->
            <!-- 할당량.vCPU -->
            <!-- <template #assignvcpu="props">
              <div class="cell-flex-wrap -wrap">
                <progress-bar
                  class="size-progress-bar"
                  :value="props.row.assign.vcpu.size"
                  :total="props.row.assign.vcpu.all"
                />
                <p class="progress-desc">
                  {{ `${props.row.assign.vcpu.size}C / ${props.row.assign.vcpu.all}C` }}
                </p>
              </div>
            </template> -->
            <!-- 할당량.Memory -->
            <!-- <template #assignmemory="props">
              <div class="cell-flex-wrap -wrap">
                <progress-bar
                  class="size-progress-bar"
                  :value="props.row.assign.memory.size"
                  :total="props.row.assign.memory.all"
                />
                <p class="progress-desc">
                  {{ `${props.row.assign.memory.size}GB / ${props.row.assign.memory.all}GB` }}
                </p>
              </div>
            </template> -->
            <!-- 할당량.Disk -->
            <!-- <template #assigndisk="props">
              <div class="cell-flex-wrap -wrap">
                <progress-bar
                  class="size-progress-bar"
                  :value="props.row.assign.disk.size"
                  :total="props.row.assign.disk.all"
                />
                <span class="progress-desc">{{ `${props.row.assign.disk.size}TB / ${props.row.assign.disk.all}TB` }}</span>
              </div>
            </template> -->
          </cmp-grid>
        </div>
      </article>

      <article
        class="node-contents -node"
        v-if="type==='both' || type === 'node'"
      >
        <h5 class="modal-sub-title sub-title">
          노드 선택
        </h5>
        <div class="table-area">
          <cmp-grid
            :item-source="nodeGridData"
            :columns="nodeColumns"
            :header-merge="nodeHeaderMergeColumns"
            selectable
            @selectedRow="setSelectedNode"
            :init-custom-action="initNodeGrid"
          >
            <!-- <template #usagevcpu="props">
              <div class="cell-flex-wrap -wrap">
                <progress-bar
                  class="size-progress-bar"
                  :value="props.row.usage.vcpu.size"
                  :total="props.row.usage.vcpu.all"
                />
                <span class="progress-desc">{{ `${props.row.usage.vcpu.size}C / ${props.row.usage.vcpu.all}C` }}</span>
              </div>
            </template> -->
            <!-- 사용량.vCPU -->
            <!-- <template #usagememory="props">
              <div class="cell-flex-wrap -wrap">
                <progress-bar
                  class="size-progress-bar"
                  :value="props.row.usage.memory.size"
                  :total="props.row.usage.memory.all"
                />
                <span class="progress-desc">{{ `${props.row.usage.memory.size}GB / ${props.row.usage.memory.all}GB` }}</span>
              </div>
            </template> -->
            <!-- 사용량.Memory -->
            <!-- <template #usagedisk="props">
              <div class="cell-flex-wrap -wrap">
                <progress-bar
                  class="size-progress-bar"
                  :value="props.row.usage.disk.size"
                  :total="props.row.usage.disk.all"
                />
                <span class="progress-desc">{{ `${props.row.usage.disk.size}TB / ${props.row.usage.disk.all}TB` }}</span>
              </div>
            </template> -->
            <!-- 사용량.Disk -->
            <!-- <template #usagegpu="props">
              <div class="cell-flex-wrap -wrap">
                <progress-bar
                  class="size-progress-bar"
                  :value="props.row.usage.gpu.size"
                  :total="props.row.usage.gpu.all"
                />
                <span class="progress-desc">{{ `${props.row.usage.gpu.size} / ${props.row.usage.gpu.all}` }}</span>
              </div>
            </template> -->
            <!-- 사용량.Disk -->
            <!-- <template #assignvcpu="props">
              <div class="cell-flex-wrap -wrap">
                <progress-bar
                  class="size-progress-bar"
                  :value="props.row.assign.vcpu.size"
                  :total="props.row.assign.vcpu.all"
                />
                <span class="progress-desc">{{ `${props.row.assign.vcpu.size}C / ${props.row.assign.vcpu.all}C` }}</span>
              </div>
            </template> -->
            <!-- 할당량.vCPU -->
            <!-- <template #assignmemory="props">
              <div class="cell-flex-wrap -wrap">
                <progress-bar
                  class="size-progress-bar"
                  :value="props.row.assign.memory.size"
                  :total="props.row.assign.memory.all"
                />
                <span class="progress-desc">{{ `${props.row.assign.memory.size}GB / ${props.row.assign.memory.all}GB` }}</span>
              </div>
            </template> -->
            <!-- 할당량.Memory -->
            <!-- <template #assigndisk="props">
              <div class="cell-flex-wrap -wrap">
                <progress-bar
                  class="size-progress-bar"
                  :value="props.row.assign.disk.size"
                  :total="props.row.assign.disk.all"
                />
                <span class="progress-desc">{{ `${props.row.assign.disk.size}TB / ${props.row.assign.disk.all}TB` }}</span>
              </div>
            </template> -->
            <!-- 할당량.Disk -->
            <!-- <template #relateVm="props">
              <div class="cell-flex-wrap">
                <cmp-status-tag
                  tooltip
                  :contents="`${props.row.relateVm.length}대`"
                  v-if="props.row.relateVm.length"
                  tooltip-popper-class="vm-info-popper"
                  tooltip-effect="dark"
                >
                  <template #toolTip>
                    <div v-html="vmInfo(props.row.relateVm)" />
                  </template>
                </cmp-status-tag>
                <span v-else>-</span>
              </div>
            </template> -->
            <!-- 관련 VM -->
          </cmp-grid>
        </div>
      </article>
    </section>
    <section class="modal-footer big-button-area">
      <button
        class="button"
        type="is-anti"
        @click="close"
      >
        취소
      </button>
      <button
        class="button"
        type="is-primary"
        @click="confirm"
      >
        확인
      </button>
    </section>
  </el-dialog>
</template>
<script>
import API from '@sd-fe/cmp-core'

export default {
  name: 'SetEraClusterModal',
  props: {
    data: {
      type: Object,
      default () {
        return {}
      }
    },
    active: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '클러스터 선택'
    },
    type: {
      type: String,
      default: 'cluster',
      validator (value) {
        return ['cluster'].includes(value)
      }
    },
    width: {
      type: String,
      default: '80%'
    }
  },
  computed: {
    computeTitle () {
      if (this.type === 'cluster') return '클러스터 선택'
      else return '클러스터 선택'
    }
  },
  watch: {
    active (newVal) {
      this.isActive = newVal
    },
    isActive (newVal) {
      this.active = newVal

      if (newVal) this.setResetGrid()
    },
    data (newVal) {
      this.modalData = newVal
    }
  },
  created () {
    this.modalData = JSON.parse(JSON.stringify(this.data))
  },
  methods: {
    initClusterGrid (grid) {
      this.clusterGrid = grid
    },
    gridRefresh (grid) {
      const cv = grid.collectionView
      cv.refresh()
    },
    /**
     * 선택된 클러스터를 모두 취소해줍니다.
     */
    setResetGrid () {
      this.selectedCluster = null

      this.gridRefresh(this.clusterGrid)
    },
    close () {
      this.selectedCluster = null
      this.$emit('close')
    },

    confirm () {
      if (this.type === 'cluster' && (!this.selectedCluster)) {
        this.$alert(this.$t('common.ALERT.NUTA.011'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
        return false
      } else {
        this.$emit('confirm', { cluster: this.selectedCluster })
      }
      this.close()
    },
    /**
     * 선택 클러스터 = this.selectedCluser
     */
    setSelectedCluster (param) {
      this.$emit('selectedCluster', param)
      this.selectedCluster = param
    },

    async init () {
      const userProfIdx = 26
      const response = await this.getUserProfilePopUp(userProfIdx)
      if (response !== undefined) {
        this.clusterGridData = response
        console.log(response)
      }
    },
    async getUserProfilePopUp (userProfIdx) {
      // 사용 안하는 컴포넌트
      return API.database.getUserProfilePopUp(userProfIdx)
    }
  },
  data () {
    return {
      modalData: null,
      isActive: this.active || false,
      selectedCluster: null,

      // 클러스터 그리드 데이터
      clusterHeaderMergeColumns: {
        colSpan: [
          { startIdx: 4, endIdx: 6, header: '할당량' }
        ],
        rowSpan: ['eraClusterName', 'eraStorageContianer', 'externalIp', 'cloudType']
      },
      clusterColumns: [
        { header: 'eraClusterName', binding: 'eraClusterName', customHtml: true },
        { header: 'eraStorageContainer', binding: 'eraStorageContainer', customHtml: true },
        { header: 'externalIp', binding: 'externalIp', customHtml: true },
        { header: 'cloudType', binding: 'cloudType', customHtml: true },
        { header: 'storageThresholdPercentage', binding: 'storageThresholdPercentage', customHtml: true },
        { header: 'momoryThresholdPercentage', binding: 'memoryThresholdPercentage', customHtml: true }
      ],
      // clusterColumns: [
      //   { header: '이름', binding: 'name', width: '*', customHtml: true },
      //   { header: 'Node', binding: 'node', width: 70, customHtml: true },
      //   { header: 'VM', binding: 'vm', width: 70, customHtml: true },
      //   { header: '관련 VM', binding: 'relateVm', width: 70, customHtml: true },
      //   { header: 'vCPU', binding: 'assign.vcpu', width: '*', customHtml: true },
      //   { header: 'Memory', binding: 'assign.memory', width: '*', customHtml: true },
      //   { header: 'Disk', binding: 'assign.disk', width: '*', customHtml: true }
      // ],
      clusterGridData: [
      ]
      // clusterGridData: [
      //   { type: 'SSD', name: '클러스터1', node: 16, vm: 30, relateVm: 4, assign: { vcpu: { size: 72, all: 128 }, memory: { size: 40, all: 128 }, disk: { size: 149, all: 2182 } } },
      //   { type: 'GPU', name: '클러스터2', node: 12, vm: 24, relateVm: 0, assign: { vcpu: { size: 12, all: 64 }, memory: { size: 80, all: 256 }, disk: { size: 30, all: 35 } } },
      //   { type: 'GPU', name: '클러스터3', node: 12, vm: 20, relateVm: 0, assign: { vcpu: { size: 64, all: 128 }, memory: { size: 100, all: 128 }, disk: { size: 30, all: 35 } } }
      // ],
    }
  }
}
</script>
<style lang="scss" scoped>
  .set-era-cluster-modal {
    .node-contents {
      & + .node-contents {
        margin-top: 50px;
      }
      .progress-desc {
        display: inline-block;
        font-size: 12px;
        margin-top: 5px;
      }
    }
  }
</style>
