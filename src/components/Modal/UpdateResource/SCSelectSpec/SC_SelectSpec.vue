<!--
  * 파일명 : SC_SelectSpec.vue
  * 파일 기능 :
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2021-02-15
  * License By Shinsegae I&C
  * 2021-02-15 fix: [자원이관] - 체크 자원 세팅 및 출발지 프로젝트 설정
 -->

<template>
  <div class="select-spec-wrapper">
    <!-- {{ spec }} - 지금 선택된 사양 || <br>
    {{ selectedRow ? selectedRow.dataItem : '안선택됨..' }} -->
    <div class="custom-add">
      <!-- <button
        class="button"
        v-if="selectedRow && !editStatus"
        @click="removeSpecRow(specGridData)"
      >
        삭제
      </button> -->
      <button
        class="button"
        type="is-primary"
        v-if="isEditingRow"
        @click="saveAllRowData(specGridData)"
      >
        {{ $t('common.BTN.apply') }}
      </button>

      <button
        v-if="!isDatabase"
        :disabled="disabled || isEditingRow"
        class="button"
        type="is-dark"
        @click="addCustomSpec "
      >
        {{ $t('common.BTN.ADMIN.addCustom') }}
      </button>
    </div>
    <cmp-grid
      :item-source="specGridData"
      :columns="selectSpecColumns"
      :init-custom-action="initSpecGrid"
      :selectable="!disabled"
      @selectedRow="specSelectedData"
      :init-auto-select-row="initAutoSelectRow"
      :init-auto-select-row-key="initAutoSelectRowKey"
      :use-excel-download="false"
      @loaded-rows="onLoadedRows"
    >
      <template #flavorName="props">
        <!-- <el-input
          :disabled="true"
          v-model="props.row.flavorName"
          v-if="props.row.edit"
          @keydown.native.enter="saveAllRowData(specGridData)"
        /> -->
        <span>{{ props.row.flavorName }}</span>
      </template>
      <template #flavorCpu="props">
        <div
          class="flex-wrap"
          v-if="props.row.edit"
        >
          <el-input
            type="number"
            style="margin-right: 5px; width: 100px;"
            v-model="props.row.flavorCpu"
            :min="osType === 'WINDOWS' ? 2 : 1"
            @keydown.native="blockOtherKeys"
            @keypress.native.enter="saveAllRowData(specGridData)"
            @click.native="e => { e.stopPropagation() }"
          />
          <span>Core</span>
        </div>

        <span v-else>{{ props.row.flavorCpu }} Core</span>
      </template>
      <!-- VCPUs -->

      <template #flavorRam="props">
        <div
          v-if="props.row.edit"
          class="flex-wrap"
        >
          <el-input
            v-model="props.row.flavorRam"
            type="number"
            style="margin-right: 5px; width: 100px;"
            :min="osType === 'WINDOWS' ? 2 : 1"
            @keydown.native="blockOtherKeys"
            @keypress.native.enter="saveAllRowData(specGridData)"
            @click.native="e => { e.stopPropagation() }"
          />
          <span>GB</span>
        </div>

        <span v-else>{{ props.row.flavorRam }} GB</span>
      </template>
      <!-- RAM -->

      <template #flavorDisk="props">
        <div
          class="flex-wrap"
          v-if="props.row.edit"
        >
          <el-input
            v-model="props.row.flavorDisk"
            type="number"
            style="margin-right: 5px; width: 100px;"
            :min="customMinValue"
            @keydown.native="blockOtherKeys"
            @keypress.native.enter="saveAllRowData(specGridData)"
            @click.native="e => { e.stopPropagation() }"
          />
          <span>GB</span>
        </div>
        <span v-else>{{ props.row.flavorDisk }} GB</span>
      </template>
    </cmp-grid>
  </div>
</template>

<script>
import { cloneDeep } from 'lodash'
import * as wjGrid from '@grapecity/wijmo.grid'
import { Tooltip } from '@grapecity/wijmo'

export default {
  name: 'SCSelectSpec',
  props: {
    data: {
      type: Array,
      default: () => [],
      required: true
    },
    disabled: { // disabled 시켜야 할 경우 사용합니다.
      type: Boolean,
      default: false
    },
    isDatabase: { // Database 일 때는 Disk
      type: Boolean,
      default: false
    },
    initAutoSelectRow: { // 이전에 선택된 row의 dataItem - 그리드 시작시 해당 row 의 data 를 기반으로 Array에서 해당하는 row를 찾습니다.
      type: [Object, Array],
      default: null
    },
    initAutoSelectRowKey: { // 그리드 시작 시, 자동 선택되는 로우를 알기 위한 고유 key 값
      type: String,
      default: ''
    },
    // Custom 생성 시 최소 값
    customMinValue: {
      type: Number,
      default: 50
    },
    osType: { // 'LINUX', 'WINDOWS', 'CENTOS', 'RHEL', 'UBUNTU'
      type: String,
      default: 'LINUX'
    }
  },
  watch: {
    data (newVal) {
      this.specGridData = [...newVal]
      // console.log('@@ sc-select-spec > newVal : ', this.specGridData)
    },
    // initAutoSelectRow (newVal) {
    //   if (this.initAutoSelectRow) { this.selectedRow = this.initAutoSelectRow }
    // },
    selectedRow (rows) {
      if (rows) this.spec = rows.dataItem
      else this.spec = rows

      this.$emit('selected-spec', rows)
    }
  },
  computed: {
    isEditingRow () { // 수정 중인 row가 있는지? 있으면 true
      const editingRow = this.specGridData.filter(row => row.edit)
      return Boolean(editingRow.length)
    }
  },
  created () {
    // if (this.initAutoSelectRow) { this.selectedRow = this.initAutoSelectRow }
    this.specGridData = [...this.data]
    this.selectSpecColumns = this.isDatabase ? this.databaseCols : this.selectSpecColumns
    // console.log('@@ sc-select-spec > created : ', this.specGridData)
  },
  methods: {
    initSpecGrid (grid) {
      this.specGrid = grid

      if (this.disabled) {
        this.specGrid.select(2, 2) // disabled시 기본으로 설정되어야 하는지?? - 수정 필요
      }
    },
    /**
     * 사양선택 - row를 선택할때 해당 정보를 저장합니다.
     * @param {Object} row 선택한 row의 데이터를 가집니다.
     */
    specSelectedData (row) {
      if (this.disabled) return null
      else this.selectedRow = row
    },
    /**
     * 사양선택 - Custom 추가를 클릭했을 때 발생하는 이벤트를 핸들링합니다.
     * row를 하나씩 추가했을 때 먼저 edit 상태를 모두 false로 변경합니다.
     */
    addCustomSpec () {
      if (this.specGridData?.length) this.saveBeforeAddRow(this.specGridData)
      const newRow = new wjGrid.Row()

      const newObj = {
        flavorName: 'Custom',
        flavorCpu: 1,
        flavorRam: 1,
        flavorDisk: 50,
        edit: true,
        flavorCustomIdx: `Custom_${Math.random().toString(36).substr(2, 9)}` // 랜덤 고유 키 부여
      }
      newRow._data = newObj

      this.editStatus = true

      if (this.specGridData?.length) {
        this.specGrid.rows.insert(0, newRow)
        this.specGridData.unshift(newObj)
        this.gridRefresh()
      } else this.specGridData.push(newObj)
    },
    blockOtherKeys (e) {
      const blockKeys = ['e', '.', '-', '+']
      if (blockKeys.indexOf(e.key) >= 0) return e.preventDefault()
    },
    /**
     * 사양선택 - 모든 데이터 edit 상태를 false로 변경합니다.
     * @return {Array} 데이터의 값을 초기화합니다..
     */
    setAllRowDataEditDisable (gridData) {
      let flag = true
      let message = null
      const minVcpu = this.osType === 'WINDOWS' ? 2 : 1
      const minRam = this.osType === 'WINDOWS' ? 2 : 1

      for (let i = 0; i < gridData.length; i++) {
        if (!gridData[i].isSelectable) continue

        if (!gridData[i].flavorCpu) {
          message = this.$t('common.ALERT.COMP.007')
        } else if (!gridData[i].flavorRam) {
          message = this.$t('common.ALERT.CONF.013')
        } else if (!gridData[i].flavorDisk) {
          message = this.$t('common.ALERT.BASE.052')
        } else if (gridData[i].flavorCpu < minVcpu) {
          message = `VCPUs 최소 값은 ${minVcpu} 입니다.` // VCPUs 최소 값은 1 입니다.
          gridData[i].flavorCpu = minVcpu
        } else if (gridData[i].flavorRam < minRam) {
          message = `RAM 최소 값은 ${minRam} 입니다.` // RAM 최소 값은 1 입니다.
          gridData[i].flavorRam = minRam
        } else if (gridData[i].flavorDisk < this.customMinValue) {
          message = 'DISK 최소 값은 ' + this.customMinValue + '입니다.' // DISK 최소 값은 ' + this.customMinValue + ' 입니다.
          gridData[i].flavorDisk = this.customMinValue
        }
        if (message) {
          this.$alert(message)
          flag = false
          return false
        } else gridData[i].edit = false
        // if (!item.vcpus) item.vcpus = 1
        // if (!item.ram) item.ram = 20
      }
      return flag
    },
    /**
     * Custom 추가시 데이터를 edit상태를 변경하고 생성된 row를 선택합니다.
     * @param {Array} gridData - 그리드에 입력할 데이터
     */
    saveBeforeAddRow (gridData) {
      this.editStatus = !this.setAllRowDataEditDisable(gridData)

      // this.setAllRowDataEditDisable(gridData)
      // this.specGrid.select(0, 0)
    },
    /**
     * 적용 / row 변경사항 저장시 row[0]번을 자동으로 선택합니다.
     * @param {Array} gridData - 그리드에 입력할 데이터
     */
    saveAllRowData (gridData) {
      this.editStatus = !this.setAllRowDataEditDisable(gridData)
      this.selectedRow = this.specGrid.rows[0]
      setTimeout(() => this.gridRefresh(), 10)
      // setTimeout(() => this.specGrid.select(0, 0), 10)
    },
    /**
     * 사양선택 - [삭제] 버튼을 눌렀을 때, spec 그리드에서 선택한 row 삭제
     * 기본제공되는 사양들은 삭제할 수 없으므로 validation 처리
     * @param {Array} gridData - 그리드에 입력할 데이터
     * @param {Object} item 삭제 할 아이템
     */
    removeSpecRow (gridData, item = this.selectedRow) {
      if (item.dataItem.flavorName === 'Custom') {
        const removeIdx = item._idx

        this.specGrid.rows.remove(this.specGrid.rows[removeIdx])
        gridData.splice(removeIdx, 1)

        setTimeout(() => {
          this.specGrid.select(0, 0)
          this.selectedRow = this.specGrid.rows[0]
        }, 10)
      } else {
        this.$alert(this.$t('common.ALERT.PROJECT.033'), '알림', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: this.$t('common.BTN.confirm'),
          callback: () => false
        })
      }
    },
    gridRefresh (grid = this.specGrid) {
      if (!grid) return
      const cv = grid.collectionView
      cv.refresh()
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
          if (this.osType === 'WINDOWS' &&
            !item.edit &&
            (item.flavorCpu <= 1 || item.flavorRam <= 1)) {
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
            this.imageTooltip.setTooltip(e.cell,
              '<small>* WINDOWS의 선택 가능 사양은<br/>vCPUs: 2Core 이상, RAM: 2GB 이상 입니다.</small>')
          }
        })
      })
    }
  },
  data () {
    return {
      selectSpecColumns: [
        { binding: 'flavorName', header: '사양', customHtml: true, keyPath: 'common.GRID.spec' },
        { binding: 'flavorCpu', header: 'VCPUs', customHtml: true },
        { binding: 'flavorRam', header: 'RAM', customHtml: true },
        { binding: 'flavorDisk', header: 'DISK', customHtml: true }
      ],
      databaseCols: [
        { binding: 'userProfMap.profileName', header: '사양', keyPath: 'common.GRID.spec' },
        { binding: 'userProfMap.vcpu', header: 'vCPUs' },
        { binding: 'userProfMap.memory', header: 'RAM' }
      ],
      specGridData: [],
      specGrid: {}, // flexgrid 데아터
      selectedRow: undefined, // 선택한 로우
      editStatus: false,
      spec: null,
      imageTooltip: new Tooltip({
        showAtMouse: true,
        showDelay: 200
      })
    }
  }
}
</script>

<style lang="scss" scoped>
  .custom-add {
    display: flex;
    justify-content: flex-end;
    margin-bottom: $gap-s;
    > button {
      margin-left: $gap-s;
    }
  }
</style>
