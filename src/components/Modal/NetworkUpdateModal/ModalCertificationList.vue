<template>
  <div class="modal-certification-list">
    <network-certif-grid @selectedRow="handleSelectedRow" />
    <common-modal-footer
      :is-used-cancel="false"
      @close="$emit('close')"
      @confirm="$emit('confirm',selectedRow)"
    />
  </div>
</template>

<script>
import NetworkCertifGrid from './NetworkCertifGrid.vue'
import { CommonModalFooter } from '@sd-fe/cmp-core'
export default {
  props: {

  },
  components:
    {
      NetworkCertifGrid,
      CommonModalFooter
    },
  created () {
    if (this.isFullColumns) { this.defaultColumns.concat(this.addColumns) }
  },
  methods: {
    handleSelectedRow (rowData) {
      console.log(rowData)
      if (rowData) {
        this.selectedRow = rowData
      } else this.selectedRow = null
    }
  },
  data () {
    return {
      selectedRow: null
    }
  }
}
</script>

<style>
</style>
