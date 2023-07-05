
<template>
  <el-dialog
    :visible="programInfo.visible"
    title=""
    custom-class="delete-program"
    width="300px"
    top="50px"
    :center="true"
    @close="$emit('delete', false)"
  >
    <div class="modal-body -delete-program">
      {{ programInfo && programInfo.name ? programInfo.name : undefined }}
      {{ programInfo.item && programInfo.item.swScriptVersion !== undefined ? `Script ${programInfo.item.swScriptVersion}` : undefined }}
      <!-- 을(를) <br> 삭제하시려면 <br> 소프트웨어 명을 동일하게<br> 입력해주세요. -->
      {{ $t('service.INSTALL.ALERT.012') }}
      <p v-html="$t('service.INSTALL.ALERT.013')" />

      <el-input
        class="delete-input"
        :placeholder="$t('service.INSTALL.PLACEHOLDER.006')"
        v-model="programInfo.value"
        @input="inputDelete"
      />
    </div>

    <div class="modal-button-area">
      <button
        class="button"
        @click="$emit('delete', false)"
      >
        <!-- 취소 -->
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button"
        type="is-primary"
        :disabled="programInfo.disabled"
        @click="$emit('delete', true)"
      >
        <!-- 삭제 -->
        {{ $t('common.BTN.delete') }}
      </button>
    </div>
  </el-dialog>
</template>

<script>
import { cloneDeep, escapeRegExp } from 'lodash'

export default {
  name: 'InstallProgramDelete',
  props: {
    status: {
      type: Object,
      default: () => {}
    }
  },
  watch: {
    status: {
      deep: true,
      handler (status) {
        this.programInfo = cloneDeep(status)
        console.log(this.programInfo)
      }
    }
  },
  methods: {
    /**
     * 삭제시 입력하는 Input Text 검사
     */
    inputDelete (value) {
      const deleteInfo = this.programInfo
      const installNameRegex = new RegExp(escapeRegExp(deleteInfo.name), 'g')
      deleteInfo.disabled = !installNameRegex.test(value)
    }
  },
  data: () => ({
    programInfo: {}
  })
}
</script>

<style lang="scss" scoped>
.-delete-program {
  text-align: center;
  font-size: 16px;
  line-height: 22px;
  margin-top: $gap-s;
  .delete-input {
    margin-top: $gap
  }
}
</style>

<style lang="scss">
.delete-program {
  .el-dialog__header { margin: 0 !important; }
}
</style>
