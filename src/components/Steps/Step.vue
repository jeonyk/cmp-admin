<template>
  <el-tooltip
    placement="top"
    effect="light"
    :disabled="!tooltipContent"
  >
    <div
      slot="content"
    >
      {{ tooltipContent }}
    </div>

    <span
      class="icon"
      :class="[
        {'is-colored' : isColored},
        {'is-canceled' : isCanceled}
      ]"
    >
      <span
        v-if="stepLevel === 1 && !isReady"
        style="font-size:18px;"
      >
        !
      </span>
      <close-icon
        v-else-if="isCanceled && hasCanceledItems"
      />
      <i
        v-else-if="isPending"
        style="font-size:16; color:#fff;"
        class="el-icon-more"
      />
      <check-icon
        class="check-icon"
        v-else
        :icon-color="iconColor"
      />

    </span>
  </el-tooltip>
</template>

<script>
import CloseIcon from '@/components/Icons/CloseIcon.vue'
import CheckIcon from '@/components/Icons/CheckIcon.vue'
export default {
  components: {
    CheckIcon,
    CloseIcon
  },
  props: {
    isReady: {
      type: Boolean,
      default: true
    },
    type: {
      type: String,
      default: ''
    },
    isColored: {
      type: Boolean,
      default: false
    },
    isPending: {
      type: Boolean,
      default: false
    },
    isCanceled: {
      type: Boolean,
      default: false
    },
    canceledItems: {
      type: Array,
      default: () => []
    },
    tooltipContent: {
      type: String,
      default: ''
    },
    roleName: {
      type: String,
      default: ''
    },
    stepLevel: {
      type: Number,
      default: 0
    }
  },
  computed: {
    hasCanceledItems () {
      return this.canceledItems && this.canceledItems.length > 0
    },
    classObject () {
      return {
        [this.type]: false
      }
    },
    iconColor () {
      // return this.isColored ? '#fff' : '#53566F'
      // return this.isColored ? '#fff' : '#671819'
      if (this.isColored) return '#fff'
      if (this.isCanceled) return '#671819'
      return '#53566F'
    }
  }
}
</script>

<style lang="scss" scoped>
// .done {
//   background: #3e57c9;
// }
// .canceled {
//   background: #882929;
// }

.icon {
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  position: relative;
  z-index: 1;
}

.tooltip-ui {
  .list-title {
    text-align: center;
    color:#CF494D;
    font-size:12px;
    margin-bottom:5px;
  }
}

</style>
