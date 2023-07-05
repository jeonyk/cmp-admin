<template>
  <el-dialog
    title="Cloud Init Script 선택"
    :visible="active"
    @close="$emit('close')"
    width="1100px"
  >
    <cloud-init-fetch-list @change="val => (script = val)" />
    <section class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="$emit(['close'])"
      >
        {{ $v('취소') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="onSaveScript"
      >
        {{ $v('저장') }}
      </button>
    </section>
  </el-dialog>
</template>

<script>
import CloudInitFetchList from './CloudInitFetchList.vue'

export default {
  name: 'CloudInitFetchListModal',
  props: {
    active: {
      type: Boolean,
      required: true
    }
  },
  components: {
    CloudInitFetchList
  },
  methods: {
    onSaveScript () {
      if (!this.script) {
        return this.$alert('스크립트를 입력해주세요.')
      }

      this.$confirm('스크립트를 저장하시겠습니까?')
        .then(() => {
          this.$emit('save-script', this.script)
        })
        .catch(() => false)
    }
  },
  data: () => ({
    script: ''
  })
}
</script>

<style lang="scss" scoped>
.modal-button-area {
  border-top: 1px solid $purple-gray;
  padding-top: $gap;
}
</style>
