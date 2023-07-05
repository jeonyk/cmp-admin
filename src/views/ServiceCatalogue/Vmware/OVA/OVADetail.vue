<template>
  <div
    v-loading="isLoadingDetailData"
    class="ova-detail"
    style="min-height: 700px;"
  >
    <div
      v-if="!isLoadingDetailData && detailData"
    >
      <market-place-info
        v-loading="isInfoUpdating"
        :data="detailData"
        :update-on-prop="updateFn"
        is-ova
        @update-blueprint-info="updateOVAInfo"
      />
      <g-tab
        :data="ovaTableTab"
        class="tab"
      >
        <template #info>
          <market-table
            :bp-info="detailData"
            @update-blueprint-desc="updateTable"
            is-ova
          />
        </template>
      </g-tab>
    </div>
  </div>
</template>

<script>
import MarketPlaceInfo from '@/components/cmp-components/MarketPlaceInfo.vue'
import MarketTable from '../MarketplaceTemplate/MarketPlaceDetail/MarketplaceItemInformation.vue'
import API from '@sd-fe/cmp-core'

export default {
  components: {
    MarketPlaceInfo,
    'market-table': MarketTable
  },
  created () {
    this.setInitDetailData()
  },
  methods: {
    async setInitDetailData () {
      try {
        this.isLoadingDetailData = true
        const { data } = await API.compute.getDetailOVA(this.$route.params.uuid)
        this.detailData = data
      } catch (error) {} finally {
        this.isLoadingDetailData = false
      }
    },
    async updateTable (payload, uuid) {
      try {
        const { data: added } = await API.compute.addDescOVA(uuid, payload)
        if (!added) throw added
        this.$alert(this.$t('common.ALERT.BASE.043'), { callback: () => this.setInitDetailData() })
      } catch (error) {
        this.$alert(this.$t('common.ALERT.LOGGING.005'), { dangerouslyUseHTMLString: true })
      }
    },
    updateFn (payload) {
      this.updateOVAInfo(payload)
    },
    async updateOVAInfo (payload) {
      try {
        this.isInfoUpdating = true
        await API.compute.updateOVA(this.detailData.ovaUuid, payload)
        this.$alert(this.$t('common.ALERT.BASE.043'), { callback: () => this.setInitDetailData() })
      } catch (error) {
        console.log(error)
        this.$alert(this.$t('common.ALERT.LOGGING.005'), { dangerouslyUseHTMLString: true })
      } finally {
        this.isInfoUpdating = false
      }
    }
  },
  data: () => ({
    isLoadingDetailData: true,
    isInfoUpdating: false,
    detailData: null,
    ovaTableTab: [
      { field: 'info', name: '제품 정보', isActive: true, keyPath: 'service.productInfo' }
    ]
  })
}
</script>

<style lang="scss" scoped>
.ova-detail {
  .tab {
    margin-top: $gap-m;
  }
}
</style>
