<template>
  <section
    class="module-version"
    v-loading="isLoadingModuleInfo"
    :element-loading-text="$t('common.PLACEHOLDER.loading')"
  >
    <module-version-grid
      v-if="!isLoadingModuleInfo"
      :data="versionData"
      @open-new-modal="openNewModal"
      @refresh="getModuleInfo"
    />
    <edit-module-modal
      :active="isActiveNewModuleModal"
      create-mode
      @close="isActiveNewModuleModal = false"
      @required-refresh="getModuleInfo"
    />
  </section>
</template>

<script>
import ModuleVersionGrid from '@/components/Package/Module/ModuleVersionGrid.vue'
import EditModuleModal from '@/components/Package/Module/Modal/EditModule.vue'
import API from '@sd-fe/cmp-core'

export default {
  name: 'ModuleVersion',
  components: { ModuleVersionGrid, EditModuleModal },
  created () {
    this.getModuleInfo()
  },
  methods: {
    async getModuleInfo () {
      this.isLoadingModuleInfo = true
      try {
        const { data } = await API.license.getModuleList()
        this.versionData = data.map(d => ({
          ...d,
          updateTime: this.$options.filters.dateSimple(d.updateTime, 'YYYY-MM-DD'),
          createTime: this.$options.filters.dateSimple(d.createTime, 'YYYY-MM-DD')
        }))
      } catch (error) {
        this.$alert(this.$t('common.ALERT.LIC.017'))
      } finally {
        this.isLoadingModuleInfo = false
      }
    },
    openNewModal () {
      this.isActiveNewModuleModal = true
    }
  },
  data: () => ({
    isLoadingModuleInfo: true,
    versionData: [],
    isActiveNewModuleModal: false
  })
}
</script>
