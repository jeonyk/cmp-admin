<template>
  <div>
    <h1 style="color:#fff;">
      Peering
    </h1>
    <header class="tag-header">
      <div class="instance-tags">
        <el-tag
          :class="['name-tag', { '-selected': idx === selectedIdx }, {'is-canceled' : tag.workItemState === 'CANCELED_AT_REVIEW'} ]"
          v-for="(tag, idx) in computedTags"
          :key="tag.label"
          @click="clickTagName(idx)"
        >
          {{ getTagText(tag) }}
        </el-tag>
      </div>
      <task-button-groups
        v-if="taskType === 'REVIEW'"
        :service-status="selectedService.workItemState"
        :role-status="selectedService.workState"
        @cancel="setEmitData('cancel')"
        @set="setEmitData('set')"
        @update="setEmitData('update')"
        @restore="setEmitData('restore')"
        @excute="setEmitData('excute')"
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
          <template #status>
            <task-status-tags
              :status="data.workItemState"
              @set-success="setEmitData('set-success')"
            />
          </template>
        </vertical-table>
      </div>
    </main>
    <cmp-grid
      style="display:none;"
      :item-source="list"
      :columns="newColumns"
    />
  </div>
</template>

<script>
import { VerticalTable } from '@sd-fe/cmp-core'
import TaskButtonGroups from '@/components/ButtonGroups/TaskButtonGroups.vue'
import TaskResourceMixins from '../TaskResourceMixins'
import TaskStatusTags from './TaskStatusTags.vue'

export default {
  mixins: [TaskResourceMixins],
  components: {
    VerticalTable,
    TaskButtonGroups,
    TaskStatusTags
  },
  props: {
    data: {
      type: [Array, Object],
      default: () => {}
    },
    taskType: {
      type: String,
      default: 'REVIEW'
    },
    orderType: {
      type: String,
      default: ''
    }
  },
  computed: {
    computedTags () {
      return this.list?.map((r) => {
        return {
          label: r.transitGatewayName,
          workItemState: r.workItemState
        }
      })
    },
    selectedService () {
      return this.data[this.selectedIdx]
    }
  },
  watch: {
    data: {
      deep: true,
      immediate: true,
      handler (newVal) {
        const asd = newVal.map(x => {
          return {
            // ...x,
            ...x.data,
            workSchedule: x.workSchedule,
            workState: x.workState,
            workItemState: x.workItemState
          }
        })
        this.list = this.convert(asd)
      }
    }
  },
  methods: {
    getArrayByProp (list, prop) {
      return list.map(x => x[prop]).join(', ')
    },
    getSourcerAndTargetProjects (source, target) {
    //   this.$alert(source)
      return source + ' / ' + target
    },
    getEnvironments (source, target) {
      return this.getArrayByProp(source, 'projectEnvironment') + ' / ' + this.getArrayByProp(target, 'projectEnvironment')
    },
    getVpcs (source, target) {
      return this.getArrayByProp(source, 'destinationCidrBlock') + ' / ' + this.getArrayByProp(target, 'destinationCidrBlock')
    },
    convert (list) {
      return list.map(x => {
        return {
          ...x,
          projects: this.getSourcerAndTargetProjects(x.peeringAttachmentDto.sourceTransitGatewayAttachmentName, x.peeringAttachmentDto.targetTransitGatewayAttachmentName),
          projectEnvironment: this.getEnvironments(x.peeringAttachmentDto.createSourceVpcAttachmentDtos, x.peeringAttachmentDto.createTargetVpcAttachmentDtos),
          vpcs: this.getVpcs(x.peeringAttachmentDto.createSourceVpcAttachmentDtos, x.peeringAttachmentDto.createTargetVpcAttachmentDtos)
        //   customerGatewayName: x.vpnConnectionDto.customerGatewayDto.customerGatewayName,
        //   projectEnvironment: this.getArrayByProp(x.vpnConnectionDto.createVpcAttachmentDtos, 'projectEnvironment'),
        //   destinationCidrBlock: this.getArrayByProp(x.vpnConnectionDto.createVpcAttachmentDtos, 'destinationCidrBlock')
        }
      })
    }
  },
  data () {
    return {
      selectedIdx: 0,
      list: [],
      newColumns: [
        { binding: 'transitGatewayName', header: this.$v('연결 이름') },
        { binding: 'projects', header: this.$v('연결 이름(내 프로젝트/연결 프로젝트') },
        { binding: 'projectEnvironment', header: this.$v('연결 VPC 환경(내 프로젝트/연결 프로젝트') },
        { binding: 'vpcs', header: this.$v('연결 VPC CIDR(내 프로젝트/연결 프로젝트') },
        { binding: 'workSchedule', header: this.$v('예약 설정') }

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
  .instance-tags {
    width: 80%;
  }
  .button-wrapper {
    display: flex;
    align-items: top;
    margin-top: 20px;
  }
  .name-tag {
    cursor: pointer;
    &.-selected {
      background: #3e57c9;
    }
    &.-selected.is-canceled {} // background: #fa5657;
    &.is-canceled {}
  }
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
