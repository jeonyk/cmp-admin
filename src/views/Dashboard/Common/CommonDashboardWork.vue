<template>
  <section
    class="common-dashboard-work"
    style="display:flex;"
  >
    <pie-chart
      :title="$v('업무 현황')"
      :width-wrap="460"
      :height-wrap="350"
      :width="240"
      :height="240"
      :item-source="orderList"
      :label-content="getLabelContent"
      :core-text="totalOrderCount"
      @change="changeMonth"
    />

    <task-calendar
      :data="taskSchedules"
      :list-test="taskSchedules"
      @change="(e) => {
        fetchTaskScheduels(e)
      }"
    />
  </section>
</template>

<script>
import API from '@sd-fe/cmp-core'
import PieChart from '@/components/Chart/PieChart.vue'
import TaskCalendar from '@/components/Calendar/TaskCalendar.vue'
import dayjs from 'dayjs'
import { mapState } from 'vuex'
import _ from 'lodash'
import { roleMixin } from '@/utils/work/role.js'

export default {
  mixins: [roleMixin],
  components: {
    PieChart,
    TaskCalendar
  },
  computed: {
    ...mapState({
      user: (state) => state.auth.user,
      csp: (state) => state.cloud.cloud.toUpperCase(),
      userPermRole: state => state.auth.user.userPermRoleList.map(x => x.roleUpper).filter(x => x !== null)
    })
  },
  async mounted () {
    this.fetchOrderSummary()
  },
  methods: {
    /**
     @comment 주문 현황 데이터 관련 함수 동작
     **/
    async fetchOrderSummary () {
      const data = await this.getOrderSummary()

      this.orderList = this.transformOrderSummary(data, this.colors)
      this.totalOrderCount = this.sumValues(data)
    },
    /**
     @comment 달력 업무 일정 관련 함수 동작
     **/
    async fetchTaskScheduels (params) {
      let list = await this.getTaskSchedules(params)
      list = list.map(x => {
        return {
          ...x,
          workItems: x.workItems
            .filter(x => this.checkServiceAuth(x.service, this.READ_PERMISSION))
        }
      }).filter(x => x.workItems.length > 0)

      this.taskSchedules = this.transformTaskScheduleData(list)
    },
    /**
     @comment 업무 대시보드 파이차트 데이터
     @param {since} 시작일
     @param {userId} 로그인 사용자 Id
     */
    getOrderSummary () { // Pie 차트 데이터
      return API.work.get_resource_order_summary({
        since: this.selectedMonthFormat,
        userId: this.user.userId,
        csp: this.csp
      })
    },
    /**
     @comment 업무 대시보드 캘린더 데이터
     @param {from} 시작일
     @param {to} 종료일
     */
    getTaskSchedules ({ startDate, endDate }) {
      return API.work.get_task_schedules({
        from: startDate,
        to: endDate,
        csp: this.csp
      })
    },
    /**
     @comment 업무 주문 현황 데이터 변경
     **/
    transformOrderSummary (data, colors) {
      return Object.keys(data).map(key => {
        const obj = {
          key,
          title: this.getKorTaskStatus(key),
          ...data[key],
          value: this.getSliceTotal(key, data[key]),
          color: colors.find(c => c.key === key).color || 'white'
        }
        return obj
      })
    },
    /**
     @comment 업무 스케쥴 데이터 변경
     **/
    transformTaskScheduleData (data) {
      const result = _.groupBy(data, (cur) => {
        return dayjs(cur.expectDate).format('YYYY-MM-DD')
      })

      for (const dateKey in result) {
        result[dateKey] = result[dateKey].map((cur) => {
          return {
            ...cur,
            expectDate: dayjs(cur.expectDate).format('YYYY-MM-DD')
          }
        })
      }
      return result
    },
    changeMonth (val) {
      const today = dayjs()
      this.selectedMonthFormat = today.subtract(val || 1, 'month').format('YYYY-MM-DD')

      this.fetchOrderSummary()
    },
    sumValues (obj) {
      let sum = 0
      for (const prop in obj) {
        if (typeof obj[prop] === 'object') {
          sum += this.sumValues(obj[prop])
        } else {
          sum += obj[prop]
        }
      }
      return sum
    },
    getLabelContent (ht) {
      return ht.item.value
    },
    getSliceTotal (key, data) {
      if (['workReviewCount', 'workTodoCount', 'workDoneCount'].includes(key)) {
        return (data.general | 0) + (data.urgent | 0)
      } else {
        return ((data.accepted | 0) + (data.my | 0) + (data.rejected | 0))
      }
    },
    getKorTaskStatus (key) {
      return {
        workReviewCount: '사전협의',
        workTodoCount: '할일',
        workDoneCount: '한일',
        manageApprovalCount: '결재함'
      }[key] ?? key
    }
  },
  data () {
    const today = dayjs()
    return {
      selectedMonthFormat: today.subtract(1, 'month').format('YYYY-MM-DD'),
      selectedMonthValue: 1,
      totalOrderCount: 0,
      orderList: [],
      taskSchedules: [],
      colors: [
        {
          key: 'workReviewCount',
          color: 'rgba(84, 98, 255, 1)'
        },
        {
          key: 'workTodoCount',
          color: '#525896'
          // color: 'rgba(121, 202, 40, 1)'
        },
        {
          key: 'workDoneCount',
          color: 'rgba(178, 98, 242, 1)'
        },
        {
          key: 'manageApprovalCount',
          color: 'rgba(255, 181, 64, 1)'
        }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.common-dashboard-work {
  height:350px;
  &::v-deep {
    .label-wrapper {
      flex-direction: column;
      gap:20px;
      margin-left:40px;
    }
    .wj-data-labels {
      .wj-data-label {
        fill: #fff;
        font-size:15px;
        font-weight: 700;

      }
    }
  }
}

</style>
