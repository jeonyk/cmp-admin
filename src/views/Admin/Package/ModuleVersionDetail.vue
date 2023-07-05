<template>
  <section
    v-loading="isLoadingMVDetail"
    :element-loading-text="$t('common.PLACEHOLDER.loading')"
    class="mv-detail"
  >
    <mv-summary
      v-if="moduleSummaryData"
      :summary="moduleSummaryData"
      @open-edit-dialog="openEditDialog"
    />
    <mv-grid
      :module-data="moduleData"
      @refresh="getMVDetail"
    />
    <edit-module-modal
      :active.sync="isActiveEditDialog"
      :module-data="moduleData"
      @required-refresh="getMVDetail"
      @close="isActiveEditDialog = false"
    />
  </section>
</template>

<script>
import ModuleVersionSummary from '@/components/Package/Module/Summary.vue'
import ModuleVersionDetailGrid from '@/components/Package/Module/DetailGrid.vue'
import EditModuleModal from '@/components/Package/Module/Modal/EditModule.vue'
import API from '@sd-fe/cmp-core'

export default {
  name: 'ModuleVersionDetail',
  components: {
    'mv-summary': ModuleVersionSummary,
    'mv-grid': ModuleVersionDetailGrid,
    EditModuleModal
  },
  async created () {
    await this.getMVDetail()
  },
  methods: {
    async getMVDetail () {
      this.isLoadingMVDetail = true
      try {
        const { data } = await API.license.getDetailModule(this.$route.params.id)
        this.moduleData = data
        this.moduleSummaryData = this.moduleData
      } catch (error) {
        this.$alert(this.$t('common.ALERT.LIC.018'))
        console.log(error)
      } finally {
        this.isLoadingMVDetail = false
      }
    },
    openEditDialog () {
      this.isActiveEditDialog = true
    }
  },
  data: () => ({
    isLoadingMVDetail: true,
    isActiveEditDialog: false,
    moduleData: null,
    moduleSummaryData: null
  })
}
</script>
