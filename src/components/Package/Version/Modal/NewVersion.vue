<template>
  <el-dialog
    :title="$v('CMP 신규 버전 등록')"
    width="480px"
    :visible="active"
    @close="$emit('close')"
  >
    <div
      class="new-version"
      v-loading="isLoadingGetModuleList"
    >
      <register-contents
        type="input"
        :title="'CMP ' + $t('common.TERMS.version')"
        required
      >
        <el-input
          v-model="cmpVersion"
          :placeholder="$t('service.PLACEHOLDER.enterVersion')"
        />
      </register-contents>
      <register-contents
        type="input"
        :title="$t('license.PLACEHOLDER.selectModule')"
        required
      >
        <el-select
          style="margin-right: 10px;"
          :placeholder="$t('license.PLACEHOLDER.selectModule')"
          @change="v => (selectedModule = v)"
          v-model="selectedModuleName"
          value-key="moduleIdx"
        >
          <el-option
            v-for="mod in moduleList"
            :key="mod.moduleIdx"
            :value="mod"
          >
            {{ mod.moduleName }}{{ mod.packageTypeList | getFirstPackageTypes }}
            <!-- {{ getPackageTypeName(mod) }} -->
          </el-option>
        </el-select>
      </register-contents>
      <register-contents type="input">
        <div class="flex">
          <el-select
            :placeholder="$t('license.PLACEHOLDER.selectVersion')"
            :disabled="!isSelectModuleVersion"
            @change="v => (selectedModuleVersion = v)"
            v-model="selectedModuleVersionName"
            value-key="moduleVersionIdx"
          >
            <el-option
              v-for="version in moduleVersionList"
              :key="version.moduleVersionIdx"
              :value="version"
            >
              {{ version.moduleVersion }}
            </el-option>
          </el-select>
          <button
            class="button"
            type="is-primary"
            style="padding: 0 10px;"
            :disabled="!selectedModuleVersion"
            @click="pushModule"
          >
            {{ $t("common.BTN.add") }}
          </button>
        </div>
      </register-contents>
      <register-contents type="input">
        <div
          v-if="!pushedModules.length"
          class="custom-contents"
        >
          {{ $t("license.PLACEHOLDER.selectModuleUpdate") }}
        </div>
        <div
          v-else
          class="custom-contents pushed-modules"
        >
          <div
            v-for="(mod, index) in pushedModules"
            :key="index"
            class="pushed-modules-item"
          >
            <span>{{ mod.name }} ({{ mod.version | printVersion }})</span>
            <type-items
              v-if="mod.packageTypeList"
              :items="mod.packageTypeList"
            />
          </div>
        </div>
      </register-contents>
      <register-contents
        :title="$t('common.GRID.explain')"
        type="input"
        required
      >
        <el-input
          :rows="3"
          v-model="comment"
          type="textarea"
          :placeholder="$t('license.PLACEHOLDER.enterUpdateExplain')"
        />
      </register-contents>
    </div>
    <section class="modal-button-area">
      <button
        type="is-anti"
        class="button"
        @click="$emit('close')"
      >
        {{ $t("common.BTN.close") }}
      </button>
      <button
        type="is-primary"
        class="button"
        @click="addNewCmpVersion"
        v-loading="isLoadingCreate"
      >
        {{ $t("common.BTN.enroll") }}
      </button>
    </section>
  </el-dialog>
</template>

<script>
import API from '@sd-fe/cmp-core'
import TypeItems from '../TypeItems.vue'
import { mapGetters } from 'vuex'

export default {
  props: {
    active: {
      type: Boolean,
      required: true
    }
  },
  components: { TypeItems },
  computed: {
    ...mapGetters(['user']),
    selectedModuleName: {
      get () {
        return this.selectedModule
          ? this.selectedModule.moduleName +
              this.$options.filters.getFirstPackageTypes(
                this.selectedModule.packageTypeList
              )
          : ''
      },
      set (value) {}
    },
    selectedModuleVersionName: {
      get () {
        return this.selectedModuleVersion
          ? this.selectedModuleVersion.moduleVersion
          : ''
      },
      set (value) {}
    }
  },
  watch: {
    async selectedModule (sModule) {
      if (sModule) {
        await this.getModuleVersions()
        this.isSelectModuleVersion = true
        this.selectedModuleVersion = null
      } else {
        this.isSelectModuleVersion = false
      }
    },
    active (visible) {
      if (!visible) {
        this.isSelectModuleVersion = false
        this.selectedModuleVersion = null
        this.selectedModule = null
        this.moduleVersionList = []
        this.pushedModules = []
        this.cmpVersion = ''
        this.comment = ''
      } else {
        if (!this.moduleList.length) {
          this.getModuleList()
        }
      }
    }
  },
  filters: {
    getFirstPackageTypes (value) {
      if (!value || !value.length) return ''
      const packageTypes = value.map(type => type.packageTypeName[0])
      return ` (${packageTypes.join(', ')})`
    },
    printVersion (value) {
      return 'v.' + value
    }
  },
  methods: {
    async getModuleList () {
      try {
        this.isLoadingGetModuleList = true
        const { data } = await API.license.getModuleList()
        this.moduleList = data
      } catch (error) {
        this.$alert(this.$t('common.ALERT.LIC.018'))
      } finally {
        this.isLoadingGetModuleList = false
      }
    },
    async validateAddObj (reqObj) {
      if (!reqObj.adminId) {
        return this.$alert(this.$t('common.ALERT.LIC.005'), {
          callback: () => false
        })
      } else if (!reqObj.adminName) {
        return this.$alert(this.$t('common.ALERT.LIC.006'), {
          callback: () => false
        })
      } else if (!reqObj.cmpVersion) {
        return this.$alert(this.$t('common.ALERT.LIC.007'), {
          callback: () => false
        })
      } else if (!reqObj.comment) {
        return this.$alert(this.$t('common.ALERT.LIC.008'), {
          callback: () => false
        })
      } else if (!reqObj.moduleList || !reqObj.moduleList.length) {
        return this.$alert(this.$t('common.ALERT.LIC.009'), {
          callback: () => false
        })
      }
      return true
    },
    async addNewCmpVersion () {
      const requestObj = {}

      requestObj.adminId = this.user.userId
      requestObj.adminName = this.user.userName
      requestObj.cmpVersion = this.cmpVersion
      requestObj.comment = this.comment
      requestObj.moduleList = this.pushedModules.map(data => {
        data.originModule.moduleVersionIdx =
          data.originModuleVersion.moduleVersionIdx
        data.originModule.moduleVersion =
          data.originModuleVersion.moduleVersion
        const copy = { ...data.originModule }
        return copy
      })

      // validate
      const isValidated = await this.validateAddObj(requestObj)

      if (isValidated) {
        try {
          this.isLoadingCreate = true
          const { data: created } = await API.license.createVersion(requestObj)
          this.$emit('created', created)
        } catch (error) {
          switch (error.response.data.code) {
            case 'LIC101':
              this.$alert(this.$t('common.ALERT.LIC.011'))
              break
            case 'LIC103':
              this.$alert(this.$t('common.ALERT.LIC.009'))
              break
            default:
              this.$alert(this.$t('common.ALERT.LIC.010'))
              break
          }
        } finally {
          this.isLoadingCreate = false
        }
      }
    },
    async getModuleVersions () {
      const { data } = await API.license.getModuleVersionList({
        moduleIdx: this.selectedModule.moduleIdx
      })
      this.moduleVersionList = data
    },
    pushModule () {
      const mod = {
        name: this.selectedModule.moduleName,
        version: this.selectedModuleVersion.moduleVersion,
        packageTypeList: this.selectedModule.packageTypeList,
        key: this.selectedModule.moduleIdx,
        originModule: this.selectedModule,
        originModuleVersion: this.selectedModuleVersion
      }
      this.pushedModules.push(mod)
    }
  },
  data: () => ({
    selectedModule: null,
    selectedModuleVersion: null,
    moduleVersionList: [],
    isSelectModuleVersion: false,
    pushedModules: [],
    cmpVersion: '',
    comment: '',
    isLoadingCreate: false,
    moduleList: [],
    isLoadingGetModuleList: false
  })
}
</script>

<style lang="scss" scoped>
.new-version {
  & .register-contents {
    align-items: flex-start;

    &::v-deep .contents-title {
      width: 60px;
      min-width: 60px;
      padding: 10px;
    }

    &::v-deep .contents {
      padding: 5px 20px;
      padding-right: 0;
    }

    & .flex {
      display: flex;

      & > *:first-child {
        margin-right: $gap-s;
      }
    }

    & .custom-contents {
      height: 100px;
      width: 100%;
      background: rgba($dark-slate, $alpha: 0.6);
      border: 1px solid $purple-gray;
      box-sizing: border-box;
      border-radius: 2px;
      color: $input-placeholder;
      padding: $gap-s;
      overflow-y: auto;

      &.pushed-modules {
        & .pushed-modules-item {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 6px;

          &::v-deep {
            .type-badge {
              margin-top: 2px;
            }
          }

          & > span {
            margin-right: $gap-s;
            white-space: break-spaces;
          }
        }
      }
    }

    &:last-of-type {
      padding-bottom: $gap-s;
      border-bottom: 1px solid $purple-gray;
    }
  }
}
</style>
