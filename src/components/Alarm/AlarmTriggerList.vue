<template>
  <div
    v-loading="isLoadingPage"
    class="cmp-alarm-trigger"
  >
    <div class="filter">
      <filtering-component
        :data="triggerFilters"
        @reset-data="onResetFilter"
        @selected="onSelectedFilter"
      />
    </div>
    <search-component
      v-model="filterTriggerName"
      :placeholder="$v('트리거명을 입력해주세요.')"
      @input="() => (triggers = getTriggers())"
    />
    <div class="info-action">
      <total-count :total-count="triggers.length" />
      <div class="actions">
        <button
          v-for="action in actions"
          :key="action.content"
          :type="action.type"
          :disabled="action.disabled"
          @click="action.handler"
          class="button"
        >
          {{ action.content }}
        </button>
      </div>
    </div>
    <div class="grid">
      <cmp-grid
        auto-row-heights
        use-checkbox
        header-checkbox
        :columns="columns"
        :item-source="triggers"
        :changing-page-reset="false"
        @checkedRowsData="onCheckedRows"
        @changingPage="onChangePage"
        @init-collection-view="onInitCollectionView"
        @refresh-collection-view="currentPage = 1"
      >
        <template #macroList="{ row }">
          <div
            v-for="macro in row.macroList"
            :key="macro.orderNum"
          >
            {{ macro.keyword }}:{{ macro.jsonKey }}
          </div>
        </template>
        <template #actions="{ row }">
          <el-switch
            v-model="row.__ui_use_yn__"
            @change="e => onChangeSwitch(row, e)"
          />
        </template>
      </cmp-grid>
    </div>
    <alarm-trigger-create
      :active="isActiveCreateModal"
      :is-edit="editMode"
      :content-condition="contentCondition"
      :method-types="methodTypes"
      :alarm-cycles="alarmCycles"
      :edit-data="triggerEditData"
      @close="isActiveCreateModal = false"
      @required-refresh="onRefreshAfterCreate"
    />
  </div>
</template>

<script>
import columns from './AlarmTriggerList.columns'
import AlarmTriggerCreate from './AlarmTriggerCreate.vue'
import API from '@sd-fe/cmp-core'
import { omit } from 'lodash'
import Fuse from 'fuse.js'

export default {
  name: 'AlarmTriggerList',
  components: {
    AlarmTriggerCreate
  },
  computed: {
    actions () {
      return [
        {
          handler: this.onClickCreateTrigger,
          type: 'is-primary',
          disabled: this.isActiveCreateModal,
          content: '추가'
        },
        {
          handler: this.onClickChangeTrigger,
          type: 'is-primary',
          disabled: this.checkedRows.length !== 1,
          content: '변경'
        },
        {
          handler: this.onClickDeleteTrigger,
          type: 'is-primary',
          disabled: !this.checkedRows.length,
          content: '삭제'
        }
      ]
    }
  },
  watch: {
    triggerFilterData: {
      handler (filter) {
        this.triggers = this.getTriggers()
      },
      immediate: true,
      deep: true
    }
  },
  created () {
    this.initData()
  },
  methods: {
    onInitCollectionView (data) {
      if (data) {
        data.moveToPage(this.currentPage - 1)
      }
    },
    onChangePage (page) {
      this.currentPage = page
    },
    onRefreshAfterCreate () {
      this.initData()
    },
    onChangeSwitch (row, e) {
      this.updateTrigger({ ...omit(row, ['__ui_use_yn__']), useYn: e })
    },
    mapTrigger (trigger) {
      const contentMap = `${trigger.contentKeyword} ${trigger.contentComparisonSymbol} ${trigger.contentValue}`

      return {
        ...trigger,
        contentMap,
        alarmCycleTypeMap: this.alarmCycleObj[trigger.alarmCycleType]?.codeName,
        __ui_use_yn__: trigger.useYn
      }
    },
    async updateTrigger (body) {
      this.isLoadingPage = true

      try {
        await API.alarm.updateTrigger(body)
        this.$alert('트리거 사용 여부를 변경했습니다.')
      } catch (error) {
        console.log(error)
        this.$alert('사용 여부 변경에 실패하였습니다.')
      } finally {
        this.isLoadingPage = false
        this.initData()
      }
    },
    async getMethodTypes () {
      if (this.methodTypes && this.methodTypes.length) return this.methodTypes
      const { data } = await API.alarm.getMethodTypes()
      return data
    },
    async getContentCondition () {
      if (this.contentCondition && this.contentCondition.length) return this.contentCondition
      const { data } = await API.alarm.getSearchConditionTypes()
      return data
    },
    async getAlarmCycleType () {
      if (this.alarmCycles && this.alarmCycles.length) return this.alarmCycles
      const { data } = await API.alarm.getAlarmCycleTypes()
      return data
    },
    async getTrigger () {
      const { data } = await API.alarm.getTriggerList({ pageSize: 10000 })
      return data.content
    },
    async deleteTrigger (id) {
      const { data } = await API.alarm.deleteTrigger(id)
      if (!data.result) {
        throw data
      } else {
        return data
      }
    },
    /**
     * 트리거 조회 등
     */
    initData () {
      this.isLoadingPage = true

      Promise.all([
        this.getTrigger(),
        this.getAlarmCycleType(),
        this.getContentCondition(),
        this.getMethodTypes()
      ])
        .then(([trigger, alarmCycles, condition, methodTypes]) => {
          this.methodTypes = methodTypes
          this.contentCondition = condition
          this.alarmCycles = alarmCycles
          this.alarmCycleObj = {}

          this.alarmCycles.forEach(cycle => {
            this.alarmCycleObj[cycle.codeVal] = cycle
          })

          this.originTriggers = trigger.map(this.mapTrigger)
          this.triggers = this.getTriggers(this.originTriggers)

          const methodFilter = this.triggerFilters.find(f => f.field === 'method')

          if (methodFilter) {
            methodFilter.selections = methodTypes.map(method => ({ label: method.codeVal, value: method.codeVal }))
          }
        })
        .catch(() => {
          this.$alert(this.$v('트리거 조회에 실패하였습니다.'))
        })
        .finally(() => {
          this.isLoadingPage = false
        })
    },
    /**
     * 트리거명으로 필터링
     */
    filterByTriggerName (triggers, triggerName = this.filterTriggerName) {
      return triggers // TODO
    },
    /**
     * 필터 선택 이벤트
     */
    onSelectedFilter (params) {
      this.triggerFilterData = params
    },
    onCheckedRows (rows) {
      this.checkedRows = rows
    },
    /**
     * 트리거 추가
     */
    onClickCreateTrigger () {
      this.triggerEditData = null
      this.editMode = false
      this.isActiveCreateModal = true
    },
    /**
     * 트리거 변경
     */
    onClickChangeTrigger () {
      this.triggerEditData = this.checkedRows[0]
      this.editMode = true
      this.isActiveCreateModal = true
    },
    /**
     * 트리거 삭제
     */
    onClickDeleteTrigger () {
      if (!this.checkedRows.length) return

      this.$confirm(this.$v('선택된 트리거를 삭제하시겠습니까?'))
        .then(() => {
          const promises = this.checkedRows.map(row => {
            return this.deleteTrigger(row.id)
          })

          Promise.all(promises)
            .then(() => {
              this.$alert('트리거 삭제가 완료되었습니다.')
              this.initData()
            })
            .catch((err) => {
              if (err.message) {
                return this.$alert(err.message)
              } else {
                return this.$alert('트리거 삭제에 실패하였습니다.')
              }
            })
        })
        .catch(() => false)
    },
    /**
     * 필터 초기화
     */
    onResetFilter () {
      this.triggerFilterData = {}
    },
    getTriggers (list = this.originTriggers) {
      let copyList = list.slice(0)

      if (this.triggerFilterData && Object.keys(this.triggerFilterData).length) {
        const keys = Object.keys(this.triggerFilterData)

        keys.forEach(key => {
          copyList = copyList.filter(item => item[key] === this.triggerFilterData[key])
        })
      }

      if (this.filterTriggerName) {
        const fuse = new Fuse(copyList, {
          keys: ['name'],
          threshold: 0.25
        })

        copyList = fuse.search(this.filterTriggerName).map(node => node.item)
      }

      return copyList
    }
  },
  data: root => ({
    currentPage: 1,
    triggerEditData: null,
    methodTypes: [],
    contentCondition: [],
    editMode: false,
    alarmCycleObj: null,
    alarmCycles: [],
    isLoadingPage: false,
    triggers: [], // 필터링된 트리거
    originTriggers: [], // 원본 트리거
    checkedRows: [], // 체크된 트리거
    columns: columns(root),
    triggerFilters: [
      {
        field: 'method',
        label: 'Method',
        selections: [{ label: 'GET', value: 'get' }]
      },
      {
        field: 'useYn',
        label: '사용 여부',
        selections: [
          { label: '사용', value: true },
          { label: '미사용', value: false }
        ]
      }
    ],
    triggerFilterData: null,
    isActiveCreateModal: false,
    filterTriggerName: ''
  })
}
</script>

<style lang="scss" scoped>
.cmp-alarm-trigger {
  .info-action {
    display: flex;
    width: 100%;
    justify-content: space-between;

    .actions {
      > .button:not(:last-of-type) {
        margin-right: $gap-s;
      }
    }
  }

  .el-switch {
    &.is-checked {
      &::v-deep {
        .el-switch__core {
          &::before {
            left: -5px;
          }
        }
      }
    }
  }

  .filter {
    .filtering-component {
      margin-bottom: 25px;
    }
  }
}
</style>
