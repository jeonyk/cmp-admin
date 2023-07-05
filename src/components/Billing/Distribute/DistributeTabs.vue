<template>
  <g-tab
    v-if="detailModel"
    :data="tabs"
    @click="tabClick"
  >
    <template #all>
      <cmp-grid
        :columns="columns"
        :item-source="allRate"
        paging-type="list"
      >
        <template #amountPercent="{ row }">
          <template v-if="row.amountPercent !== null">
            {{ row.rate | round }}%
          </template>
          <template v-else>
            -
          </template>
        </template>
      </cmp-grid>
    </template>
    <template #depth-1>
      <cmp-grid
        :columns="columns"
        :item-source="cloneDetailModelDeep"
        paging-type="list"
      >
        <template #amount="{ row }">
          <div>
            {{ row.amount }}
            <span v-if="distributeInputType === 'DIRECT'">
              ({{ row.distributeStandardName || detailModel.distributeStandardName }})
            </span>
            <span v-else-if="distributeInputType === 'TEMPLATE'">
              {{ getStdRefName(row.stdRefIdx) }}
            </span>
          </div>
        </template>
      </cmp-grid>
    </template>
    <template #depth-2>
      <div
        v-if="Object.keys(distGroupMap || {}).length"
        class="list-wrapper"
      >
        <div
          v-for="(item, key, idx) in distGroupMap"
          :key="key"
          class="list-item"
        >
          <div class="depth-header">
            {{ idx + 1 }}. {{ item[0].parentGroupName }}
          </div>
          <cmp-grid
            :columns="[...columns.slice(0, 2), getColumn(item)]"
            :item-source="item"
          >
            <template #amount="{ row }">
              {{ row.amount }}
            </template>
          </cmp-grid>
        </div>
      </div>
      <template v-else>
        <div class="empty-data">
          {{ $t("common.PLACEHOLDER.noData") }}
        </div>
      </template>
    </template>
    <template #memo>
      <slot name="memo" />
    </template>
  </g-tab>
</template>

<script>
import { cloneDeep } from 'lodash'

export default {
  props: {
    detailModel: {
      type: Object,
      required: true
    },
    useMemo: {
      type: Boolean,
      default: false
    },
    stdRef: {
      type: Array,
      default: () => ([])
    }
  },
  computed: {
    distributeInputType () {
      return this.detailModel?.distributeInputType
    }
  },
  watch: {
    detailModel: {
      deep: true,
      immediate: true,
      handler (newVal) {
        this.cloneDetailModel = cloneDeep(newVal.distributeGroups) // 2차 배부 기준
        this.cloneDetailModelDeep = cloneDeep(newVal.distributeGroups) // 1차 배부 기준
        this.currentTab = this.tabs[0]

        setTimeout(() => {
          this.initDistRate()
          this.initDistGroupMap()
          this.initCommonAffRate()
          this.setColumns()
        }, 0)
      }
    }
  },
  filters: {
    round (value) {
      return (value || 0).toFixed(2)
    }
  },
  created () {
    if (this.useMemo) this.tabs.push({ field: 'memo', name: this.$v('메모') })
  },
  methods: {
    /**
     * 3차 - 공통 배부 모델 표준 배부 템플릿에서 배부 기준명 조회
     */
    getStdRefName (stdRefIdx) {
      const findStdRef = this.stdRef.find(sr => sr.stdRefIdx === stdRefIdx)
      return findStdRef ? `(${findStdRef.stdRefName})` : ''
    },
    getColumn (item) {
      return {
        header: `배부기준 ${
          item[0].distributeStandardName
            ? `(${item[0].distributeStandardName})`
            : ''
        }`,
        binding: 'amount',
        customHtml: true
      }
    },
    /**
     * 탭별 컬럼 설정
     */
    setColumns () {
      if (this.currentTab.field === 'all') {
        this.columns[2].header = this.$t('bill.percent')
        this.columns[2].binding = 'amountPercent'
      } else if (this.currentTab.field === 'depth-1') {
        this.columns[2].header = this.$t('bill.distStandardVaueOnlyText')
        this.columns[2].binding = 'amount'
      } else if (this.currentTab.field === 'depth-2') {
        this.columns[2].header = this.$t('bill.distStandardVaueOnlyText')
        this.columns[2].binding = 'amount'
      }
    },
    /**
     * 퍼센트 구하기
     */
    getPercent (unit, total) {
      const percent = (unit / total) * 100
      return Number.isNaN(percent)
        ? null
        : percent.toString().indexOf('.') === -1
          ? percent
          : percent.toFixed(2)
    },
    tabClick (tab) {
      this.currentTab = tab
      this.setColumns()
    },
    /**
     * 배부 모델 비율 계산
     */
    initDistRate () {
      // 1차 배부 관계사 + 공통 관계사
      let oneDepthGroups = this.detailModel.distributeGroups.filter(
        group => !group.parentGroupName
      )
      // 각 비율을 계산한다.
      const sum = oneDepthGroups.reduce((cur, next) => cur + next.amount, 0)
      oneDepthGroups = oneDepthGroups.map((group, idx) => {
        return {
          ...group,
          no: idx + 1,
          amountPercent: this.getPercent(group.amount, sum),
          rate: Number((group.amount / sum) * 100)
        }
      })

      const twoDepthAff = this.detailModel.distributeGroups.filter(t => t.parentGroupName)
      const upRate = []

      oneDepthGroups.filter(group => !group.groupIdx)
        .forEach(group => {
          const twoDepth = twoDepthAff.filter(
            aff => aff.parentGroupName === group.groupName
          )
          const allSelectAmount = twoDepth.reduce(
            (a, b) => a + b.amount,
            0
          )
          twoDepth.forEach(select => {
            const rate = select.amount / allSelectAmount
            const externalRate = group.rate * rate

            upRate.push({ ...select, externalRate })
          })
        })

      upRate.forEach(rate => {
        const findGroup = oneDepthGroups.find(
          group => group.groupIdx === rate.groupIdx
        )
        if (findGroup) findGroup.rate = findGroup.rate + rate.externalRate
      })

      this.allRate = oneDepthGroups.filter(group => group.groupIdx !== 0)
    },
    /**
     * 배부 모델 매핑 (1차 배부 기준)
     */
    initCommonAffRate () {
      // const noCommonGroup = this.cloneDetailModelDeep.filter(
      //   group => !group.parentGroupName && group.groupIdx !== 0
      // )
      // const isCommonGroupNames = [
      //   ...new Set(
      //     this.cloneDetailModelDeep
      //       .filter(group => group.parentGroupName)
      //       .map(group => group.parentGroupName)
      //   )
      // ]
      // const isCommonGroup = []

      // isCommonGroupNames.forEach(groupName => {
      //   const filteredGroups = this.cloneDetailModelDeep.filter(
      //     group => group.parentGroupName === groupName
      //   )
      //   const obj = { ...filteredGroups[0] }
      //   const amountSum = filteredGroups
      //     .map(group => group.amount)
      //     .reduce((a, b) => a + b, 0)

      //   obj.amount = amountSum
      //   obj.groupName = filteredGroups[0].parentGroupName
      //   isCommonGroup.push(obj)
      // })

      // const allGroups = [].concat(noCommonGroup, isCommonGroup)
      const noCommonGroup = [
        ...this.cloneDetailModelDeep.filter(
          group => !group.parentGroupName && group.groupIdx && !group.distributeStandardName
        ),
        ...this.cloneDetailModelDeep.filter(
          group => !group.parentGroupName && !group.groupIdx && group.distributeStandardName
        )
      ]

      noCommonGroup.forEach((group, idx) => {
        group.no = idx + 1
        if (!group.groupIdx) {
          // const findGroup = this.cloneDetailModel.find(innerGroup => innerGroup.parentGroupName === group.groupName)
          this.$set(group, 'distributeStandardName', group.distributeStandardName)
        }
      })

      this.cloneDetailModelDeep = noCommonGroup
    },
    /**
     * 배부 모델 매핑 (2차 배부 기준)
     */
    initDistGroupMap () {
      const groupMap = {}
      // 묶인 것들 조회
      const isParentGroup = this.cloneDetailModel.filter(
        group => group.parentGroupName
      )
      const groups = [
        ...new Set(isParentGroup.map(group => group.parentGroupName))
      ]
      // 중복 제거한 그룹 이름들 키에 정리
      groups.forEach(groupName => {
        const filteredGroups = this.cloneDetailModel.filter(
          group => group.parentGroupName === groupName
        )
        const amountSum = filteredGroups
          .map(group => group.amount)
          .reduce((a, b) => a + b, 0)

        filteredGroups.forEach(group => {
          group.rate = this.getPercent(group.amount, amountSum)
        })
        filteredGroups.forEach((group, idx) => {
          // console.log('그룹:', group)
          // console.log('1차:', this.cloneDetailModelDeep)
          group.no = idx + 1
          group.distributeStandardName = this.cloneDetailModelDeep.find(el => el.groupName === group.parentGroupName).distributeStandardName
        })
        groupMap[groupName] = filteredGroups
      })
      this.distGroupMap = groupMap
    }
  },
  data: (root) => ({
    columns: [
      { header: 'No', binding: 'no', width: 110 },
      { header: root.$t('bill.billOwnAff'), binding: 'groupName', customHtml: true },
      { header: root.$t('bill.distStandardValue'), binding: 'amount', customHtml: true }
    ],
    tabs: [
      { field: 'all', name: root.$t('bill.allRate') },
      { field: 'depth-1', name: root.$t('bill.dist1st') },
      { field: 'depth-2', name: root.$t('bill.dist2nd') }
      // { field: 'memo', name: '메모' }
    ],
    distGroupMap: null,
    cloneDetailModel: null,
    cloneDetailModelDeep: null,
    allRate: [],
    currentTab: 0
  })
}
</script>

<style lang="scss" scoped>
.depth-header {
  margin-bottom: 15px;
  font-size: 13px;
}

.empty-data {
  margin-top: 70px;
}

.list-wrapper {
  & > * + * {
    margin-top: $gap-m;
  }
}
</style>
