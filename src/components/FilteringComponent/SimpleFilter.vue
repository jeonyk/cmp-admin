<template>
  <div class="filter-layout">
    <div class="filter-layout__option">
      <i class="mdi mdi-tune" />
      <span>
        {{ $t("common.GRID.setFilter") }}
      </span>
      <i
        class="mdi mdi-refresh reset-button"
        @click="$emit('reset')"
      />
    </div>
    <div class="filter-layout__body">
      <slot />
    </div>
  </div>
</template>

<script>
// FilteringComponent 컴포넌트랑 UI만 비슷 리셋 동작만 emit
// 그 외 아무런 기능 X
</script>

<style lang="scss" scoped>
.filter-layout {
  &__option {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    margin-bottom: $gap;

    & > * + * {
      margin-left: 10px;
    }

    & span {
      font-weight: normal;
      font-size: 13px;
    }

    & .reset-button {
      transform: translateY(-2px);
      margin-left: $gap-s;
      color: #999;
      cursor: pointer;
      transition: 0.5s ease;
      &::before {
        transition: 0.5s ease;
        font-size: 18px;
      }
      &:hover {
        transform: rotate(180deg);
        &::before {
          color: $white;
        }
      }
    }
  }

  & .el-input,
  & .el-select,
  & .el-select.is-focus {
    max-width: 200px;

    &::v-deep {
      .el-input__inner {
        border-top: none !important;
        border-left: none !important;
        border-right: none !important;
        border-bottom: 1px solid $purple-gray;
        max-width: 200px;
      }
    }
  }

  &__body {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;

    & > * + * {
      margin-left: 20px;
    }
  }
}
</style>
