<template>
  <article class="review">
    <header class="review-head">
      <h1>검토</h1>
    </header>
    <section class="review-instance">
      <header class="review-instance-head">
        <h2>인스턴스 기본정보</h2>
        <i
          v-if="shared.isEdit"
          class="mdi mdi-pencil edit-icon"
          @click="onClickEditInstanceInfo"
        />
      </header>
      <section
        v-if="!shared.isEdit"
        class="review-instance-body form"
      >
        <simple-info-table
          v-for="info in instance"
          :key="info.title"
          :title="info.title"
          :desc="info.desc"
          :slot-name="info.slotName"
          width="130"
        >
          <template #storage>
            <el-table
              class="storage-table"
              :data="instanceInfo.storage"
              stripe
            >
              <el-table-column
                prop="volumeRootType"
                label="볼륨 유형"
              >
                <template slot-scope="scope">
                  {{ scope.row.volumeRootType === 0 ? '루트' : 'EBS' }}
                </template>
              </el-table-column>
              <el-table-column
                prop="device"
                label="디바이스"
              />
              <el-table-column
                prop="volumeSize"
                label="볼륨 크기"
              />
              <el-table-column
                prop="iops"
                label="IOPS"
              />
              <el-table-column
                prop="throughput"
                label="처리량"
              />
            </el-table>
          </template>
        </simple-info-table>
        <i
          class="mdi mdi-pencil edit-icon"
          @click="moveToInstanceStep"
        />
      </section>
      <section class="review-instance-body list">
        <simple-dropdown v-if="changedInstance.length">
          <template #title>
            <span><strong>변경</strong> (총 {{ changedInstance.length }}건)</span>
          </template>
          <review-changes :changes="changedInstance" />
        </simple-dropdown>
        <!-- 인스턴스 기본 정보 변경 -->
        <simple-dropdown v-if="addedInstance.length">
          <template #title>
            <span><strong>추가</strong> (총 {{ addedInstance.length }}건)</span>
          </template>
          <review-changes :changes="addedInstance" />
        </simple-dropdown>
        <!-- 인스턴스 기본 정보 추가 -->
        <simple-dropdown v-if="removedInstance.length">
          <template #title>
            <span><strong>삭제</strong> (총 {{ removedInstance.length }}건)</span>
          </template>
          <review-changes :changes="removedInstance" />
        </simple-dropdown>
        <!-- 인스턴스 기본 정보 삭제 -->
        <div
          v-if="
            !changedInstance.length &&
              !addedInstance.length &&
              !removedInstance.length &&
              shared.isEdit
          "
          class="empty-data"
        >
          수정 내역이 없습니다.
        </div>
        <!-- 전부 없음 -->
      </section>
    </section>
    <!-- 인스턴스 기본 정보 검토 (신청건) -->
    <section class="review-network">
      <header class="review-network-head">
        <h2>네트워크/보안그룹</h2>
        <i
          v-if="shared.isEdit"
          class="mdi mdi-pencil edit-icon"
          @click="moveToNetworkStep"
        />
      </header>
      <section
        v-if="!shared.isEdit"
        class="review-network-body form"
      >
        <simple-info-table
          v-for="info in network"
          :key="info.title"
          :title="info.title"
          :desc="info.desc"
          :slot-name="info.slotName"
          width="130"
        >
          <template #securityGroup>
            <div
              v-for="group in networkInfo.group"
              :key="group.groupId"
            >
              {{ group.groupName }} (인바운드 규칙:
              {{ group.inboundRuleCount }} / 아웃바운드 규칙:
              {{ group.outboundRuleCount }})
            </div>
          </template>
        </simple-info-table>
        <i
          class="mdi mdi-pencil edit-icon"
          @click="moveToNetworkStep"
        />
      </section>
      <section
        v-else
        class="review-network-body list"
      >
        <simple-dropdown v-if="changedNetwork.length">
          <template #title>
            <span><strong>변경</strong> (총 {{ changedNetwork.length }}건)</span>
          </template>
          <review-changes :changes="changedNetwork" />
        </simple-dropdown>
      </section>
      <div
        v-if="!changedNetwork.length && shared.isEdit"
        class="empty-data"
      >
        수정 내역이 없습니다.
      </div>
      <!-- 전부 없음 -->
    </section>
    <section
      v-if="!shared.isEdit"
      class="review-service-date"
    >
      <span class="required">{{ $t('common.GRID.serviceStart') }}</span>
      <div class="service-date-form">
        <el-date-picker
          v-model="serviceDate.date"
          class="date-select"
          type="date"
          format="yyyy.MM.dd"
          :placeholder="$t('common.GRID.serviceStart')"
          :disabled="shared.isEdit"
          :picker-options="svcOpenDtOpt"
        />
        <el-time-select
          v-model="serviceDate.hours"
          class="time-select"
          :picker-options="{ start: '00:00', step: '00:10', end: '23:00' }"
          :placeholder="$t('common.PLACEHOLDER.setTime')"
          :disabled="shared.isEdit || !serviceDate.date"
        />
      </div>
    </section>
    <section class="review-price">
      <template v-if="!shared.isEdit">
        <p class="review-price-text">
          월 예상 비용
        </p>
        <el-tooltip
          effect="light"
          popper-class="shade-popper"
        >
          <i class="mdi mdi-information-outline" />
          <div slot="content">
            월 예상 비용은 실제 청구되는<br>
            금액과 다를 수 있습니다.
          </div>
        </el-tooltip>
        <span class="review-price-dollar">$</span>
        <span class="review-price-number">{{ allCost }}</span>
      </template>
      <template v-else>
        <review-edit-price
          :before="beforeAllCost"
          :after="allCost"
        />
      </template>
      <!-- <p class="review-price-text">
        월 예상 비용
      </p>
      <el-tooltip
        effect="light"
        popper-class="shade-popper"
      >
        <i class="mdi mdi-information-outline" />
        <div slot="content">
          시간당 예상 비용은 실제 청구되는<br>
          금액과 다를 수 있습니다.
        </div>
      </el-tooltip>
      <span class="review-price-dollar">$</span>
      <span class="review-price-number">12.00</span> -->
    </section>
    <section class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="moveToNetworkStep"
      >
        이전
      </button>
      <button
        class="button"
        type="is-primary"
        @click="createBasketEC2"
      >
        저장
      </button>
    </section>
  </article>
</template>

<script>
import SimpleInfoTable from './SimpleInfoTable.vue'
import SimpleDropdown from './Edit/SimpleDropdown.vue'
// import Work from '@/components/Apis/Order'
import { mapGetters } from 'vuex'
import dayjs from 'dayjs'
import ReviewChanges from './Edit/ReviewChanges.vue'
import ReviewEditPrice from '../../Common/ReviewEditPrice.vue'

export default {
  components: { SimpleInfoTable, SimpleDropdown, ReviewChanges, ReviewEditPrice },
  name: 'ReviewStep',
  props: {
    instanceInfo: {
      type: Object,
      required: true
    },
    moveToOne: {
      type: Function,
      required: true
    },
    moveToTwo: {
      type: Function,
      required: true
    },
    networkInfo: {
      type: Object,
      required: true
    },
    instanceChanges: {
      type: Array,
      default: () => []
    },
    networkChanges: {
      type: Array,
      default: () => []
    },
    // 변경 전 스토리지
    originStorage: {
      type: [Object, Array],
      default: () => null
    },
    // 변경 전 보안그룹
    originSecurityGroup: {
      type: [Object, Array],
      default: () => null
    },
    beforeAllCost: {
      type: [Number, String],
      default: 0
    },
    allCost: {
      type: [Number, String],
      default: 0
    }
  },
  inject: ['shared'],
  computed: {
    ...mapGetters({
      // user: state => state.auth.user,
      // user: state => state.auth.user
      // selectedProject: 'project/getSelectedProject'
    }),
    user () {
      return this.$store.getters.user || {}
    },
    selectedProject () {
      return {
        project: {
          projectIdx: this.shared.basketData.orderData.projectIdx
        }
      }
    },
    /**
     * (수정 신청시) 변경된 인스턴스 기본 정보
     */
    changedInstance () {
      if (!this.shared.isEdit) return []
      return this.instanceChanges.filter(change => change.type === 'change')
    },
    /**
     * (수정 신청시) 추가된 인스턴스 기본 정보
     */
    addedInstance () {
      if (!this.shared.isEdit) return []
      return this.instanceChanges.filter(change => change.type === 'add')
    },
    /**
     * (수정 신청시) 삭제된 인스턴스 기본 정보
     */
    removedInstance () {
      if (!this.shared.isEdit) return []
      return this.instanceChanges.filter(change => change.type === 'remove')
    },
    /**
     * (수정 신청시) 변경된 인스턴스 기본 정보
     */
    changedNetwork () {
      if (!this.shared.isEdit) return []
      return this.networkChanges.filter(
        change => change.type === 'change-network'
      )
    },
    /**
     * (수정 신청시) 추가된 인스턴스 기본 정보
     */
    addedNetwork () {
      if (!this.shared.isEdit) return []
      return this.networkChanges.filter(change => change.type === 'add')
    },
    /**
     * (수정 신청시) 삭제된 인스턴스 기본 정보
     */
    removedNetwork () {
      if (!this.shared.isEdit) return []
      return this.networkChanges.filter(change => change.type === 'remove')
    },
    instance () {
      return [
        { title: 'Region', desc: this.instanceInfo.region },
        { title: '인스턴스 이름', desc: this.instanceInfo.instanceName },
        {
          title: 'AMI',
          desc: this.instanceInfo.ami ? this.instanceInfo.ami.name : ''
        },
        {
          title: '인스턴스 사양',
          desc: this.instanceInfo.instanceSpec?.instanceType
        },
        {
          title: '스토리지',
          desc: this.instanceInfo.instanceName,
          slotName: 'storage'
        },
        {
          title: '세부 모니터링',
          desc: this.instanceInfo.monitoringActive ? '활성' : '비활성'
        } // TODO 다국어
      ]
    },
    network () {
      return [
        {
          title: 'VPC',
          desc: this.networkInfo.vpc ? this.networkInfo.vpc.envStr : ''
        },
        { title: '서브넷', desc: this.networkInfo.subnet ? '내부' : '외부' },
        { title: '보안그룹', slotName: 'securityGroup' }
      ]
    }
  },
  watch: {
    'serviceDate.date' (date) {
      if (!date) this.serviceDate.hours = null
    },
    'shared.currentStep' (step) {
      if (step === 3 && this.shared.basketEdit) {
        this.serviceDate.date = new Date(
          this.shared.basketData.orderData.serviceDate
        )
        this.serviceDate.hours = dayjs(
          new Date(this.shared.basketData.orderData.serviceDate)
        ).format('HH:mm')
      }
    }
  },
  methods: {
    /**
     * (수정 신청시) 네트워크/보안그룹 연필 아이콘 클릭
     */
    onClickEditNetworkGroup () {
      this.moveToNetworkStep()
    },
    /**
     * (수정 신청시) 인스턴스 기본 정보 연필 아이콘 클릭
     */
    onClickEditInstanceInfo () {
      this.moveToInstanceStep()
    },
    /**
     * 서비스 개시일을 타임스탬프 형태로 변환
     */
    getServiceDate () {
      if (!this.serviceDate.date || !this.serviceDate.hours) return null

      const splitTime = this.serviceDate.hours.split(':')
      const date = dayjs(new Date(this.serviceDate.date))
        .set('hour', parseInt(splitTime[0]))
        .set('minute', parseInt(splitTime[1]))

      return date.toDate().getTime()
    },
    /**
     * 장바구니에 넣을 데이터를 검증
     */
    validateBasketData (basketData) {
      if (
        !this.shared.isEdit &&
        (!this.serviceDate.date || !this.serviceDate.hours)
      ) {
        this.$alert('서비스 개시일을 선택해주세요.')
        return false
      }

      return true
    },
    /**
     * 컴포넌트 데이터 형태 -> 보안그룹
     */
    transformSecurityGroup (group) {
      return group.map(child => child.groupId)
    },
    /**
     * 컴포넌트 데이터 형태 -> 스토리지
     */
    transformStorage (storage) {
      // let iops = storage.iops || null
      // let throughput = storage.throughput || null

      return storage.map(st => {
        const iops = st.iops === '해당 사항 없음' ? null : st.iops
        const thr = st.throughput === '해당 사항 없음' ? null : st.throughput

        const storageCopy = {
          ...st,
          deviceName: st.device,
          volumeType: st.volumeType,
          size: parseInt(st.volumeSize),
          deleteTermination: true, // 인스턴스 삭제시 스토리지 같이 삭제
          iops, // IOPS
          throughput: thr // 처리량
        }

        delete storageCopy.error

        return storageCopy
      })
    },
    /**
     * 컴포넌트에서 사용하고 있는 데이터 형태를
     * API에서 받는 형태로 변환
     */
    transformToOrderData () {
      const storage = this.transformStorage(this.instanceInfo.storage)
      const securityGroups = this.networkInfo.group

      const orderData = {
        ...this.shared.basketData.orderData,
        projectIdx: this.selectedProject.project.projectIdx, // 선택된 프로젝트 idx (테스트)
        instanceTypeDto: this.instanceInfo.instanceSpec, // 인스턴스 타입 e.g.) t2.micro
        instanceName: this.instanceInfo.instanceName, // 인스턴스 이름
        monitoringState: this.instanceInfo.monitoringActive, // 모니터링 활성화 여부
        amazonImageDto: this.instanceInfo.ami, // AMI ID
        vpcDto: this.networkInfo.vpc, // VPC ID
        subnetDto: this.networkInfo.azZone, // Subnet ID
        blockDeviceMapping: storage, // 스토리지
        securityGroupDtoList: securityGroups // 보안그룹 ID
        // serviceDate: null // 서비스 개시일
      }

      if (this.shared.isEdit) {
        if (this.shared.basketEdit) {
          orderData.instanceTypeDto = this.shared.basketData.orderData.instanceTypeDto
          orderData.serviceDate = this.shared.basketData.orderData.serviceDate
          orderData.subnetDto = this.shared.basketData.orderData.subnetDto
          orderData.vpcDto = this.shared.basketData.orderData.vpcDto
        } else {
          orderData.instanceTypeDto = this.shared.editData.orderData.instanceTypeDto
          orderData.serviceDate = this.shared.editData.orderData.serviceDate
          orderData.subnetDto = this.shared.editData.orderData.subnetDto
          orderData.vpcDto = this.shared.editData.orderData.vpcDto
        }
      } else {
        orderData.serviceDate = this.getServiceDate()
      }

      return orderData
    },
    /**
     * 장바구니에 넣을 수 있는 데이터 형태로 데이터 가공
     */
    getBasketData () {
      const basketData = [
        {
          beforePrice: this.beforeAllCost || null, // 이전 금액 (TODO)
          createTime: new Date().getTime(), // 등록 날짜
          orderData: {}, // EC2 데이터
          price: Number(this.allCost) || null, // 금액 (TODO)
          projectIdx: this.selectedProject.project.projectIdx, // 프로젝트 (테스트 중) - 프로젝트 생성 개발되면 수정 필요
          userId: this.user.userId, // 신청하는 유저의 사번 (vuex)
          userName: this.user.userName, // 신청하는 유저의 이름 (vuex)
          workType: 'EC2',
          orderType: ''
        }
      ]

      // if (!this.shared.isEdit) basketData[0].orderType = 'NEW'
      // else basketData[0].orderType = 'CHANGE'

      // basketData[0].orderType = this.shared.editData.orderType
      basketData[0].orderData = this.transformToOrderData()

      // 자원 변경 신청건
      if (this.shared.isEdit && !this.shared.basketEdit) {
        const orderData = basketData[0].orderData

        orderData.networkSecurityChanges = this.networkChanges
        orderData.instanceInfoChanges = this.instanceChanges
        orderData.beforeData = {
          blockDeviceMapping: this.originStorage,
          securityGroupList: this.originSecurityGroup
        }
      }

      return basketData
    },
    /**
     * EC2 자원을 장바구니에 반영
     */
    createBasketEC2 () {
      if (!this.validateBasketData()) {
        return
      }

      this.$confirm('자원을 변경하시겠습니까?')
        .then(() => {
          const basketData = this.getBasketData()
          this.$emit('update-order', basketData[0].orderData)
        })
        .catch(() => false)
    },
    moveToPrev () {
      this.$confirm('이전 단계로 이동하시겠습니까?')
        .then(() => this.moveToTwo())
        .catch(() => false)
    },
    moveToInstanceStep () {
      this.$confirm(
        '인스턴스 기본 정보 신청 내용을<br>수정하시겠습니까?<br><span style="color: #d95252;">* 확인 클릭 시 해당 단계로 이동합니다.</span>',
        { dangerouslyUseHTMLString: true }
      )
        .then(() => this.moveToOne())
        .catch(() => false)
    },
    moveToNetworkStep () {
      this.$confirm(
        '네트워크/보안그룹 신청 내용을<br>수정하시겠습니까?<br><span style="color: #d95252;">* 확인 클릭 시 해당 단계로 이동합니다.</span>',
        { dangerouslyUseHTMLString: true }
      )
        .then(() => this.moveToTwo())
        .catch(() => false)
    }
  },
  data: () => ({
    serviceDate: {
      date: null,
      hours: null
    },
    svcOpenDtOpt: {
      // datepicker 설정
      disabledDate (time) {
        const today = new Date().toDateString()
        return time.getTime() < new Date(today)
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.review {
  header {
    display: flex;
    justify-content: space-between;

    .edit-icon {
      margin: $gap-m $gap-s $gap-s 0;
      cursor: pointer;
    }
  }

  h1 {
    font-size: 16px;
    margin-top: 0;
  }

  h2 {
    margin: $gap-m 0 $gap-s 0;
    font-size: 14px;
  }

  .form {
    margin-bottom: $gap;
    padding: 40px;
    background-color: #f9f9f9;
    border-radius: 6px;
    position: relative;

    > .info-table + .info-table {
      margin-top: $gap;
    }

    &::v-deep .info-table {
      &-desc {
        color: #333;
      }
    }

    .edit-icon {
      position: absolute;
      top: 20px;
      right: 20px;
      color: #9596ad;

      &:hover {
        cursor: pointer;
        color: #333;
      }
    }

    .storage-table {
      background-color: transparent;

      &::before {
        background-color: transparent;
      }

      &::v-deep {
        tr,
        td,
        th {
          background-color: transparent;
          color: #333;
          border-color: #e0e0e0;
        }

        td,
        th {
          padding: 3px 0;
        }

        th {
          font-weight: normal;
          padding-top: 0;
        }

        td {
          border: none;
        }
      }
    }
  }

  .list {
    & > * + * {
      margin-top: $gap-s;
    }
  }

  &-price {
    margin-top: 120px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    flex-wrap: nowrap;

    &-text {
      font-size: 22px;
      font-weight: bold;
      margin-right: 5px;
    }

    > .mdi {
      font-size: 18px;
      color: $main-blue;
      margin-right: 25px;
    }

    &-dollar {
      margin-right: $gap;
    }

    &-number {
      font-size: 28px;
      font-weight: bold;
      color: $main-blue;
    }
  }

  &-service-date {
    margin-top: $gap;

    span,
    .service-date-form {
      display: inline-block;
    }

    span {
      margin-right: 25px;
      font-size: 14px;
      font-weight: bold;
    }

    .service-date-form {
      margin-top: $gap-s;

      &::v-deep {
        .date-select {
          margin-right: $gap-s;
          width: 180px;
        }

        .time-select {
          width: 120px;
        }
      }
    }
  }

  .modal-button-area {
    border-top: 1px solid $section-stroke;
    padding-top: $gap;
    margin-top: 40px;
  }

  .empty-data {
    border: 1px solid #caced0;
    border-radius: 6px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $gap;
    margin-top: 0;
  }

  .required {
    position: relative;

    &::after {
      position: absolute;
      content: "*";
      color: $main-blue;
      display: inline-block;
      top: -2px;
      margin-left: 5px;
    }
  }
}

.time-select {
  &::v-deep {
    .el-input__icon {
      line-height:32px;
    }
  }
}
</style>
