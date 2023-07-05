<template>
  <div>
    <task-ec2-review
      v-if="isReviewMode"
      :columns="reviewColumns"
      :data="list"
    />
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
            :columns="newColumns"
            type="horizontal"
          >
            <template #status="{row}">
              <task-status-tags
                :status="data.workItemState"
                @set-success="$event => setEmitData('set-success', { data :$event, row})"
              />
            </template>
            <template #instanceName>
              <cmp-status-tag
                :class="getOrderType(data.resourceType, 'class')"
                style="margin-right:10px;"
              >
                {{ getOrderType(data.resourceType) }}
              </cmp-status-tag>
              {{ data.instanceName }}
            </template>
            <template #regionName>
              {{ data.region || data.regionName }}
            </template>

            <template #vcpu>
              {{ data.vcpu }} Core
            </template>
            <template #memory>
              {{ data.memory }} GB
            </template>
            <template #disks>
              <div
                v-for="(disk,index) in data.disks"
                :key="index"
              >
                {{ disk.size }} {{ disk.volumeSizeType }} ({{ checkDeviceType(disk) }})
              </div>
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
          v-if="computedGroupNames"
          style="margin-top: 20px"
          :title="$v('보안그룹')"
          foldable
          small-title
        >
          <div>
            <span
              @click="selectedSgIdx = idx"
              :class="[
                'instance-tag',
                { '-selected': idx === selectedSgIdx },
              ]"
              v-for="(name, idx) in computedGroupNames"
              :key="name"
              class="security-article-title"
            >
              {{ $v('보안그룹 ID') }} :&nbsp;{{ name }}
            </span>
          </div>
        </dashboard-panel>

        <!-- Outbound Rules -->
        <!-- Outbound Rules -->
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
          <ul class="card-wrapper">
            <bound-card
              v-for="inbound in inboundRules"
              :data="inbound"
              :key="inbound.id"
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
          <ul class="card-wrapper">
            <bound-card
              v-for="outbound in outboundRules"
              :data="outbound"
              :key="outbound.id"
            />
          </ul>
        </dashboard-panel>
      </div>
      <div
        v-else
        class="empty-zone"
      >
        {{ $v('보안그룹이 없습니다') }}
      </div>
    </div>
  </div>
</template>

<script>
import { cloneDeep } from 'lodash'
import API, { VerticalTable, DashboardPanel } from '@sd-fe/cmp-core'
import TaskButtonGroups from '@/components/ButtonGroups/TaskButtonGroups.vue'
import TaskResourceMixins from '../TaskResourceMixins'
import TaskStatusTags from './TaskStatusTags.vue'
import TaskServiceTags from './TaskServiceTags.vue'
import TaskEc2Review from './TaskEc2Review.vue'

export default {
  mixins: [TaskResourceMixins],
  components: {
    VerticalTable,
    DashboardPanel,
    TaskButtonGroups,
    TaskStatusTags,
    TaskServiceTags,
    TaskEc2Review
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
  created () {
    this.clonedData = cloneDeep(this.data)
  },
  mounted () {
    console.log(33434343434)
    console.log(this.data)
    console.log(this.selectedService)
  },
  computed: {
    list () {
      return this.data?.map(x => {
        return {
          ...x,
          ...(x.data && JSON.parse(x.data)),
          tagName: x.instanceName,
          amiId: x.amazonImageDto?.imageId || '-',
          networkPerformance: x.instanceTypeDto?.networkPerformance || '-',
          memory: String(x.instanceTypeDto?.memory),
          instanceType: x.instanceTypeDto?.instanceType,
          regionName: x.instanceTypeDto?.regionName,
          availabilityZone: x.subnetDto?.availabilityZone,
          architecture: x.amazonImageDto?.architecture,
          vcpu: String(x.instanceTypeDto?.vcpu),
          disks: x.blockDeviceMapping
          // securityGroupDtoList: this.getSecurityGroups(x.securityGroupDtoList),
        }
      })
    },
    computedTags () {
      return this.list?.map((r) => {
        return {
          label: r.instanceName,
          workItemState: r.workItemState
        }
      })
    },
    computedGroupNames () {
      return this.list[this.selectedIdx]?.securityGroupDtoList?.map(g => g.groupId)
    },
    computedSg () {
      return this.list[this.selectedIdx].securityGroupDtoList[this.selectedSgIdx]
    },
    inboundRules () {
      return this.computedSg?.securityGroupRuleDtoList
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
      return this.computedSg?.securityGroupRuleDtoList
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

  methods: {
    checkDeviceType (disk) {
      const { isRoot, volumeRootType } = disk
      if (typeof isRoot === 'boolean') return isRoot ? this.$v('루트') : 'EBS'
      if (typeof volumeRootType === 'number') return volumeRootType === 0 ? this.$v('루트') : 'EBS'
    },
    async getSecurityGroup (groupId) {
      const response = await API.work.getSecurityGroupById(groupId)
      return response.data || {}
    }
  },
  data () {
    return {
      selectedSgIdx: 0,
      reviewColumns: [
        { binding: 'instanceName', header: this.$v('EC2 이름') },
        { binding: 'info', header: this.$v('자원 정보'), customHtml: true }
      ],
      newColumns: [
        { binding: 'instanceName', header: this.$v('인스턴스 명') },
        { binding: 'networkPerformance', header: this.$v('네트워크 성능') },
        { binding: 'availabilityZone', header: this.$v('가용영역') },
        { binding: 'regionName', header: this.$v('리전') },
        { binding: 'amiId', header: 'AMI ID' },
        { binding: 'architecture', header: this.$v('아키텍쳐') },
        { binding: 'instanceType', header: this.$v('인스턴스 유형') },
        { binding: 'vcpu', header: 'vCPU' },
        { binding: 'memory', header: this.$v('메모리') },
        { binding: 'disks', header: this.$v('디스크') },
        { binding: 'autoScheduleAt', header: this.$v('예약 설정'), customHtml: true },
        { binding: 'status', header: this.$v('상태'), customHtml: true }
      ]
    }
  }
}
</script>
<style lang="scss" scoped>
.button-area {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px 0px;
}

.card-wrapper {
  display:flex;
  gap:20px;
  flex-direction: row;
  flex-wrap:wrap;
}

.re-run-button {
  top:-50px;
  right:0px;
  position:absolute;
}

.tag-header {
  padding-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
}

.delete {
  color: #fa5657;
  border: 1px solid #fa5657;
  background: rgba(250, 86, 87, 0.2);
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

.instance-tag {
  margin-right:10px;
  cursor: pointer;
  padding:5px;
  border-radius: 3px;
  font-size: 13px;
  line-height: 27px;
  border:1px solid #999;
  color:#999;
  &.-selected {
    border:1px solid $purple;
    color:  $purple;
  }
}

.flex-wrap {
  flex-wrap: wrap;
}
</style>
