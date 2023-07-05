<template>
  <div
    class="filter-group"
    :class="{'filter-header__is-horizontal': isHorizontalHeader}"
  >
    <!-- 헤더 (|필터아이콘| 필터설정 |리셋아이콘|) -->
    <div
      v-if="isUsedHeader"
      class="filter-header"
    >
      <i
        class="mdi mdi-tune"
        style="margin-right: 10px;"
      />
      <span class="filter-set-text">{{ $t('common.GRID.setFilter') }}</span>

      <i
        class="mdi mdi-refresh reset-button"
        @click="resetData"
      />
    </div>
    <!-- left, right 슬롯이 한 개 이상 있을 경우 -->
    <div class="filter-item-container">
      <div
        v-if="$slots.left || $slots.right"
        class="side-filter__space-between"
      >
        <div
          v-if="($slots.left && $slots.left.length > 0) || (!$slots.left && $slots.right)"
          class="filter-group-left"
        >
          <slot name="left" />
        </div>
        <div
          v-if="$slots.right && $slots.right.length > 0"
          class="filter-group-right"
        >
          <slot name="right" />
        </div>
      </div>

      <div
        v-else
        class="default-filter__left"
      >
        <slot />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    isUsedHeader: { // [필터설정 / reset] 영역을 사용하지 않을경우 false 로 설정
      type: Boolean,
      default: true
    },
    isHorizontalHeader: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    resetData () {
      this.filterTotalData = {}
      if (this.defaultValues && Object.keys(this.defaultValues).length) {
        this.data.forEach(option => {
          this.filterTotalData[option.field] = this.defaultValues[option.field]
        })
      }
      return this.$emit('reset-data')
    }
  }
}
</script>

<style lang="scss" scoped>
.filter-group {
  display: flex;
  width: 100%;
  align-items: center;
  &.filter-header__is-horizontal {
    flex-direction: column;
      align-items: flex-start;
    .filter-header {
      margin-bottom: 20px;
      justify-content: center !important;
    }
  }
  .filter-header {
    display: flex;
    height: 20px;
    font-size: 13px;
    font-weight: normal;
    flex-wrap: nowrap;
    align-items: center;
    z-index: 3;
    margin-right: 12px;
    .filter-set-text {
      white-space: nowrap;
      align-items: center;
    }
    .filter-icon {
      margin-left: 5px;
      width: 16px; height: 16px;
      display: inline-block;
      background-size: 16px;
    }

    .reset-button {
      display: block;
      width: 18px; height: 20px;
      margin-left: $gap-s;
      color: #999;
      cursor: pointer;
      transition: .5s ease;
      &::before {
        transition: .5s ease;
        font-size: 18px;
        display: block;
      }
      &:hover {
        transform: rotate(180deg);
        &::before {
          color: $white;
        }
      }
    }
  }
  .filter-item-container {
    display: flex;
    width: 100%;
    align-items: center;
    .default-filter__left {
      display: flex;
      flex-wrap: wrap;
              flex-shrink: 0;
    }

    .side-filter__space-between {
      display: flex;
      width: 100%;
      justify-content: space-between;
      .filter-group-left {
            display: flex;
        justify-content: flex-start;

        flex-wrap: wrap;
      }
      .filter-group-right {
        display: flex;
        flex-wrap: wrap;

        justify-content: flex-end;
      }
    }
  }
}
</style>
