<template>
  <div class="cmp-package">
    <g-tab
      v-if="!isLoadingPackageTypeList && !isErrorPackageTypeList"
      :data="tabs"
      @click="moveTab"
    >
      <template
        v-for="tab in tabs"
        v-slot:[tab.field]
      >
        <router-view
          :key="tab.field"
        />
      </template>
    </g-tab>
    <div
      v-else
      v-loading="isLoadingPackageTypeList"
      class="empty-data"
      style="min-height: 800px;"
    >
      {{ $t('common.PLACEHOLDER.noData') }}
    </div>
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'

export default {
  name: 'PackageMain',
  async created () {
    await this.getVersions()
    this.moveToBase()
  },
  watch: {
    '$route.path' (path) {
      this.moveToBase()
    }
  },
  provide () {
    return {
      sharedPackage: this.sharedState
    }
  },
  methods: {
    handleLeaveRouter () {
      this.$router.go(-1)
    },
    async getVersions () {
      try {
        this.isLoadingPackageTypeList = true
        const { data } = await API.license.getPackageTypeList()
        this.sharedState.packageTypeList = data
      } catch (error) {
        this.$alert(this.$t('common.ALERT.LIC.015'))
        this.isErrorPackageTypeList = true
      } finally {
        this.isLoadingPackageTypeList = false
      }
    },
    moveTab (tab) {
      this.$router.push({ name: tab.routeTo })
    },
    moveToBase () {
      const { path } = this.$route
      if (typeof path === 'string' && path.endsWith('/package')) {
        this.$router.push({ name: 'cmp-package-management-license' })
      }
    }
  },
  data: (root) => ({
    isLoadingPackageTypeList: true,
    isErrorPackageTypeList: false,
    tabs: [
      { field: 'license', name: root.$t('bc.ADMIN.PKG.license'), routeTo: 'cmp-package-management-license' },
      { field: 'version', name: root.$t('bc.ADMIN.PKG.version'), routeTo: 'cmp-package-management-version' },
      { field: 'module', name: root.$t('bc.ADMIN.PKG.moduleVersion'), routeTo: 'cmp-package-management-module' }
    ],
    sharedState: {
      packageTypeList: []
    }
  })
}
</script>
