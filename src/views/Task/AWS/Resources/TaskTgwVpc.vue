<template>
  <div>
    <!-- <pre style="color:#fff; border:1px solud purple">
      {{ list }}
    </pre> -->
    <h1 style="color:#fff;">
      VPC
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

          <template #connectionInfo>
            <div class="attachments">
              <div
                v-for="(vpc, idx) in data.createVpcAttachmentDtos"
                :key="idx"
                class="wrapper"
              >
                <div class="input-row">
                  <div class="input-row__title">
                    VPC 환경
                  </div>
                  <div class="input-row__value">
                    <span class="bold">
                      운영
                      <!-- {{ vpc.environmentKor }} -->
                    </span>
                  </div>
                </div>
                <div class="input-row">
                  <div class="input-row__title">
                    CIDR
                  </div>
                  <div class="input-row__value">
                    <el-input
                      class="el-input"
                      disabled
                      :value="vpc.destinationCidrBlock"
                    />
                  </div>
                </div>
                <div class="input-row">
                  <div class="input-row__title required">
                    연결 이름
                  </div>
                  <div class="input-row__value">
                    <el-input
                      v-model="vpc.transitGatewayAttachmentName"
                    />
                    <!-- @input="onChangeAttachmentName" -->
                    <!-- :class="{ error: !vpc.name && vpc.errorEmptyAttachName }" -->
                  </div>
                </div>
              </div>
            </div>
          </template>
        </vertical-table>
        <div style="color:#fff; margin-top:30px;">
          <h3 style="margin-bottom:15px;">
            VPC 연결 정보
          </h3>
          <cmp-grid
            :item-source="data.createVpcAttachmentDtos"
            :columns="connectionColumns"
          />
        </div>
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
    },
    selectedIdx: {
      immediate: true,
      handler (newIdx) {
        this.selectedSgIdx = 0
        this.$emit('selected', newIdx)
      }
    }
  },
  methods: {
    getArrayByProp (list, prop) {
      return list.map(x => x[prop]).join(', ')
    },
    convert (list) {
      return list.map(x => {
        return {
          ...x,
          projectEnvironment: this.getArrayByProp(x.createVpcAttachmentDtos, 'projectEnvironment'),
          destinationCidrBlock: this.getArrayByProp(x.createVpcAttachmentDtos, 'destinationCidrBlock'),
          createVpcAttachmentDtos: x.createVpcAttachmentDtos.map(vpc => {
            return {
              ...vpc,
              transitGatewayId: x.transitGatewayId
            }
          })
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
        { binding: 'transitGatewayId', header: this.$v('TGW ID') },
        { binding: 'attachmentType', header: this.$v('연결 타입') },
        { binding: 'projectEnvironment', header: this.$v('연결 VPC 환경') },
        { binding: 'destinationCidrBlock', header: this.$v('연결 CIDR') },
        { binding: 'workSchedule', header: this.$v('예약 설정') }
        // { binding: 'connectionInfo', header: this.$v('연결 정보'), colspan: true }
      ],
      connectionColumns: [
        { binding: 'transitGatewayAttachmentName', header: this.$v('연결 이름') },
        { binding: 'transitGatewayId', header: this.$v('연결 ID') },
        { binding: 'destinationCidrBlock', header: this.$v('리소스 ID') },
        { binding: 'vpcId', header: this.$v('리소스 ID') },
        { binding: 'projectEnvironment', header: this.$v('연결 유형') }
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

.attachments {
  display:flex;
  gap:20px;
  > .wrapper {
    padding: $gap-m $gap;
    border: 1px solid $input-stroke;
    border-radius: 6px;
    display:flex;
    flex-direction: column;
    gap:30px;
    width:100%;

    &:not(:last-of-type) {
      // margin-bottom: $gap; // direction column 일 경우
    }
    .input-row {
      // border:1px solid red;
      display:flex;
      &__title {
        flex:1 0 20%;
      }

      &__value {
        flex:1 0 80%;
      }
    }

    .input-row:last-of-type {
      margin-bottom: 0;
    }

    .bold {
      font-weight: bold;
      color: $main-blue;
    }

    h4 {
      margin: $gap 0 $gap-s 0;
    }

    .el-input {
      &::v-deep {
        .el-input__inner {
          background: #2A2D44 !important;
          // background:black !important;
          border:none !important;
        }

        &.error {
          .el-input__inner {
            border-color: $main-blue;
          }
        }
      }
    }
  }
}
</style>
