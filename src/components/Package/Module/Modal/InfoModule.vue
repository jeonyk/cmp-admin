<template>
  <el-dialog
    :title="title"
    :visible="active"
    @close="$emit('close')"
    @closed="$emit('closed')"
    width="460px"
  >
    <div
      v-if="active"
      class="module-info"
    >
      <register-contents
        :title="$t('license.TEXT.location')"
        type="input"
        required
      >
        <el-input
          :disabled="isEdit"
          v-model="infoCloneData.modulePath"
          type="text"
          :placeholder="$t('license.PLACEHOLDER.enterLocation')"
        />
      </register-contents>
      <register-contents
        :title="$t('common.TERMS.version')"
        type="input"
        required
      >
        <el-input
          :disabled="isEdit"
          v-model="infoCloneData.moduleVersion"
          type="text"
          :placeholder="$t('common.ALERT.LIC.007')"
        />
      </register-contents>
      <register-contents
        :title="$t('common.GRID.explain')"
        type="input"
        required
        style="height: 100px;"
      >
        <el-input
          v-model="infoCloneData.comment"
          type="textarea"
          :rows="3"
        />
      </register-contents>
    </div>
    <section class="modal-button-area">
      <button
        type="is-anti"
        class="button"
        @click="$emit('close')"
      >
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        v-if="!isEdit"
        type="is-primary"
        class="button"
        @click="enrollModule"
      >
        {{ $t('common.BTN.enroll') }}
      </button>
      <button
        v-if="isEdit"
        class="button"
        type="is-primary"
        @click="modifyModule"
      >
        {{ $t('common.BTN.complete') }}
      </button>
    </section>
  </el-dialog>
</template>

<script>
import { cloneDeep } from 'lodash'
import { mapGetters } from 'vuex'
import API from '@sd-fe/cmp-core'

export default {
  props: {
    active: {
      type: Boolean,
      required: true
    },
    isEdit: {
      type: Boolean,
      required: false,
      default: false
    },
    item: {
      type: Object,
      required: false,
      default: null
    },
    moduleData: {
      type: Object,
      required: false,
      default: null
    }
  },
  computed: {
    title () {
      return `${this.moduleData?.moduleName} ${this.isEdit ? this.$t('common.BTN.modify') : this.$t('license.TEXT.update')}`
    },
    ...mapGetters(['user'])
  },
  watch: {
    active (visible) {
      if (visible) {
        if (this.isEdit) {
          this.infoCloneData = cloneDeep(this.item)
        } else {
          this.infoCloneData = {
            modulePath: '',
            moduleVersion: '',
            comment: ''
          }
        }
      } else {
        this.infoCloneData = null
      }
    }
  },
  methods: {
    async validationCheck (requestObj) {
      if (!requestObj.modulePath) {
        return this.$alert(this.$t('common.ALERT.LIC.023', { item: this.$t('license.TEXT.location') }), { callback: () => false })
      } else if (!requestObj.moduleVersion) {
        return this.$alert(this.$t('common.ALERT.LIC.002', { item: this.$t('common.TERMS.version') }), { callback: () => false })
      } else if (!requestObj.comment) {
        return this.$alert(this.$t('common.ALERT.LIC.002', { item: this.$t('common.GRID.explain') }), { callback: () => false })
      } else if (!requestObj.adminId) {
        return this.$alert(this.$t('common.ALERT.LIC.002', { item: this.$t('license.TEXT.adminNumber') }), { callback: () => false })
      } else if (!requestObj.adminName) {
        return this.$alert(this.$t('common.ALERT.LIC.002', { item: this.$t('license.TEXT.adminName') }), { callback: () => false })
      } else if (!requestObj.moduleIdx) {
        return this.$alert(this.$t('common.ALERT.LIC.023', { item: 'moduleIdx' }), { callback: () => false })
      }
      return true
    },
    async enrollModule () {
      const requestObj = {
        ...this.infoCloneData,
        adminId: this.user.userId,
        adminName: this.user.userName,
        moduleIdx: this.moduleData.moduleIdx
      }

      const validated = await this.validationCheck(requestObj)

      if (!validated) return

      try {
        await API.license.createModuleVersion(requestObj)
        this.$alert(this.$t('common.ALERT.LIC.019'), {
          callback: () => {
            this.$emit('required-refresh')
            this.$emit('close')
          }
        })
      } catch (error) {
        const callback = () => this.$emit('close')
        switch (error.response.data.code) {
          case 'LIC204':
            this.$alert(this.$t('common.ALERT.LIC.020'), { callback })
            break
          case 'LIC205':
            this.$alert(this.$t('common.ALERT.LIC.021'), { callback })
            break
          case 'LIC210':
            this.$alert(this.$t('common.ALERT.LIC.037'), { callback })
            break
          default:
            this.$alert(this.$t('common.ALERT.LIC.022'), { callback })
        }
      }
    },
    async modifyModule () {
      if (!this.item.moduleVersionIdx) return
      if (!this.infoCloneData.comment) return this.$alert(this.$t('common.ALERT.LIC.002', { item: this.$t('common.GRID.explain') }), { callback: () => false })

      try {
        await API.license.updateModuleVersion(this.item.moduleVersionIdx, { comment: this.infoCloneData.comment })
        this.$alert(this.$t('common.ALERT.LIC.024'), {
          callback: () => {
            this.$emit('required-refresh')
            this.$emit('close')
          }
        })
      } catch (error) {
        this.$alert(this.$t('common.ALERT.LIC.025'), {
          callback: () => {
            this.$emit('close')
          }
        })
      }
    }
  },
  data: () => ({
    infoCloneData: null
  })
}
</script>

<style lang="scss" scoped>
.module-info {
  padding-bottom: $gap-s;
  border-bottom: 1px solid $purple-gray;

  & .register-contents {
    height: 42px;
    align-items: flex-start;

    &::v-deep .contents-title {
      width: 40px;
      min-width: 40px;
      margin-top: 5px;
    }

    &::v-deep .contents {
      padding-right: 0;
    }
  }
}
</style>
