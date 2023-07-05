<template>
  <div>
    <cmp-grid
      v-loading="isLoadingCertifGridData"
      :item-source="certifGridData"
      :columns="columns"
      class="content-area"
      :use-excel-download="false"
      use-checkbox
      @checkedRowsData="handleCheckRows"
      :changing-page-reset="false"
    />
    <common-modal-footer
      @confirm="handleConfirmCertif"
      @close="handleCancelCertif"
      :confirm-text="$v('연결')"
    />
  </div>
</template>
<script>
import API, { CommonModalFooter } from '@sd-fe/cmp-core'
// import { cloneDeep } from 'lodash'

export default {
  components: { CommonModalFooter },

  async created () {
    this.certifGridData = await this.getSslCertif()
  },
  methods: {
    handleConfirmCertif () {
      this.$emit('confirm')
    },
    handleCancelCertif () {
      this.$emit('close')
    },
    handleCheckRows (checkRow) {
      console.log('@handleCheckRows', checkRow)
      this.checkRows = checkRow

      // this.test.forEach((row, index) => { row.checked = (index === this.checkRows[0].index) })
      // this.checkRows = []

      // this.checkRows = temp
    },
    async getSslCertif () {
      try {
        const result = await API.network.getSslCertif()
        return result
      } catch (error) {
        this.$alert(this.$v('인증서를 불러오지 못하였습니다.'))
      }
    }
  },
  data () {
    return {
      isLoadingCertifGridData: false,
      certifGridData: [{}, {}],
      columns: [
        { header: this.$v('인증서 명'), binding: 'varKey', width: '*' },
        { header: 'Common Name', binding: 'varValue', width: '*' },
        { header: 'Issuer Name', binding: 'isEncrypted', width: '*' },
        { header: this.$v('만료일자'), binding: 'comment', width: '*' },
        { header: this.$v('상태'), binding: 'state', width: '*' }
      ],
      checkRows: []
    }
  }

}
</script>
