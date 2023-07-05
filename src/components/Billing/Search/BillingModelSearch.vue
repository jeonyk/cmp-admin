<template>
  <div class="billing-model-search">
    <el-input
      :value="search"
      @input="e => $emit('change', e)"
      class="billing-model-search__input"
      :placeholder="$t('common.PLACEHOLDER.searchEnter')"
      @keypress.native.enter="validateSearch"
    />
    <span class="billing-model-search__icon">
      <i
        class="el-icon el-icon-search"
        @click="validateSearch"
      />
      <i
        class="mdi mdi-refresh"
        @click="$emit('reset')"
      />
    </span>
  </div>
</template>

<script>
export default {
  name: 'BillingModelSearch',
  model: {
    prop: 'search',
    event: 'change'
  },
  props: {
    search: {
      type: String,
      required: true
    }
  },
  methods: {
    validateSearch () {
      this.$emit('search')
    }
  }
}
</script>

<style lang="scss" scoped>
.billing-model-search {
  margin-bottom: 40px;
  min-width: 350px;

  &__icon {
    margin-left: $gap-s;

    & > * {
      display: inline-block;
      vertical-align: middle;
      width: 16px;
      height: 16px;
      font-size: 16px;
      cursor: pointer;
      color: $color-grey;

      &:hover {
        color: $white;
      }
    }

    & > * + * {
      margin-left: 5px;
    }

    & > .mdi {
      vertical-align: sub;
    }
  }

  &__input {
    max-width: 210px;

    &::v-deep .el-input__inner {
      border: none;
      border-radius: 0;
      border-bottom: 1px solid $input-stroke;
      padding-bottom: 3px;

      &:focus {
        background-color: transparent;
        color: $white;
      }
    }
  }
}
</style>
