<template>
  <div class="detail-grid">
    <div class="detail-grid-item">
      <div class="detail-grid-item__title">
        {{ $t("bill.MODEL.quota") }}
      </div>
      <div
        class="detail-grid-wrapper"
        :class="isEdit ? 'is-edit' : ''"
      >
        <cmp-grid
          v-if="!isEdit"
          :columns="columns"
          :item-source="[gridData[0]]"
          :init-custom-action="infoGridInit"
          key="detail-grid"
          grid-id="no-edit-detail-grid"
          class="no-edit-detail-grid"
        >
          <template #chargeUnit>
            {{ resourceChartUnitLabel }}
          </template>
          <template #fares="{ row }">
            <span v-if="row.chargeType === 1">
              {{ row.scope.standard }}
            </span>
            <!-- <span v-else>
              {{ row.scope.lowestLimit }} ~ {{ row.scope.upperLimit }}
            </span> -->
            <span v-else>
              <div
                v-for="(fare, index) in row.fares"
                :key="fare.id + getUuid()"
              >
                <div
                  v-if="row.chargeType === 2"
                  :class="[
                    index === 0 && row.fares.length > 1 && 'range-first',
                    index === row.fares.length - 1 && 'range-end',
                    index !== 0 &&
                      index !== row.fares.length - 1 &&
                      'range-middle'
                  ]"
                >
                  {{ fare.lowestLimit }} ~ {{ fare.upperLimit }}
                </div>
                <div v-else>
                  {{ fare.standard }}
                </div>
              </div>
            </span>
          </template>
          <template #billingPrice="{ row }">
            <!-- <span>&#8361; {{ row.scope.cost | moneyFormat }}</span> -->
            <div
              v-for="(fare, index) in row.fares"
              :key="fare.id + getUuid()"
            >
              <div
                v-if="row.chargeType === 2"
                :class="[
                  index === 0 && row.fares.length > 1 && 'range-first',
                  index === row.fares.length - 1 && 'range-end',
                  index !== 0 &&
                    index !== row.fares.length - 1 &&
                    'range-middle'
                ]"
              >
                &#8361; {{ fare.cost | priceFilter }}
              </div>
              <div v-else>
                &#8361; {{ fare.cost | priceFilter }}
              </div>
            </div>
          </template>
        </cmp-grid>
        <!-- 상세 모드 -->
        <cmp-grid
          v-else
          grid-id="detail-grid-edit"
          cell-merge
          :columns="gridEditColumns"
          :item-source="editGridData"
          :init-custom-action="gridInit"
          :class="fixedBill ? 'fixed-bill-grid' : ''"
          key="edit-grid"
        >
          <template #system="{ row }">
            <span
              v-if="!row.isDescription"
              style="padding: 0 5px;"
            >
              <el-radio-group
                v-model="ownEditData.system"
                class="edit-system-group"
                @change="v => onChangeSystem(v, row.scopeIdx)"
              >
                <el-radio
                  :label="1"
                  class="fixed-radio"
                >
                  {{ $t("bill.MODEL.fixed") }}
                </el-radio>
                <el-radio
                  :label="2"
                  class="custom-radio"
                >
                  {{ $t("bill.MODEL.variable") }}
                </el-radio>
              </el-radio-group>
            </span>
          </template>
          <template #unit="{ row }">
            <span v-if="!row.isDescription">
              <el-select
                v-model="ownEditData.unit"
                popper-class="unit-dropdown"
              >
                <el-option
                  v-for="unit in unitOptions"
                  :key="unit.name"
                  :value="unit.field"
                  :label="unit.label"
                />
              </el-select>
            </span>
          </template>
          <template #fares="{ row }">
            <div v-if="row.isDescription">
              <span class="scope-description">
                <p v-html="$t('bill.MODEL.PLACEHOLDER.scopeTop')" />
                <p v-html="$t('bill.MODEL.PLACEHOLDER.scopeBottom')" />
              </span>
            </div>
            <div v-else>
              <div
                v-for="(fare, index) in row.fares"
                :key="fare.id + getUuid()"
                :class="[
                  row.fares.length > 1 && index === 0 && 'range-first',
                  index === row.fares.length - 1 && 'range-end',
                  index !== 0 &&
                    index !== row.fares.length - 1 &&
                    'range-middle'
                ]"
              >
                <span v-if="ownEditData.system === 1">
                  <el-input-number
                    v-model="ownEditData.scope[0].standard"
                    class="scope start billing"
                    :min="1"
                    :step="1"
                  />
                </span>
                <!-- 고정 과금 -->
                <span v-else>
                  <el-input-number
                    v-if="ownEditData.scope[index]"
                    v-model="ownEditData.scope[index].lowestLimit"
                    class="scope start billing"
                    :min="handleStartScopeMin(ownEditData.scope, index) || 1"
                    :max="handleStartScopeMax(ownEditData.scope, index)"
                    @change="
                      (cur, old) =>
                        changeBillingScope(cur, old, ownEditData.scope[index])
                    "
                  />
                  <span style="margin: 0 5px;">~</span>
                  <el-input-number
                    v-if="ownEditData.system === 2 && ownEditData.scope[index]"
                    v-model="ownEditData.scope[index].upperLimit"
                    class="scope end billing"
                    :min="handleEndScopeMin(ownEditData.scope, index) || 1"
                    :max="handleEndScopeMax(ownEditData.scope, index)"
                  />
                  <!-- :min="ownEditData.scope[row.scopeIdx].lowestLimit" -->
                  <!-- 변동 과금 -->
                </span>
              </div>
            </div>
          </template>
          <template #price="{ row }">
            <span v-if="!row.isDescription">
              <div
                v-for="(fare, index) in row.fares"
                :key="fare.id + getUuid()"
                :class="[
                  row.fares.length > 1 && index === 0 && 'range-first',
                  index === row.fares.length - 1 && 'range-end',
                  index !== 0 &&
                    index !== row.fares.length - 1 &&
                    'range-middle'
                ]"
                style="padding: 10px 10px;"
              >
                <el-input-number
                  v-if="ownEditData.scope[index]"
                  v-model="ownEditData.scope[index].cost"
                  class="price billing"
                  :step="10"
                  :min="0"
                  :max="100000000"
                  thousands-sep=","
                />
                <span
                  v-if="ownEditData.system === 2"
                  class="button-wrap"
                >
                  <button
                    v-if="ownEditData && row.fares.length !== 1"
                    type="is-icon"
                    class="button model-delete"
                    @click="deleteBillingScope(row, index)"
                  >
                    <i class="delete-icon" />
                  </button>
                  <button
                    v-if="index === row.fares.length - 1"
                    type="is-icon"
                    class="button model-add"
                    @click="addBillingScope(row)"
                    style="color: #9596A0;"
                  >
                    <i class="el-icon el-icon-circle-plus-outline" />
                  </button>
                </span>
              </div>
            </span>
          </template>
        </cmp-grid>
        <div
          v-if="isEdit && ownEditData.system === 2"
          class="desc-wrapper"
        >
          <span class="scope-description">
            <p v-html="$t('bill.MODEL.PLACEHOLDER.scopeTop')" />
            <p v-html="$t('bill.MODEL.PLACEHOLDER.scopeBottom')" />
          </span>
        </div>
        <!-- 수정 모드 -->
      </div>
    </div>
    <div class="detail-grid-item bottom">
      <div class="detail-grid-item__title">
        {{ $t("common.PLACEHOLDER.remark") }}
      </div>
      <div
        v-if="!isEdit"
        class="detail-grid-item__inner"
      >
        {{ resource.note }}
      </div>
      <div
        v-else
        class="detail-grid-item__edit"
      >
        <el-input
          v-model="ownEditData.note"
          type="textarea"
          class="note-textarea"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { cloneDeep, uniqueId } from 'lodash'

export default {
  props: {
    columns: {
      type: Array,
      required: true
    },
    editColumns: {
      type: Object,
      required: true
    },
    resource: {
      type: Object,
      required: true
    },
    resourceType: {
      type: String,
      required: true
    },
    isEdit: {
      type: Boolean,
      required: true
    },
    billUnits: {
      type: Array,
      default: () => ([])
    }
  },
  filters: {
    priceFilter (price) {
      return price.toLocaleString()
    }
  },
  computed: {
    resourceChartUnitLabel () {
      if (this.billUnits.length && this.resource.chargeUnit) {
        return this.billUnits.find(unit => unit.field === this.resource.chargeUnit)?.label || ''
      }
      return ''
    },
    fixedBill () {
      return ['l7', 'l4', 'firewall'].includes(this.resourceType)
    },
    gridData () {
      const sources = []

      this.resource.fares.forEach((item, index) => {
        sources.push({
          ...this.resource,
          scope: this.resource.fares[index],
          scopeIdx: index
        })
      })

      return sources
    },
    editGridData () {
      return this.ownEditData.system !== 1
        ? [this.editData[0]]
        : [this.editData[0]]
    },
    gridEditColumns () {
      switch (this.resourceType) {
        case 'hardware':
        case 'software':
          return this.editColumns.four
        case 'l4':
        case 'l7':
        case 'firewall':
        default:
          return this.editColumns.three
      }
    }
  },
  watch: {
    isEdit (edit) {
      if (edit) {
        this.editData = cloneDeep(this.gridData)
        this.ownEditData.system = this.resource.chargeType
        this.ownEditData.unit = this.resource.chargeUnit
        this.ownEditData.scope = cloneDeep(
          this.resource.fares
        ).map((fare, index) => ({ ...fare, scopeIdx: index }))
        this.ownEditData.note = this.resource.note
        this.lazyUpdateGridRows()
      }
    }
  },
  methods: {
    getUuid () {
      return uniqueId()
    },
    gridInit (grid) {
      this.grid = grid
    },
    infoGridInit (grid) {
      grid.loadedRows.addHandler(() => {
        grid.rows.forEach((row, index) => {
          if (grid.rows[index].dataItem.fares.length === 1) {
            this.$nextTick(() => {
              row.height = 42
            })
          } else {
            this.$nextTick(() => {
              row.height =
                row.dataItem.fares.length * 40 -
                (row.dataItem.fares.length > 5 ? 30 : 10)
            })
          }
        })
      })
    },
    /**
     * 범위 시작 값 및 최대 값 제한
     * 1 ~ 2 D (3 이상으로 올라가기 불가능)
     * 3 ~ 4 D (2 미만으로 내려가기 불가능)
     * 5 ~ 6 D (삭제 시 아래 값이 이전 값(최소, 최대)보다 1 큰 범위로 변경)
     * 7 ~ 8 D +
     */
    handleStartScopeMin (scope, idx) {
      // 최소 범위일 경우 1
      if (idx === 0) return 1
      return scope[idx - 1]?.upperLimit
    },
    handleStartScopeMax (scope, idx) {
      if (idx + 1 >= scope.length) {
        if (idx + 1 > scope.length) return Infinity
        if (idx + 1 === scope.length) return scope[idx - 1]?.upperLimit + 1
      }
      if (
        idx - 1 >= 0 &&
        scope[idx].lowestLimit - scope[idx - 1].upperLimit > 1
      ) {
        return scope[idx - 1].upperLimit + 1
      }
      if (scope[idx].lowestLimit - scope[idx + 1].upperLimit > 1) {
        return scope[idx].lowestLimit
      }
      if (scope[idx].upperLimit + 1 >= scope[idx + 1].lowestLimit) {
        return scope[idx + 1].lowestLimit - 1
      }
    },
    handleEndScopeMin (scope, idx) {
      if (
        !(idx + 1 >= scope.length) &&
        scope[idx + 1].lowestLimit - scope[idx].upperLimit >= 1
      ) {
        return scope[idx + 1].lowestLimit - 1
      }
      return scope[idx].lowestLimit
    },
    handleEndScopeMax (scope, idx) {
      if (idx + 1 >= scope.length) return Infinity
      return scope[idx + 1].lowestLimit
    },
    updateBillingScope (scope = this.ownEditData.scope, isEnd) {
      if (isEnd) return // 배열의 양 끝에서 삭제가 일어날 경우

      scope.forEach((item, index) => {
        if (index === 0) return // 첫 데이터가 기준이므로 패스

        const validate = (pre, cur) => {
          if (cur.lowestLimit - pre.upperLimit > 1) return false
          return true
        }

        if (!validate(scope[index - 1], item)) {
          item.lowestLimit = scope[index - 1].upperLimit + 1
        }
      })
    },
    /**
     * 기댓값: [[1, 2], [3, 4], [5, 6], [7, 8]] - true
     * 기댓값: [[1, 2], [2, 6], [8, 11]] - false
     */
    validateAllBillingScope (scopeArray) {
      if (this.ownEditData.system === 1) return true // 고정 과금
      const fares = scopeArray.map(fare => [fare.lowestLimit, fare.upperLimit])
      const validate = pairs =>
        pairs
          .slice(0, pairs.length - 1)
          .every((pair, index) => pairs[index + 1][0] - pair[1] < 2)
      return validate(fares)
    },
    changeBillingScope (cur, old, scope) {
      if (cur > old) {
        scope.upperLimit++
      } else {
        scope.upperLimit--
      }
    },
    emitAllData () {
      if (this.validateAllBillingScope(this.ownEditData.scope)) {
        this.$emit('apply', this.ownEditData)
      } else {
        this.$alert(this.$t('common.ALERT.BILL.042'), { dangerouslyUseHTMLString: true }) // 기준 범위 또는 과금 단가를<br>입력해주세요.
      }
    },
    addDescRow () {
      this.mergeRowIdx = this.editData[this.editData.length - 1].index + 1
      if (this.grid && !this.grid.refreshed.handlerCount) {
        this.grid.refreshed.addHandler(() => {
          if (this.ownEditData.system !== 1) {
            this.grid.rows[this.mergeRowIdx].allowMerging = true
            this.grid.rows[this.mergeRowIdx].defaultSize = 40
          }
        })
      }
      this.lazyUpdateGridRows()
      return {
        ...cloneDeep(this.editData[0]),
        isDescription: true, // 구분자
        scope: 'Description', // merge
        price: 'Description', // merge
        system: 'Description',
        unit: 'Description'
      }
    },
    lazyUpdateGridRows () {
      if (this.fixedBill) return
      if (this.grid) {
        setTimeout(() => this.grid.autoSizeRows(), 50)
      }
    },
    syncEditData () {
      this.editData.forEach((data, i) => {
        data.scopeLength = this.editData.length
        data.scopeIdx = i
        // data.billingPrice.idx = i
      })
      this.syncOwnEditData()
    },
    syncOwnEditData () {
      this.ownEditData.scope.forEach((d, i) => (d.scopeIdx = i))
      // this.ownEditData.scope.forEach((d, i) => (d.idx = i))
      // this.ownEditData.price.forEach((d, i) => (d.idx = i))
    },
    addBillingScope (row) {
      const end = this.ownEditData.scope[this.ownEditData.scope.length - 1]
      const scope = {
        ...end,
        lowestLimit: end.upperLimit + 1,
        upperLimit: end.upperLimit + 1,
        scopeIdx: end.scopeIdx + 1
      }
      delete scope.id
      this.ownEditData.scope.push(scope)
      this.editData[0].fares.push(scope)
      // this.editData.push({ ...row, scope: scope })
      // row.fares.push({ ...row, scope })
      // row.fares.push({ ...row.fares[row.fares.length - 1] })
      this.syncEditData()
      this.lazyUpdateGridRows()
    },
    deleteBillingScope (row, idx) {
      const isEnd = idx === this.ownEditData.scope.length - 1 || idx === 0
      this.ownEditData.scope.splice(idx, 1)
      row.fares.splice(idx, 1)
      this.updateBillingScope(this.ownEditData.scope, isEnd)
      this.syncEditData()
      this.lazyUpdateGridRows()
    },
    onChangeSystem (radioValue, scopeIdx) {
      if (radioValue === 1) {
        // 고정 과금
        this.tempFares = cloneDeep(this.ownEditData.scope)
        this.editGridData[0].fares.splice(
          1,
          this.editGridData[0].fares.length - 1
        )
        this.ownEditData.scope.splice(1, this.ownEditData.scope.length - 1)
      } else {
        // 변동 과금 (따로 처리가 필요한가)
        if (this.tempFares && this.tempFares.length) {
          this.ownEditData.scope = [...this.tempFares]
          this.editGridData[0].fares = [...this.tempFares]
        }
        this.tempFares = []
      }
      this.syncEditData()
      this.lazyUpdateGridRows()
    }
  },
  data: () => ({
    tempFares: [],
    mergeRowIdx: 0,
    grid: null,
    ownEditData: {
      system: '',
      unit: '',
      scope: [],
      note: ''
    },
    editData: [],
    chargeTyeps: [
      {
        value: 1,
        label: '고정 과금'
      },
      {
        value: 2,
        label: '변동 과금'
      }
    ],
    // 추후에 백엔드 API랑 연동 (enum)
    unitOptions: [
      {
        name: 'VCORE',
        field: 'vCore',
        label: 'vCore'
      },
      {
        name: 'CORE',
        field: 'Core',
        label: 'Core'
      },
      {
        name: 'OS',
        field: 'OS',
        label: 'OS'
      },
      {
        name: 'GB',
        field: 'GB',
        label: 'GB'
      },
      {
        name: 'GPU',
        field: 'GPU',
        label: 'GPU'
      },
      {
        name: 'SLICE_GPU',
        field: 'Slice GPU',
        label: 'Slice GPU'
      }
    ]
  })
}
</script>

<style lang="scss">
#detail-grid-edit {
  max-height: 500px;

  .wj-cells .wj-cell[role="gridcell"] {
    padding: $gap-s;
    border-bottom: none;
  }

  div.scope.el-input-number {
    min-width: 100px !important;
    width: 100px !important;

    & .el-input {
      width: 100px;
    }
  }
}

#no-edit-detail-grid,
#detail-grid-edit {
  & .range-first,
  & .range-middle {
    border-bottom: 1px dashed $main-black;
  }

  & .range-first,
  & .range-middle,
  & .range-end {
    padding: $gap-s 0;
  }

  & .wj-cell.cell-scope,
  & .wj-cell.cell-price {
    padding: 0 !important;
  }
}

#no-edit-detail-grid {
  .wj-cell {
    border: none;
  }
}
</style>

<style lang="scss" scoped>
.fixed-bill-grid {
  &::v-deep {
    & .wj-cell {
      text-align: center !important;
      justify-content: center !important;
    }
    & .el-select {
      max-width: 110px;
    }
  }
}

.no-edit-detail-grid {
  border-bottom: 1px solid $dark-slate;
}

@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-grid {
  & .edit-system-group {
    justify-content: center;
    flex-wrap: wrap;

    & .fixed-radio {
      margin-bottom: $gap-s;
    }

    & .custom-radio {
      margin-right: $gap-s;
    }
  }

  &-wrapper {
    width: 100%;
    overflow-x: hidden;

    &.is-edit {
      padding-bottom: 1px;
      border-bottom: 1px solid $border2A;
    }

    &::v-deep .cmp-grid-inner {
      overflow-y: auto;
    }
  }

  &-item {
    display: flex;
    flex-wrap: nowrap;

    &.bottom {
      height: 130px;

      & .detail-grid-item__inner {
        color: $light-gray;
        padding: $gap-s;
        white-space: pre-line;
        width: 100%;
        overflow-y: scroll;
        font-weight: 400;
      }
    }

    &__edit {
      width: 100%;
      padding: $gap-s;

      & .el-textarea {
        width: 100%;
        height: 100%;

        &::v-deep .el-textarea__inner {
          border: none;
          width: 100%;
          height: 100%;
          color: #333;
          background-color: #fff !important;
        }
      }
    }

    &__title {
      flex: 0 0 110px;
      background-color: $dark-slate;
      padding: $gap-s;
      margin-right: 1px;
      @include flex-center();

      &:first-child {
        margin-bottom: 1px;
      }
    }
  }

  & .button-wrap {
    margin-left: 5px;
    position: absolute;

    & .button {
      display: inline-block;
      min-width: 25px;
      width: 25px;

      &.model-delete {
        > .delete-icon {
          height: 22px;
          position: relative;
          top: 5px;
        }
      }

      & .el-icon {
        position: relative;
        top: 3px;
        font-size: 22px;
      }
    }
  }

  & .desc-wrapper {
    display: flex;
    justify-content: flex-end;
    padding-top: 15px;
    padding-bottom: $gap;

    & .scope-description {
      font-size: 11px;
      color: $main-red;
      text-align: left;
      line-height: 1.5;
    }
  }
}
</style>
