<template>
  <div
    class="badge"
    :class="versionClass"
  >
    <div class="badge-inner">
      <div class="badge-inner__name">
        {{ displayVersion }}
      </div>
      <div class="badge-inner__count">
        {{ count }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    count: {
      type: [Number, String],
      required: true
    },
    version: {
      // Plus, Basic, Standard, Enterprise
      type: String,
      required: true,
      validator (version) {
        if (typeof version !== 'string') return false
        return ['plus', 'basic', 'standard', 'enterprise'].includes(version)
      }
    }
  },
  computed: {
    displayVersion () {
      return this.version[0].toUpperCase() + this.version.toString().slice(1)
    },
    versionClass () {
      return `badge-${this.version}`
    }
  }
}
</script>

<style lang="scss" scoped>
$versions: ('plus', 'basic', 'standard', 'enterprise');
$colors: ($sea-blue, $yellow, $main-red, #59a51d);

.badge {
  width: 230px;
  height: 66px;

  @each $version in $versions {
    $index: index($versions, $version);
    $color: nth($colors, $index);

    &.badge-#{$version} {
      color: $color;
      border: 1px solid $color;
      border-radius: 0px 6px 6px 6px;
      background-color: rgba($color, $alpha: 0.1);
    }
  }

  &-inner {
    display: flex;
    justify-content: space-between;
    height: 100%;
    flex-wrap: nowrap;

    &__name {
      font-size: 14px;
      font-weight: normal;
      color: $white;
      padding: 15px 0 0 20px;
    }

    &__count {
      font-size: 30px;
      font-weight: 500;
      align-self: flex-end;
      padding: 0 30px 10px 0;
    }
  }
}
</style>
