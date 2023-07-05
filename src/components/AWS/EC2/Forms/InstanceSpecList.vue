<template>
  <div
    v-loading="loadingSpecList"
    class="spec-list"
  >
    <div
      v-if="amiSelected"
      class="spec-list-body"
    >
      <div
        v-for="(spec, index) in dataByPage"
        :key="index"
        class="spec-list-body__item"
        :class="[spec.active && 'active']"
        @click="activeSpec(spec)"
      >
        <div class="spec-list-body__item-title">
          {{ spec.instanceType }}
        </div>
        <div class="spec-list-body__item-right">
          <ul class="spec-list-body__item-right-list">
            <li
              v-for="column in listColumns"
              :key="column.binding"
              class="spec-list-body__item-right-list-item"
            >
              <span class="column">{{ column.name }}</span>
              <span class="value">{{ spec[column.binding] }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <ami-empty v-else />
    <div
      v-if="amiSelected && specs.length"
      class="pagination-wrap"
    >
      <el-pagination
        :current-page="currentPage"
        :total="totalSpec"
        :page-size="perPage"
        @current-change="onChangePage"
        layout="prev, pager, next"
      />
    </div>
    <div
      v-else-if="!specs.length"
      class="empty-data"
    >
      {{ $t('common.PLACEHOLDER.noData') }}
    </div>
  </div>
</template>

<script>
import { getInstanceTypes } from '@/components/Apis/AWS'
import AmiEmpty from './AmiEmpty.vue'

export default {
  name: 'InstanceSpecList',
  components: { AmiEmpty },
  inject: ['shared'],
  props: {
    amiSelected: {
      type: Boolean,
      required: true,
      default: false
    },
    perPage: {
      type: Number,
      default: 5
    },
    // specs: {
    //   type: Array,
    //   default: () => []
    //   default: () => [
    //     { name: 't2.nano', vcpu: 1, memory: 0.5, network: 'LOW TO MODERATO' },
    //     { name: 't2.micro', vcpu: 1, memory: 0.5, network: 'LOW TO MODERATO' },
    //     { name: 't2.small', vcpu: 1, memory: 0.5, network: 'LOW TO MODERATO' },
    //     { name: 't2.medium', vcpu: 1, memory: 0.5, network: 'LOW TO MODERATO' },
    //     { name: 't2.large', vcpu: 1, memory: 0.5, network: 'LOW TO MODERATO' },
    //     { name: 't2.nano', vcpu: 1, memory: 0.5, network: 'LOW TO MODERATO' }
    //   ]
    // },
    filterOption: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    dataByPage () {
      const start = (this.currentPage - 1) * 5
      const end = start + this.perPage
      return this.specs.slice(start, end)
    }
  },
  watch: {
    'shared.active' (active) {
      if (active) {
        this.checkBasketEdit()
        this.getSpecs()
      } else {
        this.selectedSpec = null
        this.currentPage = 1
      }
    },
    filterOption: {
      handler (option) {
      },
      deep: true
    }
  },
  created () {
    if (this.shared.active) {
      if (this.shared.basketEdit) {
        this.checkBasketEdit()
      }

      this.getSpecs()
    }
  },
  methods: {
    /**
     * 장바구니에서 모달 오픈시 선택한 인스턴스 사양 세팅
     */
    checkBasketEdit () {
      if (this.shared.basketEdit) {
        // 장바구니에서 열었을 때에만
        this.activeSpec(this.shared.basketData.orderData.instanceTypeDto, true)
      }
    },
    async getSpecs () {
      try {
        this.loadingSpecList = true
        const { data } = await getInstanceTypes({
          // 리전 수정 필요
          regionName: 'ap-northeast-2',
          pageSize: 65536,
          pageNum: 1,
          memory: this.filterOption.specSelect === 'memory' ? ((this.filterOption.keyword * 1024) || undefined) : undefined,
          vcpu: this.filterOption.specSelect === 'vcpu' ? (this.filterOption.keyword || undefined) : undefined,
          instanceType: this.filterOption.specSelect === 'name' ? this.filterOption.keyword : undefined
        })
        this.currentPage = 1
        this.specs = data.list.map(spec => ({ ...spec, active: false, memory: spec.memory / 1024 }))
        this.totalSpec = data.total

        if (this.selectedSpec) {
          // 현재 페이지의 모든 인스턴스 타입
          const allInstanceTypes = this.specs.map(spec => spec.instanceType)
          // 현재 선택된 사양이 현재 페이지의 인스턴스 타입에 해당되는지
          if (allInstanceTypes.includes(this.selectedSpec.instanceType)) {
            const target = this.specs.find(spec => spec.instanceType === this.selectedSpec.instanceType)
            target.active = true
          }

          this.specs.sort((a, b) => {
            if (a.active) return -1
            else if (b.active) return 1
            return 0
          })
        }

        if (this.shared.isEdit) {
          const refKey = this.shared.basketEdit ? 'basketData' : 'editData'
          const editSpec = this.shared[refKey].orderData.instanceTypeDto.instanceType
          const findSpec = this.specs.find(spec => spec.instanceType === editSpec)

          if (findSpec) this.activeSpec(findSpec)
        }
      } catch (error) {
        console.log(error)
        this.$alert('인스턴스 사양 조회에 실패하였습니다.')
      } finally {
        this.loadingSpecList = false
      }
    },
    onChangePage (page) {
      this.currentPage = page
      // this.getSpecs()
    },
    /**
     * 모든 인스턴스 타입의 활성화 상태를 비활성화로 바꿈
     */
    unActiveSpecs () {
      this.specs.forEach(spec => (spec.active = false))
      this.selectedSpec = null
      this.$emit('selected-spec', this.selectedSpec)
    },
    activeSpec (spec, isBasket = false) {
      // 이미 선택된 인스턴스 사양
      if (spec.active && !isBasket) return this.unActiveSpecs()

      // 사양을 모두 초기화한다.
      this.unActiveSpecs()
      this.selectedSpec = spec

      // 선택한 사양을 활성화시킨다.
      spec.active = true

      this.$emit('selected-spec', spec)
    },
    /**
     * 컴포넌트의 데이터를 초기화한다.
     */
    resetData () {
      this.unActiveSpecs()
      this.$emit('selected-spec', null)
      this.currentPage = 1
      this.totalSpec = 0
      this.specs = []
      this.getSpecs()
    }
  },
  data: () => ({
    currentPage: 1,
    listColumns: [
      { name: 'vCPU', binding: 'vcpu' },
      { name: '메모리(GiB)', binding: 'memory' },
      { name: '네트워크 성능', binding: 'networkPerformance' }
    ],
    mapSpecs: [],
    loadingSpecList: false,
    specs: [],
    totalSpec: 0,
    selectedSpec: null
  })
}
</script>

<style lang="scss" scoped>
.spec-list {
  .pagination-wrap {
    width: 100%;
  }

  &-body {
    margin: $gap 0 $gap-m 0;

    & > * {
      margin-top: $gap-s;
    }

    &__item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 50px;
      overflow: hidden;
      border-radius: 6px;
      background-color: #232642;
      padding: 0 30px 0 20px;
      cursor: pointer;
      transition: background-color 300ms ease;
      transition: box-shadow 300ms ease;

      &.active,
      &:hover {
        background-color: #0A0C20;
        box-shadow: 6px 6px 20px rgba(11, 1, 1, 0.15);
      }

      &-title {
        font-weight: bold;
      }

      &-right {
        &-list {
          display: flex;
          align-items: center;

          &-item {
            .column {
              color: #E1E1E1;
            }

            .value {
              margin-left: $gap-s;
              font-weight: bold;
            }
          }

          & > :not(:last-child) {
            &::after {
              width: 2px;
              height: 12px;
              background-color: #39394B;
              content: '';
              display: inline-block;
              vertical-align: middle;
              margin: 0 15px;
            }
          }
        }
      }
    }
  }
}
</style>
