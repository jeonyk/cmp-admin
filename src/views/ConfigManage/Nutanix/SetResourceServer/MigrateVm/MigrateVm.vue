<template>
  <div class="migrate-vm">
    <section
      class="migrate-vm-contents"
      :style="{maxHeight: height}"
    >
      <el-tag
        class="clustername-tag"
        :style="{
          left: $i18n.locale === 'en' ? '200px' : '110px'
        }"
      >
        {{ vmData.clusterName }}
      </el-tag>
      <div>
        <span class="small-title">{{ $v('현재 노드 위치') }}</span>

        <cmp-grid
          :columns="columns"
          :item-source="[{...currentNode}]"
          :init-auto-select-row="currentNode"
          init-auto-select-row-key="nodeName"
          class="current-node-grid"
          :selectable="false"
        >
          <template #hypervisorCpuUsagePpm="props">
            <progress-bar
              :value="props.row.hypervisorCpuUsagePpm"
              :total="1000000"
              :incr-decr-rate="destNode ? -props.row.cpuIncrDecrRate : undefined"
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
              :incr-decr-rate="destNode ? -props.row.memoryIncrDecrRate : undefined"
              height="20px"
              :notice-percent="60"
              :alert-percent="80"
            />
          </template>
        <!-- Memory 사용량 -->
        </cmp-grid>
      </div>
      <select-node-grid
        class="node-area"
        @select="row => destNode = row"
        :grid-data="otherNodes"
        :use-btn="false"
        @loaded-rows="onLoadedRows"
      />
    </section>
    <div class="button-area page-bottom -center">
      <button
        class="button"
        type="is-anti"
        @click="close()"
      >
        <!-- 취소 -->
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="proceedMigrate"
      >
        <!-- 확인 -->
        {{ $t('common.BTN.confirm') }}
      </button>
    </div>

    <section
      class="pass-migrate-form"
      v-if="migratePop"
    >
      <div class="form-body">
        <i
          class="mdi mdi-close close-btn"
          @click="migratePop = false"
        />
        <span
          v-html="$t('common.ALERT.COMP.046', {
            hostName: vmData.hostname,
            startNodeName: vmData.nodeName,
            destNodeName: destNode.nodeName
          })"
        />
        <!-- {hostName}을<br>{startNodeName} → {destNodeName}<br>이전 하시려면<br>호스트 명을 동일하게 입력해주세요. -->

        <el-input
          v-model="checkHostname"
          :placeholder="$t('common.ALERT.COMP.036')"
          @keyup.native.enter="e => {
            if(vmData.hostname !== checkHostname) return
            save()
          }"
        />
        <small
          class="-reference"
          v-if="!checkHostname"
        >*&nbsp;{{ $t('common.ALERT.COMP.036') }}</small>
        <!-- 호스트 명을 입력하세요. -->

        <small
          class="-reference"
          v-else-if="vmData.hostname !== checkHostname"
        >*&nbsp;{{ $t('common.ALERT.COMP.037') }}</small>
        <!-- 호스트명이 올바르지 않습니다. -->

        <div class="modal-button-area">
          <button
            class="button -modal-button"
            type="is-anti"
            @click="migratePop = false"
          >
            <!-- 취소 -->
            {{ $t('common.BTN.cancel') }}
          </button>
          <button
            class="button -modal-button"
            @click="save"
            type="is-primary"
            :disabled="vmData.hostname !== checkHostname"
          >
            <!-- 확인 -->
            {{ $t('common.BTN.confirm') }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
import { cloneDeep } from 'lodash'
import { Tooltip } from '@grapecity/wijmo'

import SelectNodeGrid from '@/components/Modal/UpdateResource/ComputeUpdateForm/SelectNodeGrid/SelectNodeGrid'
import ProgressBar from '@/components/ProgressBar/ProgressBar'

export default {
  name: 'MigrateVm',
  components: {
    SelectNodeGrid,
    ProgressBar
  },
  props: {
    vmData: {
      type: Object,
      default: null
    },
    height: { // 콘텐츠에 스크롤 생기기 시작 높이
      type: String,
      default: '67vh'
    }
  },
  watch: {
    vmData: {
      immediate: true,
      async handler  (newVal, oldVal) {
        if (!oldVal) {
          if (newVal.manageGroupIdx) {
            this.vmManageGroup = this.getOperationList({
              moduleType: 'NX',
              operatingGroupType: 'COMPUTE',
              operatingGroupIdx: newVal.manageGroupIdx
            })
          }
          await this.getHosts(newVal.elementIdx)
          this.setCurrentNode(newVal.hostUuid)
        }
      }
    },
    migratePop (state) {
      if (!state) this.checkHostname = ''
    }
  },
  methods: {
    /**
     * 노드 정보 조회
     */
    async getHosts (clusterUuid) {
      try {
        this.loading = true
        const res = await API.compute.getHosts(clusterUuid)
        const vmManageGroup = this.vmManageGroup?.length ? this.vmManageGroup[0] : null

        this.nodes = res.map(row => {
          return {
            ...row,
            cpuIncrDecrRate: this.vmData?.numVcpus ? (+this.vmData.numVcpus / row.numCpuCores * 100).toFixed(2) : 0, // vCPU 사용량 증감률
            memoryIncrDecrRate: this.vmData?.memoryCapacityInBytes ? (+this.vmData?.memoryCapacityInBytes / row.memoryCapacityInBytes * 100).toFixed(2) : 0, // memory 사용량 증감률,
            ...(vmManageGroup?.clusterNodeType === 'HOST' && {
              isInMangeGroup: vmManageGroup.clusterNodeList.some(item => item.clusterNodeId === row.hostUuid)
            })
          }
        })
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.$alert(message)
      } finally {
        this.loading = false
      }
    },
    /**
    * API: 운영그룹 목록을 조회합니다.
    */
    // 운영그룹 조회
    async getOperationList (params) {
      try {
        const { data } = await API.billing.getOperationGroup(params)
        return data || []
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('운영 그릅 조회에 실패하였습니다.'), () => false)
      }
    },
    /**
     * hostUuid를 비교해서 현재 노드 위치 정보를 가져옵니다.
     * @param {String} hostUuid 비교할 Uuid
     */
    setCurrentNode (hostUuid) {
      this.currentNode = this.nodes.find(nd => nd.hostUuid === hostUuid)
      console.log('CURRENT NODE: ', this.currentNode)
      this.otherNodes = this.nodes.filter(nd => nd.hostUuid !== hostUuid)
    },
    close () {
      this.$emit('close')
    },
    /**
     * vm 이관 진행
     */
    proceedMigrate () {
      if (!this.vmData) return this.$alert(this.$t('common.ALERT.COMP.047')) // 현재 노드 위치 정보가 없습니다.
      if (!this.destNode) return this.$alert(this.$t('common.ALERT.COMP.048')) // 목적지 노드를 선택해주세요.
      this.migratePop = true
    },
    /*
    * vm 이관
     */
    save () {
      const emitData = {
        vmData: this.vmData,
        destNode: this.destNode
      }
      this.$emit('save', emitData)
    },
    /**
    * disabled row 설정
    * 1. [isInMangeGroup] vm의 운영그룹 타입이 'NODE'일 때, 운영그룹에 설정된 노드만 선택 가능
    */
    onLoadedRows (grid) {
      this.$nextTick(function () {
        for (let i = 0; i < grid.rows.length; i++) {
          const row = grid.rows[i]
          const item = row.dataItem
          const cssList = cloneDeep(row.cssClass)
          if (item?.isInMangeGroup === false) {
            item.isSelectable = false
            item.disable = true
            row.cssClass = cssList + ' is-disable-row'
          } else {
            item.disable = false
            row.cssClass = cssList?.replace(' is-disable-row', '') || ''
          }
        }

        grid.formatItem.addHandler((s, e) => {
          const rowData = s.rows[e.row]?._data
          if (!rowData?.isSelectable) {
            const tooltipMsg = this.$v('선택한 운영그룹에 설정된 노드만 선택 가능합니다.')

            this.gridTooltip.setTooltip(e.cell, `<small>* ${tooltipMsg}</small>`)
          }
        })
      })
    }
  },
  data () {
    return {
      migratePop: false,
      loading: false,
      nodes: [], // 노드 그리드 정보 (현재 위치 노드 포함)
      otherNodes: [], // 노드 그리드 정보 (전체)
      destNode: null, // 이관 목적지 노드
      checkHostname: '', // 이관 시, 체크 할 호스트 명
      columns: [
        { header: this.$t('common.REGCON.name'), binding: 'nodeName', width: 150 },
        { header: 'vm 수', binding: 'numVms', width: 80, keyPath: 'common.GRID.COMPUTE.numberOfVm' },
        { header: 'Node Serial', binding: 'serial' },
        { header: 'Block Serial', binding: 'blockSerial' },
        { header: 'Block Model', binding: 'blockModelName' },
        { header: this.$t('common.GRID.CLUSTER.usageCpu'), binding: 'hypervisorCpuUsagePpm', customHtml: true },
        { header: this.$t('common.GRID.COMPUTE.usageMemory'), binding: 'hypervisorMemoryUsagePpm', customHtml: true }
      ],
      currentNode: [], // 현재 노드
      vmManageGroup: [],
      gridTooltip: new Tooltip({
        showAtMouse: true,
        showDelay: 200
      })
    }
  }
}
</script>

<style lang="scss">
  .migrate-vm {
    .clustername-tag {
      position: absolute;
      top: 22px;
      left: 110px;
    }
    .-reference {
      display: block;
      margin-top: $gap-s;
      width: 100%;
      color: $main-red;
    }
    .migrate-vm-contents { overflow-y: auto; }
    .node-area { margin-top: $gap-m; }
    .current-node-grid {
      .wj-cells {
        // cell
        .wj-cell {
          &.selected-row {
            background: $white;
            color: $color-black;
          }
        }
      }
    }
    .pass-migrate-form {
      &:before {
        content: '';
        position: fixed;
        top: 0; left: 0; bottom: 0; right: 0;
        z-index: 3;
        background-color: rgba(0,0,0,.5);
      }
      .form-body {
        position: fixed;
        top: 50%;
        left: 50%;
        display: flex;
        align-items: center;
        flex-direction: column;
        padding: 40px 30px 30px;
        width: 300px;
        height: auto;
        z-index: 10;
        background-color: #161A30;
        box-sizing: border-box;
        transform: translate(-50%, -50%);
        > span {
          display: block;
          text-align: center;
          line-height: 22px;
          margin-bottom: $gap;
        }
        .close-btn {
          position: absolute;
          top: $gap;
          right: $gap;
        }
      }
    }
  }
</style>
