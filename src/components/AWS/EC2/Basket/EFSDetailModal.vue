<template>
  <el-dialog
    class="basket-detail-modal"
    title="EFS 신규 신청 상세"
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
                시간당 예상 비용은 실제 청구되는<br>
                금액과 다를 수 있습니다.
              </div>
            </el-tooltip>
          </div>
          <div class="box-bottom">
            <span class="price">${{ data.price.toFixed(2) }}</span>
          </div>
        </div>
        <!-- /. 시간당 예상 비용 -->
        <!-- /. 시뮬레이션 상태 -->
      </div>
      <div class="detail-modal-name">
        <h3 class="head">
          EFS 이름
        </h3>
        <div class="round-box name-box">
          {{ orderData.fileSystemName }}
        </div>
      </div>
      <!-- /. EFS 명 -->

      <div class="detail-modal-apply-range">
        <h3 class="head">
          적용 범위
        </h3>
        <ul class="round-box apply-range-box">
          <!-- v-for="(item, idx) of ['One Zone', '가용영역 A', '가용영역 B']" -->
          <li
            v-for="(item, idx) of ['Region']"
            :key="item"
          >
            <img
              v-if="idx === 0"
              :src="require('../../../../assets/images/EC2/icon-region.svg')"
            >
            {{ item }}
          </li>
        </ul>
      </div>
      <!-- /. AMI -->

      <div class="detail-modal-spec">
        <div class="left">
          <h3 class="head">
            성능 모드
          </h3>
          <div
            class="round-box spec-box"
            v-if="orderData.performanceMode === 'generalPurpose'"
          >
            <div class="-info-img">
              <img :src="require('../../../../assets/images/EC2/carbon_meter-alt.svg')">
              범용 모드
            </div>
          </div>
        </div>
        <!-- /. 성능 모드 -->
        <div class="right">
          <h3 class="head">
            파일 처리량
          </h3>
          <div class="round-box spec-box">
            <div class="-info-img">
              <img :src="require('../../../../assets/images/EC2/fluent_table-resize-row-28-regular.svg')">
              {{ orderData.throughtputMode ? '버스트모드' : '프로비저닝됨' }}
              <!-- ❌ 프로비저닝됨 -->
            </div>

            <div
              v-if="false"
              class="provision-info"
            >
              <i class="mdi mdi-information-outline" />
              <span>1024 MiB/s</span>
              <span>3072 MiB/s</span>
            </div>
          </div>
          <!-- ❌ 프로비저닝됨 -->
        </div>
        <!-- /. 파일 처리량 -->
      </div>
      <!-- /. 성능 모드 / 파일 처리량 -->

      <div
        class="detail-modal-policy"
        v-if="false"
      >
        <h3 class="head">
          파일 시스템 정책
        </h3>
        <ul class="round-box policy-box">
          <li><div>기본적으로 루트 액세스 금지</div></li>
          <li><div>기본적으로 읽기 전용 액세스 제공</div></li>
          <li><div>익명 액세스 금지</div></li>
          <li><div>모든 클라이언트에 대해 전송 중 암호화 적용</div></li>
        </ul>
      </div>
      <!-- /. ❌ 파일 시스템 정책 -->

      <div
        class="detail-modal-lifecycle"
        v-if="false"
      >
        <h3 class="head">
          데이터 수명 주기
        </h3>

        <div class="round-box etc-info-box">
          <div class="item">
            <span>IA 전환</span>
            <span>마지막 액세스 이후 30일 경과</span>
          </div>
          <div class="item">
            <span>IA 외부로 전환</span>
            <span>처음 액세스 할 때</span>
          </div>
        </div>
      </div>
      <!-- /. ❌ 데이터 수명 주기 -->

      <div class="detail-modal-network">
        <h3 class="head">
          네트워크
        </h3>

        <div class="round-box etc-info-box">
          <div class="item">
            <span>VPC</span>
            <span>{{ envType[orderData.environment] }}</span>
          </div>
          <!-- <div class="item">
            <span>서브넷</span>
            <span>내부</span>
          </div>
          <div class="item">
            <span>IP</span>
            <span>xxx.xxx.xxx.xxx</span>
          </div> -->
        </div>
      </div>
      <!-- /. 네트워크 -->

      <div
        class="detail-modal-sg"
        v-if="false"
      >
        <div class="detail-modal-sg__header">
          <h3>
            보안그룹
          </h3>
          <span
            v-if="expandedSg"
            class="expand"
            @click="expandSg(expandedSg)"
          >
            접기
            <i class="mdi mdi-chevron-up" />
          </span>
          <span
            v-else
            class="expand"
            @click="expandSg(expandedSg)"
          >
            펼침
            <i class="mdi mdi-chevron-down" />
          </span>
        </div>
        <!-- /. 보안그룹 -->

        <div class="detail-modal-sg__body round-box">
          <div class="detail-modal-sg__body-head">
            <div class="name">
              <!-- {{ testData.groupName }} -->
            </div>
            <div class="count">
              <vertical-list
                :data="[
                ]"
              />
              <!-- {
                    name: '인바운드 규칙',
                    value: testData.inboundRules.length
                  },
                  {
                    name: '아웃바운드 규칙',
                    value: testData.outboundRules.length
                  } -->
            </div>
          </div>
          <security-group-list-tab
            v-show="expandedSg"
            :item="{testData : ''}"
          />
        </div>
        <!-- /. ❌ 보안그룹 탭s -->
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
import VerticalList from '../Util/VerticalList.vue'
import SecurityGroupListTab from '../Forms/SecurityGroupListTab.vue'

export default {
  components: { VerticalList, SecurityGroupListTab },
  name: 'EFSDetailModal',
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
      } else {
        this.$el.scrollIntoView(0, 0)
        this.expandedSg = true
      }
    }
  },
  async created () {
    this.orderData = { ...this.data.orderData }
  },
  methods: {
    expandSg (state) {
      this.expandedSg = !state
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
      width: 100%;
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

  &-name {
    .name-box {
      padding: 15px 20px;
      font-size: 14px;
      font-weight: 700;
    }
  }

  &-apply-range {
    .apply-range-box {
      padding: 20px;
      display: flex;
      justify-content: space-around;
      align-items: center;
      height: 60px;

      li {
        border-right: 1px solid #E0E0E0;
        flex: 1 1 auto;
        text-align: center;
        height: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;

        img {
          display: block;
          width: 20px;
          height: 20px;
          margin-right: 10px;
        }
        &:last-child { border: none; }
      }
    }
  }

  &-spec {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 10px;

    .spec-box {
      display: flex;
      align-items: center;
      justify-content: space-around;

      .-info-img {
        height: 76px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;

        img {
          display: block;
          width: 30px;
          height: 30px;
          margin-right: 10px;
        }
      }

      .provision-info {
        color: $text-lighter-gray;
        font-size: 13px;
        font-weight: normal;

        .mdi {
          font-size: 12px;
          color: $main-blue;
          margin-right: 5px;
        }

        span:nth-of-type(1) {
          line-height: 10px;
          padding-right: 10px;
          margin-right: 10px;
          border-right: 1px solid #e0e0e0;
          display: inline-block;
        }
      }
    }
  }

  &-policy {
    .policy-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      line-height: 50px;
      text-align: center;

      > li {
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        > div { width: 340px; }
        &::after {
          content: '';
          position: absolute;
          width: 1px;
          height: 10px;
          background: #E0E0E0;
          right: 0;
        }

        &:nth-of-type(-n+2) { div { border-bottom: 1px solid #E0E0E0; } }
        &:nth-of-type(2), &:nth-of-type(4) { &::after { content: none; } }
      }
    }
  }

  &-lifecycle,
  &-network {
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

  &-sg {
    &__body {
      padding: 20px 30px;

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
