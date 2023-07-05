<template>
  <div>
    <section class="table-top-wrap">
      <total-count
        class="total-count-wrap"
        :total-count="totalResultCnt"
      />
    </section>
    <section class="table-area">
      <cmp-grid
        :loading="isLoadingGrid"
        :columns="columns"
        :item-source="serviceGridData"
        :changing-page-reset="false"
      />
    </section>
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
export default {
  created () {
    this.initServiceGrid()
  },
  computed: {
    totalResultCnt () {
      return this.serviceGridData.length
    }
  },
  methods: {
    async initServiceGrid () {
      try {
        this.isLoadingGrid = true
        this.serviceGridData = await this.getLbServiceList()
      } catch (error) {
        console.error(error)
      } finally {
        this.isLoadingGrid = false
      }
    },
    async getLbServiceList () {
      try {
        const result = await API.network.getLbServiceList()
        return result
      } catch (error) {
        this.$alert(this.$v('서비스를 불러오지 못하였습니다.<br /> 관리자에게 문의해주세요.'), { dangerouslyUseHTMLString: true })
      }
    }
  },
  data () {
    return {
      isLoadingGrid: false,
      serviceGridData: [],
      columns: [{ binding: 'serverName', header: this.$v('서비스 명') },
        { binding: 'ip', header: 'IP' },
        { binding: 'protocolType', header: this.$v('프로토콜') },
        { binding: 'port', header: this.$v('포트') },
        { binding: 'state', header: this.$v('상태') },
        { binding: 'hits', header: 'Hits' }]
    }
  }
}
</script>

<style lang="scss">

</style>
