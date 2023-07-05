<template>
  <section
    v-loading="!isProjectLoaded"
    class="billing-dashboard"
  >
    <filtering-component
      v-loading="isLoadingGetAff"
      :data="affFilters"
      @reset-data="resetFilter"
      @selected="onSelectedFilter"
    />
    <template v-if="isProjectLoaded">
      <compare-chart :group-idx="selectedAff" />
      <yearly-chart :group-idx="selectedAff" />
      <project-bill-grid :group-idx="selectedAff" />
    </template>
  </section>
</template>

<script>
import API, { FilteringComponent } from '@sd-fe/cmp-core'
import CompareChart from '@/components/Billing/AWS/CompareChart.vue'
import YearlyChart from '@/components/Billing/AWS/YearlyChart.vue'
import ProjectBillGrid from '@/components/Billing/AWS/ProjectBillGrid.vue'
import { mapGetters } from 'vuex'

export default {
  name: 'AWSBillingDashboard',
  components: { CompareChart, YearlyChart, ProjectBillGrid, FilteringComponent },
  computed: {
    ...mapGetters({
      isProjectLoaded: 'project/getIsProjectLoaded'
    })
  },
  created () {
    this.getFilteringGroups()
  },
  methods: {
    onSelectedFilter (selected) {
      this.selectedAff = selected.aff
    },
    resetFilter () {
      this.selectedAff = null
    },
    async getFilteringGroups () {
      try {
        this.isLoadingGetAff = true

        const res = await API.iam.getGroupList({
          groupUpper: 0
        })
        this.affFilters[0].selections = this.affFilters[0].selections.concat(res.map(group => ({
          label: group.groupName,
          value: group.groupIdx
        }))).filter(x => x.label !== '공통')
      } catch (error) {
        console.log(error)
        this.$alert('관계사 정보를 불러오지 못했습니다.')
      } finally {
        this.isLoadingGetAff = false
      }
    }
  },
  data: (root) => ({
    isLoadingGetAff: false,
    selectedAff: null,
    affFilters: [
      {
        field: 'aff',
        label: root.$v('관계사 선택'),
        selections: [
          { label: root.$t('main.DASHBOARD.all'), value: undefined }
        ]
      }
    ]
  })
}
</script>
