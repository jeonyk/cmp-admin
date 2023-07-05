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
    <div class="button-area -right">
      <el-tooltip
        :disabled="(bpDetail ? bpDetail.bpInfo.isPub : false)"
        placement="top"
        effect="light"
      >
        <div slot="content">
          {{ $v('사용자 포탈 노출 제품만 신청 가능합니다.') }}
        </div>
        <div>
          <button
            class="button"
            type="is-primary"
            @click="activeOrderModal = true"
            :disabled="bpDetail ? !bpDetail.bpInfo.isPub : true"
          >
            {{ $v('제품 신청') }}
          </button>
        </div>
      </el-tooltip>
    </div>
    <div class="item-info">
      <marketplace-info
        v-loading="loading.isGetBpInfo"
        :data="bpDetail"
        :update-on-prop="updateBlueprintInfo"
        @update-blueprint-pub="updateBlueprintPub"
        @update-blueprint-info="updateBlueprintInfo"
      />

      <article class="marketplace-detail-arti">
        <h6 class="skip-article-header">
          {{ $v('마켓플레이스 상세') }}
        </h6>

        <g-tab
          :data="marketplaceDetailTab"
        >
          <template #info>
            <marketplace-item-information
              v-loading="loading.isGetBpInfo"
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

    <!-- 제품 신청 모달 -->
    <el-dialog
      :title="$v('제품 신청')"
      :visible.sync="activeOrderModal"
      :before-close="cancelAlert"
      width="1420px"
      top="5vh"
    >
      <nx-compute-update-form
        v-if="activeOrderModal"
        @close="cancelAlert"
        @save="createVM"
        height="calc(70vh - 186px)"
        :market-product-info="bpDetail"
        :user-info="user"
        :loading="loading.isCreate"
        in-admin
      />
    </el-dialog>
    <!-- /자원추가 모달 -->
  </div>
</template>
<script>
import { mapState } from 'vuex'
import API, { NXComputeUpdateForm } from '@sd-fe/cmp-core'
import MarketplaceInfo from '@/components/cmp-components/MarketPlaceInfo'
import GTab from '@/components/common/g-tab/g-tab'
import MarketplaceItemInformation from './MarketplaceItemInformation'
import MarketplaceItemOrder from './MarketplaceItemOrder'

export default {
  name: 'MarketPlaceDetail',
  components: {
    'marketplace-info': MarketplaceInfo,
    'g-tab': GTab,
    'marketplace-item-information': MarketplaceItemInformation,
    'marketplace-item-order': MarketplaceItemOrder,
    'nx-compute-update-form': NXComputeUpdateForm
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
    ...mapState({
      user: state => state.auth.user
    }),
    comBpIdx () {
      return this.$route.params.bpIdx
    }
  },
  async created () {
    await this.getBlueprint()
    await this.setServiceMetadataForm()
  },
  methods: {
    async getBlueprint () {
      try {
        this.loading.isGetBpInfo = true
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
      } catch (error) {
        console.error('Error! Get BP Info: ', error)
      } finally {
        this.loading.isGetBpInfo = false
      }
    },
    async updateBlueprintInfo (payload, alertSkip = false) {
      console.log('@@ updateBlueprintInfo > payload : ', payload)

      if ((!payload.iconImage || !payload.category || !payload.summary || !payload.swIdxList) && payload.isPub) {
        payload.isPub = false
      }

      try {
        await API.market.updateBlueprintInfo(payload)
        // {name}를 변경하였습니다.
        if (!alertSkip) this.$alert(this.$t('common.ALERT.SERVICE.010', { name: payload.displayName }))
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
    },
    // ============= v3.마켓 제품 바로 신청 =============
    /**
     * [취소] 클릭시 발생 이벤트
     */
    cancelAlert () {
      this.$confirm(this.$v('입력하신 내용을 적용하지 않고<br>취소하시겠습니까?'), '', {
        dangerouslyUseHTMLString: true
      }).then(() => { this.activeOrderModal = false })
        .catch(() => false)
    },
    /**
     * 자원 생성
     */
    async createVM (saveData) {
      try {
        this.loading.isCreate = true

        const {
          beforePrice,
          isUrgent,
          price,
          tagInfo,
          ...rest
        } = saveData

        const payload = {
          beforePrice,
          groupIdx: saveData.groupId,
          groupName: saveData.groupName,
          isUrgent: !!isUrgent, // 긴급 여부(긴급 = true, 일반 = false)
          price,
          projectIdx: saveData.projectId,
          requestData: {
            ...rest,
            tagInfo: tagInfo || []
          },
          service: 'MARKET',
          userId: this.user.userId,
          userName: this.user.userName
        }

        this.$confirm(this.$v('자원을 생성하시겠습니까?')).then(async () => {
          const result = await API.work_v3.createNxMarket(payload)
          if (result) {
            this.$alert(`VM 생성 작업이 요청되었습니다.<br>${payload.requestData.hostname}`, { dangerouslyUseHTMLString: true })
            this.activeOrderModal = false
          } else {
            this.$alert(this.$v('생성에 실패하였습니다.<br>관리자 문의 부탁드립니다.'), {
              dangerouslyUseHTMLString: true,
              callback: () => false
            })
          }
        }).catch(() => false)
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('생성에 실패하였습니다.<br>관리자 문의 부탁드립니다.'), {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
      } finally {
        this.loading.isCreate = false
      }
    },

    // ======= 메타데이터 관련
    /**
     * 활성화 서비스에 해당하는 MARKET 메타데이터 폼을 조회합니다.
     */
    setServiceMetadataForm (to = this.$router.history.current.path) {
      this.$store.dispatch('metadata/getMetaDataForm', {
        csp: 'NUTANIX',
        service: 'MARKET'
      })
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
      ],
      // ============= v3.마켓 제품 바로 신청 =============
      activeOrderModal: false,
      loading: {
        isGetBpInfo: false,
        isCreate: false
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.marketplace-detail {
  .item-info { margin-top: $gap; }
  .marketplace-detail-arti {
    margin-top: 35px;
  }
}
</style>
