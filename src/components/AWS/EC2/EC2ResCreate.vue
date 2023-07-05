<template>
  <el-dialog
    :visible="active"
    v-show="isDataLoaded"
    @close="$emit('close')"
    @closed="$emit('closed')"
    :title="isEdit ? 'EC2 수정' : 'EC2 신청'"
    width="1220px"
    top="10vh"
    class="ec2-create-modal"
    :before-close="beforeClose"
  >
    <div class="ec2-create">
      <div class="ec2-create-wrapper">
        <div
          class="create-info"
          :class="{
            'is-edit': isEdit,
            half: steps[1].active,
            full: steps[2].active
          }"
        >
          <create-info-step
            v-for="(step, index) in steps"
            v-bind="step"
            :key="index"
            :index="index + 1"
            @expand="expanded => expand(step, expanded)"
            @walk-step="walkStep"
          >
            <template v-if="index === 0">
              <template v-if="!isEdit">
                <div class="info-table-wrap">
                  <simple-info-table
                    title="Region"
                    :desc="instanceInfo.region"
                  />
                  <simple-info-table
                    title="이름"
                    :desc="instanceInfo.instanceName"
                  />
                  <simple-info-table
                    title="AMI"
                    :desc="instanceInfo.ami ? instanceInfo.ami.name : ''"
                  />
                  <simple-info-table
                    title="사양"
                    :desc="
                      instanceInfo.instanceSpec
                        ? instanceInfo.instanceSpec.instanceType
                        : ''
                    "
                  />
                  <simple-info-table
                    title="스토리지"
                    :desc="storageInfoText"
                  />
                  <simple-info-table
                    title="세부 모니터링"
                    :desc="instanceInfo.monitoringActive ? '활성' : '비활성'"
                  />
                </div>
              </template>
              <template v-else>
                <changes-content :items="instanceInfoChanges" />
              </template>
            </template>
            <!-- 인스턴스 기본 정보 상세 -->
            <template v-else-if="index === 1">
              <div
                v-if="!isEdit"
                class="info-table-wrap"
              >
                <simple-info-table
                  title="VPC"
                  :desc="networkInfo.vpc ? networkInfo.vpc.envStr : ''"
                />
                <simple-info-table
                  title="서브넷"
                  :desc="getSubnetSummary()"
                />
                <simple-info-table
                  title="보안그룹"
                  slot-name="securityGroup"
                >
                  <template
                    v-if="networkInfo. group && networkInfo.group.length"
                    #securityGroup
                  >
                    <div
                      v-for="group in networkInfo.group"
                      :key="group.groupId"
                    >
                      {{ group.groupName }}
                    </div>
                  </template>
                </simple-info-table>
              </div>
              <changes-content
                v-else
                :items="networkInfoChanges"
                type="network"
              />
            </template>
            <!-- 네트워크/보안그룹 상세 -->
            <template v-else />
            <!-- 검토 상세 -->
          </create-info-step>
          <div class="create-preview">
            <div class="create-preview-head">
              <h2>월 예상 비용</h2>
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
            </div>
            <div
              v-if="!isEdit"
              class="create-preview-price"
            >
              <span>$</span><strong>{{ allCost }}</strong>
            </div>
            <!-- 신청시 월 예상 비용 (좌측) -->
            <div
              v-else
              class="edit-preview-price"
            >
              <div class="flex-up-bottom">
                <div class="up">
                  수정 전
                </div>
                <div class="bottom">
                  $ <strong>{{ beforeAllCost }}</strong>
                </div>
              </div>
              <div class="divider-icon">
                <arrow-right />
              </div>
              <div class="flex-up-bottom">
                <div class="up">
                  수정 후
                </div>
                <div class="bottom">
                  $ <strong class="em">{{ allCost }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="create-content">
          <instance-info
            v-show="currentStep === 1"
            ref="instanceInfo"
            :instance-name.sync="instanceInfo.instanceName"
            :selected-ami.sync="instanceInfo.ami"
            :selected-spec.sync="instanceInfo.instanceSpec"
            :storage.sync="instanceInfo.storage"
            :monitor.sync="instanceInfo.monitoringActive"
            :instance-info-changes="instanceInfoChanges"
            @move-to-next="moveToTwoStep"
            @cancel-create="cancelCreate"
            @change-storage="onChangeStorage"
            @monitor-change="onChangeMonitoring"
            @origin-storage-data="onOriginStorageData"
          />
          <!-- 인스턴스 기본 정보 스텝 -->
          <aws-network-security
            v-show="currentStep === 2"
            ref="networkSecurity"
            :steps="steps"
            @move-to-prev="moveToOneStep"
            @move-to-next="moveToThreeStep"
            @sync-security="syncSecurity"
            @sync-subnet="syncSubnet"
            @network-change="onChangeNetwork"
            @origin-security-group="onOriginSecurityGroup"
            :vpc.sync="networkInfo.vpc"
            :subnet.sync="networkInfo.subnet"
            :subnet-az.sync="networkInfo.azZone"
            :edit-security-group="editSecurityGroup"
          />
          <!-- 네트워크/보안그룹 스텝 -->
          <review-step
            v-show="currentStep === 3"
            :move-to-one="moveToOneStep"
            :move-to-two="moveToTwoStep"
            :instance-info="instanceInfo"
            :network-info="networkInfo"
            @close="$emit('close')"
            @create="$emit('create')"
            @update-order="updateOrder"
            :instance-changes="instanceInfoChanges"
            :network-changes="networkInfoChanges"
            :origin-storage="originStorageData"
            :origin-security-group="originSecurityGroupData"
            :before-all-cost="beforeAllCost"
            :all-cost="allCost"
          />
          <!-- 검토 스텝 -->
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
/**
 * 자원관리 > EC2 신청시 뜨는 모달
 * {@link https://www.figma.com/file/pa5IgOdP0v8gmTC3exxxpn/CMP-2%EB%8B%A8%EA%B3%84_share?node-id=4319%3A17550}
 */
import CreateInfoStep from './CreateInfoStep.vue'
import ArrowRight from '@/components/Icons/ArrowRight.vue'

// 스텝별 컴포넌트
import InstanceInfo from './Forms/InstanceInfo.vue'
import NetworkSecurity from './Forms/NetworkSecurity.vue'
import ReviewStep from './Forms/ReviewStep.vue'
import SimpleInfoTable from './Forms/SimpleInfoTable.vue'
import ChangesContent from './Forms/Edit/ChangesContent.vue'

import { cloneDeep } from 'lodash'
import { billUtils } from '../Common/ResCreateUtil'

export default {
  name: 'EC2ResCreate',
  components: {
    CreateInfoStep,
    InstanceInfo,
    SimpleInfoTable,
    'aws-network-security': NetworkSecurity,
    ReviewStep,
    ArrowRight,
    ChangesContent
  },
  props: {
    active: {
      type: Boolean,
      required: true
    },
    isEdit: {
      // 수정 상태인지 아닌지
      type: Boolean,
      required: false,
      default: false
    },
    editData: {
      // 수정 상태일 시 데이터 수정 데이터
      type: Object,
      required: false,
      default: null
    },
    editSecurityGroup: {
      type: Array,
      default: () => []
    },
    basketEdit: {
      // 장바구니에서 수정하는지
      type: Boolean,
      default: false
    },
    basketData: {
      // 장바구니 데이터 - basketEdit: true 일 필요 있음
      type: Object,
      default: () => ({})
    }
  },
  mixins: [billUtils],
  provide () {
    const shared = {}
    const sharedKeys = [
      'active',
      'currentStep',
      'isEdit',
      'basketEdit',
      'basketData',
      'steps',
      'regionName'
    ]

    sharedKeys.forEach(key => {
      Object.defineProperty(shared, key, {
        get: () => key === 'regionName' ? this.instanceInfo.regionName : this[key],
        enumerable: true
      })
    })

    if (this.isEdit && this.basketEdit) {
      Object.defineProperty(shared, 'editData', {
        get: () => this.basketData,
        enumerable: true
      })
    } else if (this.isEdit && !this.basketEdit) {
      Object.defineProperty(shared, 'editData', {
        get: () => this.editData,
        enumerable: true
      })
    }

    return {
      shared
    }
  },
  watch: {
    currentStep: {
      immediate: true,
      handler (step) {
        if (step === 3) {
          this.steps.forEach(step => (step.expanded = false))
          this.steps[0].expanded = true
          this.steps[1].expanded = true
        } else if (step === 2) {
          this.steps[0].expanded = false
          this.steps[1].expanded = true
        } else {
          this.steps[0].expanded = true
          this.steps[1].expanded = false
        }
      }
    },
    active: {
      immediate: true,
      handler (visible) {
        if (!visible) {
          this.initData()

          // 수정 상태일 때 모달 종료
          if (this.isEdit) {
            this.monitoringChanges = []
            this.storageChanges = []
            this.networkInfoChanges = []
          }
        } else if (visible && this.isEdit) {
          this.initEditData()

          if (this.basketEdit) {
            this.copyChanges()
            this.beforeAllCost = this.basketData.beforePrice
          } else {
            this.beforeAllCost = this.editData.orderData?.beforePrice || 0
          }
        }

        if (visible) {
          this.steps[0].expanded = true
        }
      }
    }
  },
  computed: {
    // ...mapGetters({
    //   selectedProject: 'project/getSelectedProject'
    // }),
    selectedProject () {
      return {
        project: this.basketData.orderData.projectIdx
      }
    },
    isBasketCreateEdit () {
      return this.visible && this.basketEdit && this.basketOrderType === 'NEW'
    },
    isBasketChangeEdit () {
      return this.visible && this.basketEdit && this.basketOrderType === 'CHANGE'
    },
    storageInfoText () {
      if (this.instanceInfo.storage && !this.instanceInfo.storage.length) {
        return ''
      }
      const text = this.instanceInfo.storage
        .map((sto, i) => this.convertStorageToText(sto, true, i + 1))
        .join('\n')
      return text
    },
    instanceInfoChanges () {
      const changes = [...this.storageChanges, ...this.monitoringChanges]

      changes.sort((a, b) => {
        if (a.type === 'change') return -1
        else if (b.type === 'change') return 1
        else return 0
      })

      return changes
    },
    allCost () {
      const result = this.specCost + this.storageCost
      // return Number.isInteger(result) ? result : Number(result.toFixed(2))
      return Number(result.toFixed(4))
    }
  },
  async created () {
    // 믹스인 함수 호출
    this.instanceInfo.region = this.basketData.orderData.region
    this.instanceInfo.regionName = this.basketData.orderData.instanceTypeDto.regionName
    try {
      this.ec2BillingData = await this.getBillingList('ec2', this.instanceInfo.regionName)
      this.ebsBillingData = await this.getBillingList('ebs', this.instanceInfo.regionName)

      this.setEC2BillingData()
      this.startWatchWithBilling()
    } catch (error) {
      console.log('@error', error)
    } finally {
      this.isDataLoaded = true
    }
  },
  methods: {
    updateOrder (order) {
      // $emit('update-order') 리전 속성 추가
      this.$emit('update-order', order)
    },
    getPriceSpec (spec) {
      if (!spec) return

      const price = this.ec2BillingDataMap.get(spec.instanceType)
      if (!price) return 0

      return price.pricePerMonth
    },
    getPriceStorage (storage) {
      if (!storage || !storage.length) return 0

      let cost = 0

      storage.forEach(sto => {
        const price = this.ebsBillingData.find(ebs => ebs.type === sto.volumeType)
        if (!price) return

        cost += price.pricePerMonth * (parseInt(sto.volumeSize) || 0)
      })

      return cost
    },
    /**
     * 인스턴스 사양 과금 표를 Map 형태로 가공
     */
    setEC2BillingData () {
      this.ec2BillingDataMap = new Map()

      if (this.ec2BillingData && this.ec2BillingData.length) {
        this.ec2BillingData.forEach(price => {
          this.ec2BillingDataMap.set(price.type, price)
        })
      }
    },
    /**
     * 인스턴스 정보 감지 시작 (빌링 데이터 조회 후)
     * 과금 금액 책정을 위해서
     */
    startWatchWithBilling () {
      this.$watch(vm => [vm.instanceInfo.instanceSpec, vm.instanceInfo.storage],
        ([spec, storage]) => {
          // 선택된 사양, 스토리지 없음 (AMI 미선택 상태)
          if (!spec && (!storage || !storage.length)) return

          if (spec) this.specCost = this.getPriceSpec(spec)
          if (storage && storage.length) this.storageCost = this.getPriceStorage(storage)
        }, {
          immediate: true,
          deep: true
        })
    },
    /**
     * 서브넷 요약 정보 반환
     */
    getSubnetSummary () {
      if (this.networkInfo.azZone) {
        return (this.networkInfo.subnet ? '내부' : '외부') + ` (${this.networkInfo.azZone.availabilityZone})`
      }
      return this.networkInfo.subnet ? '내부' : '외부'
    },
    /**
     * 장바구니에서 변경 신청을 한 자원을 변경하는 경우
     * 바뀌는 변경점에 대해서 복사하기
     */
    copyChanges () {
      this.monitoringChanges = this.basketData.orderData.instanceInfoChanges.filter(change => change.id.includes('monitor'))
    },
    onOriginSecurityGroup (origin) {
      this.originSecurityGroupData = origin
    },
    onOriginStorageData (origin) {
      this.originStorageData = origin
    },
    /**
     * 장바구니 신청건 수정하는 케이스 모달 열릴 때
     */
    initBasketCreateEdit () {
    },
    /**
     * 장바구니 변경건 수정하는 케이스 모달 열릴 때
     */
    initBasketChangeEdit () {
    },
    /**
     * 네트워크/보안그룹 변경점
     */
    onChangeNetwork (changes) {
      this.networkInfoChanges = changes
    },
    /**
     * 수정시 기본 데이터 세팅
     */
    initEditData () {
      if (this.basketEdit) return
      // TODO
      this.instanceInfo.instanceName = this.editData.instanceName
      this.instanceInfo.instanceSpec = {}
      this.instanceInfo.monitoringActive = false
      this.instanceInfo.storage = this.editData.storage
      this.networkInfo.vpc = this.editData.orderData.vpcDto
      this.networkInfo.subnet = this.editData.orderData.subnetDto
      this.networkInfo.azZone = this.editData.availabilityZone
      this.networkInfo.group = cloneDeep(this.editSecurityGroup)
    },
    /**
     * 세부 모니터링 변경사항 업데이트
     */
    onChangeMonitoring (changes) {
      this.monitoringChanges = changes
    },
    /**
     * 스토리지 변경사항 업데이트
     */
    onChangeStorage (changes) {
      // 자식 컴포넌트에서 스토리지에 대한 변경점을 파악하고
      // 변경 내역을 여기서 수신한다.
      // 여기서는 스토리지 변경점에 대해서 무엇이 어떻게 변했는지
      // 문자열로 변환한다.
      this.storageChanges = changes.map(change => {
        return {
          ...change,
          items: change.items.map(item => ({
            ...item,
            changeValue:
              typeof item.changeValue === 'string'
                ? item.changeValue
                : this.convertStorageToText(item.changeValue)
          }))
        }
      })
    },
    /**
     * 스토리지 데이터 문자열로 변경
     */
    convertStorageToText (storage, order = false, orderNum = 0) {
      const info = [
        `볼륨유형: ${storage.volumeRootType === 0 ? '루트' : 'EBS'}`,
        '디스크명: ' + storage.device,
        '용량: ' + storage.volumeSize + storage.volumeSizeType,
        '유형: ' + storage.volumeType,
        'IOPS: ' + storage.iops,
        '처리량: ' + storage.throughput
      ].join(' / ')
      return order && orderNum ? `${orderNum}. ${info}` : info
    },
    /**
     * 단계 이동
     */
    walkStep (index) {
      const methodName = ['moveToOneStep', 'moveToTwoStep', 'moveToThreeStep'][
        index - 1
      ]

      this[methodName]()
    },
    /**
     * 체크한 서브넷 동기화
     */
    syncSubnet (subnet) {
      // true = 내부, false = 외부
      this.networkInfo.subnet = subnet
    },
    /**
     * 체크된 보안그룹 동기화
     */
    syncSecurity (security) {
      this.networkInfo.group = security
    },
    beforeClose (done) {
      // 팝업 문구
      const text = this.isEdit
        ? '수정을 취소하시겠습니까?'
        : '수정을 취소하시겠습니까?'

      this.$confirm(text)
        .then(() => done())
        .catch(() => false)
    },
    initData () {
      this.currentStep = 1
      this.steps = [
        {
          header: '인스턴스 기본 정보',
          active: true,
          expandable: true,
          expanded: false,
          completed: false,
          clickable: false,
          visited: true
        },
        {
          header: '네트워크/보안그룹',
          active: false,
          expandable: false,
          expanded: false,
          completed: false,
          clickable: false,
          visited: false
        },
        {
          header: '검토',
          active: false,
          expandable: false,
          expanded: false,
          completed: false,
          clickable: false,
          visited: false
        }
      ]
      this.instanceInfo = {
        regionName: this.instanceInfo.regionName,
        region: this.instanceInfo.region,
        instanceName: '',
        ami: null,
        instanceSpec: null,
        storage: [],
        monitoringActive: false
      }
    },
    cancelCreate () {
      this.$emit('close')
    },
    unActiveSteps () {
      this.steps.forEach(step => (step.active = false))
    },
    moveToOneStep () {
      this.unActiveSteps()
      this.steps[0].active = true
      this.currentStep = 1
    },
    moveToTwoStep () {
      this.unActiveSteps()
      this.steps[0].completed = true
      this.steps[0].visited = true
      this.steps[1].active = true
      this.steps[1].visited = true
      this.steps[1].expandable = true
      this.currentStep = 2
    },
    moveToThreeStep () {
      this.unActiveSteps()
      this.steps[0].clickable = true
      this.steps[1].clickable = true
      this.steps[1].completed = true
      this.steps[2].active = true
      this.steps[2].visited = true
      this.currentStep = 3
    },
    expand (step, expanded) {
      step.expanded = !expanded
    }
  },
  data: () => ({
    isDataLoaded: false,
    beforeAllCost: 0,
    specCost: 0,
    storageCost: 0,
    ebsBillingData: [],
    ec2BillingData: [],
    ec2BillingDataMap: null,
    originSecurityGroupData: null,
    originStorageData: null,
    networkInfoChanges: [],
    networkInfo: {
      vpc: null,
      subnet: null,
      group: [],
      azZone: null
    },
    monitoringChanges: [],
    storageChanges: [
      // {
      //   id: 'ec2-edit-1',
      //   title: '변경',
      //   type: 'storage', // 변경된 요소 식별
      //   items: [
      //     {
      //       id: 'ec2-edit-1-1',
      //       title: '변경 전',
      //       changeText: '볼륨유형: 루트 / 디스크명...'
      //     },
      //     {
      //       id: 'ec2-edit-1-2',
      //       title: '변경 후',
      //       changeText: '볼륨유형: 루트 / 디스크명...'
      //     }
      //   ]
      // }
    ],
    currentStep: 1,
    steps: [
      {
        header: '인스턴스 기본 정보',
        active: true,
        expandable: true,
        expanded: false,
        completed: false,
        clickable: false,
        visited: true
      },
      {
        header: '네트워크/보안그룹',
        active: false,
        expandable: false,
        expanded: false,
        completed: false,
        clickable: false,
        visited: false
      },
      {
        header: '검토',
        active: false,
        expandable: false,
        expanded: false,
        completed: false,
        clickable: false,
        visited: false
      }
    ],
    instanceInfo: {
      // 인스턴스 기본 정보 폼
      regionName: '', // 리전명
      region: '', // 리전한글표기명
      instanceName: '', // 인스턴스 이름
      ami: null, // AMI
      instanceSpec: null, // 인스턴스 스펙
      storage: [],
      monitoringActive: false
    }
  })
}
</script>

<style lang="scss" scoped>
.ec2-create {
  &-wrapper {
    display: flex;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: flex-start;

    & > :first-child {
      flex: 0 0 310px;
      margin-right: 40px;
      height: auto;
    }

    & > :last-child {
      flex: 0 1 100%;
    }

    .create-info {
      background-color: $dark-navy;
      border-radius: 6px;
      padding: $gap-m $gap;
      position: sticky;
      top: 0;
      overflow: hidden;

      .info-table-wrap {
        & > * + * {
          margin-top: $gap-s;
        }
      }

      & > * + * {
        margin-top: $gap;
      }

      &.is-edit::after {
        height: calc(100% - 200px);
      }

      &.half {
        &::after {
          background: linear-gradient(
            to bottom,
            $primary calc(100% - (50px + 20px)),
            #333333 calc(50px + 20px)
          );
        }
      }

      &.full {
        &::after {
          background: $primary;
        }
      }

      &::after {
        content: "";
        position: absolute;
        margin: $gap-m $gap;
        width: 2px;
        height: calc(100% - 180px);
        /* border-left: 2px solid #e5e5e5; */
        background: #333;
        z-index: 0;
        top: 0;
        left: $gap * 2;
      }
    }

    .create-preview {
      margin-top: $gap;

      &-head {
        > * {
          display: inline-block;
        }

        .mdi {
          margin-left: 5px;
          color: $primary;
        }
      }

      &-price {
        text-align: right;
        font-size: 15px;
        margin-top: $gap;
        display: flex;
        justify-content: flex-end;
        align-items: center;

        span {
          margin-top: 3px;
          color: $primary;
        }

        strong {
          color: $primary;
          font-size: 28px;
          font-weight: 700;
          margin-left: $gap-s;
        }
      }

      .edit-preview-price {
        margin-top: $gap;
        padding-top: $gap;
        border-top: 1px solid #f0f0f0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: nowrap;

        .divider-icon {
          align-self: flex-end;
          padding-bottom: 5px;
        }

        .flex-up-bottom {
          display: flex;
          flex-wrap: nowrap;
          height: 40px;

          .up {
            align-self: flex-start;
            font-size: 12px;
            color: #999;
            margin-right: $gap-s;
          }

          .bottom {
            align-self: flex-end;
            font-size: 15px;

            strong {
              font-size: 22px;
              font-weight: 500;
              margin-left: 5px;

              &.em {
                font-size: 26px;
                color: $main-blue;
              }
            }
          }
        }
      }
    }
  }

  &-modal {
    &::v-deep {
      .el-dialog {
        max-height: calc(100% - 20vh);
        overflow-y: auto;
      }
    }
  }
}
</style>
