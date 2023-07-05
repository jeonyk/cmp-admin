<!-- 삭제 예정 -->
<template>
  <div
    class="simple-form"
    :class="[topFixed && 'top-fixed', small && 'small']"
  >
    <div
      class="simple-form-title"
      :class="required && 'required'"
      :style="{ flex: `0 0 ${sizeToPixel(width)}` }"
    >
      <span class="simple-form-title__head">
        {{ title }}
      </span>
      <span
        v-if="summary"
        class="simple-form-title__sub"
      >
        {{ summary }}
      </span>
    </div>
    <div class="simple-form-content">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'SimpleForm',
  props: {
    title: {
      type: String,
      default: ''
    },
    required: {
      type: Boolean,
      default: false
    },
    summary: {
      type: String,
      default: ''
    },
    width: {
      type: [String, Number],
      default: 210
    },
    topFixed: {
      type: Boolean,
      default: false
    },
    small: {
      type: Boolean,
      default: false
    }
  },
  computed: {},
  methods: {
    sizeToPixel (size) {
      return typeof size === 'number'
        ? `${size.toString()}px`
        : size.indexOf('px') !== -1
          ? size
          : size + 'px'
    }
  }
}
</script>

<style lang="scss" scoped>
.simple-form {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  margin-bottom: 10px;

  &.top-fixed {
    align-items: flex-start;

    & .simple-form-title {
      padding-top: 12px;
    }
  }

  &.small {
    & .simple-form-title {
      padding-left: 7px;
    }
  }

  &-title {
    margin-right: $gap;
    padding-left: $gap-m;

    &__head {
      font-size: 15px;
    }

    &__sub {
      margin-top: 5px;
      display: block;
      color: $text-lighter-gray;
      font-weight: 400;
    }

    &.required {
      .simple-form-title__head {
        &::after {
          content: "*";
          display: inline-block;
          position: relative;
          color: $main-blue;
          margin-left: 3px;
          top: -1px;
        }
      }
    }
  }

  &-content {
    flex-grow: 1;
    flex-basis: auto;
    flex-shrink: 0;
  }
}
</style>
