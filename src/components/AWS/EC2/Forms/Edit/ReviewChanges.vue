<template>
  <div class="changes-body-wrap">
    <ul
      v-for="(item, idx) in changes"
      :key="item.id"
      class="changes-wrap"
    >
      <li
        :key="item.id + item.type"
        class="changes-item"
      >
        <template v-if="item.type === 'change'">
          <div class="item-index">
            {{ idx + 1 }}.
          </div>
          <div class="item-title">
            {{ item.items[0].title }}<br>
            {{ item.items[1].title }}
          </div>
          <div class="item-value">
            <span class="gray"> {{ item.items[0].changeValue }}</span><br>
            {{ item.items[1].changeValue }}
          </div>
        </template>
        <!-- 인스턴스 기본 정보 변경 -->
        <template v-else-if="item.type === 'change-network'">
          <div class="item-network">
            <div
              v-for="(ch, chIdx) in item.items"
              :key="'ch-' + chIdx"
              style="display: flex;"
            >
              <div class="item-title">
                {{ chIdx === 0 ? "변경 전" : "변경 후" }}
              </div>
              <div>
                <div
                  v-for="(chd, chdIdx) in ch.changeValue"
                  :key="'chd-' + chdIdx"
                >
                  <div>{{ chd[0] }}</div>
                  <div>{{ chd[1] }}</div>
                </div>
              </div>
            </div>
          </div>
        </template>
        <!-- 네트워크/보안그룹 변경 -->
        <template v-else>
          <div class="item-index">
            {{ idx + 1 }}.
          </div>
          <div class="item-title">
            {{ getItemTitle(item) }}
          </div>
          <div class="item-value">
            {{ item.items[0].changeValue }}
          </div>
        </template>
        <!-- 인스턴스 깁노 정보 변경 외 삭제/추가 -->
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'ReviewChanges',
  props: {
    changes: {
      type: Array,
      default: () => []
    }
  },
  filters: {
    replaceSlash (value) {
      return value.replace(/\s+\/\s+/g, ' | ')
    }
  },
  computed: {},
  methods: {
    getItemTitle (item) {
      if (item.type === 'add') {
        return '추가내용'
      } else if (item.type === 'remove') {
        return '삭제내용'
      } else {
        return ''
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.changes-body-wrap {
  border-top: 1px solid #e0e0e0;
  margin-top: $gap;
  padding-top: $gap;
  box-sizing: border-box;
  padding-bottom: $gap-s;

  & > * + * {
    margin-top: $gap-s;
  }

  .changes-item {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    line-height: 2;

    .item-color {
      font-weight: bold;
    }

    .item-index {
      box-sizing: border-box;
      padding-right: $gap-s;
      font-weight: bold;
    }

    .item-title {
      box-sizing: border-box;
      padding-right: 40px;
      font-weight: bold;
    }

    .item-value {
      .gray {
        color: #666;
      }
    }

    > * {
      white-space: nowrap;
    }
  }
}
</style>
