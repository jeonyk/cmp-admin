<template>
  <div class="dist-detail">
    <div class="dist-detail__head">
      <h3>{{ activeModel ? activeModel.projectName : "" }}</h3>
      <button
        class="button"
        @click="downloadExcel"
      >
        {{ $t("common.BTN.excelDownload") }}
        <i class="download-icon" />
      </button>
    </div>
  </div>
</template>

<script>
import XLSX from 'xlsx'
import dayjs from 'dayjs'

const WORKSHEET_WIDTH = [
  25,
  50,
  50
]

export default {
  name: 'DistributeDetail',
  props: {
    activeModel: {
      type: Object,
      required: true
    },
    activeModelName: {
      type: String,
      default: ''
    }
  },
  methods: {
    downloadExcel () {
      const workbook = XLSX.utils.book_new()

      // 1차 배부 관계사의 총 비율 시트
      const oneDepthAff = this.activeModel.distributeGroups.filter(
        group => group.groupIdx && !group.parentGroupName
      )
      // 총 비율 시트의 컬럼 명
      const rateSheetColumns = ['No', '빌링 소유 관계사', '백분율(%)']
      const amountSum = oneDepthAff.reduce((prev, cur) => prev + cur.amount, 0)
      const rateSheetItem = oneDepthAff.map((group, idx) => [
        idx + 1,
        group.groupName,
        ((group.amount / amountSum) * 100).toFixed(2)
      ])

      const rateWorksheet = XLSX.utils.aoa_to_sheet([
        [this.activeModel.projectName],
        rateSheetColumns,
        ...rateSheetItem
      ])

      rateWorksheet['!cols'] = [
        { width: WORKSHEET_WIDTH[0] },
        { width: WORKSHEET_WIDTH[1] },
        { width: WORKSHEET_WIDTH[2] }
      ]

      XLSX.utils.book_append_sheet(workbook, rateWorksheet, '총 비율')

      // 1차 배부 기준
      // 1차 배부 관계사와, 공통으로 묶은 2차 배부 관계사
      const oneDepthIncludeCommon = this.activeModel.distributeGroups.filter(
        group => !group.parentGroupName
      )
      const oneDepthColumns = [
        'No',
        '빌링 소유 관계사',
        '배부기준값 (배부기준)'
      ]
      const oneDepthSheetItem = oneDepthIncludeCommon.map((group, idx) => [
        idx + 1,
        group.groupName,
        `${group.amount} (${group.distributeStandardName ||
          this.activeModel.distributeStandardName})`
      ])

      oneDepthSheetItem.A1 = { ...oneDepthSheetItem.A1, s: { alignment: { textRotation: 90 } } }

      const oneDpethWorksheet = XLSX.utils.aoa_to_sheet([
        [this.activeModel.projectName],
        oneDepthColumns,
        ...oneDepthSheetItem
      ])

      oneDpethWorksheet['!cols'] = [
        { width: WORKSHEET_WIDTH[0] },
        { width: WORKSHEET_WIDTH[1] },
        { width: WORKSHEET_WIDTH[2] }
      ]

      XLSX.utils.book_append_sheet(
        workbook,
        oneDpethWorksheet,
        '1차 배부 기준'
      )

      // 2차 배부 기준 드가자
      const twoDepthAff = this.activeModel.distributeGroups.filter(group => group.groupIdx && group.parentGroupName)

      if (twoDepthAff.length) {
        const twoDepthColumns = ['No', '빌링 소유 관계사', '배부기준']
        const affNames = [...new Set(twoDepthAff.map(group => group.parentGroupName))]
        const items = []

        affNames.forEach(name => {
          const filteredGroup = twoDepthAff.filter(group => group.parentGroupName === name)
          items.push(['', name])
          items.push(...filteredGroup.map((group, idx) => [idx + 1, group.groupName, group.amount]))
          items.push([])
        })

        const twoDepthWorksheet = XLSX.utils.aoa_to_sheet([
          [this.activeModel.projectName],
          twoDepthColumns,
          ...items
        ])

        twoDepthWorksheet['!cols'] = [
          { width: WORKSHEET_WIDTH[0] },
          { width: WORKSHEET_WIDTH[1] },
          { width: WORKSHEET_WIDTH[2] }
        ]

        XLSX.utils.book_append_sheet(workbook, twoDepthWorksheet, '2차 배부 기준')
      }

      const fileName = `빌링_배부_모델_${dayjs().format(
        'YYYYMMDDHHmmss'
      )}.xlsx`
      XLSX.writeFile(workbook, fileName)
    }
  }
}
</script>

<style lang="scss" scoped>
.dist-detail {
  &__head {
    display: flex;
    justify-content: space-between;

    .button {
      .download-icon {
        margin-left: $gap-s / 2;
        position: relative;
        top: 2px;
      }
    }
  }
}
</style>
