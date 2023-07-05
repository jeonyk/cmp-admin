<template>
  <div class="ticket-container">
    <total-count
      :total-count="data.length"
    />
    <ul
      class="ticket-list"
      v-if="data.length"
    >
      <card-ticket
        class="ticket-panel-item"
        v-for="(a, idx) in allData"
        :data="a"
        :key="idx"
        @click="selectItem"
      />
    </ul>

    <div
      v-if="data.length && data.length >= initDataCount"
      class="pagination-wrap"
    >
      <el-pagination
        layout="prev, pager, next"
        :total="data.length"
        :page-size="initDataCount"
        :current-page.sync="currpage"
        @current-change="clickChangePageEvent"
      />
    </div>

    <p
      v-if="data.length === 0"
      class="empty-data"
    >
      {{ $t("common.PLACEHOLDER.noData") }}
    </p>
  </div>
</template>
<script>
import CardTicket from '@/components/OrderTicketIcon/CardTicket.vue'
export default {
  name: 'NewCommonTicketList',
  components: {
    'card-ticket': CardTicket
  },
  props: {
    data: {
      type: Array,
      default: undefined
    }
  },
  computed: {
    page () {
      return Number(this.$route.query?.page) || 1
    },
    allData () {
      const copyData = JSON.parse(JSON.stringify(this.data))
      const changeData = copyData.slice(
        this.initDataCount * (this.page - 1),
        this.initDataCount * this.page
      )
      return changeData
    }
  },
  watch: {
    data (data) {
      if (data.length) this.changingPage(this.page)
    },
    page (page) {
      this.currpage = page
      this.changingPage(page)
    }
  },
  methods: {
    changingPage (page) {
      this.currpage = page
      this.$emit('chageCurrentPage', page)
      this.$router.push({ query: { type: 'ticket', page } })
    },
    clickChangePageEvent (page) {
      this.changingPage(page)
      this.$emit('chageCurrentPage', page)
    },
    selectItem (item) {
      this.$emit('select-item', item)
    }
  },
  data () {
    return {
      initDataCount: 12,
      currpage: 0
    }
  }
}
</script>
<style scoped lang="scss">
.ticket-container {
  .ticket-list {
    display: flex;
    flex-wrap: wrap;
    column-gap: $gap;
    row-gap: 28px;
  }
}
</style>
