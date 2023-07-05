<template>
  <section class="modal-footer big-button-area">
    <button
      class="button"
      type="is-anti"
      @click="handleClickClose"
    >
      {{ cancleText ? cancleText : $t('common.BTN.cancel') }}
    </button>
    <button
      class="button"
      type="is-primary"
      @click="handleClickConfirm"
    >
      {{ confirmText ? confirmText : $t('common.BTN.confirm') }}
    </button>
  </section>
</template>
<script>
export default {
  props: {
    confirmText: {
      type: String,
      default: ''
    },
    cancleText: {
      type: String,
      default: ''
    }
  },
  methods: {
    handleClickClose () {
      this.$emit('close')
    },
    handleClickConfirm () {
      this.$emit('confirm')
    }

  }
}
</script>
