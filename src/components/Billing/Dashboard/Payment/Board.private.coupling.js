/* eslint-disable */
import Vue from 'vue'
import API from '@sd-fe/cmp-core'
import dayjs from 'dayjs'

export default Vue.extend({
  inject: ['$bill'],
  computed: {
    csp () {
      if (!this.boardType) return null

      return {
        nx: {
          moduleType: 'NX'
        },
        vmw: {
          moduleType: 'VMWARE'
        }
      }[this.boardType]
    },
    filterGroupIdxs () {
      return this.$bill.filterGroups.map(group => group.groupIdx)
      // return this.$bill.allGroupIdxList
    },
    /**
     * 비교 탭에서 endDate 가 현재 날짜임
     */
    isSetEndDateFilterCurrent () {
      if (this.$bill.activeTab !== 'compare') return false
      return dayjs(new Date()).format('YYYY-MM') === dayjs(new Date(this.$bill.endDate)).format('YYYY-MM')
    }
  },
  methods: {
    /**
     * ==================================
     * ==================================
     * ==================================
     */
    async getBillingAll () {
      this.billDataLoading = true

      this.billData = {
        totalPrice: 0,
        amountPrice: 0,
        correctionPrice: 0,
        comparePrevMonth: 0,
        prevMonthPrice: 0,
        regions: []
      }

      const getServiceNameByKey = (key) => {
        return {
          hwSum: 'H/W',
          swSum: 'S/W',
          heoseon: '회선',
          sosan: '소산',
          nasSum: 'NAS'
        }[key]
      }

      try {
        // 실제 바인딩 값
        let totalPrice
        let amountPrice
        let correctionPrice
        let comparePrevMonth
        let prevMonthPrice
        let regions = []
        if (this.$bill.activeTab === 'monthly') {
          // 월별
          // 현재 날짜
          if (this.$bill.isSameCurrentInMonthly) {
            const currentClaimData = await this.getExpectMonthlyBill()
            const currentReportChargeData = await this.getRegionChargeMonthlyBill(this.$bill.formattedMonthly, this.$bill.formattedMonthly)
            // const currentRegionData = await this.getExpectRegionMonthlyBill()
            // const currentClaimChargeData = await this.getExpectChargeMonthlyBill()

            regions = currentReportChargeData
              // .filter(bill => bill.moduleType == this.csp.moduleType)
              .map(bill => ({
                region: bill.dataCenter,
                value: ['hwSum', 'swSum', 'nasSum'].map(key => ({
                  label: getServiceNameByKey(key),
                  value: bill[key]
                })),
                date: this.$bill.formattedMonthly
              }))

            totalPrice = currentClaimData?.totalPrice || 0
            amountPrice = currentClaimData?.totalPrice || 0
            correctionPrice = 0
            prevMonthPrice = currentClaimData?.afterTotalPrice || 0
            comparePrevMonth = (totalPrice - prevMonthPrice)
          } else {
            // 지난 날짜
            const rangeData = await this.getRangeMonthlyBill(this.$bill.prevMonthDate, this.$bill.formattedMonthly)
            // const claimData = await this.getMonthlyBill()
            const reportChargeData = await this.getRegionChargeMonthlyBill(this.$bill.formattedMonthly, this.$bill.formattedMonthly)

            regions = reportChargeData
              // .filter(bill => bill.moduleType == this.csp.moduleType)
              .map(bill => ({
                region: bill.dataCenter,
                value: ['hwSum', 'swSum', 'heoseon', 'sosan'].map(key => ({
                  label: getServiceNameByKey(key),
                  value: bill[key]
                })),
                date: this.$bill.formattedMonthly
              }))

            const findCurrent = rangeData.find(range => dayjs(range.date).format('YYYY-MM') === this.$bill.formattedMonthly)
            const findPrev = rangeData.find(range => dayjs(range.date).format('YYYY-MM') === this.$bill.prevMonthDate)

            totalPrice = findCurrent?.total || 0
            prevMonthPrice = findPrev?.total || 0
            correctionPrice = findCurrent ? ((findCurrent.serverCorrection || 0) + (findCurrent.groupCorrection)) : 0
            amountPrice = (findCurrent?.total || 0) - correctionPrice
            comparePrevMonth = totalPrice - prevMonthPrice
          }
        } else {
          // 예상 청구 금액을 왜... 기존에 청구된 데이터와 비교하고 싶어하지..
          // 감/가산 등등...;; 그런게 있늗넹..
          // 비교
          if (this.isSetEndDateFilterCurrent) {
            // endDate 가 현재 날짜로 설정되어 있는 경우
            // 예상 현재 금액
            const currentClaimData = await this.getExpectMonthlyBill()
            // startDate 금액
            let startClaimData = await this.getRangeMonthlyBill(
              this.$bill.formattedStartDate,
              this.$bill.formattedStartDate,
            )
            // 데이터센터별 항목 금액
            const regionChargeData = await this.getRegionChargeMonthlyBill(
              this.$bill.formattedStartDate,
              this.$bill.formattedEndDate
            )

            const startRegionChargeData = regionChargeData.filter(bill => dayjs(bill.billingDate).format('YYYY-MM') === this.$bill.formattedStartDate)
            const endRegionChargeData = regionChargeData.filter(bill => dayjs(bill.billingDate).format('YYYY-MM') === this.$bill.formattedEndDate)

            // 리전 Merge
            // let allRegions = [].concat(startRegionChargeData, endRegionChargeData).map(charge => charge.dataCenter)
            // allRegions = allRegions && allRegions.length ? [...new Set(allRegions)] : []

            regions = [].concat(startRegionChargeData, endRegionChargeData)
              .map(charge => {
                return {
                  region: charge.dataCenter,
                  value: dayjs(charge.billingDate).format('YYYY-MM') === this.$bill.formattedEndDate
                    ? ['hwSum', 'swSum', 'nasSum'].map(key => ({ label: getServiceNameByKey(key), value: charge[key] }))
                    : ['hwSum', 'swSum', 'heoseon', 'sosan', 'nasSum'].map(key => ({ label: getServiceNameByKey(key), value: charge[key] })),
                  date: dayjs(new Date(charge.billingDate)).format('YYYY-MM')
                }
              })

            startClaimData = startClaimData && startClaimData.length ? startClaimData[0] : {}

            totalPrice = currentClaimData?.totalPrice || 0
            prevMonthPrice = startClaimData?.total || 0
            comparePrevMonth = (totalPrice - prevMonthPrice)
            amountPrice = currentClaimData?.totalPrice || 0
            correctionPrice = 0 // 현재 날짜에 보정이 있을 수가 없음
          } else {
            // 단순 비교 (현재 날짜가 안껴있음)
            const rangeClaimData = await this.getRangeMonthlyBill(
              this.$bill.formattedStartDate,
              this.$bill.formattedEndDate
            )
            const regionChargeData = await this.getRegionChargeMonthlyBill(
              this.$bill.formattedStartDate,
              this.$bill.formattedEndDate
            )

            const startDateClaimData = rangeClaimData.find(bill => dayjs(bill.billingDate).format('YYYY-MM') === this.$bill.formattedStartDate) || {}
            const endDateClaimData = rangeClaimData.find(bill => dayjs(bill.billingDate).format('YYYY-MM') === this.$bill.formattedEndDate) || {}

            totalPrice = endDateClaimData?.total || 0
            prevMonthPrice = startDateClaimData?.total || 0
            comparePrevMonth = totalPrice - prevMonthPrice
            amountPrice = totalPrice - ((endDateClaimData?.serverCorrection || 0) + (endDateClaimData?.groupCorrection || 0))
            correctionPrice = ((endDateClaimData?.serverCorrection || 0) + (endDateClaimData?.groupCorrection || 0))

            regions = regionChargeData.map(bill => ({
              region: bill.dataCenter,
              value: ['hwSum', 'swSum', 'heoseon', 'sosan', 'nasSum'].map(key => ({ label: getServiceNameByKey(key), value: bill[key] })),
              date: dayjs(new Date(bill.billingDate)).format('YYYY-MM')
            }))

            console.log(regions)
          }
        }

        /** 데이터 바인딩 */
        this.billData = {
          totalPrice,
          amountPrice,
          correctionPrice,
          comparePrevMonth,
          prevMonthPrice,
          regions
        }
      } catch (error) {
        console.log(error)
      } finally {
        this.billDataLoading = false
      }
    },
    /**
     * ==================================
     * ==================================
     * ==================================
     */
    /**
     * (월별 > 예상 청구 금액을 조회한다.)
     */
    async getExpectMonthlyBill () {
      return (await API.billing.getExpectBill({
        groupIdxList: this.filterGroupIdxs,
        moduleType: this.csp.moduleType
      })).data.filter(bill => bill.moduleType === this.csp.moduleType)[0] || {}
    },
    /**
     * (월별 > 데이터센터별 예상 청구 금액을 조회한다.)
     */
    async getExpectRegionMonthlyBill () {
      return (await API.billing.getExpectDataCenterBillTop5({
        date: this.currentBillDate,
        groupIdxList: this.filterGroupIdxs,
        moduleType: this.csp.moduleType
      })).data
    },
    /**
     * (월별 > 예상 청구 금액을 조회한다. 보정 등 비용 포함)
     */
    async getExpectChargeMonthlyBill () {
      return (await API.billing.getReportCurrentCharge({
        date: this.currentBillDate,
        groupIdxList: this.filterGroupIdxs,
        moduleType: this.csp.moduleType
      })).data
    },
    /**
     * (월별 > 청구 금액을 조회한다.)
     */
    // async getMonthlyBill (date) {
    //   return (await API.billing.getReportCharge({
    //     date: date || this.$bill.formattedMonthly,
    //     groupIdxList: this.filterGroupIdxs
    //   })).data
    // },
    /**
     * (월별 > 세부 청구 금액을 조회한다.)
     */
    async getRangeMonthlyBill (startDate, endDate) {
      return (await API.billing.getReportRangeV3({
        startDate: startDate || this.$bill.formattedMonthly,
        endDate: endDate || this.$bill.formattedMonthly,
        moduleType: this.csp.moduleType,
        groupIdxList: this.filterGroupIdxs
      })).data
    },
    /**
     * (월별 > 데이터센터별 청구 금액을 조회한다.)
     */
    async getRegionChargeMonthlyBill (startDate, endDate) {
      return (await API.billing.getReportRegion({
        groupIdxList: this.filterGroupIdxs,
        moduleType: this.csp.moduleType, // 500에러 나고 있음
        dateList: [startDate, endDate]
      })).data
    }
  },
  data: () => ({
    currentBillDate: dayjs(new Date()).format('YYYY-MM')
  })
})
