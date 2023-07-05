<template>
  <el-dialog
    :visible="active"
    :title="$t('bill.previewRate')"
    width="800px"
    @close="$emit('close')"
  >
    <div class="preview">
      <cmp-grid
        :columns="columns"
        :item-source="convertSource"
      >
        <template #index="{ row }">
          {{ row.index + 1 }}
        </template>
      </cmp-grid>
    </div>
  </el-dialog>
</template>

<script>
export default {
  props: {
    active: {
      type: Boolean,
      required: true
    },
    oneDepthAff: {
      type: Array,
      default: () => []
    },
    twoDepthAff: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    convertSource () {
      const sum = this.oneDepthAff
        .map(group => group.amount)
        .reduce((a, b) => a + b, 0)

      let result = this.oneDepthAff
        .map(group => {
          return {
            ...group,
            rate: (group.amount / sum) * 100 || 0
          }
        })

      // 상승폭
      const upRate = []

      result
        .filter(group => !group.groupIdx)
        .forEach(group => {
          const twoDepth = this.twoDepthAff.find(
            aff => aff.commonAffName === group.groupName
          )
          if (twoDepth) {
            const allSelectAmount = twoDepth.selected.reduce(
              (a, b) => a + b.amount,
              0
            )

            twoDepth.selected.forEach(select => {
              const rate = select.amount / allSelectAmount
              const externalRate = group.rate * rate

              upRate.push({ ...select, externalRate })
            })
          }
        })

      result = result.filter(t => !t.parentGroupName && t.groupIdx !== 0)

      upRate.forEach(rate => {
        const findGroup = result.find(
          group => group.groupIdx === rate.groupIdx
        )
        if (findGroup) findGroup.rate += rate.externalRate
      })

      return (
        result
          .filter(group => group.groupIdx)
          .map(group => ({ ...group, rate: (group.rate || 0).toFixed(2) }))
      )
    }
  },
  data: root => ({
    columns: [
      { header: 'No', binding: 'index', width: 70, customHtml: true },
      {
        header: root.$t('bill.billOwnAff'),
        binding: 'companyName',
        width: '*'
      },
      { header: root.$t('bill.percent'), binding: 'rate', width: 330 }
    ]
  })
}
</script>
