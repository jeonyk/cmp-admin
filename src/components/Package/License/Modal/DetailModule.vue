<template>
  <el-dialog
    v-loading="isLoadingHistory"
    :visible="active"
    :title="selectedModule ? selectedModule.moduleName : ''"
    width="620px"
    @close="closeDetailModule"
    @open="isLoadingHistory = true"
    @opened="getDetailModule(selectedModule.moduleIdx)"
  >
    <div
      v-if="selectedModule"
      class="detail-module"
    >
      <div class="detail-module-versions">
        <div class="detail-module-versions__current">
          {{ $t("license.TEXT.currentVersion") }} :
          <span v-if="moduleDetail && moduleDetail.moduleVersion">
            {{ moduleDetail.moduleVersion }}
          </span>
        </div>
        <div class="detail-module-versions__new">
          {{ $t("license.TEXT.latestVersion") }} :
          <span v-if="moduleDetail && moduleDetail.latestModuleVersion">
            {{ moduleDetail.latestModuleVersion }}
          </span>
        </div>
        <div class="detail-module-versions__update">
          {{ $t("license.TEXT.lastUpdated") }} :
          <span v-if="moduleDetail">{{
            moduleDetail.lastUpdated | dateSimple("YYYY-MM-DD")
          }}</span>
        </div>
      </div>
      <div class="detail-module-history">
        <template v-for="(history, i) in moduleHistory">
          <p
            v-if="!history.failMessage"
            :key="history.updateTime + i"
          >
            {{ history.updateTime | dateSimple("YYYY-MM-DD HH:mm:ss") }}
            {{ history.comment }}
          </p>
          <el-tooltip
            v-else
            effect="light"
            :key="history.updateTime + i"
            popper-class="module-history-fail-message"
          >
            <span class="is-fail-message">
              <p title="">
                {{ history.updateTime | dateSimple("YYYY-MM-DD HH:mm:ss") }}
                {{ history.comment }}
              </p>
              <warning-icon
                :width="9"
                :height="9"
                class="warning-icon"
              />
            </span>
            <template #content>
              {{ history.failMessage }}
            </template>
          </el-tooltip>
        </template>
      </div>
    </div>
    <section class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="$emit('close')"
      >
        {{ $t("common.BTN.close") }}
      </button>
    </section>
  </el-dialog>
</template>

<script>
import API from '@sd-fe/cmp-core'
import WarningIcon from '@/components/Icons/WarningIcon.vue'

export default {
  components: { WarningIcon },
  name: 'DetailModuleModal',
  props: {
    active: {
      type: Boolean,
      required: true
    },
    selectedModule: {
      type: Object,
      required: false,
      default: null
    }
  },
  inject: ['_licData', 'external'],
  computed: {
    licenseIdx () {
      return this._licData.data
        ? this._licData.data.licenseManage.licenseIdx
        : null
    },
    moduleHistory () {
      return this.moduleDetail ? this.moduleDetail.moduleHistoryDetails : []
    }
  },
  methods: {
    closeDetailModule () {
      this.$emit('close')
      this.moduleDetail = null
      this.isLoadingHistory = false
    },
    async getDetailModule (moduleIdx) {
      this.isLoadingHistory = true
      try {
        if (this.external) {
          const { data } = await API.license.getHistoryModuleExtra({
            moduleIdx,
            licenseIdx: this.licenseIdx
          })
          this.moduleDetail = data
        } else {
          const { data } = await API.license.getHistoryModuleCentral({
            moduleIdx,
            licenseIdx: this.licenseIdx
          })
          this.moduleDetail = data
        }
      } catch (error) {
        console.error(error)
        this.$alert(this.$t('common.ALERT.LIC.018'))
      } finally {
        this.isLoadingHistory = false
      }
    }
  },
  data: () => ({
    moduleDetail: null,
    isLoadingHistory: false
  })
}
</script>

<style lang="scss">
.module-history-fail-message {
  max-width: 500px;
}
</style>

<style lang="scss" scoped>
.detail-module {
  &-versions {
    display: flex;
    align-items: center;
    font-weight: bold;
    margin-bottom: 15px;

    &__current {
      color: $light-gray;
      margin-right: 13px;
    }

    &__new {
      font-size: 12px;
      font-weight: normal;
      padding: 7px 10px;
      border-radius: 50px;
      border: 1px solid $purple-gray;
      color: #9d9d9d;
    }

    &__update {
      margin-left: auto;
      color: $input-placeholder;
    }
  }

  &-history {
    padding: $gap;
    color: #9d9d9d;
    border: 1px solid $purple-gray;
    height: 380px;
    overflow-y: auto;
    position: relative;

    .is-fail-message {
      p {
        display: inline-block;
      }
    }

    p {
      line-height: 20.8px;
      font-size: 13px;
      font-weight: 400;
    }

    .warning-icon {
      margin-left: 3px;
      background-color: $main-red;
      border-radius: 9999px;
      padding: 2px;
      color: white;
      position: relative;
      top: 1px;
    }
  }
}
</style>
