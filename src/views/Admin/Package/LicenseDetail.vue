<template>
  <div class="license-detail">
    <detail-contents
      v-if="licenseData"
      :license-data="licenseData"
      :versions="sharedPackage.packageTypeList"
      @refresh="initLicenseDetail"
    />
    <detail-modules
      v-if="licenseData"
      :license-data="licenseData"
    />
    <div
      v-if="!licenseData"
      v-loading="!licenseData"
      :element-loading-text="$t('common.PLACEHOLDER.loading')"
      style="width: 100%; height: 800px;"
    />
  </div>
</template>

<script>
import DetailContents from '@/components/Package/License/DetailContents.vue'
import DetailModules from '@/components/Package/License/DetailModules.vue'
import API from '@sd-fe/cmp-core'

export default {
  name: 'LicenseDetail',
  components: {
    DetailContents,
    DetailModules
  },
  provide () {
    const _lic = {}

    Object.defineProperty(_lic, 'data', {
      get: () => this.licenseData,
      enumerable: true
    })

    return {
      _licData: _lic,
      external: false
    }
  },
  inject: ['sharedPackage'],
  async created () {
    await this.initLicenseDetail()
  },
  methods: {
    async initLicenseDetail () {
      await this.initLicenseData()
    },
    async initLicenseData () {
      const licenseIdx = this.$route.params.id

      try {
        const { data } = await API.license.getLicense({ licenseIdx })
        this.licenseData = data
      } catch (error) {
        console.error(error)
        this.$alert(this.$t('common.ALERT.LIC.015'), {
          callback: () => {
            this.$router.push({ name: 'cmp-package-management-license' })
          }
        })
      }
    }
  },
  data: () => ({
    licenseData: null
  })
}
</script>

<style lang="scss" scoped>
.license-detail {
  display: flex;
}
</style>
