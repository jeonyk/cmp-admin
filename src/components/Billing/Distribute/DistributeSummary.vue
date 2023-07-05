<template>
  <div
    class="dist-summary"
    :class="[createMode && 'create', { [$i18n.locale]: true }]"
  >
    <div
      v-for="(item, index) in summaryData"
      :key="index"
      class="dist-summary-item"
    >
      <div class="dist-summary-item__title">
        {{ item.title }}
      </div>
      <div class="dist-summary-item__value">
        {{ item.value }}
      </div>
      <div
        v-if="index === 2"
        class="dist-summary-item__icon"
      >
        <file-icon
          :width="18"
          :height="20"
          is-button
          @click="$emit('on-history')"
        />
      </div>
    </div>
    <div
      v-if="createMode"
      class="dist-summary-rate"
    >
      <button
        class="button"
        type="is-primary"
        @click="$emit('preview-rate')"
      >
        {{ $t('bill.previewRate') }}
      </button>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import FileIcon from '@/components/Icons/FileIcon.vue'

export default {
  name: 'DistributeSummary',
  components: { FileIcon },
  props: {
    detailCommonProject: {
      type: Object,
      required: true
    },
    createMode: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    summaryData () {
      const summary = [
        { title: this.$t('bill.projectOwnAff'), value: this.common.companyName },
        {
          title: this.$t('config.TRANSFER.projectCreateDate'),
          value: this.common.createTime ? dayjs(new Date(this.common.createTime)).format('YYYY.MM.DD') : ''
        }
      ]

      if (!this.createMode) {
        summary.push(
          {
            title: this.$t('license.TEXT.lastModified'),
            value: this.common.updateTime ? dayjs(new Date(this.common.updateTime)).format('YYYY.MM.DD') : ''
          },
          { title: this.$t('admin.ORG.manager'), value: this.user }
        )
      }

      return summary
    },
    user () {
      // return !this.createMode
      //   ? this.common.projectOwner
      //     ? `${
      //         this.common.projectOwner.userName
      //       }(${this.$options.filters.maskingName(
      //         this.common.projectOwner.userId
      //       )})`
      //     : ''
      //   : ''
      return this.common.projectOwner
        ? `${this.common.projectOwner.userName}(${this.$options.filters.maskingName(this.common.projectOwner.userId)})`
        : ''
    },
    common () {
      return this.detailCommonProject
    }
  }
}
</script>

<style lang="scss" scoped>
.dist-summary {
  display: flex;
  align-items: center;
  border-radius: 12px;
  background-color: $dark-navy;
  padding: 0 50px;
  height: 70px;
  margin-top: $gap;

  &.en {
    .dist-summary {
      &-item {
        width: 25%;
        text-align: center;

        &__title {
          display: block;
          white-space: nowrap;
        }

        &__value,
        &__icon {
          margin-top: 5px;
        }
      }
    }
  }

  &.create :nth-child(2n) {
    border: none !important;
  }

  & > :not(:last-child) {
    padding: 2px 35px 2px 0;
    border-right: 2px solid $dark-slate;
    margin-right: 35px;
  }

  &-item {
    font-size: 15px;

    &__title,
    &__value,
    &__icon {
      display: inline-block;
    }

    &__title {
      margin-right: 15px;
    }

    &__value {
      font-weight: 400;
    }

    &__icon {
      vertical-align: middle;
      margin-left: $gap-s;
    }
  }

  &-rate {
    margin-left: auto;
  }
}
</style>
