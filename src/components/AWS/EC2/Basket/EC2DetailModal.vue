<!-- 관리자에서 안쓰는 컴포넌트 -->

<template>
  <el-dialog
    class="basket-detail-modal"
    title="EC2 신규 신청 상세"
    :visible="active"
    @close="$emit('close')"
    @closed="$emit('closed')"
    width="830px"
    top="3vh"
  >
    <div class="detail-modal">
      <div class="detail-modal-info">
        <div class="box">
          <div class="box-top">
            <!-- 시간당 예상 비용 -->
            <h2>시간당 예상 비용</h2>
            <el-tooltip
              placement="bottom"
              popper-class="shade-popper"
              effect="light"
            >
              <i class="mdi mdi-information-outline" />
              <div slot="content">
                시간당 예상 비용은 실제 청구되는<br>금액과 다를 수 있습니다.
              </div>
            </el-tooltip>
          </div>
          <div class="box-bottom">
            <span class="price">${{ data.price.toFixed(2) }}</span>
            <!-- 🟡 -->
          </div>
        </div>
        <!-- /. 시간당 예상 비용 -->

        <div class="box">
          <div class="box-top">
            <h2>시뮬레이션 상태</h2>
            <el-tooltip
              placement="bottom"
              popper-class="shade-popper"
              effect="light"
            >
              <i class="mdi mdi-information-outline" />
              <div slot="content">
                선택하신 자원 시뮬레이션 시행 후<br>
                신청 가능 여부를 미리 알려드립니다.
              </div>
            </el-tooltip>
          </div>
          <div
            class="box-bottom"
            v-if="data.simulationStatus"
          >
            <el-tooltip
              v-if="data.simulationStatus === 'ERROR'"
              placement="bottom"
              popper-class="shade-popper"
              effect="light"
              :content="data.failMessage"
            >
              <new-status-tag :tag-type="status[data.simulationStatus].type">
                {{ status[data.simulationStatus].tag }}
              </new-status-tag>
            </el-tooltip>
            <!-- /. 시뮬레이션 상태 with 실패사유 -->

            <new-status-tag
              v-else
              :tag-type="status[data.simulationStatus].type"
            >
              {{ status[data.simulationStatus].tag }}
            </new-status-tag>
          </div>
        </div>
        <!-- /. 시뮬레이션 상태 -->
      </div>
      <div class="detail-modal-instance">
        <h3 class="head">
          인스턴스 이름
        </h3>
        <div class="round-box instance-box">
          {{ data.orderData.instanceName }}
        </div>
      </div>
      <!-- /. 인스턴스 이름 -->

      <div class="detail-modal-ami">
        <h3 class="head">
          AMI
        </h3>
        <div class="round-box ami-box">
          <div class="left">
            <span class="bit">{{ data.orderData.amazonImageDto.architecture }} </span>
            <span class="name">{{ data.orderData.amazonImageDto.name }}</span>
          </div>
          <div class="right">
            <span class="os">운영체제</span>
            <span class="name">Amazon Linux</span>
          </div>
        </div>
      </div>
      <!-- /. AMI -->

      <div class="detail-modal-spec">
        <h3 class="head">
          인스턴스 사양
        </h3>
        <div class="round-box spec-box">
          <div class="spec-name">
            {{ data.orderData.instanceTypeDto.instanceType }}
          </div>
          <div class="spec-list">
            <vertical-list
              :data="[
                { name: 'vCPU', value: data.orderData.instanceTypeDto.vcpu },
                { name: '메모리(GiB)', value: data.orderData.instanceTypeDto.memory },
                { name: '네트워크 성능', value: data.orderData.instanceTypeDto.networkPerformance }
              ]"
            />
          </div>
        </div>
      </div>
      <!-- /. 인스턴스 사양 -->

      <div class="detail-modal-storage">
        <div class="detail-modal-storage__header">
          <h3>
            스토리지
          </h3>
          <span
            class="expand"
            @click="expandedStorage = !expandedStorage"
          >
            {{ expandedStorage ? $v('접기') : $v('펼침') }}
            <i :class="['mdi', `mdi-chevron-${ expandedStorage ? 'up' : 'down' }`]" />
          </span>
        </div>
        <!-- /. 스토리지 -->

        <div
          v-show="expandedStorage"
          class="detail-modal-storage__body round-box"
        >
          <el-table :data="storageLists">
            <el-table-column
              v-for="column of storageColumns"
              :key="column.prop"
              :label="column.label"
              :width="column.width"
              :prop="column.prop"
            />
          </el-table>
        </div>
        <!-- /. 스토리지 목록 -->

        <div class="round-box etc-info-box">
          <div class="item">
            <span>세부 모니터링</span>
            <span>{{ data.orderData.monitoringState ? '활성' : '비활성' }}</span>
          </div>
          <div class="item">
            <span>VPC</span>
            <span>{{ envType[data.orderData.vpcDto.environment] }}</span>
          </div>
          <div class="item">
            <span>서브넷</span>
            <span>{{ data.orderData.subnetDto.isPublic ? '외부' : '내부' }}</span>
          </div>
        </div>
        <!-- /. 세부 모니터링 / VPC / 서브넷 -->
      </div>

      <div class="detail-modal-sg">
        <div class="detail-modal-sg__header">
          <h3>
            보안그룹
          </h3>
          <span
            class="expand"
            @click="expandedSg = !expandedSg"
          >
            {{ expandedSg ? $v('접기') : $v('펼침') }}
            <i :class="['mdi', `mdi-chevron-${ expandedSg ? 'up' : 'down' }`]" />
          </span>
        </div>
        <!-- /. 보안그룹 -->

        <div
          class="detail-modal-sg__body round-box"
          v-for="item in orderData.securityGroupDtoList"
          :key="item.groupId"
        >
          <div class="detail-modal-sg__body-head">
            <div class="name">
              {{ item.groupName }}
            </div>
            <div class="count">
              <vertical-list
                :data="[
                  { name: '인바운드 규칙', value: item.inboundRuleCount },
                  { name: '아웃바운드 규칙', value: item.outboundRuleCount }
                ]"
              />
            </div>
          </div>
          <security-group-list-tab
            v-show="expandedSg"
            :item="item"
          />
        </div>
        <!-- /. 보안그룹 탭s -->
      </div>
    </div>
    <!-- /. 신청 내용 -->

    <section class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="$emit('close')"
      >
        취소
      </button>
      <button
        class="button"
        type="is-primary"
        :disabled="data.simulationStatus === 'ERROR' || data.simulationStatus === 'PROCEED'"
        @click="$emit('put-order', [data.basketIdx])"
      >
        주문함 담기
      </button>
    </section>

    <!-- /. 취소, 주문함 담기 버튼 -->
  </el-dialog>
</template>

<script>
import { getDetailSecurityGroups } from '@/components/Apis/AWS'

import VerticalList from '../Util/VerticalList.vue'
import SecurityGroupListTab from '../Forms/SecurityGroupListTab.vue'

export default {
  components: { VerticalList, SecurityGroupListTab },
  name: 'EC2DetailModal',
  props: {
    active: {
      type: Boolean,
      default: false
    },
    /**
     * EC2 상세 Data
     */
    data: {
      type: Object,
      default: () => {}
    }
  },
  computed: {
    storageLists () {
      return this.orderData?.blockDeviceMapping?.map(({ deviceName, size, volumeType, volumeSizeType, throughput, iops, ...item }, idx) => {
        return {
          type: idx > 0 ? 'EBS' : '루트',
          deviceName,
          size: size + ' ' + volumeSizeType,
          volumeType,
          iops: iops || '해당 사항 없음',
          process: throughput || '해당 사항 없음'
        }
      })
    }
  },
  watch: {
    async active (isActive) {
      if (isActive) {
        this.orderData = { ...this.data.orderData }
        return await this.setSecurityGroups(this.orderData)
      } else {
        this.$el.scrollIntoView(0, 0)
        this.expandedSg = true
      }
    }
  },
  async created () {
    this.orderData = { ...this.data.orderData }
    await this.setSecurityGroups(this.orderData)
  },
  methods: {
    expandSg (state) {
      this.expandedSg = !state
    },
    async setSecurityGroups (orderData = this.orderData) {
      try {
        const groupIds = orderData.securityGroupDtoList.map(({ groupId }) => `groupIdList=${groupId}`).join('&')
        const { data } = await getDetailSecurityGroups(groupIds)

        const result = {}

        data.forEach(({ securityGroupRuleDtoList }) => {
          securityGroupRuleDtoList.forEach(({ groupId, ...group }) => {
            if (result[groupId]) result[groupId].push(group)
            else result[groupId] = [group]
          })
        })

        orderData.securityGroupDtoList = orderData.securityGroupDtoList.map((group) => {
          const item = {
            ...group,
            inboundRules: result[group.groupId].filter(i => !i.isEgress),
            outboundRules: result[group.groupId].filter(i => i.isEgress)
          }
          return item
        })
      } catch (error) {
        console.error('@@ setSecurityGroups : ', error)
      }
    }
  },
  data: () => ({
    expandedStorage: true,
    expandedSg: true,
    rules: [],
    securityGroupList: {},
    orderData: {},
    storageColumns: [
      { label: '볼륨 유형', width: '100', prop: 'type' },
      { label: '디바이스', width: '100', prop: 'deviceName' },
      { label: '볼륨 크기', width: '100', prop: 'size' },
      { label: '볼륨 유형', width: '', prop: 'volumeType' },
      { label: 'IOPS', width: '150', prop: 'iops' },
      { label: '처리량(MB/초)', width: '120', prop: 'process' }
    ],
    envType: { STG: '스테이징', DEV: '개발', PRD: '운영' },
    status: {
      PROCEED: { type: 'progress', tag: '진행중' },
      DONE: { type: 'running', tag: '사용 가능' },
      ERROR: { type: 'error', tag: '실패' }
    }
  })
}
</script>

<style lang="scss" scoped>
.basket-detail-modal {
  &::v-deep .el-dialog {
    max-height: 1000px;
    padding: 30px 0 30px 0;
    .el-dialog__header {
      padding: 0 30px;
    }
  }
}

.detail-modal {
  overflow-y: auto;
  height: 700px;
  margin: 0 10px 0 20px; // scroll 너비 고려...
  padding: 0 10px;
  &-info {
    display: flex;
    align-items: stretch;

    > .box {
      display: inline-block;
      width: 380px;
      border-radius: 6px;
      background-color: #fafafa;
      padding: 20px 30px 20px 25px;
      box-sizing: border-box;

      .box-top {
        text-align: left;

        h2 {
          display: inline-block;
          margin-right: 5px;
          font-size: 20px;
        }

        .mdi {
          color: $main-blue;
        }
      }

      .box-bottom {
        text-align: right;

        .price {
          color: $main-blue;
          font-weight: 700;
          font-size: 20px;
        }
      }
    }

    > :first-child {
      margin-right: $gap-s;
    }
  }

  &-instance {
    .instance-box {
      padding: 15px 20px;
      font-size: 14px;
      font-weight: 700;
    }
  }

  &-ami {
    .ami-box {
      padding: 18px 30px 18px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .left {
        .bit {
          color: $blue;
          font-size: 12px;
        }
        flex: 1 1 200px;
        margin-right: 20px;
        overflow: hidden;
        white-space: nowrap;
        height: 14px;
        text-overflow: ellipsis;
      }

      .right {
        .os { color: $text-lighter-gray; }
      }

      .left,
      .right {
        .name {
          font-size: 14px;
          font-weight: 700;
          margin-left: $gap-s;
        }
      }
    }
  }

  &-spec {
    .spec-box {
      display: flex;
      justify-content: space-between;
      padding: 18px 30px 18px 20px;

      .spec-name {
        font-weight: bold;
      }
    }
  }

  &-sg,
  &-storage {
    &__header {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      margin-bottom: 15px;

      .mdi {
        position: relative;
        top: 1px;
      }

      .expand {
        cursor: pointer;
      }
    }
  }

  &-storage {
    &__body {
      padding: 10px 15px;

      &::v-deep {
        .el-table {
          &::before {
            display: none;
          }

          th {
            color: #333;
            font-weight: 400;
          }
        }
      }
    }

    .etc-info-box {
      margin-top: $gap-s;
      box-sizing: border-box;
      padding: 18px 0;
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      justify-content: center;

      > :not(:last-child) {
        border-right: 1px solid #e0e0e0;
      }

      > * {
        flex: 0 0 33%;
        text-align: center;

        > :first-child {
          color: $text-lighter-gray;
          margin-right: $gap-s;
        }

        > :last-child {
          font-weight: bold;
        }
      }
    }
  }

  &-sg {
    &__body {
      padding: 20px 30px;
      margin-bottom: 10px;

      &-head {
        display: flex;
        flex-wrap: nowrap;
        justify-content: space-between;

        .name {
          font-size: 16px;
          font-weight: bold;
        }
      }

      .expand {
        margin-top: 30px;
      }
    }
  }

  .head {
    margin-bottom: 15px;
    margin-top: 40px;
    display: inline-block;
  }

  h3 {
    font-size: 14px;
    font-weight: 700;
  }

  .round-box {
    box-sizing: border-box;
    border: 1px solid #caced0;
    border-radius: 6px;
  }
}
</style>
