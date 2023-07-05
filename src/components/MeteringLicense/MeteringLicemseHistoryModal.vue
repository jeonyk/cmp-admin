<template>
  <grid-modal
    :active.sync="visible"
    :title="$v('S/W라이선스 이력')"
    :column-data="columns"
    :table-data="tableData"
    width="90%"
    @close="$emit('close')"
  >
    <template #button>
      <button
        class="button"
        type="is-primary"
        @click="$emit('close')"
      >
        {{ $t('common.BTN.confirm') }}
      </button>
    </template>
  </grid-modal>
</template>

<script>
import API from '@sd-fe/cmp-core'
import GridModal from '@/components/Modal/GridModal/GridModal'

export default {
  name: 'AddMeteringLicenseModal',
  inject: ['categoryKeys'],
  components: {
    'grid-modal': GridModal
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    data: {
      type: Object,
      default: () => {}
    }
  },
  watch: {
    visible (active) {
      if (active) this.getHistory(this.data)
    }
  },
  methods: {
    /**
     * SW 라이선스 이력 조회
     */
    async getHistory ({ categoryIdx, name, osType, osSystem, osVersion, purchaseLicenseType, salesLicenseType, swIdx, version }) {
      try {
        const params = { categoryIdx, name, osType, osSystem, osVersion, purchaseLicenseType, salesLicenseType, swIdx, version }

        const response = await API.metering.getSWLicenseHistory(params)
        this.tableData = response.map((history) => {
          const {
            prevPurchaseQuantity,
            diffPurchaseQuantity,
            purchaseQuantity,
            prevPurchaseAmount,
            diffPurchaseAmount,
            purchaseAmount
          } = history

          const cates = history?.categoryIdxList?.map(idx => this.categoryKeys[idx])
          const categories = cates ? (cates.length > 1 ? `${cates[0]} ${this.$v('외')} ${cates.length - 1}` : cates[0]) : '-'

          return {
            ...history,
            categories, // 카테고리

            prevPurchaseQuantity: prevPurchaseQuantity || 0 + 'EA', // 이전 구매수량
            diffPurchaseQuantity: diffPurchaseQuantity || 0 + 'EA', // 증감된 구매수량
            purchaseQuantity: purchaseQuantity || 0 + 'EA', // 변경된 구매수량
            prevPurchaseAmount: prevPurchaseAmount?.toLocaleString() || 0 + this.$v('원'), // 이전 구매금액
            diffPurchaseAmount: diffPurchaseAmount?.toLocaleString() || 0 + this.$v('원'), // 증감된 구매금액
            purchaseAmount: purchaseAmount?.toLocaleString() || 0 + this.$v('원') // 변경된 구매금액
          }
        })
      } catch (error) {
        console.error('@@ MeteringLicense > getHistory', error)
        this.$alert(this.$v('라이선스 이력을 불러오는데 문제가 발생하였습니다. 다시 시도해주세요.'))
      }
    }
  },
  data: root => ({
    tableData: [],
    columns: [ // 이력조회 컬럼
      { header: root.$v('S/W이름'), binding: 'name' },
      { header: root.$v('S/W버전'), binding: 'version' },
      { header: root.$v('카테고리 '), binding: 'categoryIdx' },
      { header: root.$v('운영체제 유형'), binding: 'osType' },
      { header: root.$v('운영체제 구분'), binding: 'osSystem' },
      { header: root.$v('운영체제버전'), binding: 'osVersion' },
      { header: root.$v('구매 라이선스유형'), binding: 'purchaseLicenseType' },
      { header: root.$v('이전 구매수량'), binding: 'prevPurchaseQuantity' },
      { header: root.$v('증감된 구매수량'), binding: 'diffPurchaseQuantity' },
      { header: root.$v('변경된 구매수량'), binding: 'purchaseQuantity' },
      { header: root.$v('이전 구매금액'), binding: 'prevPurchaseAmount' },
      { header: root.$v('증감된 구매금액'), binding: 'diffPurchaseAmount' },
      { header: root.$v('변경된 구매금액'), binding: 'purchaseAmount' }
    ]
  })
}
</script>

<style lang="scss" scoped>
.modal-body {
  max-height: 800px;
  overflow-y: auto;
}

.filtering-component::v-deep {
  margin: 0 15px 0;
  height: 30px;
  .filter-wrapper {
    margin: 0;
  }
}
</style>
