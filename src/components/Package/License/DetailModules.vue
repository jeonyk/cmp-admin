<template>
  <div class="license-detail-modules">
    <div class="license-detail-modules__serial">
      <div
        v-loading="isLoadingDownloadLicenseKey"
        ref="serialRef"
        class="number"
      >
        {{ licenseData.licenseManage.serial }}
      </div>
      <el-tooltip
        placement="top"
        effect="light"
        :content="$t('license.TEXT.copyToClipboard')"
      >
        <copy-icon
          :width="14"
          :height="18"
          icon-color="#9596A0"
          is-button
          style="margin-left: 12px;"
          @click="copySerial"
        />
      </el-tooltip>
      <button
        class="button key-download"
        type="is-primary"
        @click="downloadLicenseKey"
      >
        {{ $t("license.TEXT.downloadKey") }}
      </button>
    </div>
    <div class="license-detail-modules__active">
      <div class="license-detail-modules__active-item">
        <div class="icon">
          <check-icon
            :width="12"
            :height="8"
          />
        </div>
        <span class="title">{{ $t("admin.ACCOUNT.actived") }}</span>
        <div class="count">
          {{ activeCount }}
        </div>
      </div>
      <div class="license-detail-modules__active-item">
        <div class="icon">
          <warning-icon
            :width="2"
            :height="8"
          />
        </div>
        <span class="title">
          {{ $t("admin.ACCOUNT.inactived") }}
        </span>
        <div class="count">
          {{ inActiveCount }}
        </div>
      </div>
    </div>
    <detail-modules-list
      :modules="modules"
      @click-module="clickDetailModule"
    />
    <detail-module
      :active.sync="isActiveDetailModal"
      :selected-module="selectedModule"
      @close="isActiveDetailModal = false"
    />
  </div>
</template>

<script>
import CopyIcon from '@/components/Icons/CopyIcon.vue'
import CheckIcon from '@/components/Icons/CheckIcon.vue'
import WarningIcon from '@/components/Icons/WarningIcon.vue'
import DetailModule from '@/components/Package/License/Modal/DetailModule.vue'
import DetailModulesList from '@/components/Package/License/DetailModulesList.vue'
import API from '@sd-fe/cmp-core'

export default {
  name: 'DetailModules',
  components: {
    CopyIcon,
    CheckIcon,
    WarningIcon,
    DetailModule,
    DetailModulesList
  },
  props: {
    licenseData: {
      type: Object,
      required: false,
      default: null
    }
  },
  computed: {
    activeCount () {
      if (this.licenseData) {
        return this.licenseData.modules.filter(mod => mod.isActivate).length
      } else {
        return 0
      }
    },
    inActiveCount () {
      if (!this.licenseData) return 0
      return this.licenseData.modules.length - this.activeCount
    },
    modules () {
      return this.licenseData.modules
    }
  },
  methods: {
    clickDetailModule (module) {
      this.isActiveDetailModal = true
      this.selectedModule = module
    },
    copySerial () {
      // 기존 시리얼 키 복사 기능 제거
      const serial = document.createElement('textarea')
      document.body.appendChild(serial)
      serial.value = this.licenseData.licenseManage.serial
      serial.select()
      document.execCommand('copy')
      document.body.removeChild(serial)
    },
    async downloadLicenseKey () {
      try {
        this.isLoadingDownloadLicenseKey = true

        await API.license.downloadLicenseKey(this.licenseData.licenseManage.serial)

        const LICENSE_MANAGE_URL = process.env.VUE_APP_ZUUL_URL + '/api/cmp/v1/license/manage'
        const url =
          LICENSE_MANAGE_URL +
          '/download?hashKey=' +
          this.licenseData.licenseManage.serial
        const link = document.createElement('a')
        link.href = url
        link.target = '_blank'
        link.click()
      } catch (error) {
        if (error.response && error.response.data) {
          switch (error.response.data.code) {
            case 'LIC012':
              return this.$alert(
                '라이선스가 만료되어 파일을 다운로드 할 수 없습니다.<br>만료일을 수정해주세요.',
                { dangerouslyUseHTMLString: true }
              )
            default:
              return this.$alert('라이선스 키를 다운로드할 수 없습니다.')
          }
        } else {
          this.$alert('라이선스 키를 다운로드할 수 없습니다.')
        }
      } finally {
        this.isLoadingDownloadLicenseKey = false
      }
    }
  },
  data: () => ({
    isActiveDetailModal: false,
    selectedModule: null,
    isLoadingDownloadLicenseKey: false
  })
}
</script>

<style lang="scss" scoped>
.license-detail-modules {
  overflow: hidden;
  flex: 1;

  &__serial {
    padding: $gap;
    border-bottom: 1px solid $purple-gray;

    & .number {
      font-size: 14px;
      display: inline-block;
      white-space: pre-line;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 500px;
    }

    .key-download {
      margin-left: $gap-s;
      position: relative;
      top: -6px;
    }
  }

  &__active {
    display: flex;
    flex-wrap: nowrap;
    margin: $gap 0;

    & > *:first-child {
      margin-right: $gap;

      & .icon {
        background-color: $primary;
      }
    }

    &-item {
      display: flex;
      align-items: center;
      flex: 1 1 50%;
      background-color: $dark-slate;
      border-radius: 6px;
      padding: $gap;

      & .count {
        margin-left: auto;
        font-size: 20px;
      }

      & .icon {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 20px;
        height: 20px;
        margin-right: $gap-s;
        border-radius: 9999px;
        background-color: $main-red;
      }
    }
  }
}
</style>
