<template>
  <div class="license-detail-modules__list">
    <div
      v-for="md in modules"
      :key="md.moduleIdx"
      class="license-detail-modules__list-item"
      :class="[
        md.isActivate ? 'active' : 'inactive',
      ]"
    >
      <div class="license-detail-modules__list-item__title">
        {{ md.moduleName }}
      </div>
      <div
        v-show="md.updateStatus !== 1"
        class="license-detail-modules__list-item__version"
      >
        {{ $t('common.TERMS.version') }} : {{ md.moduleVersion }}
        <span
          v-if="md.isLastVersion"
          class="desc"
        >({{ $t('license.PLACEHOLDER.noLatestVersion') }})</span>
      </div>
      <div
        v-if="['RUNNING', 'K8S_RUNNING', 'WAIT'].includes(md.updateStatus)"
        class="update-overlay"
      >
        <update-now-icon
          :width="20"
          :height="20"
          icon-color="#7681FF"
          class="update-icon"
        />
        <span
          v-if="['RUNNING', 'K8S_RUNNING'].includes(md.updateStatus)"
          class="update-text"
        >{{ $t('license.PLACEHOLDER.updating') }}</span>
        <span
          v-else
          class="update-text"
        >
          {{ $t('license.PLACEHOLDER.updateWait') }}
        </span>
      </div>
      <div
        class="license-detail-modules__list-item__icon"
        @click="() => clickDetailModule(md)"
      >
        <i class="dots-icon mdi mdi-dots-vertical" />
      </div>
    </div>
  </div>
</template>

<script>
import UpdateNowIcon from '@/components/Icons/UpdateNowIcon.vue'

export default {
  name: 'DetailModulesList',
  props: {
    modules: {
      type: [Array, Object],
      required: true
    }
  },
  components: {
    UpdateNowIcon
  },
  methods: {
    clickDetailModule (clickedModule) {
      this.$emit('click-module', clickedModule)
    }
  }
}
</script>

<style lang="scss" scoped>
.license-detail-modules__list {
  & > * + * {
    margin-top: $gap;
  }

  &-item {
    display: flex;
    align-items: center;
    padding: $gap;
    padding-left: $gap * 2;
    border: 1px solid $purple-gray;
    border-radius: 6px;
    border-left-width: 5px;
    position: relative;

    &.inactive {
      border-left-color: $main-red;
    }

    &.active {
      border-left-color: $primary;
    }

    /* &.update {
      background-color: rgba($dark-slate, $alpha: .6);
    } */

    & .update-overlay {
      background-color: rgba($dark-slate, $alpha: .6);
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;

      & .update-icon {
        animation: bingle 1.5s linear infinite;

        @keyframes bingle {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(-360deg);
          }
        }
      }
    }

    & .update-text {
      color: $main-blue;
      margin-left: $gap-s;
    }

    &__title {
      font-size: 15px;
      margin-right: $gap;
    }

    &__version {
      font-size: 13px;
      font-weight: bold;
      color: $input-placeholder;

      & .desc {
        font-weight: normal;
      }
    }

    &__icon {
      z-index: 20;
      margin-left: auto;
      cursor: pointer;

      &:hover {
        & .dots-icon {
          color: $white;
        }
      }

      & .dots-icon {
        color: #9596a0;
      }
    }
  }
}
</style>
