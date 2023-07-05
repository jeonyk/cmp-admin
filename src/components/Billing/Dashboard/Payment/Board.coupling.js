import Vue from 'vue'
import dayjs from 'dayjs'

const __DEFAULT_DATE_FORMAT__ = 'YYYY-MM'

/**
 * @description
 * ### CSP 보드 공통 기능을 정의한다.
 * mixin을 사용하는 컴포넌트는 `getBillingData` 메서드를 반드시 작성한다.
 * 메서드의 기능은 **빌링 데이터 조회**로 정의한다.
 * 메서드의 시그니처는 `(groups, tab, start, end, monthly) => any[]` 로 정의한다.
 * 각 매개변수는 아래와 같은 의미를 가진다.
 * - `groups` **(빌링) 최상위 컴포넌트에서 설정한 관계사/조직의 필터링 데이터**
 * - `tab` 상위 컴포넌트에서 설정된 현재 탭 상태 (월별/비교)
 * - `start` `tab` 상태가 비교일 때, 시작 날짜
 * - `end` `tab` 상태가 비교일 때, 종료 날짜
 * - `monthly` `tab` 상태가 월별일 때, 조회 날짜
 * **모든 날짜 관련 형식은 포매팅하여 메서드를 호출한다.** 기본: YYYY-MM
 *
 * @description
 * ### 아래 두 객체의 변경점이 감지되면 빌링 데이터 조회 메서드를 호출한다.
 * - `$bill.filterGroups` 관계사/조직 필터링이 변경되면 빌링 데이터를 재조회한다.
 * - `$bill.updateKey` 상위 컴포넌트에서 임의로 빌링 데이터를 재조회해야 하는 경우 재조회한다.
 *
 * @description
 * ### ~~아래 세 가지 데이터를 하위 컴포넌트들에게 `provide` 한다.~~
 * - ~~`billData` **빌링 데이터**~~
 * - ~~`billDataLoading` **빌링 데이터 로딩 여부**~~
 * - ~~`billDataEmpty` **빌링 데이터 비어있는지에 대한 여부**~~
 */
export default Vue.extend({
  inject: ['$bill'],
  watch: {
    '$bill.filterGroups': {
      immediate: true,
      handler (groups) {
        this.internalHandler()
      }
    },
    '$bill.updateKey': {
      handler (key) {
        this.internalHandler()
      }
    },
    '$bill.activeTab': {
      handler () {
        this.internalHandler()
      }
    },
    '$bill.monthly' () {
      if (this.$bill.activeTab === 'monthly') {
        this.internalHandler()
      }
    },
    '$bill.startDate' () {
      if (this.$bill.activeTab === 'compare') {
        this.internalHandler()
      }
    },
    '$bill.endDate' () {
      if (this.$bill.activeTab === 'compare') {
        this.internalHandler()
      }
    }
  },
  provide () {
    const provide = {}

    Object.defineProperty(provide, 'billData', {
      get: () => this.billData,
      enumerable: true
    })

    Object.defineProperty(provide, 'billDataLoading', {
      get: () => this.billDataLoading,
      enumerable: true
    })

    Object.defineProperty(provide, 'billDataEmpty', {
      get: () => this.billDataEmpty,
      enumerable: true
    })

    Object.defineProperty(provide, 'boardType', {
      get: () => this.boardType,
      enumerable: true
    })

    return {
      $billBoard: provide
    }
  },
  computed: {
    mainColor () {
      switch (this.boardType) {
        case 'nx':
          return '#4B7EFF'
        case 'vmw':
          return '#84D631'
        case 'aws':
          return '#FFAE26'
        default:
          return ''
      }
    },
    /**
     * 탭 확인하고 시작 월 반환
     */
    formattedCurrentMonth () {
      if (this.$bill.activeTab === 'monthly') {
        return dayjs(this.$bill.monthly).format('YYYY-MM')
      } else {
        return dayjs(this.$bill.startDate).format('YYYY-MM')
      }
    },
    /**
     * 탭 확인하고 지난 월 반환 (compare 모드 일 때는 종료 월)
     */
    formattedPrevMonth () {
      if (this.$bill.activeTab === 'monthly') {
        return dayjs(this.$bill.monthly).add(-1, 'month').format('YYYY-MM')
      } else {
        return dayjs(this.$bill.endDate).format('YYYY-MM')
      }
    }
  },
  methods: {
    /**
     * 결합한 컴포넌트의 메서드를 호출하기 전 내부에서 한번 유효성 검증
     */
    _getBillingData (groups, tab, start, end, monthly) {
      // 관계사/조직 필터링 없으면 호출 금지
      if (!groups || !groups.length) return
      // 월별인데, 월 데이터 없으면 호출 금지
      if (tab === 'monthly' && !monthly) return
      // 비교인데, 시작 날짜와 종료 날짜가 없으면 호출 금지
      if (tab === 'compare' && (!start || !end)) return
      // 데이터가 이미 로딩중일 때 호출 금지
      if (this.billDataLoading) return

      // 결합한 컴포넌트 메서드 호출
      this.getBillingData(
        groups,
        tab,
        start,
        end,
        monthly
      )
    },
    internalHandler () {
      if (typeof this.getBillingData === 'function') {
        this.renderKey = Date.now()
        this._getBillingData(
          this.$bill.filterGroups,
          this.$bill.activeTab,
          dayjs(this.$bill.startDate).format(__DEFAULT_DATE_FORMAT__),
          dayjs(this.$bill.endDate).format(__DEFAULT_DATE_FORMAT__),
          dayjs(this.$bill.monthly).format(__DEFAULT_DATE_FORMAT__)
        )
      }
    }
  },
  data: () => ({
    billData: null,
    billDataLoading: false,
    billDataEmpty: false,
    renderKey: null
  })
})
