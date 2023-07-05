<template>
  <div class="dashboard-monthly-bill">
    <h3>{{ $v('이번 달 예상 청구 금액') }} <!-- (테스트 데이터 필요)--></h3>
    <div
      class="dashboard-monthly-bill-contents"
      v-loading="isLoading"
    >
      <div class="price-rough">
        <ul>
          <li>
            <h2>Private</h2>
            <p>
              <strong>{{ currPrivateTotal | locale }}</strong>
              <small>{{ $v('원') }}</small>
            </p>
            <div class="price-detail">
              <span class="-title">{{ $v('전월대비') }}</span>
              <span class="-count">
                <arrow-icon
                  :type="setDiff(null, currPrivateTotal, prevPrivateTotal).class"
                  :stroke="setDiff(null, currPrivateTotal, prevPrivateTotal).stroke"
                />
                {{ setDiff(null, currPrivateTotal, prevPrivateTotal).data | locale }} {{ $v('원') }}
              </span>
            </div>
          </li>
          <li>
            <h2>Public</h2>
            <p>
              <small>{{ '$' }}</small>
              <strong>{{ currPublicTotal | locale }}</strong>
            </p>
            <div class="price-detail">
              <span class="-title">{{ $v('전월대비') }}</span>
              <span class="-count">
                <arrow-icon
                  :type="setDiff(null, currPublicTotal, prevPublicTotal).class"
                  :stroke="setDiff(null, currPublicTotal, prevPublicTotal).stroke"
                />
                {{ '$' }} {{ setDiff(null, currPublicTotal, prevPublicTotal).data | locale }}
              </span>
            </div>
          </li>
        </ul>
      </div>

      <ul class="cloud-types">
        <li
          v-for="{ field, price, diff } in cloudTypes"
          :key="field"
          :class="{ '-active': cloud === field }"
          @click="clickEvent(field)"
        >
          <!-- <strong>{{ field }}</strong> -->
          <i :class="['icon', field]" />
          <div class="numbers">
            <span class="price">
              <b>{{ field === 'aws' ? `$ ${price && price.toLocaleString()}` : (price && price.toLocaleString()) + ` ${$v('원')}` }}</b>
            </span>
            <span :class="['diff', setDiff(diff).class]">
              <arrow-icon
                v-if=" setDiff(diff).stroke != ''"
                :type="setDiff(diff).class"
                :stroke="cloud === field ? '#FFF' : setDiff(diff).stroke"
              />
              <b>{{ field === 'aws' ? `$ ${diff && diff.toLocaleString()}` : (diff && diff.toLocaleString()) + ` ${$v('원')}` }}</b>
            </span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import Dayjs from 'dayjs'
import DashboardArrowIcon from './DashboardArrowIcon'
import API from '@sd-fe/cmp-core'

export default {
  name: 'EstimatedMonthlyBill',
  components: {
    'arrow-icon': DashboardArrowIcon
  },
  props: {
    groupIdx: {
      type: Object,
      default: null
    },
    billData: {
      type: Object,
      default () {
        return {
          prev_nutanix: 0,
          prev_vmware: 0,
          prev_aws: 0,
          prev_private_sum: 0,
          curr_private_sum: 0,
          prev_public_sum: 0,
          curr_public_sum: 0,
          curr_nutanix: 0,
          curr_vmware: 0,
          curr_aws: 0
        }
      }
    }
  },
  async mounted () {
    // await this.loadData()
  },
  watch: {
    billData: {
      immediate: true,
      deep: true,
      handler (billData) {
        // this.billings = billData
      }
    },
    billings: {
      immediate: true,
      deep: true,
      handler (billings) {
        // this.$nextTick(function () {
        // console.log('this.billings:', billings)
        this.currPrivateTotal = billings.curr_private_sum // billings.curr_nutanix + billings.curr_vmware + billings.curr_aws
        this.prevPrivateTotal = billings.prev_private_sum // billings.prev_nutanix + billings.prev_vmware + billings.prev_aws
        this.currPublicTotal = billings.curr_public_sum
        this.prevPublicTotal = billings.prev_public_sum
        this.cloudTypes = [
          { field: 'nutanix', price: billings.curr_nutanix, diff: this.calc(billings.curr_nutanix, billings.prev_nutanix), image: 'nutanix.svg' },
          { field: 'vmware', price: billings.curr_vmware, diff: this.calc(billings.curr_vmware, billings.prev_vmware), image: 'vmware.png' },
          { field: 'aws', price: billings.curr_aws, diff: this.calc(billings.curr_aws, billings.prev_aws), image: 'aws-black.svg' }
        ]
        // })
      }
    },
    groupIdx: {
      immediate: true,
      async handler (groupIdx) {
        await this.loadData()
      }
    }
  },
  methods: {
    calc (num1, num2, sum) {
      const calc1 = num1 === undefined ? 0 : num1
      const calc2 = num2 === undefined ? 0 : num2
      try {
        sum = Number(calc1) - Number(calc2)
      } catch (err) {
        // console.log('setDiff.err:', err)
      }
      return sum
    },
    setDiff (diff, num1, num2) {
      const sum = diff === null ? this.calc(num1, num2) : Number(diff)
      const className = sum === 0 ? '' : (sum > 0 ? '-plus' : '-minus')
      const stroke = sum === 0 ? '' : (sum > 0 ? '#5260D9' : '#d95252')
      // console.log('setDiff:', sum, className, stroke)
      return { data: Math.abs(sum), class: className, stroke }
    },
    async loadData () {
      const newDate = new Date()
      const currDate = Dayjs(newDate).format('YYYY-MM')
      // const prevDate = Dayjs(currDate).subtract(1, 'month').format('YYYY-MM-DD')
      const param = {
        // companyIdx: this.companyIdx,
        ...this.groupIdx
      }

      if (param.groupIdx) {
        try {
          // 전월
          const pvDateParam = {
            startDate: Dayjs(newDate).subtract(1, 'month').format('YYYY-MM'), // '2022-12',
            endDate: Dayjs(newDate).subtract(1, 'month').format('YYYY-MM')
          }
          const pvTotalBilling =
            // await axios.get(config.url + '/api/cmp/v3/billing/report/range', {
            await API.billing.getBillingReportRange(
              {
                ...param,
                ...pvDateParam
                // isAdmin: false,
                // projectIdx: this.projectIdx
              })// .then((res) => res.data)
          const pvAwsBilling =
            await API.aws.getBillForecastByGroup({
            // await axios.get(config.url + '/api/cmp/v1/aws/bill/forecast/group', {
              // params: {
              groupIdxList: param.groupIdx,
              searchDate: pvDateParam.startDate
              // }
            }).then((res) => res.data)
          const pvTgDate = []
          const pvNxBills = []
          const pvVmBills = []
          const pvAwsBills = []
          pvTotalBilling.map((itm) => {
            if (itm.synDate === pvDateParam.startDate) {
              pvTgDate.push(itm.synDate)
              if (itm.moduleType === 'NX') pvNxBills.push(itm.totalPrice)
              if (itm.moduleType === 'VMWARE') pvVmBills.push(itm.totalPrice)
            }
          })
          pvAwsBilling && pvAwsBilling.map((itm) => {
            if (itm.billDate === pvDateParam.startDate) {
              pvAwsBills.push(itm.cost)
            }
          })
          // console.log('pv_monthlyBill:', pvDateParam.startDate, pvTotalBilling, pvAwsBilling)

          // 당월
          const currDateParam = {
            startDate: currDate, // '2022-12',
            endDate: currDate
          }
          const totalBilling = await API.billing.getCurrentVmPrice({
            ...param,
            ...currDateParam,
            moduleType: undefined // NX, VMWARE
            // isAdmin: false,
            // projectIdx: this.projectIdx
          })
          const awsBilling =
            await API.aws.getBillForecastByGroup({
            // await axios.get(config.url + '/api/cmp/v1/aws/bill/forecast/group', {
              // params: {
              groupIdxList: param.groupIdx,
              searchDate: currDateParam.startDate
              // }
            }).then((res) => res.data)
          const currTgDate = []
          const nxBills = []
          const vmBills = []
          const awsBills = []
          totalBilling.map((itm) => {
            const updateDate = Dayjs(new Date(itm.updateDate)).format('YYYY-MM')
            if (updateDate === currDateParam.startDate) currTgDate.push(updateDate)
            if (itm.moduleType === 'NX') nxBills.push(itm.totalPrice)
            if (itm.moduleType === 'VMWARE') vmBills.push(itm.totalPrice)
          })
          awsBilling && awsBilling.map((itm) => {
            if (itm.billDate === currDateParam.startDate) {
              awsBills.push(itm.cost)
            }
          })
          // console.log('cu_monthlyBill:', currDateParam.startDate, totalBilling, awsBilling)

          this.billings = {
            prev_nutanix: pvNxBills.reduce((a, b) => a + b, 0),
            prev_vmware: pvVmBills.reduce((a, b) => a + b, 0),
            prev_aws: pvAwsBills.reduce((a, b) => a + b, 0),
            prev_private_sum: pvNxBills.reduce((a, b) => a + b, 0) + pvVmBills.reduce((a, b) => a + b, 0),
            curr_private_sum: nxBills.reduce((a, b) => a + b, 0) + vmBills.reduce((a, b) => a + b, 0),
            prev_public_sum: pvAwsBills.reduce((a, b) => a + b, 0),
            curr_public_sum: awsBills.reduce((a, b) => a + b, 0),
            curr_nutanix: nxBills.reduce((a, b) => a + b, 0),
            curr_vmware: vmBills.reduce((a, b) => a + b, 0),
            curr_aws: awsBills.reduce((a, b) => a + b, 0)
          }
          this.$emit('expectBillings', this.billings)
          // console.log('아이디/플랫폼 별. 전당월 청구금액: ', this.billings)
        } finally {
          this.isLoading = false
        }
      }
    },
    clickEvent (cloud) {
      this.cloud = cloud
    }
  },
  data: () => ({
    currPrivateTotal: 0,
    prevPrivateTotal: 0,
    currPublicTotal: 0,
    prevPublicTotal: 0,
    billings: {
      prev_nutanix: 0,
      prev_vmware: 0,
      prev_aws: 0,
      prev_private_sum: 0,
      curr_private_sum: 0,
      prev_public_sum: 0,
      curr_public_sum: 0,
      curr_nutanix: 0,
      curr_vmware: 0,
      curr_aws: 0
    },
    cloudTypes: [
    ],
    cloud: undefined,
    isLoading: false
  })
}
</script>

<style lang="scss" scoped>
.dashboard-monthly-bill {
  min-width: 420px;
  background-color: $panel-bg;
  padding: $gap;
  box-sizing: border-box;
  border-radius: 5px;

  .icon {
    display: inline-block;
    width: 80px; height: 15px;
    margin-right: 5px;
    background-size: contain;

    &.nutanix { background: url('../../../assets/images/integrated-dashboard/nutanix-white.svg') no-repeat; }
    &.vmware { background: url('../../../assets/images/integrated-dashboard/vmware-white.svg') no-repeat; }
    &.aws { height: 20px; background: url('../../../assets/images/integrated-dashboard/aws-white.svg') no-repeat; }
  }

  .-active {
    .icon {
      display: inline-block;
      width: 80px; height: 15px;
      margin-right: 5px;
      background-size: contain;
      &.nutanix { background: url('../../../assets/images/integrated-dashboard/nutanix-white.svg') no-repeat; }
      &.vmware { background: url('../../../assets/images/integrated-dashboard/vmware-white.svg') no-repeat; }
      &.aws { height: 20px; background: url('../../../assets/images/integrated-dashboard/aws-white.svg') no-repeat; }
    }
  }

  h3 { font-size: 16px; }

  &-contents {
    display: grid;
    height: calc(100% - 20px);
    grid-template-rows: 1fr auto;
  }

  .price-rough {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;

    ul {
      width: 100%;

      > li {
        border-bottom: 1px solid #E1E1E1;
        margin-bottom: $gap-m;
        padding: $gap-m 0;

        &:last-child { margin: 0; border: none; }
      }
    }

    h2 {
      float: left;
    }

    p {
      display: flex;
      justify-content: right;
      align-items: flex-end;
    }

    strong {
      font-size: 40px;
      line-height: 40px;
    }

    small {
      margin: 0 4px;
      display: block;
      line-height: 30px;
      font-size: 15px;
      color: $white;
      font-weight: 700;
    }
  }

  .price-detail {
    display: flex;
    margin-top: 15px;
    align-items: center;
    justify-content: right;
    color: $white;

    .-title {
      margin-right: 15px;
    }
    .-count {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .cloud-types {
    > li {
      border-bottom: 1px solid #E1E1E1;
      height: 42px;
      margin-bottom: $gap-s;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: $gap-s;
      box-sizing: border-box;
      cursor: pointer;

      &:last-child { margin: 0; border: none; }

      .numbers {
        font-weight: 500;
        display: grid;
        grid-template-columns: 130px 130px;
        text-align: right;
        line-height: 40px;

        b { font-weight: normal; }

        .price {
          font-size: 16px;
          b {
            // color: $text-dark-gray;
            margin-left: -2px;
          }
        }

        .diff {
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: flex-end;

          &.-plus { color: #525FD9 }
          &.-minus { color: $main-red }
        }
      }

      &.-active {
        background-color: $main-blue;
        border-bottom: 1px solid transparent;
        border-radius: 5px;
        color: $white;
        position: relative;

        &::after {
          content: '';
          position: absolute;
          top: calc(50% - 8px); left: 100%;
          border: 8px solid transparent;
          border-left: 8px solid $main-blue;
        }

        .numbers .price b { color: $white; }
        .numbers .diff { color: $white; }
      }
    }
  }
}
</style>
