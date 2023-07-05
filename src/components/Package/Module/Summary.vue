<template>
  <div class="mv-detail-summary">
    <div
      v-if="summary"
      class="mv-detail-summary__inner"
    >
      <div class="mv-detail-summary__inner-left">
        {{ summary.moduleName }}
      </div>
      <div class="mv-detail-summary__inner-right">
        <div class="packages">
          <span class="packages-type">{{ $t('license.TEXT.packageType') }}</span>
          <type-items :items="summary.packageTypeList" />
        </div>
        <div class="separator" />
        <div class="dates">
          <span class="reg">
            {{ $t('common.REGCON.regDate') }}
          </span>
          <span class="date">
            {{ summary.createTime | dateSimple('YYYY-MM-DD') }}
          </span>
          <span
            class="edit-icon-wrap"
            @click="$emit('open-edit-dialog')"
          >
            <pencil-icon
              :width="16"
              :height="16"
              icon-color="white"
            />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TypeItems from '@/components/Package/Version/TypeItems.vue'
import PencilIcon from '@/components/Icons/PencilIcon.vue'

export default {
  name: 'ModuleVersionSummary',
  components: { TypeItems, PencilIcon },
  props: {
    summary: {
      type: Object,
      required: false,
      default: () => ({})
    }
  }
}
</script>

<style lang="scss" scoped>
@mixin flex-item-center() {
  display: flex;
  align-items: center;
}

.mv-detail-summary {
  width: 100%;
  height: 70px;
  display: block;
  border-radius: 10px;
  background-color: $dark-navy;

  &__inner {
    @include flex-item-center();
    justify-content: space-between;
    padding: 0 $gap * 2;
    height: 100%;

    &-left {
      font-weight: bold;
      font-size: 18px;
      letter-spacing: -0.005em;
      color: $white;
    }

    &-right {
      @include flex-item-center();

      & .packages {
        @include flex-item-center();

        &-type {
          font-size: 14px;
          margin-right: 15px;
        }
      }

      & .separator {
        content: '';
        display: block;
        width: 1px;
        height: 20px;
        margin: 0 30px;
        background-color: $dark-slate;
      }

      & .dates {
        @include flex-item-center();
        font-size: 14px;

        & .reg { margin-right: 15px; }
        & .date { font-weight: bold; margin-right: $gap; }
      }

      & .edit-icon-wrap {
        cursor: pointer;
        display: inline-flex;
        padding: 8px 12px;
        background-color: $primary;
        border-radius: 50px;
      }
    }
  }
}
</style>
