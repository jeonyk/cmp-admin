<template>
  <el-dialog
    v-bind="mergedProps"
    v-on="listen"
    v-drag-outside
  >
    <slot />
  </el-dialog>
</template>

<script>
import { Dialog } from 'element-ui'

export default {
  name: 'ElDialogWrapper',
  components: {
    'el-dialog': Dialog
  },
  props: {
    title: {
      type: String,
      required: false,
      default: ''
    }
  },
  computed: {
    mergedProps () {
      return {
        ...this.$attrs,
        ...this.$props
      }
    },
    listen () {
      return {
        ...this.$listeners
      }
    }
  }
}
</script>
