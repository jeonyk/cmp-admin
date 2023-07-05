<template>
  <div
    v-if="items.length"
    class="wrap"
  >
    <div
      v-for="item in items"
      :key="item.id"
      class="changed"
    >
      <div class="title-tag">
        {{ item.title }}
      </div>
      <div
        v-for="(child, idx) in item.items"
        :key="idx"
        class="changed-inner"
      >
        <simple-info-table
          v-if="type !== 'network'"
          :title="child.title"
          :width="55"
          title-class="changed-title"
          slot-name="item"
        >
          <template #item>
            <div class="changed-inner-item">
              {{ child.changeValue }}
            </div>
          </template>
        </simple-info-table>
        <div v-else>
          <div class="changed-title">
            {{ child.title }}
          </div>
          <div
            v-for="(change, chIdx) in child.changeValue"
            :key="chIdx"
            class="changed-inner-item block"
          >
            <div>{{ change[0] }}</div>
            <div>{{ change[1] }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div
    v-else
    class="empty-data"
  >
    변경사항이 없습니다.
  </div>
</template>

<script>
import SimpleInfoTable from '../SimpleInfoTable.vue'

export default {
  name: 'ChangesContent',
  props: {
    items: {
      type: Array,
      default: () => []
    },
    type: {
      type: String,
      default: 'default'
    }
  },
  components: { SimpleInfoTable }
}
</script>

<style lang="scss" scoped>
.wrap {
  margin-top: $gap-s;

  > * + * {
    border-top: 1px dashed #e0e0e0;
    padding-top: 15px;
  }

  > * {
    padding-bottom: 15px;
  }

  .title-tag {
    padding: 5px 10px;
    box-sizing: border-box;
    background-color: #f0f0f0;
    border-radius: 50px;
    color: #999;
    display: inline-block;
    font-size: 12px;
    margin-bottom: 15px;
  }

  &::v-deep .changed-title {
    color: $main-blue;
  }

  &::v-deep .changed-inner-item {
    color: #999;

    &.block {
      margin-top: $gap-s;
    }
  }

  > .changed + .changed {
    border-top: 1px dashed #e0e0e0;
  }

  .changed {
    > .changed-inner + .changed-inner {
      margin-top: 15px;
    }
  }
}
</style>
