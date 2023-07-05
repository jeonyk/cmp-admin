
<template>
  <el-dialog
    :title="$t('config.VM.createVmTemplate')"
    width="800px"
    :visible.sync="isActive"
    @close="templateName = ''"
  >
    <div class="ova-export">
      <register-contents
        :title="$t('service.OVA.templateName')"
        type="input"
        required
      >
        <el-input
          :disabled="isLoadingExportOVA"
          :placeholder="$t('service.OVA.templateName')"
          v-model="templateName"
        />
      </register-contents>
    </div>
    <section class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="close"
        :disabled="isLoadingExportOVA"
      >
        {{ $v('취소') }}
      </button>
      <button
        class="button"
        type="is-primary"
        :disabled="isLoadingExportOVA || !templateName"
        v-loading="isLoadingExportOVA"
        @click="exportTemplate"
      >
        {{ $v('생성') }}
      </button>
    </section>
  </el-dialog>
</template>

<script>
import { mapState } from 'vuex'
import API from '@sd-fe/cmp-core'

export default {
  name: 'TemplateExportModal',
  props: {
    active: {
      type: Boolean,
      default: false
    },
    vmInfo: {
      type: Object,
      default: null
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  watch: {
    active: {
      immediate: true,
      handler (val) { this.isActive = val }
    },
    isActive (val) {
      if (!val) { this.templateName = '' }
    }
  },
  methods: {
    close () {
      this.isActive = false
      this.$emit('close')
    },

    async exportTemplate () {
      if (!this.vmInfo) return
      if (!this.templateName?.trim()) return this.$alert(this.$v('템플릿 명을 입력해주세요.'), () => false)
      if (!await this.isAvailableTemplateName()) return this.$alert('이미 사용 중인 vm 명입니다.', () => false)

      try {
        this.isLoadingExportOVA = true

        const datastoreId = this.vmInfo?.userInfo?.datastoreId // 임시
        const hostUuid = this.vmInfo.hostUuid
        const userVmIdx = this.vmInfo?.userInfo?.userVmIdx
        const templateName = this.templateName
        if (!datastoreId || !hostUuid || !userVmIdx) return

        const requestData = {
          datastoreId,
          hostUuid,
          userVmIdx,
          templateName,
          reqUserId: this.user.userId
        }

        const payload = {
          beforePrice: this.vmInfo?.beforePrice || 0,
          groupIdx: this.user.userGroup,
          groupName: this.user.userGroupName,
          isUrgent: !!this.vmInfo?.isUrgent, // 긴급 여부(긴급 = true, 일반 = false)
          price: this.vmInfo?.price || 0,
          projectIdx: this.vmInfo.projectIdx,
          requestData,
          service: 'VMW_VM_TEMPLATE',
          userId: this.user.userId,
          userName: this.user.userName
        }

        const result = await API.work_v3.exportVmwareOVA(payload)
        if (result) this.$alert(this.$v('성공적으로 VM 템플릿을 Export하였습니다.'), () => false)
        this.close()
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('VM 템플릿 Export 실패하였습니다.'), () => false)
      } finally {
        this.isLoadingExportOVA = false
      }
    },
    /**
     * Template이름 사용 가능 여부를 반환합니다.
     * [vm템플릿 명+ vm 호스트 명] 통틀어 중복 불가능합니다.
     */
    async  isAvailableTemplateName (name = this.templateName) {
      try {
        this.isLoadingExportOVA = true

        const isInVMware = await API.vmware.vm.checkHostnameInVmware({ hostName: name })
        return !isInVMware
      } catch (error) {
        console.error(error)
      } finally {
        this.isLoadingExportOVA = false
      }
    }
  },
  data: () => ({
    isActive: false,
    templateName: '',
    isLoadingExportOVA: false
  })
}
</script>

<style lang="scss" scoped>

</style>
