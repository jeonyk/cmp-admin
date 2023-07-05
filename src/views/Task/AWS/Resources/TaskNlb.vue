<template>
  <div>
    <div v-if="isReviewMode">
      <task-nlb-review
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
            :columns="newColumns"
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
            <template #elbName>
              <cmp-status-tag
                :class="getOrderType(data.resourceType, 'class')"
                style="margin-right:10px;"
              >
                {{ getOrderType(data.resourceType) }}
              </cmp-status-tag>
              {{ data.elbName }}
            </template>
            <template #registerListener>
              <ul class="instance-list">
                <li>
                  <span>{{ $v('프로토콜') }}</span>
                  <span>{{ $v('포트') }}</span>
                  <span>{{ $v('대상그룹') }}</span>
                </li>
                <li
                  v-for="(r,index) in data.registerListener"
                  :key="index"
                >
                  <span> {{ r.protocol }}</span>
                  <span> {{ r.port }}</span>
                  <span> {{ getTgName(r) }}</span>
                </li>
              </ul>
            </template>
            <template #regionName>
              {{ data.vpcRaw.regionDisplayName }}
            </template>
            <template #vpcEnvironment>
              {{ data.vpcEnvironment | typeCategory }}
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
import TaskNlbReview from './TaskNlbReview.vue'

export default {
  mixins: [TaskResourceMixins],
  components: {
    TaskButtonGroups,
    // GFoldable,
    TaskStatusTags,
    TaskServiceTags,
    TaskNlbReview
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
          label: r.elbName,
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
        this.list = this.convert(newVal)
      }
    },
    selectedIdx: {
      immediate: true,
      handler (newIdx) {
        this.$emit('selected', newIdx)
      }
    }
  },
  methods: {
    getTgName (tg) {
      // 신규, 삭제 건에 대한 사용자 넘어오는 데이터가 다름
      if (typeof tg.targetGroup === 'object') {
        return tg.targetGroup.targetGroupName
      }
      return tg.targetGroupName
    },
    convert (resourceList) {
      if (!resourceList) return []
      return resourceList.map((r) => {
        return {
          ...r,
          ...(r.data && JSON.parse(r.data)),
          regionName: r.vpcRaw?.regionName,
          type: r.registerListener?.[0]?.protocol,
          vpcEnvironment: r.vpcRaw?.environment
        }
      })
    }
  },
  data () {
    return {
      reviewColumns: [
        { binding: 'elbName', header: this.$v('NLB 이름') },
        { binding: 'info', header: this.$v('자원 정보'), customHtml: true }
      ],
      list: [],
      rawInfo: [],
      resourceList: [],
      selectedResource: {},
      tabs: [
        { field: 'memo', name: '메모' }
      ],
      newColumns: [
        // 로드밸런스이름
        // 가용영역
        // 로드밸런스 종류
        // 삭제방지: 비활성
        // 스키마 : 내부
        // 교차 영역 로드 밸런싱 : 비활성
        // vpc 운영
        // 엑세스 로그
        // 인스턴스
        { binding: 'elbName', header: '로드밸런서 이름', keyPath: this.$v('로드밸런서 이름') },
        { binding: 'regionName', header: '리전', keyPath: this.$v('리전') },
        { binding: 'type', header: '로드밸런서 종류', keyPath: this.$v('로드밸런서 종류') },
        // { binding: 'isDeletable', header: '삭제 방지' },
        // { binding: 'schema', header: '스키마' },
        // { binding: 'interactiveNlb', header: '교차 영역 로드 밸런싱' },
        { binding: 'vpcEnvironment', header: 'VPC' },
        // { binding: 'accessLog', header: '엑세스 로그' },
        { binding: 'registerListener', header: '리스너', keyPath: this.$v('리스너'), colspan: true },
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

.instance-list {
  width:40%;
  > li {
    &:first-child {
      padding-bottom:5px;
      border-bottom:1px solid #888;
    }
    padding: 10px 0px;
    display:flex;
    > span {
      width:33%;
    }
  }
}
</style>
