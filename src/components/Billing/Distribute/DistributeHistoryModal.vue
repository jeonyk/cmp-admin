<template>
  <el-dialog
    :visible="active"
    :title="modalTitle"
    @close="$emit('close')"
    width="700px"
  >
    <div
      v-loading="loadingHistory"
      class="history"
    >
      <div
        v-if="historyData && historyData.length"
        class="history-list"
      >
        <div
          v-for="(history, idx) in historyData"
          :key="idx"
          class="history-list-item"
        >
          {{ history.createTime | date('YYYY-MM-DD') }}
          <span v-if="history.createUserName">
            {{ history.createUserName }}({{ history.createUserId | maskingName }})
          </span>
          {{ history.memo }}
          <div
            v-if="history.project"
            class="history-list-item__sub"
          >
            {{ history.project }}
          </div>
        </div>
      </div>
      <div
        v-else
        class="empty-data"
      >
        {{ $t('common.PLACEHOLDER.noData') }}
      </div>
    </div>
  </el-dialog>
</template>

<script>
import API from '@sd-fe/cmp-core'

export default {
  props: {
    active: {
      type: Boolean,
      default: false
    },
    activeDistModel: {
      type: Object,
      default: null
    }
  },
  computed: {
    modalTitle () {
      return this.activeDistModel ? this.activeDistModel.name + ' ' + this.$t('meter.history') : ''
    }
  },
  watch: {
    active (visible) {
      if (visible) {
        this.getHistory()
      } else {
        this.historyData = null
      }
    }
  },
  methods: {
    async getHistory () {
      try {
        this.loadingHistory = true
        const { data } = await API.billing.getModelHistory(this.activeDistModel.id)
        this.historyData = data
      } catch (error) {
        console.log(error)
        this.$alert(this.$t('common.ALERT.BILL.062'))
      } finally {
        this.loadingHistory = false
      }
    }
  },
  data: () => ({
    loadingHistory: false,
    historyData: null
  })
}
</script>

<style lang="scss" scoped>
.history {
  &-list {
    max-height: 500px;
    overflow-y: auto;

    &-item {
      line-height: 1.5;

      &__sub {
        color: #999;
        padding-left: $gap-s;
      }
    }
  }
}
</style>
