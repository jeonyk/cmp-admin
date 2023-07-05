<template>
  <div>
    <div v-if="isReviewMode">
      <task-efs-review
        :columns="reviewColumns"
        :data="list"
      />
    </div>
    <div v-else>
      <header class="tag-header">
        <task-service-tags
          @click="clickTagName"
          :data="computedTags"
        />
        <task-button-groups
          v-if="selectedService.isExecutable"
          :service-status="selectedService.workItemState"
          :role-status="$roleState()"
          @cancel="setEmitData('cancel')"
          @set="setEmitData('set')"
          @update="setEmitData('update')"
          @restore="setEmitData('restore')"
          @excute="($event) => setEmitData('excute', $event)"
        />
      </header>
      <main>
        <div
          v-for="(data, idx) in list"
          :key="idx"
        >
          <vertical-table
            v-if="idx === selectedIdx"
            :data="data"
            :columns="cColumns"
            type="horizontal"
          >
            <template #status="{row}">
              <task-status-tags
                :status="data.workItemState"
                @set-success="$event => setEmitData('set-success', { data :$event, row})"
              />
            </template>
            <template #fileSystemName>
              <cmp-status-tag
                :class="getOrderType(data.resourceType, 'class')"
                style="margin-right:10px;"
              >
                {{ getOrderType(data.resourceType) }}
              </cmp-status-tag>
              {{ data.fileSystemName }}
            </template>
            <template #isRegion>
              {{ data.isRegion ? '리전' : '-' }}
            </template>
            <template #regionName>
              {{ data.regionName }}
            </template>
            <template #throughputMode>
              {{ data.throughputMode === 'bursting' ? '버스트 모드' : data.throughputMode }}
            </template>
            <template #performanceMode>
              {{ data.performanceMode === 'generalPurpose' ? '범용모드' : data.performanceMode }}
            </template>
            <template #autoScheduleAt>
              <div>
                {{ getScheduleTime(data.autoScheduleAt) }}
              </div>
            </template>
          </vertical-table>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import TaskButtonGroups from '@/components/ButtonGroups/TaskButtonGroups.vue'
import TaskResourceMixins from '../TaskResourceMixins'
import TaskStatusTags from './TaskStatusTags.vue'
import TaskServiceTags from './TaskServiceTags.vue'
import TaskEfsReview from './TaskEfsReview.vue'

export default {
  mixins: [TaskResourceMixins],
  components: {
    TaskButtonGroups,
    TaskStatusTags,
    TaskServiceTags,
    TaskEfsReview
  },
  props: {
    data: {
      type: [Array, Object],
      default: () => {}
    },
    isReviewMode: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    cColumns () {
      return this.newColumns
    },
    computedTags () {
      return this.list?.map((r) => {
        return {
          label: r.fileSystemName,
          workItemState: r.workItemState
        }
      })
    }
  },
  watch: {
    data: {
      immediate: true,
      handler (newVal) {
        const asd = newVal.map(x => {
          return {
            ...x,
            ...(x.data && JSON.parse(x.data))
          }
        })
        this.list = asd
      }
    },
    selectedIdx: {
      immediate: true,
      handler (newIdx) {
        this.selectedSgIdx = 0
        this.$emit('selected', newIdx)
      }
    }
  },
  data () {
    return {
      list: [],
      selectedSgIdx: 0,
      reviewColumns: [
        { binding: 'fileSystemName', header: this.$v('EFS 이름') },
        { binding: 'info', header: this.$v('자원 정보'), customHtml: true }
      ],
      newColumns: [
        { binding: 'fileSystemName', header: this.$v('EFS 이름') }, //
        { binding: 'isRegion', header: this.$v('적용 범위'), customHtml: true }, //
        { binding: 'vpcId', header: this.$v('연결된 VPC ID') }, //
        { binding: 'regionName', header: this.$v('선택된 가용영역') }, //
        { binding: 'performanceMode', header: this.$v('성능 모드'), colspan: false },
        { binding: 'throughputMode', header: this.$v('처리량 모드') },
        { binding: 'autoScheduleAt', header: '예약 설정', keyPath: this.$v('예약 설정'), customHtml: true },
        { binding: 'status', header: this.$v('상태'), customHtml: true }

      ]
    }
  }
}
</script>
<style lang="scss" scoped>

.tag-header {
  padding-bottom: 20px;
  display: flex;
  justify-content: space-between;
}

</style>
