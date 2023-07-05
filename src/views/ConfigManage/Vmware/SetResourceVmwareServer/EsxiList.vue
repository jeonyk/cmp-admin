<template>
  <div class="esxi-list">
    <search-component
      v-if="searchableName"
      v-model="inputEsxiName"
      class="search-area"
      placeholder="ESXi 이름 검색"
      @search="val => {
        filterEsxi(val)
      }"
    />
    <cmp-grid
      class="esxi-grid"
      v-loading="loading"
      :columns="columns"
      :item-source="filteredList"
      :init-auto-select-row="initAutoSelectRow"
      :init-auto-select-row-key="initAutoSelectRowKey"
      :init-custom-action="flex => esxiGrid = flex"
      :selectable="selectable"
      @selectedRow="selectRow"
      @loaded-rows="loadedRows"
    >
      <template #hypervisorCpuUsagePpmValue="{ row }">
        <progress-bar
          :total="100"
          :value="row.hypervisorCpuUsagePpmValue"
          :notice-percent="row.userConnectInfo?row.userConnectInfo.firstCpuPercent:60"
          :alert-percent="row.userConnectInfo?row.userConnectInfo.secondCpuPercent: 80"
        />
      </template>
      <!-- CPU 사용량 -->
      <template #hypervisorMemoryUsagePpmValue="{ row }">
        <progress-bar
          :total="100"
          :value="row.hypervisorMemoryUsagePpmValue"
          :notice-percent="row.userConnectInfo?row.userConnectInfo.firstMemoryPercent: 60"
          :alert-percent="row.userConnectInfo?row.userConnectInfo.firstMemoryPercent: 80"
        />
      </template>
      <template #storageUsageBytes="{ row }">
        <progress-bar
          :total="100"
          :value="row.storageUsageBytes"
          :notice-percent="row.userConnectInfo?row.userConnectInfo.firstStoragePercent: 60"
          :alert-percent="row.userConnectInfo?row.userConnectInfo.firstStoragePercent: 80"
        />
      </template>
      <!-- 메모리 사용률 -->
      <template #hypervisorMemoryUsage="{ row }">
        {{ row.hypervisorMemoryUsage | byte }}
      </template>
      <!-- 총 메모리 -->

      <template #cpuUsagePct="{ row }">
        <el-tooltip
          v-if="!isNaN(parseFloat(row.overallCpuUsage)) && !isNaN(parseFloat(row.cpuCores)) && !isNaN(parseFloat(row.cpuMhz))"
          placement="top"
          effect="light"
        >
          <template #content>
            <span>
              {{ row.overallCpuUsage }}Core&nbsp;/&nbsp;{{ row.cpuCores * row.cpuMhz }}Core
            </span>
          </template>
          <progress-bar
            :total="row.cpuCores * row.cpuMhz"
            :value="row.overallCpuUsage"
          />
        </el-tooltip>
        <span v-else>-</span>
      </template>

      <template #memoryUsagePct="{ row }">
        <el-tooltip
          v-if="!isNaN(parseFloat(row.memorySize)) && !isNaN(parseFloat(row.overallMemoryUsage))"
          placement="top"
          effect="light"
        >
          <template #content>
            <span>
              {{ row.overallMemoryUsage | MB }}&nbsp;/&nbsp;{{ row.memorySize | byte }}
            </span>
          </template>
          <progress-bar
            :total="row.memorySize"
            :value="row.overallMemoryUsage * 1024 * 1024"
          />
        </el-tooltip>

        <span v-else>-</span>
      </template>

      <template #storageUsagePct="{ row }">
        <el-tooltip
          v-if="!isNaN(parseFloat(row.storageUsage)) && !isNaN(parseFloat(row.storageTotal))"
          placement="top"
          effect="light"
        >
          <template #content>
            <span>
              {{ row.storageTotal | byte }}&nbsp;/&nbsp;{{ row.storageUsage | byte }}
            </span>
          </template>
          <progress-bar
            :value="row.storageUsage"
            :total="row.storageTotal"
          />
        </el-tooltip>
        <span v-else>-</span>
      </template>

      <template #datastore="{ row }">
        <div v-if="row.datastoreList && row.datastoreList.length">
          <span
            v-if="row.datastoreList.length > 1"
          >{{ row.datastoreList[0].name }} {{ $t('common.TERMS.other') }}
            <el-tooltip
              placement="bottom-end"
              popper-class="panel-title-popper"
              effect="light"
            >
              <template #content>
                <span v-html="ArrayjoinWithHtml(row.datastoreList)" />
              </template>
              <a class="-link">{{ row.datastoreList.length - 1 }}</a>
            </el-tooltip>
          </span>

          <span v-else>{{ row.datastoreList[0].name }}</span>
        </div>
        <span v-else>-</span>
      </template>

      <template #powerState="{ row }">
        <cmp-status-tag
          v-if="row.powerState && ['POWERED_ON' , 'POWERED_OFF', 'UNKNOWN'].includes(row.powerState)"
          :type="{
            POWERED_ON: 'is-info',
            POWERED_OFF: 'is-undefined',
            UNKNOWN: 'is-fail'
          }[row.powerState]"
          :line-style="true"
          :style="{minWidth: '60px'}"
          @loaded-rows="loadedRows"
        >
          {{ {
            POWERED_ON: 'ON',
            POWERED_OFF: 'OFF',
            UNKNOWN: 'Disconnect'
          }[row.powerState] }}
        </cmp-status-tag>
        <span v-else>-</span>
      </template>
    </cmp-grid>
  </div>
</template>

<script>
import { Tooltip } from '@grapecity/wijmo'
import ProgressBar from '@/components/ProgressBar/ProgressBar'

export default {
  name: 'EsXiList',
  components: {
    ProgressBar
  },
  props: {
    esxiData: {
      type: Array,
      default: () => []
    },
    selectable: {
      type: Boolean,
      default: true
    },
    initAutoSelectRow: {
      type: [Object, Array],
      default: undefined
    },
    initAutoSelectRowKey: {
      type: String,
      default: 'hostUuid'
    },
    loading: {
      type: Boolean,
      default: false
    },
    searchableName: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    esxiData: {
      immediate: true,
      async handler (data) {
        this.griData = await this.setEsxiGridList(data)
        this.filterEsxi()
      }
    }
  },
  methods: {
    /**
     * 그리드 가공 > 구성관리 물리서버(HOST)를 참고.
     */
    async setEsxiGridList (data) {
      if (!data) return []

      const esxiList = data.map(el => {
        let sumCap = 0 // 커패시터의 합
        let sumFs = 0// 프리스페이스의 합
        if (el.datastoreList?.length) {
          el.datastoreList.forEach((ds) => {
            const { capacity, freeSpace } = ds
            sumCap += capacity
            sumFs += freeSpace
          })
        }

        const customData = {
          hypervisor: 'VMware ESXi' + el.version + el.build,
          storageUsage: sumCap - sumFs,
          storageTotal: sumCap
        }

        return { ...el, ...customData }
      })

      return esxiList
    },
    /**
     * 배열 순회하며 <br/>로 묶어서 리턴
     * @param {Array} list 순회 할 배역
     */
    ArrayjoinWithHtml (list) {
      if (list.length <= 1) return

      let revealText = ''

      for (let i = 1; i < list.length; i++) {
        const unit = () => {
          if (i === 1) return ''
          return (i % 2 ? ',<br>' : ', ')
        }

        revealText += (unit() + list[i].name)
      }
      return revealText
    },
    /**
     * row 선택 발생 이벤트
     */
    selectRow (rowGroup) {
      const param = rowGroup?._data ? rowGroup._data : null
      this.$emit('select', param)
    },
    /**
     * EsXi 이름 검색
     */
    filterEsxi (value) {
      if (value) {
        this.filteredList = [...this.griData].filter(row => row.name?.toLowerCase().includes(value?.toLowerCase()))
      } else this.filteredList = [...this.griData]
    },
    loadedRows (grid, args) {
      this.setUnsupportHostDisable(grid)
      this.$emit('loaded-rows', grid, args)
    },
    /**
    * ESXi 선택 그리드 disabled row 설정
    * 1. 연결 끊긴 ESXi는 disable
    * 2. * 선택 image의 fileList에 ESXi의 호스트Uuid가 없는 경우
    * 3. * 선택 image의 fileList에 `isSupportGuestOsId: false`인 ESXi인 경우(Guest OS가 지원하지 않음)
    * 4. * 선택 image의 fileList에 `isDsDeleted: true`인 ESXi의 경우(데이터 스토어에 이미지 파일이 없음)
    * @param {GridObject} grid
    */
    setUnsupportHostDisable (grid) {
      this.$nextTick(function () {
        for (let i = 0; i < grid.rows.length; i++) {
          const row = grid.rows[i]
          const item = row.dataItem
          const cssList = row.cssClass
          if (item.powerState === 'UNKNOWN' ||
          item.inImage === false ||
          item.isSupportGuestOsId === false ||
          item.isDsDeleted === true
          ) {
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
            let tooltipMsg = ''
            if (rowData?.inImage === false) tooltipMsg = this.$v('해당 ESXi가 선택한 이미지OS를 지원하지 않습니다.')
            else if (rowData?.isSupportGuestOsId === false) tooltipMsg = this.$v('ESXi의 Guest OS가 선택한 이미지OS를 지원하지 않습니다.')
            else if (rowData?.isDsDeleted === true) tooltipMsg = this.$v('해당 ESXi의 데이터스토어에 이미지 파일이 없습니다.')
            else if (rowData?.powerState === 'UNKNOWN') tooltipMsg = this.$v('* 연결 끊김')

            this.tooltip.setTooltip(e.cell,
              `<small>* ${tooltipMsg}</small>`)
          }
        })
      })
    },
    // 다른 컴포넌트에서 ref로 받아서 사용하는 메서드이므로 절대 지우지 말 것.
    gridRefresh (grid = this.esxiGrid) {
      if (!grid) return
      const cv = grid?.collectionView
      if (!cv) return
      cv.refresh()
    }
  },
  data: (root) => ({
    filteredList: [],
    griData: [],
    inputEsxiName: '',
    columns: [
      { binding: 'userConnectInfo.name', header: 'vCenter', width: 120 },
      { header: 'ESXi명', binding: 'name', width: 120 },
      { header: '하이퍼바이저', binding: 'hypervisor', width: '*', customHtml: true },
      { header: root.$v('모델'), binding: 'model', width: 80 },
      { header: '프로세스 유형', binding: 'cpuModel', width: '*' },
      { header: '논리 프로세서', binding: 'cpuCores', width: 100 },
      // { header: root.$v('연결 상태'), binding: 'connectionState', width: '*', customHtml: true },

      { binding: 'cpuUsagePct', header: root.$v('CPU 사용량(%)'), customHtml: true, width: 140, filtable: false },
      { binding: 'memoryUsagePct', header: root.$v('메모리 사용량(%)'), customHtml: true, filtable: false },
      { binding: 'storageUsagePct', header: '스토리지 사용량(%)', customHtml: true, width: '*', filtable: false },
      { binding: 'datastore', header: 'datastore', customHtml: true, width: 110 },
      { binding: 'powerState', header: '상태', customHtml: true, width: 110 }
    ],
    tooltip: new Tooltip({
      showAtMouse: true,
      showDelay: 200
    })
  })
}
</script>

<style lang="scss" scoped>
  .esxi-list {
    .search-area {
      margin-bottom: 10px;
    }
    .esxi-grid::v-deep {
      .cmp-grid-inner {
        overflow: auto;
        max-width: 100%;
        #cmpGrid {
          width: 130%;
        }
      }
    }
  }
</style>
