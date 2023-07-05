<template>
  <div
    v-loading="isLoadingLicense"
    class="package-external"
  >
    <detail-contents
      v-if="licenseData.licenseManage"
      external
      :license-data="licenseData.licenseManage"
      :versions="versions"
      @refresh="initExternalLicense"
    />
    <div
      v-if="licenseData.modules"
      class="package-external-status"
    >
      <div class="package-external-status__badges">
        <external-badge
          type="usage"
          style="flex-basis: 270px;"
        >
          <div class="usage-icon">
            <div class="usage-icon-wrapper">
              <resource-icon
                :width="18"
                :height="14"
                icon-color="white"
              />
            </div>
          </div>
          <div class="usage-text">
            <span class="normal">{{ $t("license.TEXT.purchase") }}</span>
            <span class="emp">{{ licenseData.licenseManage.nodeCnt }} /</span>
            <span class="normal">{{ $t("service.INSTALL.STATUS.use") }}</span>
            <span class="emp">{{
              licenseData.licenseManage.hostCnt || 0
            }}</span>
          </div>
        </external-badge>
        <external-badge type="normal">
          <div class="left">
            <div class="icon-wrap check">
              <check-icon
                :width="12"
                :height="8"
              />
            </div>
            <span class="text">{{ $t("admin.ACCOUNT.actived") }}</span>
          </div>
          <div class="count">
            <!-- {{
              licenseData.licenseManage
                ? licenseData.licenseManage.activeModule
                : 0
            }} -->
            {{ activeModuleCount }}
          </div>
        </external-badge>
        <external-badge type="normal">
          <div class="right">
            <div class="icon-wrap warning">
              <warning-icon
                :width="2"
                :height="8"
              />
            </div>
            <span class="text">{{ $t("admin.ACCOUNT.inactived") }}</span>
          </div>
          <div class="count">
            <!-- {{
              licenseData.licenseManage
                ? licenseData.licenseManage.inActiveModule
                : 0
            }} -->
            {{ inActiveModuleCount }}
          </div>
        </external-badge>
        <external-badge type="normal">
          <div
            v-if="updating"
            class="is-updating left"
          >
            <div class="update-icon-wrap">
              <update-now-icon
                :width="20"
                :height="20"
                icon-color="#7681FF"
                class="update-icon"
              />
            </div>
            <span class="update-text">{{
              $t("license.PLACEHOLDER.updating")
            }}</span>
          </div>
          <div
            v-else-if="!existNewVersion"
            class="left"
          >
            v{{ licenseData.licenseManage.cmpVersion }} {{ $t("license.PLACEHOLDER.latestVersion") }}
          </div>
          <!-- 최신버전 -->
          <div
            v-else-if="existNewVersion && nextCmpVersion"
            class="left"
          >
            <div class="module-update">
              <span
                class="module-update-text"
                @click="isActiveUpdateModule = true"
              >
                v{{ nextCmpVersion.cmpVersion }} {{ $t("license.TEXT.update") }}
              </span>
              <span class="module-update-icon">
                <i class="mdi mdi-chevron-right mdi-24px" />
              </span>
            </div>
          </div>
          <!-- 최신버전 존재 -->
          <div
            class="count"
            @click="isActiveModuleHistory = true"
          >
            <i class="dots-icon mdi mdi-dots-vertical" />
          </div>
        </external-badge>
      </div>
      <div class="package-external-status__modules">
        <detail-modules-list
          :modules="licenseData.modules"
          @click-module="clickModule"
        />
      </div>
    </div>
    <detail-module-modal
      :active.sync="isActiveDetailModule"
      :selected-module="selectedModule"
      @close="isActiveDetailModule = false"
    />
    <update-module-modal
      v-if="nextCmpVersion"
      :active.sync="isActiveUpdateModule"
      @close="isActiveUpdateModule = false"
      @close-with-refresh="closeRefreshUpdateModuleModal"
      :cmp-data="nextCmpVersion"
    />
    <module-history-modal
      v-if="historyVersion"
      :active.sync="isActiveModuleHistory"
      @close="isActiveModuleHistory = false"
      :history="historyVersion"
    />
  </div>
</template>

<script>
import DetailContents from '@/components/Package/License/DetailContents.vue'
import DetailModuleModal from '@/components/Package/License/Modal/DetailModule.vue'
import UpdateModuleModal from '@/components/Package/License/Modal/UpdateModule.vue'
import ModuleHistoryModal from '@/components/Package/License/Modal/ModuleHistory.vue'
import DetailModulesList from '@/components/Package/License/DetailModulesList.vue'
import ExternalBadge from '@/components/Package/License/ExternalBadge.vue'
import ResourceIcon from '@/components/Icons/ResourceIcon.vue'
import CheckIcon from '@/components/Icons/CheckIcon.vue'
import WarningIcon from '@/components/Icons/WarningIcon.vue'
import UpdateNowIcon from '@/components/Icons/UpdateNowIcon.vue'
import API from '@sd-fe/cmp-core'

export default {
  name: 'PackageMain',
  components: {
    DetailContents,
    DetailModulesList,
    ExternalBadge,
    ResourceIcon,
    CheckIcon,
    WarningIcon,
    UpdateNowIcon,
    DetailModuleModal,
    UpdateModuleModal,
    ModuleHistoryModal
  },
  async created () {
    await this.initPackageMain()
  },
  provide () {
    const _lic = {}

    Object.defineProperty(_lic, 'data', {
      get: () => this.licenseData,
      enumerable: true
    })

    return {
      _licData: _lic,
      external: true
    }
  },
  computed: {
    activeModuleCount () {
      if (this.licenseData) {
        return this.licenseData.modules.filter(mod => mod.isActivate).length
      }
      return 0
    },
    inActiveModuleCount () {
      if (this.licenseData) {
        return this.licenseData.modules.length - this.activeModuleCount
      }
      return 0
    },
    // 업데이트중인 여부
    updating () {
      return this.licenseData
        ? this.licenseData.licenseManage.updateStatus === 'RUNNING'
        : null
    },
    // 최신 버전 존재 여부
    existNewVersion () {
      return this.licenseData
        ? this.licenseData.licenseManage.cmpVersionIdx !==
            this.licenseData.licenseManage.nextCmpVersionIdx
        : null
    },
    // 현재 라이선스의 패키지 타입 idx - 플러스, 베이직...
    currentPackageIdx () {
      return this.licenseData.licenseManage
        ? this.licenseData.licenseManage.packageType.packageTypeIdx
        : null
    },
    // 현재 라이선스 idx
    licenseIdx () {
      return this.licenseData.licenseManage
        ? this.licenseData.licenseManage.licenseIdx
        : null
    }
  },
  methods: {
    closeRefreshUpdateModuleModal () {
      this.isActiveUpdateModule = false
      this.initPackageMain()
    },
    async initPackageMain () {
      this.isLoadingLicense = true
      await this.getVersions()
      await this.initExternalLicense()
      await this.getHistoryPackage()
      if (this.existNewVersion) await this.getNextCmpVersion()
      this.isLoadingLicense = false
    },
    async getNextCmpVersion () {
      try {
        const { data } = await API.license.getUpdate({
          packageTypeIdx: this.licenseData.licenseManage.packageType.packageTypeIdx,
          nextCmpVersionIdx: this.licenseData.licenseManage.nextCmpVersionIdx
        })
        this.nextCmpVersion = data
      } catch (error) {
        this.$alert(this.$t('common.ALERT.LIC.015'))
      }
    },
    async getVersions () {
      try {
        const { data } = await API.license.getPackageTypeList()
        this.versions = data
      } catch (error) {
        console.log(error)
        this.$alert(this.$t('common.ALERT.LIC.015'))
      }
    },
    async getHistoryPackage () {
      try {
        const { data } = await API.license.getHistoryVersion({
          licenseIdx: this.licenseIdx,
          packageTypeIdx: this.currentPackageIdx
        })
        this.historyVersion = data
      } catch (error) {
        this.$alert(this.$t('common.ALERT.LIC.015'))
      }
    },
    async initExternalLicense () {
      try {
        const { data } = await API.license.getLicense({ extra: true })
        this.licenseData = data
      } catch (error) {
        console.log(error)
        this.$alert(this.$t('common.ALERT.LIC.015'))
      }
    },
    clickModule (moduleItem) {
      this.selectedModule = moduleItem
      this.isActiveDetailModule = true
    }
  },
  data: () => ({
    isLoadingLicense: true,
    isActiveDetailModule: false,
    isActiveUpdateModule: false,
    isActiveModuleHistory: false,
    selectedModule: null,
    licenseData: {},
    versions: [],
    historyVersion: null,
    nextCmpVersion: null
  })
}
</script>

<style lang="scss" scoped>
@mixin flex-center() {
  display: flex;
  align-items: center;
  justify-content: center;
}

.package-external {
  display: flex;

  &-status {
    display: flex;
    flex-direction: column;
    width: 100%;

    &__badges {
      display: flex;
      margin-bottom: $gap;

      & > * {
        flex: 1 1 250px;
      }

      & > * + * {
        margin-left: $gap-s;
      }

      & .usage-icon {
        padding: 12px 0 12px 12px;

        &-wrapper {
          @include flex-center();
          background-color: $black;
          width: 36px;
          height: 36px;
          border-radius: 9999px;
        }
      }

      & .usage-text {
        display: flex;
        align-items: center;
        padding: 20px 20px 20px 0;
        font-weight: normal;

        & .emp {
          font-size: 20px;
          color: $color-black;
        }

        & > * + * {
          margin-left: 6px;
        }
      }

      & .left,
      & .right {
        @include flex-center();

        & .icon-wrap {
          @include flex-center();
          width: 20px;
          height: 20px;
          margin-right: $gap-s;
          border-radius: 9999px;
          background-color: $main-red;

          &.check {
            background-color: $primary;
          }
        }

        & .title {
          font-size: 13px;
        }

        & .update-text {
          margin-left: $gap-s;
          color: $main-blue;
        }

        & .module-update {
          @include flex-center();

          &-text {
            text-decoration: underline;
            cursor: pointer;
          }

          &-icon {
            margin-left: $gap-s;
          }
        }
      }

      & .external-badge {
        & .count {
          font-size: 20px;

          & .dots-icon {
            cursor: pointer;
            color: #9596a0;

            &:hover {
              color: $white;
            }
          }
        }
      }
    }

    .update-icon-wrap {
      .update-icon {
        animation: 2s bingle infinite linear;
      }
    }

    &__modules {
      width: 100%;
    }
  }
}

@keyframes bingle {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(-360deg);
  }
}
</style>
