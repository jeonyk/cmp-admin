<template>
  <el-dialog
    :title="moduleName"
    width="650px"
    :visible="active"
    @opened="openedEditModal"
    @close="$emit('close')"
  >
    <div
      v-loading="isLoadingGetModules"
      class="edit-module"
    >
      <register-contents
        :title="$t('common.REGCON.name')"
        type="input"
        required
      >
        <el-select
          v-if="createMode"
          v-model="editModuleName"
          :placeholder="$t('common.ALERT.ORG.009')"
        >
          <el-option
            v-for="mod in modules"
            :label="mod"
            :value="mod"
            :key="mod"
          >
            {{ mod }}
          </el-option>
        </el-select>
        <el-input
          v-else
          type="text"
          :placeholder="$t('common.ALERT.ORG.009')"
          v-model="editModuleName"
        />
      </register-contents>
      <register-contents
        :title="$t('license.TEXT.packageType')"
        type="input"
        required
      >
        <el-checkbox-group
          v-model="packageList"
          class="package-list-group"
        >
          <el-checkbox
            v-for="packageName in allPackage"
            :key="packageName"
            :label="packageName"
            :value="packageList.includes(packageName)"
          />
        </el-checkbox-group>
      </register-contents>
    </div>
    <section class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="$emit('close')"
      >
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        v-loading="isApiLoading"
        :disabled="isApiLoading"
        class="button"
        type="is-primary"
        @click="confirmEditModule"
      >
        {{ $t('common.BTN.complete') }}
      </button>
    </section>
  </el-dialog>
</template>

<script>
import { cloneDeep } from 'lodash'
import API from '@sd-fe/cmp-core'

export default {
  name: 'EditModuleModal',
  props: {
    active: {
      type: Boolean,
      required: true
    },
    moduleData: {
      type: Object,
      required: false,
      default: null
    },
    createMode: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  computed: {
    moduleName () {
      return this.createMode
        ? this.$t('license.TEXT.regNewModule')
        : this.moduleData?.moduleName + ' ' + this.$t('common.BTN.modify')
    }
  },
  watch: {
    active (visible) {
      if (visible) {
        if (this.createMode) {
          this.editModuleName = ''
        } else {
          this.editModuleName = this.moduleData.moduleName
          this.editModuleData = cloneDeep(this.moduleData)
          this.editModuleData.packageTypeList.forEach(packageType => {
            this.packageList.push(packageType.packageTypeName)
          })
        }
      } else {
        this.packageList = []
        this.editModuleName = ''
        this.editModuleData = null
        this.isApiLoading = false
        this.isLoadingGetModules = false
      }
    }
  },
  methods: {
    async openedEditModal () {
      if (this.createMode) {
        try {
          this.isLoadingGetModules = true
          const { data } = await API.license.getNotRegisteredModules()
          this.modules = data
        } catch (error) {
          console.log(error)
        } finally {
          this.isLoadingGetModules = false
        }
      }
    },
    mapValuePackageType (packageTypeName) {
      switch (packageTypeName) {
        case 'Plus':
          return 1
        case 'Basic':
          return 2
        case 'Standard':
          return 3
        case 'Enterprise':
          return 4
        default:
          return 1
      }
    },
    getRequestPackageTypeList (idx) {
      return this.packageList.map(packageName => {
        return {
          moduleIdx: idx,
          packageTypeIdx: this.mapValuePackageType(packageName),
          packageTypeName: packageName
        }
      })
    },
    async validationCheck (requestObj) {
      if (!requestObj) {
        this.$alert(this.$t('common.ALERT.LIC.026'))
        return false
      } else if (!requestObj.moduleName) {
        this.$alert(this.$t('common.ALERT.LIC.027'))
        return false
      } else if (!requestObj.packageTypeList.length) {
        this.$alert(this.$t('common.ALERT.LIC.030'))
        return false
      }
      return true
    },
    async confirmEditModule () {
      this.isApiLoading = true

      if (this.createMode) {
        const requestObj = {
          moduleName: this.editModuleName,
          packageTypeList: this.getRequestPackageTypeList(0)
        }

        const validated = await this.validationCheck(requestObj)

        if (!validated) {
          this.isApiLoading = false
          return
        }

        try {
          await API.license.createModule(requestObj)
          this.$alert(this.$t('common.ALERT.LIC.028'), {
            callback: () => {
              this.$emit('required-refresh')
              this.$emit('close')
            }
          })
        } catch (error) {
          const callback = () => this.$emit('close')
          switch (error.response.data.code) {
            case 'LIC202':
              this.$alert(this.$t('common.ALERT.LIC.029'), { callback })
              break
            case 'LIC203':
              this.$alert(this.$t('common.ALERT.LIC.030'), { callback })
              break
            case 'LIC209':
              this.$alert(this.$t('common.ALERT.LIC.034'))
              break
            default:
              this.$alert(this.$t('common.ALERT.LIC.031'), { callback })
          }
        } finally {
          this.isApiLoading = false
        }
      } else {
        const idx = this.editModuleData.moduleIdx
        const packageTypeList = this.getRequestPackageTypeList(idx)
        const requestObj = {
          moduleName: this.editModuleName,
          packageTypeList
        }

        if (!this.validationCheck(requestObj)) {
          this.isApiLoading = false
          return
        }

        try {
          await API.license.updateModule(idx, requestObj)
          this.$alert(this.$t('common.ALERT.LIC.032'), {
            callback: () => {
              this.$emit('required-refresh')
              this.$emit('close')
            }
          })
        } catch (error) {
          const callback = () => this.$emit('close')
          switch (error.response.data.code) {
            case 'LIC202':
              this.$alert(this.$t('common.ALERT.LIC.029'), { callback })
              break
            case 'LIC203':
              this.$alert(this.$t('common.ALERT.LIC.030'), { callback })
              break
            case 'LIC209':
              this.$alert(this.$t('common.ALERT.LIC.034'), { callback })
              break
            default:
              this.$alert(this.$t('common.ALERT.LIC.033'), { callback })
          }
        } finally {
          this.isApiLoading = false
        }
      }
    }
  },
  data: () => ({
    isLoadingGetModules: false,
    editModuleName: '',
    editModuleData: null,
    packageList: [],
    allPackage: ['Plus', 'Basic', 'Standard', 'Enterprise'],
    modules: [],
    isApiLoading: false
  })
}
</script>

<style lang="scss" scoped>
.edit-module {
  & .register-contents {
    height: 46px;
    align-items: flex-start;

    &::v-deep .contents-title {
      width: 68px;
      min-width: 68px;
      padding: 10px 5px;
    }

    &::v-deep .contents {
      padding-right: 0;
    }

    & .package-list-group {
      display: flex;

      & > * {
        margin-right: 0;
      }

      & > * + * {
        margin-left: 30px;
      }

      &::v-deep {
        .el-checkbox {
          &__label {
            line-height: 0.7;
            font-size: 13px;
            color: $input-placeholder;
            padding-left: 10px;
          }
        }
      }
    }
  }
}
</style>
