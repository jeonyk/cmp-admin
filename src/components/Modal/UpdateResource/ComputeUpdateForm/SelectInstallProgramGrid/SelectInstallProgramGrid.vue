<!--
  * 파일명 : SelectInstallProgramGrid.vue
  * 파일 기능 : 설치프로그램 선택 컴포넌트
  * 작성자 : 김예담
  * 최종 작성일 : 2022-04-06
  * License By Shinsegae I&C
 -->

<template>
  <div>
    <cmp-grid
      :item-source="itemSource"
      :columns="installProgramColumns"
      header-checkbox
      @checkedRowsData="changeChecked"
      :init-auto-select-row="checkedSw"
      init-auto-select-row-key="softwareId"
      :changing-page-reset="false"
      :init-custom-action="flex => { grid = flex }"
      :all-checkbox-disable="disabled"
    >
      <template #versionName="props">
        <el-select
          v-model="props.row.selectedVersion"
          placeholder="버전을 선택해주세요."
          @change="changeChecked()"
          :disabled="disabled"
        >
          <el-option
            v-for="item in props.row.versionOptions"
            :key="item.versionId"
            :label="item.versionName"
            :value="item.versionId"
          />
        </el-select>
      </template>
    </cmp-grid>
  </div>
</template>

<script>
export default {
  name: 'SelectInstallProgramGrid',
  props: {
    disabled: { // 수정 불가능
      type: Boolean,
      default: false
    },
    itemSource: {
      type: Array,
      default: () => []
    },
    syncData: {
      type: Array,
      default: () => []
    },
    billingModel: {
      type: Array,
      default: () => []
    }
  },
  data: () => ({
    installProgramColumns: [
      { binding: 'softwareName', header: 'SW name' },
      { binding: 'versionName', header: 'VERSION', customHtml: true }
    ],
    checkedSw: [],
    gridData: []
  }),
  watch: {
    syncData: {
      immediate: true,
      deep: true,
      handler () {
        const swIds = this.syncData.map(item => item.softwareId)

        this.itemSource.forEach(row => {
          row.checked = !!swIds.includes(row.softwareId)
        })

        const checkedData = this.itemSource.filter(row => row.checked)

        const setData = checkedData.map(sw => {
          const versionInfo = sw.versionOptions.find(item => item.versionId === sw.selectedVersion)
          const { softwareName, softwareId, isInstall, osType } = sw

          return {
            softwareName,
            softwareId,
            swIdx: versionInfo?.swIdx,
            versionId: versionInfo?.versionId,
            versionName: versionInfo?.versionName,
            isInstall: isInstall || true,
            osType
          }
        })
        this.checkedSw = setData

        this.$forceUpdate()
      }
    }
  },
  methods: {
    /**
     * 체크된 설치프로그램, 버전 바뀔 때 마다 발생 이벤트
     */
    changeChecked () {
      const checkedData = this.itemSource.filter(item => item.checked)
      const setData = checkedData.map(sw => {
        const versionInfo = sw.versionOptions.find(item => item.versionId === sw.selectedVersion)
        const { softwareName, softwareId, isInstall, osType } = sw

        return {
          softwareName,
          softwareId,
          swIdx: versionInfo?.swIdx,
          versionId: versionInfo?.versionId,
          versionName: versionInfo?.versionName,
          isInstall: isInstall || true,
          osType
        }
      })

      this.checkedSw = setData

      this.$emit('change', this.checkedSw)
    },
    gridRefresh (grid = this.grid) {
      if (!grid) return
      const cv = grid.collectionView
      if (!cv) return
      cv.refresh()
    }
  }
}
</script>
