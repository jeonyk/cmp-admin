<!-- 자원 상세 모달 (단건) -->

<template>
  <el-dialog
    :title="title"
    :visible="active"
    @close="$emit('close')"
    width="880px"
    top="100px"
  >
    <div
      v-if="resource"
      class="detail-resource"
    >
      <cmp-grid
        :columns="columns[resourceType]"
        :item-source="[{ ...resource }]"
        id="detail-resource-top-grid"
      />
      <detail-grid
        :columns="detailColumns"
        :edit-columns="editColumns"
        :resource="resource"
        :resource-type="resourceType"
        :bill-units="billUnits"
        :is-edit="isEdit"
        @apply="receiveAllData"
        ref="detailGrid"
      />
    </div>
    <section class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="$emit('close')"
      >
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        v-if="!activeModel.confirm && !resourceIsNetwork"
        class="button"
        type="is-default"
        @click="deleteResource"
      >
        {{ $t('common.BTN.delete') }}
      </button>
      <button
        v-if="!isEdit && !activeModel.confirm && !resourceIsNetwork"
        class="button"
        type="is-primary"
        @click="isEdit = true"
      >
        {{ $t('common.BTN.modify') }}
      </button>
      <button
        v-if="isEdit"
        class="button"
        type="is-primary"
        @click="applyResource"
      >
        {{ $t('common.BTN.apply') }}
      </button>
    </section>
  </el-dialog>
</template>

<script>
import { columns, detailColumns, editColumns } from './DetailResource.columns'
import DetailGrid from './DetailGrid.vue'
import { cloneDeep } from 'lodash'
import API from '@sd-fe/cmp-core'

export default {
  components: { DetailGrid },
  props: {
    active: {
      type: Boolean,
      required: true
    },
    // 자원 종류
    resourceType: {
      type: String,
      required: true,
      validator (value) {
        return [
          'hardware',
          'software',
          'l4',
          'l7',
          'firewall',
          'custom',
          'fixed-compute',
          'nas'
        ].includes(value)
      }
    },
    // 선택한 데이터
    resource: {
      type: Object,
      required: false,
      default: null
    },
    // 활성화된 모델 그룹
    activeModel: {
      type: Object,
      required: true
    },
    billUnits: {
      type: Array,
      default: () => ([])
    }
  },
  computed: {
    resourceIsNetwork () {
      return ['l4', 'l7', 'firewall'].includes(this.resourceType)
    },
    title () {
      switch (this.resourceType) {
        case 'hardware':
        case 'software':
          return this.isEdit
            ? this.$t('bill.MODEL.update', {
              update: this.$t('bill.MODEL.' + this.resourceType)
            })
            : this.$t('bill.MODEL.detail', {
              detail: this.$t('bill.MODEL.' + this.resourceType)
            })
        case 'firewall':
          return this.isEdit
            ? this.$t('bill.MODEL.update', { update: 'Firewall' })
            : this.$t('bill.MODEL.detail', { detail: 'Firewall' })
        case 'custom':
          return this.isEdit
            ? this.$t('bill.MODEL.update', { update: this.$v('Custom 요금') })
            : this.$t('bill.MODEL.detail', { detail: this.$v('Custom 요금') })
        case 'l4':
        case 'l7':
        default:
          return this.isEdit
            ? this.$t('bill.MODEL.update', {
              update: this.resourceType.toUpperCase()
            })
            : this.$t('bill.MODEL.detail', {
              detail: this.resourceType.toUpperCase()
            })
      }
    }
  },
  watch: {
    active (visible) {
      if (!visible) {
        this.isEdit = false
      }
    }
  },
  methods: {
    deleteResource () {
      this.$confirm(this.$t('common.CONFIRM.BASE.020'))
        .then(async () => {
          try {
            await API.billing.deleteServices(this.resource.id)
            this.$alert(this.$t('common.ALERT.BASE.017')) // 삭제하였습니다.
            this.$emit('close', true)
            this.$emit('deleted')
          } catch (error) {
            this.$alert(this.$t('common.ALERT.BASE.016')) // 삭제에 실패했습니다..
          }
        })
        .catch(() => false)
    },
    applyResource () {
      this.$confirm(this.$t('common.CONFIRM.BASE.024')) // 해당 내용으로 수정하시겠습니까?
        .then(() => {
          this.$refs.detailGrid.emitAllData()
        })
        .catch(() => false)
    },
    validateService (service) {
      if (service.fares && service.fares.length) {
        if (service.chargeType === 1) {
          return service.fares[0].cost >= 0 && service.fares[0].standard > 0
        } else {
          return service.fares.every(fare => fare.cost >= 0 && fare.lowestLimit !== 0 && fare.upperLimit !== 0)
        }
      }
      return true
    },
    receiveAllData (data) {
      const cloneService = cloneDeep(this.resource)
      ;['scopeIdx', 'scopeLength', 'index'].forEach(key => {
        delete cloneService[key]
      })
      cloneService.fares = data.scope
      cloneService.note = data.note
      cloneService.chargeType = data.system
      cloneService.chargeUnit = data.unit
      if (this.validateService(cloneService)) {
        return this.updateService(cloneService)
      } else {
        return this.$alert(this.$t('common.ALERT.BILL.042'), { dangerouslyUseHTMLString: true })
      }
    },
    async updateService (service) {
      try {
        await API.billing.updateServices(service)
        this.$emit('update')
        this.$alert(this.$t('common.ALERT.BASE.053')) // 수정하였습니다.
      } catch (error) {
        this.$alert(this.$t('common.ALERT.BASE.021')) // 업데이트 실패
      }
    }
  },
  data: root => ({
    columns: columns(root),
    detailColumns: detailColumns(root),
    editColumns: editColumns(root),
    isEdit: false
  })
}
</script>

<style lang="scss" scoped>
#detail-resource-top-grid {
  &::v-deep .wj-cell {
    border: none !important;
  }
}

.detail-resource {
  padding-bottom: 20px;
}
</style>
