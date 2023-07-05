<template>
  <div class="migrate-vm">
    <section
      class="migrate-vm-contents"
      :style="{maxHeight: height}"
    >
      <div
        class="current-node-area"
        v-loading="loading"
      >
        <span class="small-title">현재 ESXi 정보</span>

        <esxi-list
          v-if="currentHost"
          :custom-host-grid-data="[{...currentHost}]"
          :init-auto-select-row="currentHost"
          :selectable="false"
        />
      </div>

      <div class="node-area">
        <span class="small-title">이관 ESXi 선택</span>
        <esxi-list
          :init-auto-select-row="selectedHost"
          :image-info="vmImageInfo"
          :manage-group-idx="vmData.userInfo.manageGroupIdx"
          searchable-name
          view-center-tree
          @select="row => destNode = row"
          @loaded-rows="onLoadedRows"
        />
      </div>
    </section>
    <div class="modal-button-area -center">
      <button
        class="button"
        type="is-anti"
        @click="close()"
      >
        {{ $v('취소') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="proceedMigrate"
      >
        {{ $v('확인') }}
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
            hostName: vmData.name,
            startNodeName: currentHost.name,
            destNodeName: destNode.name
          })"
        />
        <!-- {hostName}을<br>{startNodeName} → {destNodeName}<br>이전 하시려면<br>호스트 명을 동일하게 입력해주세요. -->

        <el-input
          v-model="checkHostname"
          :placeholder="$v('호스트 명을 입력하세요.')"
          @keyup.native.enter="e => {
            if(vmData.name !== checkHostname) return
            save()
          }"
        />
        <small
          class="-reference"
          v-if="!checkHostname"
        >*&nbsp;{{ $v('호스트 명을 입력하세요.') }}</small>

        <small
          class="-reference"
          v-else-if="vmData.name !== checkHostname"
        >*&nbsp;{{ $v('호스트 명이 올바르지 않습니다.') }}</small>

        <div class="modal-button-area">
          <button
            class="button -modal-button"
            type="is-anti"
            @click="migratePop = false"
          >
            {{ $v('취소') }}
          </button>
          <button
            class="button -modal-button"
            @click="save"
            type="is-primary"
            :disabled="vmData.name !== checkHostname"
          >
            {{ $v('확인') }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import API, { VMwareEsxiList } from '@sd-fe/cmp-core'
import { Tooltip } from '@grapecity/wijmo'
import { cloneDeep } from 'lodash'

export default {
  name: 'MigrateVmwareVm',
  components: {
    'esxi-list': VMwareEsxiList
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
    migratePop (state) {
      if (!state) this.checkHostname = ''
    }
  },
  async mounted () {
    if (this.vmData?.userInfo?.imageId) await this.getVMwareImage(this.vmData?.userInfo?.imageId) // 이미지 조회 (사용 불가능 ESXi 를 표기하기 위함)
    await this.getEsxiList() // Esxi 목록 조회
    await this.setCurrentNode(this.vmData.hostUuid)

    this.restHosts = this.allHosts.filter(nd => nd.hostUuid !== this.currentHost.hostUuid)

    this.filterEsxi()
  },
  methods: {
    async getVMwareImage (userImageIdx) {
      if (!userImageIdx) return
      try {
        this.loading = true
        const data = await API.vmware.image.getVMwareImage(userImageIdx)
        this.vmImageInfo = data
      } catch (error) {
        console.error(error)
        return this.$alert('이미지 조회에 문제가 발생했습니다.', () => false)
      } finally {
        this.loading = false
      }
    },
    /**
     * ESXi(호스트) 목록 조회
     *
     */
    async getEsxiList () {
      const hostList = await this.getVmwareHostList()

      this.allHosts = hostList.map(host => ({
        ...host,
        isSelectable: !!host.datastoreList?.length // 데이터스토어가 없는 호스트의 row는 disable 처리 하기 위함
      }))
    },
    /**
     * VMware 호스트 조회
     */
    async getVmwareHostList (params) {
      try {
        this.loading = true
        const data = await API.vmware.host.getVmwareHostList({
          ...params
        })
        return data || []
      } catch (error) {
        console.error(error)
        return this.$alert('호스트 조회에 문제가 발생했습니다.', () => false)
      } finally {
        this.loading = false
      }
    },
    /**
     * hostUuid를 비교해서 현재 노드 위치 정보를 가져옵니다.
     * @param {String} hostUuid 비교할 Uuid
     */
    setCurrentNode (hostUuid) {
      this.currentHost = this.allHosts.find(nd => nd.hostUuid === hostUuid)
      console.log('@current host:: ', this.currentHost)
    },
    /**
     * ESXi 이름 검색
     */
    filterEsxi (value) {
      if (value) {
        this.filteredHosts = [...this.restHosts].filter(row => row.name?.toLowerCase().includes(value?.toLowerCase()))
      } else this.filteredHosts = [...this.restHosts]
    },
    /**
    * disabled row 설정 -> 데이터스토어가 없는 호스트
    */
    onLoadedRows (grid) {
      this.$nextTick(function () {
        for (let i = 0; i < grid.rows.length; i++) {
          const row = grid.rows[i]
          const item = row.dataItem
          const cssList = cloneDeep(row.cssClass)

          // * 이관 가능 호스트 조건
          // 1. 원래 호스트와 다른 호스트
          // 2. 데이터스토어가 있는 호스트
          // 3. [vm이 속한 데이터스토어 + Local disk가 속한 데이터스토어]를 모두 가진 호스트로만 이관 가능하도록 (Local Disk까지 체크하는 이유는 미등록 자원이 있기 때문)

          // 1
          item._isSameHost = this.vmData?.hostUuid === item.hostUuid // 1

          // 2
          item._isNoDatastore = !item.datastoreList?.length

          // 3
          if (!item._isNoDatastore) {
            const imageDatastoreIds = item.datastoreList.map(ds => ds.datastoreId)

            item._isHasAvailableDatastore = imageDatastoreIds.includes(this.vmData?.userInfo?.datastoreId) &&
              this.vmData?.diskList.every(disk => imageDatastoreIds.includes(disk?.backing?.datastoreId))
          }

          if (item._isSameHost || item._isNoDatastore || !item._isHasAvailableDatastore) {
            item.isSelectable = false
            row.cssClass = cssList + ' is-disable-row'
          } else {
            item.isSelectable = item.isSelectable !== false
            row.cssClass = !item.isSelectable ? row.cssClass : ''
          }
        }

        grid.formatItem.addHandler((s, e) => {
          const rowData = s.rows[e.row]?._data
          if (!rowData?.isSelectable) {
            let tooltipMsg = ''
            if (rowData?._isSameHost === true) tooltipMsg = '현재 ESXi와 동일합니다.'
            else if (rowData?._isNoDatastore === true) tooltipMsg = 'ESXi에 이관 가능한 데이터스토어가 없습니다.'
            else if (rowData?._isHasAvailableDatastore === false) tooltipMsg = '해당 ESXi에 vm과 Local Disk를 모두 이관할 수 있는 데이터스토어가 없습니다.'
            if (tooltipMsg) {
              this.gridTooltip.setTooltip(e.cell,
              `<small>* ${tooltipMsg}</small>`)
            }
          }
        })
      })
    },
    close () {
      this.$emit('close')
    },
    /**
     * vm 이관 진행
     */
    proceedMigrate () {
      if (!this.vmData) return this.$alert(this.$v('현재 ESXi 위치 정보가 없습니다.'), () => false)
      if (!this.destNode) return this.$alert('목적지 ESXi를 선택해주세요.', () => false)
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
    }
  },
  data (root) {
    return {
      migratePop: false,
      loading: false,
      destNode: null, // 이관 목적지 노드
      checkHostname: '', // 이관 시, 체크 할 호스트 명
      columns: [
        { binding: 'vcenter.name', header: 'vCenter', width: 170 },
        { binding: 'name', header: '이름', width: 150 },
        { binding: 'cpuInfo', header: 'CPU', customHtml: true, width: 150 },
        { binding: 'memoryUsage', header: 'Memory', customHtml: true },
        { binding: 'datastore', header: 'datastore', customHtml: true, width: 150 },
        { binding: 'powerState', header: '상태', customHtml: true, width: 100 }
      ],
      allHosts: [], // 전체 호스트
      currentHost: null, // 현재 호스트
      restHosts: [], // 나머지 호스트
      inputEsxiName: '',
      filteredHosts: [],
      selectedHost: null,
      vmImageInfo: undefined,
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
    .current-node-area { min-height: 126px; }
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
