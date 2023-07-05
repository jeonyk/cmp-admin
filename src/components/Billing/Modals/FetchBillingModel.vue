<!-- 과금모델 불러오기 -->

<template>
  <el-dialog
    :title="!distribute ? $t('bill.MODEL.loadModel') : '배부모델 불러오기'"
    :visible="active"
    @close="$emit('close')"
    width="830px"
  >
    <div
      v-loading="modelFetchLoading"
      class="fetch-modal"
    >
      <div class="fetch-modal-search">
        <div class="search-options">
          <wj-flex-grid-search
            class="search-box"
            id="fetchBillingSearch"
            ref="fetchBillingSearch"
            :placeholder="$t('common.PLACEHOLDER.searchEnter')"
          />
          <span class="search-icon">
            <i
              class="el-icon el-icon-search"
            />
            <i
              class="mdi mdi-refresh"
              @click="resetSearch"
            />
          </span>
        </div>
        <cmp-grid
          :columns="distribute ? gridHeaderDist : gridHeader"
          :item-source="allModels"
          @selectedRow="selectedRow"
          selectable
          searching
          grid-id="fetch-billing-search"
          search-box-id="fetchBillingSearch"
        >
          <template #index="{row}">
            {{ row.index + 1 }}
          </template>
          <template #name="{ row }">
            <span>
              {{ row.name }}
              <cmp-status-tag
                v-if="row.apply"
                type="is-primary"
                line-style
                style="margin-left: 5px;"
              >
                Apply
              </cmp-status-tag>
            </span>
          </template>
          <template #createTime="{ row }">
            <span>{{ row.createTime | date('YYYY-MM-DD') }}</span>
          </template>
          <template #rawModelCount="{ row }">
            <el-tooltip
              v-if="row.modelCount.count"
              effect="light"
              placement="right"
            >
              <span>{{ row.modelCount.count }}</span>
              <template #content>
                <div
                  v-for="name in row.modelCount.names"
                  :key="name"
                >
                  {{ name }}
                </div>
              </template>
            </el-tooltip>
            <span v-else>
              {{ row.modelCount.count }}
            </span>
          </template>
        </cmp-grid>
      </div>
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
        class="button"
        type="is-primary"
        @click="emitApplyEvent"
      >
        {{ $t('common.BTN.apply') }}
      </button>
    </section>
  </el-dialog>
</template>

<script>
import API from '@sd-fe/cmp-core'
import { columns, distColumns } from './FetchBillingModel.columns'

export default {
  name: 'FetchBillingModel',
  props: {
    active: {
      type: Boolean,
      required: true
    },
    // 배부 모델
    distribute: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    active: {
      handler (visible) {
        if (visible) {
          if (this.distribute) {
            this.getAllDistModel()
          } else {
            this.getAllModel()
          }
        } else {
          this.$refs.fetchBillingSearch.control.text = ''
        }
      }
    }
  },
  methods: {
    resetSearch () {
      this.$refs.fetchBillingSearch.control.text = ''
    },
    emitApplyEvent () {
      if (!this.selectedModelGroup) {
        return this.$alert(this.$t('common.ALERT.BILL.003')) // 과금 모델을 선택해주세요.
      }
      this.$emit('apply', this.selectedModelGroup)
    },
    selectedRow (row) {
      if (!row || !row.dataItem) return
      this.selectedModelGroup = row.dataItem
    },
    getModelCount (model) {
      if (!model.models || !model.models.length || !model.models.find(innerModel => innerModel.type === 3)) return { count: 0, names: [] }
      const affModel = model.models.find(innerModel => innerModel.type === 3)
      const names = affModel.models.map(model => model.companyName)
      const count = affModel.models.length
      return { count, names }
    },
    searchBillingModel () {},
    resetBillingModel () {},
    async getAllDistModel () {
      this.modelFetchLoading = true
      try {
        const models = await API.billing.getDistModel() // 이건 뭐지? 🌸
        this.allModels = models.filter(model => !model.apply)

        // apply 모델을 찾아서 최상단에 위치 시킨다.
        const applyModel = models.find(model => model.apply)
        if (applyModel) this.allModels.unshift(applyModel)

        this.allModels = this.allModels.map(model => ({
          ...model,
          projectCount: model.distributeProjects.length,
          billing: model.confirm ? 'Y' : 'N'
        }))
      } catch (error) {
        console.error(error)
      } finally {
        this.modelFetchLoading = false
      }
    },
    /**
     * 과금모델 불러오기
     * 모든 과금모델을 가져오고
     * apply된 과금모델의 위치를 최상단으로 바꾼 후
     * 관계사 과금모델이 포함된 경우 관계사의 갯수 구하기
     */
    async getAllModel () {
      this.modelFetchLoading = true
      try {
        const models = await API.billing.getModelGroups()
        this.allModels = models.map(model => ({ ...model, billing: model.billing ? 'Y' : 'N' }))
        this.allModels.forEach(model => {
          this.$set(model, 'modelCount', { ...this.getModelCount(model) })
          this.$set(model, 'rawModelCount', model.modelCount.count)
        })
        const applyModelIdx = this.allModels.findIndex(model => model.apply)
        if (applyModelIdx !== -1) {
          const applyModel = this.allModels.splice(applyModelIdx, 1)[0]
          this.allModels.unshift(applyModel)
        }
      } catch (error) {
        console.error(error)
      } finally {
        this.modelFetchLoading = false
      }
    }
  },
  data: root => ({
    searchText: '',
    gridHeader: columns(root),
    gridHeaderDist: distColumns(root),
    allModels: [],
    modelFetchLoading: false,
    selectedModelGroup: null
  })
}
</script>

<style lang="scss" scoped>
.fetch-modal-search {
  & .search-box {
    margin-bottom: $gap;
    max-width: 210px;

    &::v-deep .wj-input-group-btn {
      display: none;
    }
  }

  & .search-options {
    position: relative;
  }

  & .search-icon {
    top: 5px;
    position: absolute;
    margin-left: $gap-s;

    & > * {
      display: inline-block;
      vertical-align: middle;
      width: 16px;
      height: 16px;
      font-size: 16px;
      cursor: pointer;
      color: $color-grey;

      &:hover {
        color: $white;
      }
    }

    & > * + * {
      margin-left: 5px;
    }

    & > .mdi {
      vertical-align: sub;
    }
  }
}
</style>
