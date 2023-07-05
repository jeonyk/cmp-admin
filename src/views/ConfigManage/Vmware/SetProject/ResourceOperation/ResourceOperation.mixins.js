import Vue from 'vue'

export default Vue.extend({
  methods: {
    /**
    * disabled row 설정 -> 타 최고관리자의 장바구니에 담겨있는 자원일 경우
    */
    onLoadedRows (grid) {
      this.$nextTick(function () {
        for (let i = 0; i < grid.rows.length; i++) {
          const row = grid.rows[i]
          const item = row.dataItem
          if (item.isSelectable === false) {
            // item.checked = item.checked || false
            item.disable = true
            row.cssClass = 'is-disable-row'
          } else {
            // item.checked = item.checked || false

            item.disable = false
            row.cssClass = ''
          }
        }
      })
    },
    setRowCheckState (row) {
      const ids = this.initAutoSelectRow.map(item => item.resourceId)

      return ids.includes(row.resourceId)
    },
    gridRefresh (grid) {
      if (!grid) return
      const cv = grid.collectionView
      if (!cv) return
      cv.refresh()
    },
    allGridRefresh () {
      if (this.grid) this.gridRefresh(this.grid)
      if (this.withVmGrid) this.gridRefresh(this.withVmGrid)
    }
  },
  data () {
    return {
      grid: null,
      withVmGrid: null,

      // NETWORK
      l4Grid: null,
      l7Grid: null,
      withVmL4Grid: null,
      withVmL7Grid: null
    }
  }
})
