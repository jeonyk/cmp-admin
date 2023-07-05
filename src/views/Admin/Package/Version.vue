<template>
  <section
    v-loading="isLoadingVersionInfo"
    :element-loading-text="$t('common.PLACEHOLDER.loading')"
    class="version"
  >
    <version-grid
      :data="cmpVersion"
      @refresh="getVersionInfo"
    />
  </section>
</template>

<script>
import VersionGrid from '@/components/Package/Version/CmpVersionGrid.vue'
import API from '@sd-fe/cmp-core'

export default {
  name: 'CmpVersion',
  components: { VersionGrid },
  created () {
    this.getVersionInfo()
  },
  methods: {
    async getVersionInfo () {
      this.cmpVersion = []
      try {
        this.isLoadingVersionInfo = true
        const { data } = await API.license.getVersions()
        if (data?.cmpVersion) data.cmpVersion.sort(this.sortVersions)
        this.cmpVersion =
          data?.cmpVersion.map((v, i) => ({
            ...v,
            gIndex: data.cmpVersion.length - i,
            manager: v.adminName + '(' + this.$options.filters.maskingName(v.adminId) + ')',
            createTime: this.$options.filters.dateSimple(
              v.createTime,
              'YYYY-MM-DD'
            )
          })) || []
      } catch (error) {
        console.error(error)
      } finally {
        this.isLoadingVersionInfo = false
      }
    },
    sortVersions (a, b) {
      return b.createTime - a.createTime
    }
  },
  data: () => ({
    isLoadingVersionInfo: true,
    cmpVersion: []
  })
}
</script>
