<template>
  <div
    class="dashboard-bill-top5"
    v-loading="isLoading"
  >
    <div class="flex-wrap">
      <h4 class="flex-itm">
        {{ $v('프로젝트별 예상 청구 금액 TOP 5') }}
      </h4>
      <el-select
        class="flex-itm"
        v-model="cloudList.cloudCode"
        :placeholder="$v('선택하세요')"
        :popper-append-to-body="false"
        @change="cloudChange"
        hidden
      >
        <el-option
          v-for="item in cloudList"
          :key="item.cloudCode"
          :label="item.cloudName"
          :value="item.cloudCode"
        />
      </el-select>
    </div>

    <div
      v-if="!topPjtBills.length"
      class="dashboard-bill-top5-contents -empty"
    >
      {{ $v('데이터가 없습니다.') }}
    </div>

    <ul
      class="dashboard-bill-top5-contents"
      v-loading="isLoading"
      v-else
    >
      <li
        v-for="(item, idx) in topPjtBills"
        :key="idx"
      >
        <a @click="goVmDetail(item)">
          <div class="-info">
            <i class="-index">{{ idx + 1 }}</i>
            <strong>{{ item.name }}</strong>
          </div>

          <div class="-price">
            <icon />
            <strong>
              <template v-if="selectedTab.codeVal === 'AWS'">
                <span>{{ '$' }}</span>
              </template>
              {{ item.priceDetail | locale }}
              <template v-if="selectedTab.codeVal !== 'AWS'">
                <span>{{ $v('원') }}</span>
              </template>
            </strong>
            <span></span>
          </div>
        </a>
      </li>
    </ul>
  </div>
</template>

<script>
import Dayjs from 'dayjs'
import API from '@sd-fe/cmp-core'
// import { goToResourceDetail } from '@/components/Utils/CurrentResourceGoToDetail'

/*
import axios from 'axios'
const config = {
  url: process.env.VUE_APP_ZUUL_URL
} */

const databaseIcon = {
  template: `
    <svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.9 2.55C10.9 3.54411 8.68381 4.35 5.95 4.35C3.21619 4.35 1 3.54411 1 2.55M10.9 2.55C10.9 1.55589 8.68381 0.75 5.95 0.75C3.21619 0.75 1 1.55589 1 2.55M10.9 2.55V6.56143C9.80065 6.89158 9.1 7.39104 9.1 7.95M1 2.55V13.35C1 14.3441 3.21619 15.15 5.95 15.15C7.14667 15.15 8.24415 14.9956 9.1 14.7386V7.95M1 6.15C1 7.14411 3.21619 7.95 5.95 7.95C7.14667 7.95 8.24415 7.79559 9.1 7.53856M1 9.75C1 10.7441 3.21619 11.55 5.95 11.55C7.14667 11.55 8.24415 11.3956 9.1 11.1386M19 7.95C19 8.94411 16.7838 9.75 14.05 9.75C11.3162 9.75 9.1 8.94411 9.1 7.95M19 7.95C19 6.95589 16.7838 6.15 14.05 6.15C11.3162 6.15 9.1 6.95589 9.1 7.95M19 7.95V15.15C19 16.1441 16.7838 16.95 14.05 16.95C11.3162 16.95 9.1 16.1441 9.1 15.15V7.95M19 11.55C19 12.5441 16.7838 13.35 14.05 13.35C11.3162 13.35 9.1 12.5441 9.1 11.55" stroke="#9596A0" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `
}

export default {
  name: 'DashboardBillTop5',
  components: {
    icon: databaseIcon
  },
  props: {
    topbillData: {
      type: Array,
      default: () => []
    },
    groupIdx: {
      type: Object,
      default: null
    },
    selectedTab: {
      type: Object,
      default: null
    },
    allVmList: {
      type: Array,
      default: () => []
    }
  },
  async mounted () {
    // await this.loadData()

    this.cloudList = [
      {
        cloudCode: '',
        cloudName: '전체'
      },
      {
        cloudCode: 'nutanix',
        cloudName: 'nutanix'
      },
      {
        cloudCode: 'vmware',
        cloudName: 'vmware'
      },
      {
        cloudCode: 'aws',
        cloudName: 'aws'
      }
    ]
  },
  watch: {
    topbillData: {
      immediate: true,
      deep: true,
      handler (topbillData) {
        // this.topPjtBills = topbillData
      }
    },
    topPjtBills: {
      immediate: true,
      deep: true,
      handler (topPjtBills) {
      }
    },
    groupIdx: {
      immediate: true,
      async handler (groupIdx) {
        // console.log('groupIdx:', groupIdx)
        await this.loadData(null)
      }
    },
    selectedTab: {
      immediate: true,
      deep: true,
      async handler (selectedTab) {
        // console.log('selectedTab:', selectedTab)
        await this.loadData(null)
      }
    }
  },
  methods: {
    goVmDetail (data) {
      try {
        let selectedVm, routePath
        if (this.selectedTab.codeVal === 'NX') {
          selectedVm = this.allVmList?.find(vm => vm.vmUuid === data.vmUuid)
          // routePath = 'set-resource-server-detail'
          // routePath = 'set-resource-server'
        } else if (this.selectedTab.codeVal === 'VMWARE') {
          selectedVm = this.allVmList?.find(vm => vm.vmUuid === data.vmUuid)
          // routePath = 'set-resource-server-detail-vmw'
          // routePath = 'set-resource-server-vmw'
        }
        console.log('routeTo:', routePath, selectedVm)
        // if (!selectedVm) return
        /*
        goToResourceDetail(
          selectedVm,
          { resource: 'userVmIdx', order: 'orderDataIdx', basket: 'basketIdx' },
          routeName
        ) */
        this.$router.push({ name: routePath })
      } catch (error) {
        console.log(error)
      }
    },
    async getPrivateBills (csp, date, param) {
      const bills = // undefined
        // await axios.get(config.url + '/api/cmp/v1/billing/currentPrice/top' // ?date=2023-03&moduleType=NX
        await API.billing.getProjectBillingRank(
          {
            ...param,
            moduleType: csp, // NX, VMWARE, AWS, ALL
            date: date
            // isAdmin: false,
            // projectIdx: this.projectIdx
          }
        )
        // .then((res) => res.data)
      // console.log('getPrivateBills.bills:', bills)
      return bills
    },
    async getAwsBills (startDate, endDate, param) {
      const bills =
        await API.aws.getBillingByDateAdm(startDate, endDate, param.groupIdx).then((res) => res.data)
        /*
        await axios({
          method: 'get',
          url: config.url + '/api/cmp/v1/aws/bill/project',
          params: {
            groupIdxList: this.groupIdx?.groupIdx,
            startDate: startDate,
            endDate: endDate
          }
        }).then((res) => res.data) */
      // console.log('getAwsBills.bills:', bills)
      return bills
    },
    async loadData (filter) {
      const newDate = new Date()
      const currDate = Dayjs(newDate)// .subtract(1, 'month')
      const startDate = currDate// .subtract(24, 'month')
        .format('YYYY-MM')
      const endDate = currDate.set('day', 30).format('YYYY-MM')
      // const prevDate = Dayjs(currDate).subtract(1, 'month').format('YYYY-MM')
      const param = {
        ...this.groupIdx
      }

      if (param.groupIdx) {
        try {
          this.isLoading = true

          const apiCallList = []
          if (this.selectedTab.codeVal === 'NX') {
            apiCallList.push(
              this.getPrivateBills('NX', currDate.format('YYYY-MM'), param)
            )
          } else if (this.selectedTab.codeVal === 'VMWARE') {
            apiCallList.push(
              this.getPrivateBills('VMWARE', currDate.format('YYYY-MM'), param)
            )
          } else if (this.selectedTab.codeVal === 'AWS') {
            apiCallList.push(
              this.getAwsBills(startDate, endDate, param)
            )
          } else {
            apiCallList.push(
              this.getPrivateBills('NX', currDate.format('YYYY-MM'), param),
              this.getPrivateBills('VMWARE', currDate.format('YYYY-MM'), param),
              this.getAwsBills(startDate, endDate, param)
            )
          }
          Promise.all([...apiCallList]).then((res) => {
            res = res.filter((resArr) => (resArr instanceof Array))
            let billingRanking = [].concat(...res)
            billingRanking = billingRanking?.filter((itm) =>
              filter ? filter === itm.cloud : true
            )
            if (billingRanking// .length
            ) {
              const mappedRanking = billingRanking.map((itm) => ({
                ...itm,
                name: itm.projectName,
                price: itm.price ? itm.price : itm.cost,
                priceDetail: itm.price !== undefined ? itm.price : itm.cost
              })).sort((a, b) => a.price > b.price ? -1 : 1).slice(0, 5)
              // console.log('billTop5:', this.selectedTab.codeVal, res)
              this.topPjtBills = mappedRanking
            }
          })
        } finally {
          this.isLoading = false
        }
      } else this.isLoading = false
    },
    cloudChange (selected) {
      this.loadData(selected)
    }
  },
  data: () => ({
    topPjtBills: [],
    cloudList: [],
    isLoading: true
  })
}
</script>

<style lang="scss" scoped>
.dashboard-bill-top5 {

  h4 {
    font-size: 16px;
    margin-bottom: $gap;
  }

  &-contents {

    &.-empty {
      height: 450px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $white
    }
    > li {
      height: 90px;
      box-sizing: border-box;
      border-bottom: 1px solid $purple-gray;

      &:hover { border: none; }

      a {
        display: block;
        height: 100%;
        transition: .3s ease all;
        padding: 15px 15px 15px 10px;
        box-sizing: border-box;

        &:active,
        &:hover {
          background-color: rgba(63, 85, 187, 0.3);
          border-radius: $radius-m;
          color: $white;

          .-info .-index {
            background-color: $main-blue;
            border-color: $main-blue;
            color: $white;
          }

          .-price::v-deep {
            color: $white;
            path {
              stroke: $white;
            }
            strong {
              font-weight: 700;
            }
          }
        }
      }

      .-info {
        display: flex;
        align-items: center;
        margin-bottom: $gap-s;

        .-index {
          display: block;
          width: 25px; height: 25px;
          line-height: 25px;
          text-align: center;
          font-style: normal;
          border: 1px solid #5F606B;
          border-radius: $radius-s;
          font-weight: 700;
          margin-right: $gap-s;
        }

        strong {
          display: block;
          width: 85%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .-price {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        color: $white;

        strong {
          margin-left: 10px;
          font-weight: 400;
          font-size: 20px;
        }
        span {
          font-size: 20px;
        }
      }
    }
  }
  .flex-wrap {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    .flex-itm:nth-child(2) {
      width: 120px;
      margin-right: 0px;
      margin-bottom: 10px;
    }
  }
}
</style>
