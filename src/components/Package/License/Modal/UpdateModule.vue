<template>
  <el-dialog
    :title="'v' + cmpVersion + ' ' + $t('license.TEXT.update')"
    width="450px"
    :visible="active"
    @close="$emit('close')"
  >
    <div
      v-loading="isLoadingUpdatePackage"
      class="update-module"
    >
      <register-contents
        :title="$t('license.TEXT.moduleList')"
        type="input"
        style="height: 123px;"
      >
        <el-input
          v-model="moduleNames"
          :rows="4"
          type="textarea"
          disabled
        />
      </register-contents>
      <register-contents
        :title="$t('common.TERMS.version')"
        type="input"
      >
        <el-input
          v-model="cmpVersion"
          disabled
        />
      </register-contents>
      <register-contents
        :title="$t('common.GRID.explain')"
        type="input"
      >
        <el-input
          :rows="4"
          v-model="cmpData.comment"
          type="textarea"
          :placeholder="$t('license.PLACEHOLDER.explainUpdate')"
          disabled
        />
      </register-contents>
    </div>
    <section class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="$emit('close')"
      >
        {{ $t("common.BTN.cancel") }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="runUpdate"
      >
        {{ $t("license.TEXT.startUpdate") }}
      </button>
    </section>
  </el-dialog>
</template>

<script>
import API from '@sd-fe/cmp-core'
import gTreeVue from '@/components/common/g-tree/g-tree.vue'

export default {
  props: {
    active: {
      type: Boolean,
      required: false
    },
    cmpData: {
      type: Object,
      required: true
    }
  },
  inject: ['_licData'],
  computed: {
    moduleNames () {
      return this.cmpData.moduleList
        .map(mod => `${mod.moduleName} (${mod.moduleVersion})`)
        .join('\n')
    },
    cmpVersion () {
      return this.cmpData.cmpVersion
    }
  },
  methods: {
    runUpdate () {
      this.$confirm(this.$t('common.CONFIRM.LIC.001'))
        .then(async () => {
          try {
            this.isLoadingUpdatePackage = gTreeVue
            const updateData = this.cmpData
            await API.license.runUpdate(updateData, {
              licenseIdx: this._licData.data.licenseManage.licenseIdx
            })
            this.$alert(this.$t('common.ALERT.LIC.035'), {
              callback: () => {
                this.$emit('close-with-refresh')
              }
            })
          } catch (error) {
            console.log(error)
            this.$alert(this.$t('common.ALERT.LIC.036'))
          } finally {
            this.isLoadingUpdatePackage = false
          }
        })
        .catch(() => {})
    },
    async getUpdatePackageInfo () {
      // await getUpdate({ })
    }
  },
  data: () => ({
    isLoadingUpdatePackage: false
  })
}
</script>

<style lang="scss" scoped>
.update-module {
  padding-bottom: $gap-s;
  border-bottom: 1px solid $purple-gray;

  & .register-contents {
    align-items: flex-start;

    &:nth-of-type(2) {
      &::v-deep .contents-title {
        padding-top: 12px;
      }
    }

    &::v-deep .contents-title {
      width: 55px !important;
      min-width: 55px !important;
      padding-top: 15px;
    }

    &::v-deep .contents {
      padding: 5px 20px;
      padding-right: 0;
    }
  }
}
</style>
