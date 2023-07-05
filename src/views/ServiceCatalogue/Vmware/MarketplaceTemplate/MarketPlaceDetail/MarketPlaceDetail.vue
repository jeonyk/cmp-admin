<!--
  * 파일명 : MarketPlaceDetail.vue
  * 파일 기능 : 서비스 카탈로그 > 마켓플레이스 제품 상세 페이지 (제품 상세 + 서비스 정보)
  * 작성자 : 이경환 외 4명
  * 최종 작성일 : 2021-02-19
  * License By Shinsegae I&C
  * 2021-02-19 fix: 접근불가능 페이지 접근 후 > 뒤로가기시 이동 불가능 버그 수정
 -->

<template>
  <div class="marketplace-detail">
    <div class="item-info">
      <marketplace-info
        v-if="bpDetail"
        :data="bpDetail"
        :update-on-prop="updateBlueprintInfo"
        @update-blueprint-pub="updateBlueprintPub"
        @update-blueprint-info="updateBlueprintInfo"
      />

      <article class="marketplace-detail-arti">
        <h6 class="skip-article-header">
          마켓플레이스 상세
        </h6>

        <g-tab
          :data="marketplaceDetailTab"
        >
          <template #info>
            <marketplace-item-information
              :bp-info="bpDetail"
              @update-blueprint-desc="updateBlueprintDesc"
              @refresh="getBlueprint"
            />
          </template>
          <!-- 서비스 정보  -->

          <template #prop>
            <marketplace-item-order />
          </template>
          <!-- 제품 신청 -->
        </g-tab>
      </article>
    </div>
  </div>
</template>
<script>
import MarketplaceInfo from '@/components/cmp-components/MarketPlaceInfo'
import GTab from '@/components/common/g-tab/g-tab'
import MarketplaceItemInformation from './MarketplaceItemInformation'
import MarketplaceItemOrder from './MarketplaceItemOrder'
import API from '@sd-fe/cmp-core'

export default {
  name: 'MarketPlaceDetail',
  components: {
    'marketplace-info': MarketplaceInfo,
    'g-tab': GTab,
    'marketplace-item-information': MarketplaceItemInformation,
    'marketplace-item-order': MarketplaceItemOrder
  },
  watch: {
    data (newVal) { return newVal },
    'bpDetail.bpName' (newVal, old) {
      if (newVal !== old) {
        this.$store.commit('common/ADD_PARAMETERS', {
          label: this.bpDetail.bpName ? this.bpDetail.bpName : this.$t('bc.SC.mpDetail'),
          path: ''
        })
      }
    }
  },
  computed: {
    comBpIdx () {
      return this.$route.params.bpIdx
    }
  },
  async created () {
    await this.getBlueprint()
  },
  methods: {
    async getBlueprint () {
      const response = await API.market.getBlueprint(this.comBpIdx)
      const result = { ...response }
      console.log('@@ getBlueprint :', result)

      if (response.error || !Object.keys(response).length) {
        const code = response.status || 400
        this.$router.replace({ name: 'not-found-status', params: { code } })
      }
      if (result.bpImg?.osName) result.osInfo = `${result.bpImg?.osType} ${result.bpImg?.osName} ${result.bpImg?.osBit}`
      this.bpDetail = result
      this.bpSvcInfos = result.bpSvcInfos
    },
    async updateBlueprintInfo (payload) {
      console.log('@@ updateBlueprintInfo > payload : ', payload)
      try {
        await API.market.updateBlueprintInfo(payload)
        // {name}를 변경하였습니다.
        this.$alert(this.$t('common.ALERT.SERVICE.010', { name: payload.displayName }))
        this.getBlueprint(payload.bpIdx)
      } catch (error) {
        // 변경에 실패하였습니다.
        this.$alert(this.$t('common.ALERT.SERVICE.008', { name: payload.displayName }))
        throw error
      }
    },
    async updateBlueprintDesc (payload, idx) {
      console.log('@@ updateBlueprintDesc > payload : ', payload)
      const res = await API.market.updateMarketTemplate(payload, idx)
      if (res) {
        // 제품 정보를 변경하였습니다.
        this.$alert(this.$t('common.ALERT.SERVICE.004'))
        this.getBlueprint()
      } else {
        // 제품 정보 변경에 실패하였습니다.
        this.$alert(this.$t('common.ALERT.SERVICE.001'))
      }
    },
    async updateBlueprintPub (payload) {
      const response = await API.market.updateBlueprintPub(payload)
      if (response.status === 200) {
        if (response.data) {
          this.getBlueprint(payload.bpIdx)
        } else {
          // 사용자 화면 등록에 실패하였습니다.
          this.$alert(this.$t('common.ALERT.SERVICE.016'))
        }
      } else {
        this.$alert(response.data.message)
      }
    }
  },
  data () {
    return {
      bpDetail: undefined,
      categoryOptions: [],
      descTypeOptions: [],
      data: null,
      marketplaceDetailTab: [
        { field: 'info', name: '제품 정보', isActive: true, keyPath: 'service.productInfo' }
        // { field: 'prop', name: '제품 신청' }
      ],
      bpSvcInfos: [
        {
          code: 'INFO',
          list: [
            { descKey: 'ID', descDisplayName: 'ID', isDefault: true, descValue: 'jeus' },
            { descKey: 'NAME', descDisplayName: '이름', isDefault: true, descValue: 'JEUS7-RHEL7' },
            { descKey: 'versionDt', descDisplayName: '버전', isDefault: false, descValue: 'Ver jeus-7.0' }
          ]
        },
        {
          code: 'PERFORMANCE',
          list: [
            { descKey: 'ID', descDisplayName: 'ID', isDefault: true, descValue: 'jeus' },
            { descKey: 'NAME', descDisplayName: '이름', isDefault: true, descValue: 'JEUS7-RHEL7' },
            { descKey: 'versionDt', descDisplayName: '버전', isDefault: false, descValue: 'Ver jeus-7.0' }
          ]
        }
      ]
    }
  }
}
</script>
<style lang="scss">
.marketplace-detail {
  .marketplace-detail-arti {
    margin-top: 35px;
    .tab-contents-area {
      padding-top: $gap;
    }
  }
}
</style>
