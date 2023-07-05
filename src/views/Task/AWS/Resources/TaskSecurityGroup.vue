<template>
  <div>
    <div v-if="isReviewMode">
      <task-security-group-review
        :data="list"
        :columns="reviewColumns"
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
            <template #groupName>
              <cmp-status-tag
                :class="getOrderType(data.resourceType, 'class')"
                style="margin-right:10px;"
              >
                {{ getOrderType(data.resourceType) }}
              </cmp-status-tag>
              {{ data.groupName }}
            </template>

            <template #autoScheduleAt>
              <div>
                {{ getScheduleTime(data.autoScheduleAt) }}
              </div>
            </template>
          </vertical-table>
        </div>
      </main>

      <div v-if="computedGroupNames">
        <dashboard-panel
          v-if="inboundRules"
          style="margin-top: 20px"
          :title="$v('인바운드 규칙')"
          foldable
          small-title
        >
          <template #headerPostfix>
            <small
              class="reference-text"
            >({{ $v('총') }} <strong>{{ inboundRules.length || 0 }}</strong>{{ $v('개') }})</small>
          </template>
          <ul
            v-if="inboundRules && inboundRules.length"
            class="card-wrapper"
          >
            <bound-card
              v-for="(inbound, index) in inboundRules"
              :data="inbound"
              :key="inbound.id + index"
            />
          </ul>
        </dashboard-panel>

        <dashboard-panel
          v-if="outboundRules"
          style="margin-top: 20px"
          :title="$v('아웃바운드 규칙')"
          foldable
          small-title
        >
          <template #headerPostfix>
            <small
              class="reference-text"
            >({{ $v('총') }} <strong>{{ outboundRules.length || 0 }}</strong>{{ $v('개') }})</small>
          </template>
          <ul
            v-if="outboundRules && outboundRules.length"
            class="card-wrapper"
          >
            <bound-card
              v-for="(inbound, index) in outboundRules"
              :data="inbound"
              :key="inbound.id + index"
            />
          </ul>
        </dashboard-panel>
      </div>
    </div>
  </div>
</template>

<script>
import { DashboardPanel } from '@sd-fe/cmp-core'
import TaskButtonGroups from '@/components/ButtonGroups/TaskButtonGroups.vue'
import TaskResourceMixins from '../TaskResourceMixins'
import TaskStatusTags from './TaskStatusTags.vue'
import TaskServiceTags from './TaskServiceTags.vue'
import TaskSecurityGroupReview from './TaskSecurityGroupReview.vue'

export default {
  mixins: [TaskResourceMixins],
  components: {
    DashboardPanel,
    TaskButtonGroups,
    TaskStatusTags,
    TaskServiceTags,
    TaskSecurityGroupReview
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
    list () {
      return this.data.map(x => {
        return {
          ...x,
          ...(x.data && JSON.parse(x.data))
        }
      })
    },
    computedTags () {
      return this.list?.map((r) => {
        return {
          label: r.groupName,
          workItemState: r.workItemState
        }
      })
    },
    computedGroupNames () {
      return this.list[this.selectedIdx]?.securityGroupRuleDtoList?.map(g => g.groupId)
    },
    inboundRules () {
      return this.list[this.selectedIdx]?.securityGroupRuleDtoList
        ?.filter((rule) => !rule.isEgress)
        .map((rule) => {
          return {
            ...rule,
            id: rule.ruleId || '-',
            title: rule.ruleType,
            method: rule.ruleType,
            source: rule.ipv4Ranges,
            toPort: rule.toPort,
            fromPort: rule.fromPort,
            desc: rule.ruleDescription
          }
        })
    },
    outboundRules () {
      return this.list[this.selectedIdx]?.securityGroupRuleDtoList
        ?.filter((rule) => rule.isEgress)
        .map((rule) => {
          return {
            ...rule,
            id: rule.ruleId || '-',
            title: rule.ruleType,
            method: rule.ruleType,
            source: rule.ipv4Ranges,
            toPort: rule.toPort,
            fromPort: rule.fromPort,
            desc: rule.ruleDescription
          }
        })
    }
  },
  watch: {
    selectedIdx: {
      immediate: true,
      handler (newIdx) {
        this.selectedSgIdx = 0
        this.$emit('selected', newIdx)
      }
    }
  },
  methods: {},
  data () {
    return {
      reviewColumns: [
        { binding: 'groupName', header: this.$v('보안그룹 이름') },
        { binding: 'info', header: this.$v('자원 정보'), customHtml: true }
      ],
      newColumns: [
        { binding: 'groupName', header: this.$v('그룹 이름') },
        { binding: 'description', header: this.$v('설명') },
        { binding: 'vpcId', header: this.$v('연결된 VPC ID'), customHtml: true },
        { binding: 'vpcKor', header: this.$v('환경') },
        { binding: 'autoScheduleAt', header: this.$v('예약 설정'), customHtml: true },
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
</style>
