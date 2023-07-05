<template>
  <ul class="history">
    <li
      v-for="(item, index) in items"
      :key="index"
      class="history-item"
    >
      <div class="body">
        <div class="body-time">
          {{ item.time | date("YYYY/MM/DD HH:mm") }}
        </div>
        <div
          class="body-action"
          @click="expandItem(item)"
        >
          <i
            class="mdi"
            :class="item.expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          />
        </div>
      </div>
      <div
        v-if="item.expanded"
        class="expanded"
      >
        <div class="expanded-body">
          <simple-info-table
            title="Instance type"
            desc="vCPU: 1 | Memory: 0.5 | Network: low to moderate"
            :width="140"
          />
          <simple-info-table
            title="Storage"
            desc="vCPU: 1 | Memory: 0.5 | Network: low to moderate"
            slot-name="storage"
            :width="140"
          >
            <template #storage>
              1. Device
            </template>
          </simple-info-table>
          <simple-info-table
            title="Monitoring"
            desc="True"
            :width="140"
          />
          <simple-info-table
            title="Security group"
            desc="보안그룹 이름 1"
            :width="140"
          />
        </div>
      </div>
    </li>
  </ul>
</template>

<script>
import SimpleInfoTable from '../Forms/SimpleInfoTable.vue'

export default {
  name: 'DetailHistory',
  components: { SimpleInfoTable },
  methods: {
    expandItem (item) {
      item.expanded = !item.expanded
    }
  },
  data: () => ({
    items: [
      { time: new Date(), expanded: false },
      { time: new Date(), expanded: false },
      { time: new Date(), expanded: false }
    ]
  })
}
</script>

<style lang="scss" scoped>
.history {
  > .history-item + .history-item {
    margin-top: $gap-s;
  }

  &-item {
    width: 1490px;
    box-sizing: border-box;
    padding: 25px 60px 25px 40px;
    background-color: $white;
    box-shadow: 0px 0px 30px rgba(0, 0, 0, 0.05);
    border-radius: 6px;

    .body {
      display: flex;
      justify-content: space-between;
      align-items: center;

      &-time {
        font-weight: bold;
      }

      &-action {
        cursor: pointer;
      }
    }

    .expanded {
      margin-top: 30px;

      &-body {
        padding: 30px 0;
        border-top: 1px solid #e0e0e0;

        &::v-deep {
          > * + * {
            margin-top: 40px;
          }

          .info-table {
            &-title {
              font-weight: bold;
              color: #333;
            }

            &-desc {
              color: #333;
            }
          }
        }
      }
    }
  }
}
</style>
