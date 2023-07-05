<template>
  <div class="progressbar-wrap">
    <progress-bar
      :value="value"
      :total="100"
      :notice-percent="thresValue1"
      :alert-percent="thresValue2"
    />
    <el-tooltip
      v-if="text.length > 18"
      :content="text"
      placement="top"
      effect="light"
    >
      <span
        class="progress-desc ellipsis-wrap"
      >
        {{ text }}
      </span>
    </el-tooltip>
    <p
      v-else
      class="progress-desc"
    >
      {{ text }}
    </p>
  </div>
</template>

<script>
export default {
  props: {
    thresValue1: {
      type: Number,
      default: 0
    },
    thresValue2: {
      type: Number,
      default: 0
    },
    value: {
      type: Number,
      default: 0
    },
    text: {
      type: String,
      default: ''
    }
  }
}
</script>

<style>

</style>
