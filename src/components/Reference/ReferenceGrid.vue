<template>
  <!-- 자료실 그리드 컴포넌트 -->
  <div class="reference-grid">
    <div class="reference-grid__button">
      <total-count :total-count="totalCount" />
      <button
        class="button"
        type="is-primary"
        @click="
          $router.push({
            name: 'set-ref-detail',
            params: { id: 0 },
            query: { create: true }
          })
        "
      >
        {{ $t('common.BTN.addReference') }}
      </button>
    </div>
    <cmp-grid
      :columns="columns"
      :item-source="refData.data"
      :use-column-filter="false"
      :total-page-size="totalCount"
      :server-side-now-page="currPage"
      server-side-paging
      @changingPage="onChangePage"
      routable="set-ref-detail"
    >
      <template #index="{ row }">
        {{ pagingByIndex(row.index) }}
      </template>
      <template #isView="{ row }">
        <span
          :class="row.isView ? 'is-complete' : 'is-fail'"
          style="background-color: transparent;"
        >
          {{ row.isView ? $t('admin.NOTI.post') : $t('admin.NOTI.unPost') }}
        </span>
      </template>
      <template #createTime="{ row }">
        {{ row.createTime | date("YYYY-MM-DD HH:mm:ss") }}
      </template>
    </cmp-grid>
  </div>
</template>

<script>
import columns from './ReferenceGridColumn'

export default {
  name: 'ReferenceGrid',
  inject: ['refData'],
  props: {
    currPage: {
      type: Number,
      required: true
    },
    totalCount: {
      type: Number,
      required: true
    }
  },
  methods: {
    onChangePage (page) {
      this.$emit('page', page)
    },
    pagingByIndex (index) {
      return Number(this.totalCount) - (10 * (this.currPage - 1) + index)
    }
  },
  data: root => ({
    columns: columns(root)
  })
}
</script>

<style lang="scss" scoped>
.reference-grid {
  &__button {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $gap-s;
  }
}
</style>
