<template>
  <div>
    <div v-if="isReviewMode">
      <task-target-group-review
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
      <main v-if="list && list.length">
        <div
          v-for="(data, idx) in list"
          :key="idx"
        >
          <vertical-table
            v-if="idx === selectedIdx"
            :columns="getColumnsByType(data.targetType)"
            :data="data"
            type="horizontal"
            style="position: relative;"
          >
            <template #status="{row}">
              <task-status-tags
                :status="data.workItemState"
                @set-success="$event => setEmitData('set-success', { data :$event, row})"
              />
            </template>
            <template #targetGroupName>
              <cmp-status-tag
                :class="getOrderType(data.resourceType, 'class')"
                style="margin-right:10px;"
              >
                {{ getOrderType(data.resourceType) }}
              </cmp-status-tag>
              {{ data.targetGroupName }}
            </template>
            <template #targetType>
              <div>{{ data.targetType === 'ip' ? 'IP' : $v('인스턴스') }}</div>
            </template>
            <template #port>
              {{ data.protocol }}  {{ data.port }}
            </template>
            <template #healthCheckProperty>
              <span>{{ $v('포트') }} : {{ data.healthCheckPort }} / </span>
              <span>{{ $v('시간초과') }} : {{ data.healthCheckTimeoutSeconds }} {{ $v('초') }} / </span>
              <span>{{ $v('정상 임계값') }} : {{ data.healthyThresholdCount }} {{ $v('연속 상태 확인 성공 횟수') }}  </span><br>
              <span>{{ $v('비정상 임계값') }} : {{ data.unhealthyThresholdCount }} {{ $v('연속 상태 확인 실패 횟수') }} / </span>
              <span>{{ $v('간격') }} : {{ data.healthCheckIntervalSeconds }} {{ $v('초') }} </span>
            </template>

            <template #registerTarget>
              <ul class="instance-list">
                <li>
                  <span>{{ list[idx].targetType === 'ip' ? 'IP' : $v('인스턴스') }}</span>
                  <span>{{ $v('포트') }}</span>
                </li>
                <li
                  v-for="(r,index) in data.registerTarget"
                  :key="index"
                >
                  <span> {{ list[idx].targetType === 'ip' ? r.targetId : r.instanceName }}</span>
                  <span> {{ r.targetPort }}</span>
                </li>
              </ul>
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
import TaskResourceMixins from '../TaskResourceMixins'
import TaskButtonGroups from '@/components/ButtonGroups/TaskButtonGroups.vue'
import TaskStatusTags from './TaskStatusTags.vue'
import TaskServiceTags from './TaskServiceTags.vue'
import TaskTargetGroupReview from './TaskTargetGroupReview.vue'

export default {
  mixins: [TaskResourceMixins],
  components: {
    TaskButtonGroups,
    TaskStatusTags,
    TaskServiceTags,
    TaskTargetGroupReview
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
    computedTags () {
      return this.list?.map((r) => {
        return {
          label: r.targetGroupName,
          workItemState: r.workItemState
        }
      })
    }
  },
  watch: {
    data: {
      deep: true,
      immediate: true,
      handler (newVal) {
        this.list = newVal.map(x => {
          return {
            ...x,
            ...(x.data && JSON.parse(x.data))
          }
        })
      }
    },
    selectedIdx: {
      immediate: true,
      handler (newIdx) {
        // this.selectedSgIdx = 0
        this.$emit('selected', newIdx)
      }
    }
  },
  methods: {
    getColumnsByType (type) {
      if (type === 'ip') return this.ipColumns
      return this.columns
    },
    clickTagName (idx) {
      this.selectedIdx = idx
    }
  },
  data () {
    return {
      list: [],
      resourceList: [],
      selectedResource: {},
      newColumns: [],
      reviewColumns: [
        { binding: 'targetGroupName', header: this.$v('대상그룹 이름') },
        { binding: 'info', header: this.$v('자원 정보'), customHtml: true }
      ],
      columns: [
        { binding: 'targetGroupName', header: this.$v('대상그룹 이름') },
        { binding: 'targetType', header: this.$v('대상그룹 유형') },
        { binding: 'port', header: this.$v('대상그룹 서비스 포트') },
        { binding: 'healthCheckProtocol', header: this.$v('상태 확인 프로토콜') },
        { binding: 'healthCheckPath', header: this.$v('상태 확인 경로') },
        { binding: 'healthCheckProperty', header: this.$v('상태 확인 속성') },
        { binding: 'registerTarget', header: this.$v('인스턴스'), colspan: true },
        { binding: 'autoScheduleAt', header: '예약 설정', keyPath: this.$v('예약 설정'), customHtml: true },
        { binding: 'status', header: this.$v('상태'), customHtml: true }
      ],
      ipColumns: [
        { binding: 'targetGroupName', header: this.$v('대상그룹 이름') },
        { binding: 'targetType', header: this.$v('대상그룹 유형') },
        { binding: 'port', header: this.$v('대상그룹 서비스 포트') },
        { binding: 'healthCheckProtocol', header: this.$v('상태 확인 프로토콜') },
        { binding: 'healthCheckPath', header: this.$v('상태 확인 경로') },
        { binding: 'healthCheckProperty', header: this.$v('상태 확인 속성') },
        { binding: 'registerTarget', header: 'IP', colspan: true },
        { binding: 'autoScheduleAt', header: '예약 설정', keyPath: this.$v('예약 설정'), customHtml: true },
        { binding: 'status', header: this.$v('상태'), customHtml: true }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.card-wrapper {
  display:flex;
  gap:20px;
  flex-direction: row;
  flex-wrap:wrap;
}
.tag-header {
  padding-bottom: 20px;
  display: flex;
  justify-content: space-between;
}

.new {
  color: #5d5fef;
  border: 1px solid #5d5fef;
  background: rgba(93, 95, 239, 0.2);
}

.proceed, .change {
  color: #f4a462;
  border: 1px solid #f4a462;
  background: rgba(244, 164, 98, 0.2);
  font-weight: 700;
}

.delete {
  color: #fa5657;
  border: 1px solid #fa5657;
  background: rgba(250, 86, 87, 0.2);
  font-weight: 700;
}

.error {
  color: #fa5657;
  border: 1px solid #fa5657;
  background: rgba(250, 86, 87, 0.2);
  font-weight: 700;
  padding-left:15px;
}

.cancel {
  background: transparent;
  color: #999999;
}

.done {
  color: #5d5fef;
  border: 1px solid #5d5fef;
  background: rgba(93, 95, 239, 0.2);
  margin-left:10px;
}

.button-area {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px 0px;
}

.re-run-button {
  top:-50px;
  right:0px;
  position:absolute;
}

.instance-list {
  width:100%;
  > li {
    padding: 10px 0px;
    display:flex;
    &:first-child {
      padding-bottom:5px;
      border-bottom:1px solid #888;
    }
    > span {
      width:44%;
    }
  }
}

</style>
