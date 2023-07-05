<template>
  <div>
    <button
      v-if="!syncing"
      class="button refresh-btn"
      type="is-primary"
      @click="e=> $emit('click',e)"
    >
      {{ syncDate }}
      <refresh-full-icon
        :width="12"
        :height="12"
        class="refresh-btn-icon"
      />
    </button>
    <button
      v-else
      class="button syncing-btn"
      type="is-primary"
    >
      {{ $v('동기화 중') }}
    </button>
  </div>
</template>

<script>
import RefreshFullIcon from '@/components/Icons/RefreshFullIcon.vue'

export default {
  name: 'MonitoringSyncButton',
  components: { RefreshFullIcon },
  props: {
    syncDate: {
      type: String,
      default: () => this.$v('동기화할 데이터가 없습니다')
    },
    syncing: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped lang="scss">
.refresh-btn {
  height: 36px;
  &-icon {
    position: relative;
    top: 1px;
    margin-left: 5px;
  }
}
</style>
