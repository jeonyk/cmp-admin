<template>
  <div
    v-loading="isLoadingTemplate"
    class="cmp-alarm-template"
  >
    <div class="filter">
      <filtering-component
        :data="gridFilters"
        @selected="onSelectFilter"
      />
    </div>
    <div class="info-action">
      <total-count :total-count="gridDataWithFilter.length" />
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
        use-checkbox
        header-checkbox
        :columns="gridColumns"
        :item-source="gridDataWithFilter"
        :changing-page-reset="false"
        @checkedRowsData="onCheckedRows"
        @changingPage="onChangePage"
        @init-collection-view="onInitCollectionView"
        @refresh-collection-view="currentPage = 1"
      >
        <template #receiverDisplayName="{ row }">
          <!-- <el-tooltip
            v-if="row.receiverDisplayName && row.receiverDisplayName.length"
            effect="light"
          >
            <span class="receiver-tooltip-trigger">상세</span>
            <div slot="content">
              <div
                v-for="displayName in row.receiverDisplayName"
                :key="displayName"
              >
                {{ displayName }}
              </div>
            </div>
          </el-tooltip>
          <span v-else>
            -
          </span> -->
          <el-tooltip
            v-if="row.receiverDisplayName && row.receiverDisplayName.length > 1"
            effect="light"
          >
            <span class="receiver-tooltip-trigger">
              {{ row.receiverDisplayName[0] }} 외 {{ row.receiverDisplayName.length - 1 }}
            </span>
            <div slot="content">
              <div
                v-for="displayName in row.receiverDisplayName"
                :key="displayName"
              >
                {{ displayName }}
              </div>
            </div>
          </el-tooltip>
          <div v-else-if="row.receiverDisplayName && row.receiverDisplayName.length === 1">
            {{ row.receiverDisplayName[0] }}
          </div>
          <div v-else>
            -
          </div>
        </template>
        <template #actions="{ row }">
          <div class="grid-action">
            <el-switch
              v-model="row.useYn"
              @change="(bool) => onChangeUseSwitch(row, bool)"
            />
            <file-icon
              :width="20"
              :height="20"
              is-button
              class="file-icon"
              @click="() => getTemplateHistory(row, 0)"
            />
          </div>
        </template>
      </cmp-grid>
    </div>
    <alarm-template-history-modal
      :active="isActiveTemplateHistoryModal"
      :history-info="templateHistoryInfo"
      :trigger-map="alarmTriggerMap"
      :alarm-cycle="alarmCycles"
      :alarm-type-map="alarmTypeMap"
      :loading="isLoadingTemplate"
      :select-template="selectHistoryTemplate"
      @close="isActiveTemplateHistoryModal = false"
      @change-page="(template, page) => getTemplateHistory(template, page)"
    />
  </div>
</template>

<script>
import columns from './AlarmTemplateList.columns'
import FileIcon from '@/components/Icons/FileIcon.vue'
import AlarmTemplateHistoryModal from '@/components/Alarm/AlarmTemplateHistoryModal.vue'
import API from '@sd-fe/cmp-core'
import { mapAlarmCycleDto } from './Util/Mapping'

export default {
  name: 'AlarmTemplateList',
  components: { FileIcon, AlarmTemplateHistoryModal },
  computed: {
    gridDataWithFilter () {
      if (this.isSetFilter) {
        let result = this.gridData.slice(0)

        if (this.filterData.event) result = result.filter(alarm => alarm.alarmCycleType === this.filterData.event)
        if (this.filterData.sendSystem) result = result.filter(alarm => alarm.alarmType === this.filterData.sendSystem)

        return result
      } else return this.gridData
    },
    actions () {
      return [
        {
          handler: this.onClickCreateTemplate,
          type: 'is-primary',
          disabled: false,
          content: '추가'
        },
        {
          handler: this.onClickChangeTemplate,
          type: 'is-primary',
          disabled: this.checkedRows.length !== 1,
          content: '변경'
        },
        {
          handler: this.onClickDeleteTemplate,
          type: 'is-primary',
          disabled: !this.checkedRows.length,
          content: '삭제'
        }
      ]
    }
  },
  created () {
    this.initData()
  },
  methods: {
    async getBatchAlarmCycles () {
      if (this.alarmBatchCycles && this.alarmBatchCycles.length) return this.alarmBatchCycles
      const { data } = await API.alarm.getBatchAlarmCycle()
      this.alarmBatchCycles = (data || [])
      this.alarmBatchCycles.forEach(cycle => {
        this.alarmBatchCycleMap.set(cycle.codeVal, cycle)
      })
      return this.alarmBatchCycles
    },
    onInitCollectionView (data) {
      if (data) {
        data.moveToPage(this.currentPage - 1)
      }
    },
    onChangePage (page) {
      this.currentPage = page
    },
    onSelectFilter (filters) {
      this.isSetFilter = Object.keys(filters).length > 0
      this.filterData = filters
    },
    setFilterSections (alarmType, alarmCycle) {
      const filterObj = this.gridFilters.find(f => f.field === 'sendSystem')

      if (filterObj) {
        filterObj.selections = alarmType.map(t => ({
          ...t,
          label: t.codeName,
          value: t.codeVal
        }))
      }

      const cycleFilter = this.gridFilters.find(f => f.field === 'event')

      if (cycleFilter && alarmCycle) {
        cycleFilter.selections = alarmCycle.map(cycle => ({
          ...cycle,
          label: cycle.codeName,
          value: cycle.codeVal
        }))
      }
    },
    initData () {
      this.isLoadingTemplate = true

      Promise.all([this.getAlarmTypes(), this.getTrigger(), this.getTemplate(), this.getAlarmCycleTypes(), this.getBatchAlarmCycles()])
        .then(([alarmType, trigger, template, alarmCycles, batchCycles]) => {
          this.setMapAlarmType(alarmType || [])
          this.setMapTrigger(trigger || [])
          this.setFilterSections(alarmType, alarmCycles)

          this.alarmCycleList = alarmCycles
          this.alarmCycles = {}

          alarmCycles.forEach(cycle => {
            this.$set(this.alarmCycles, cycle.codeVal, cycle)
          })

          // 템플릿
          this.gridData = (template || [])
            .map(this.mapTriggerToTemplate)
            .map(this.mapTypeToTemplate)
            .map(this.mapReceiverToTemplate)
            .map(this.mapBatchCycleTemplate)
          this.alarmTriggers = trigger
          this.alarmTypes = alarmType

          ;(template || []).forEach(t => {
            this.alarmTemplateMap.set(t.id, {
              ...t,
              alarmTemplateReceiverDtoList: t.alarmTemplateReceivers
            })
          })
        })
        .catch((_err) => {
          console.log(_err)
          this.$alert(this.$v('템플릿 조회에 실패하였습니다.'))
        })
        .finally(() => (this.isLoadingTemplate = false))
    },
    setMapAlarmType (types = this.alarmTypes) {
      types.forEach(type => {
        this.alarmTypeMap.set(type.codeVal, type)
      })
    },
    setMapTrigger (triggers = this.alarmTriggers) {
      triggers.forEach(trigger => {
        this.alarmTriggerMap.set(trigger.id, trigger)
      })
    },
    mapBatchCycleTemplate (template) {
      if (template.alarmCycleType !== 'BATCH' || !template.alarmCycleDto) return template

      const templateBatchCycle = template.alarmCycleDto
      const batchCycle = this.alarmBatchCycleMap.get(templateBatchCycle.alarmCycle)

      const { slicedDisplayLabel } = mapAlarmCycleDto(templateBatchCycle, batchCycle)

      return {
        ...template,
        alarmBatchCycleText: slicedDisplayLabel
      }
    },
    mapReceiverToTemplate (template) {
      return {
        ...template,
        alarmTemplateReceivers: template.alarmTemplateReceiverDtoList,
        receiverDisplayName: template.alarmTemplateReceiverDtoList.map(receiver => receiver.receiverKeyword)
      }
    },
    mapTypeToTemplate (template) {
      const alarmType = this.alarmTypeMap.get(template.alarmType)

      if (!alarmType) return { ...template }

      return {
        ...template,
        alarmTypeMap: alarmType.codeName,
        alarmTypeRaw: alarmType
      }
    },
    mapTriggerToTemplate (template) {
      const trigger = this.alarmTriggerMap.get(template.triggerId)
      const ct = this.alarmCycles[template.alarmCycleType]?.codeName

      if (!trigger) return { ...template, alarmCycleTypeMap: ct }

      return {
        ...template,
        alarmCycleTypeMap: ct,
        defaultReceiverName: '',
        receviers: [],
        triggerName: trigger.name,
        triggerRaw: trigger
      }
    },
    async getAlarmCycleTypes () {
      if (this.alarmCycleList && this.alarmCycleList.length) return this.alarmCycleList
      const { data } = await API.alarm.getAlarmCycleTypes()
      return data
    },
    async getAlarmTypes () {
      if (this.alarmTypes && this.alarmTypes.length) return this.alarmTypes
      const { data } = await API.alarm.getAlarmTypes()
      return data
    },
    async getTrigger () {
      const { data } = await API.alarm.getTriggerList({ pageSize: 10000 })
      return data.content
    },
    async getTemplate () {
      const { data } = await API.alarm.getTemplateList()
      return data.content
    },
    /**
     * 파일 아이콘 클릭 이벤트
     */
    async getTemplateHistory (row, page) {
      // this.isActiveTemplateHistoryModal = true
      this.selectHistoryTemplateId = row?.id
      this.selectHistoryTemplate = row
      this.isLoadingTemplate = true

      try {
        const { data } = await API.alarm.getHistoryList({
          almTemplatesId: row?.id,
          pageNo: page
        })
        this.templateHistoryInfo = data
        this.isActiveTemplateHistoryModal = true
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('템플릿 히스토리 조회에 실패하였습니다.'))
      } finally {
        this.isLoadingTemplate = false
      }
    },
    /**
     * 사용 여부
     */
    async onChangeUseSwitch (row, bool) {
      const rawTemplate = this.alarmTemplateMap.get(row.id)

      if (rawTemplate) {
        try {
          this.isLoadingTemplate = true
          await API.alarm.updateUseYnTemplate(row.id)
          this.$alert(this.$v('템플릿 사용 여부를 수정하였습니다.'))
        } catch (error) {
          this.$alert(this.$v('템플릿 사용 여부 수정에 실패하였습니다.'))
        } finally {
          this.initData()
        }
      }
    },
    onCheckedRows (rows) {
      this.checkedRows = rows
    },
    /**
     * 템플릿 추가
     */
    onClickCreateTemplate () {
      this.$router.push({
        name: 'cmp-alarm-template-detail'
      })
    },
    /**
     * 템플릿 변경
     */
    onClickChangeTemplate () {
      if (!this.checkedRows.length || !this.checkedRows.length > 1) return

      const row = this.checkedRows[0]

      this.$router.push({
        name: 'cmp-alarm-template-detail',
        query: {
          t: row.id,
          isEdit: true
        }
      })
    },
    deleteTemplate (id) {
      return API.alarm.deleteTemplateById(id)
    },
    /**
     * 템플릿 삭제
     */
    onClickDeleteTemplate () {
      if (!this.checkedRows || !this.checkedRows.length) return

      this.$confirm(this.$v('선택한 템플릿을 삭제하시겠습니까?'))
        .then(async () => {
          const ids = this.checkedRows.map(row => row.id)
          const promisePool = ids.map(id => this.deleteTemplate(id))

          this.isLoadingTemplate = true

          try {
            await Promise.all(promisePool)
            this.$alert(this.$v('템플릿을 삭제하였습니다.'))
            this.initData()
          } catch (error) {
            this.$alert(this.$v('템플릿 삭제에 실패하였습니다.'))
          } finally {
            this.isLoadingTemplate = false
          }
        })
        .catch(() => false)
    }
  },
  data: root => ({
    alarmBatchCycleMap: new Map(),
    alarmBatchCycles: [],
    selectHistoryTemplate: null,
    selectHistoryTemplateId: null,
    templateHistoryInfo: null,
    currentPage: 1,
    isActiveTemplateHistoryModal: false,
    filterData: null,
    gridColumns: columns(root),
    gridData: [],
    gridFilters: [
      {
        field: 'event',
        label: '유형',
        selections: [
          // { label: '이벤트', value: 'EVENT' },
          // { label: '배치', value: 'BATCH' }
        ]
      },
      {
        field: 'sendSystem',
        label: '발송 시스템',
        selections: []
      }
    ],
    checkedRows: [],
    isLoadingTemplate: false,
    alarmTemplates: [],
    alarmTriggers: [],
    alarmTypes: [],
    alarmCycles: null,
    alarmCycleList: [],
    alarmTriggerMap: new Map(),
    alarmTypeMap: new Map(),
    alarmTemplateMap: new Map(),
    isSetFilter: false
  })
}
</script>

<style lang="scss" scoped>
.cmp-alarm-template {
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

  .grid {
    .receiver-tooltip-trigger {
      color: $primary;
      text-decoration: underline;
    }

    .grid-action {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &::v-deep {
      .wj-cells .wj-row:hover .file-icon * {
        fill: $black;
      }
    }

    .el-switch {
      margin-right: $gap-s;
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
  }
}
</style>
