<template>
  <div class="text-display">
    {{ content01 }} > {{ content02 }} > {{ content03 }}
  </div>
</template>

<script>

export default {
  props: {
    content01: {
      type: String,
      default: '{text}'
    },
    content02: {
      type: String,
      default: 'text}'
    },
    content03: {
      type: String,
      default: '{text}'
    }
  }
}

</script>

<style scoped>
.text-display {
 color:#9D9D9D;
}

</style>
