<!--
  * 파일명 : DashboardWorks.vue
  * 파일 기능 : 대시보드 상단 - 중요 페이지(공지사항 / 업무 사전 협의건 / 확인사항)로 빠르게 이동할 수 있는 기능, 최신 정보 6개를 생성일순으로 보여줌
  * 작성자 : 이경환 외 2명
  * 최종 작성일 : 2021-02-24
  * License By Shinsegae I&C
  * 2021-02-24 fix: 대시보드 업무 사전 협의건 디데이 수정
 -->

 <!-- 스타일 수정 -->

<template>
  <div>
    <h3 class="section-title3">
      Works
    </h3>

    <article class="dashboard-works">
      <dashboard-component
        class="body-panel"
        :title="$t('main.DASHBOARD.notice')"
        :new-item-counts="noticeTotalLen"
        v-loading="noticeLoad"
      >
        <template #header>
          <i
            class="more-icon"
            @click="routeTo({name: 'notice-list'})"
          />
        </template>

        <ul
          v-if="noticeData.length > 0"
          class="note-lists"
        >
          <template
            v-for="(item, idx) in noticeData"
          >
            <li
              :key="idx + '_notice'"
              class="notice-item flex-wrap -space-between"
              @click="routeTo({ name: 'notice-detail', params: item })"
            >
              <!-- v-if="existNoticeType(item.noticeType)" -->
              <p class="-contents">
                <small
                  :class="['-status', { '-is-deleted': noticeTypeCheck(item.noticeType) === $t('admin.NOTI.unClassified') }]"
                >
                  {{ noticeTypeCheck(item.noticeType) }}
                </small>
                <span class="item-title">{{ item.noticeTitle }}</span>
              </p>
              <span class="item-desc">{{ item.createTime | date }}</span>
            </li>
          </template>
        </ul>
      </dashboard-component>
      <!-- 공지사항 -->

      <dashboard-component
        class="body-panel"
        :title="$t('main.DASHBOARD.prior')"
        :new-item-counts="taskTotalLen"
        v-loading="tasksLoad"
      >
        <template #header>
          <i
            class="more-icon"
            @click="routeTo({name: 'task-conference', query: { type: 'ticket', page: 1 }})"
          />
        </template>
        <ul
          v-if="taskData.length > 0"
          class="note-lists"
        >
          <li
            class="notice-item flex-wrap "
            v-for="(item, idx) in taskData"
            :key="idx + '_taskData'"
            @click="conferenceSelectItem(item)"
          >
            <span class="item-state">
              <cmp-status-tag
                v-if="item.state === 'DELAY'"
                :type="`is-${stateDesc[item.state].color}`"
                :contents="item.taskStatus"
              />
              <span
                v-else
                :class="['work-state', stateDesc[item.state].color]"
              >
                {{ item.taskStatus }}
              </span>
            </span>

            <p class="title-arrange flex-wrap">
              <span class="item-title">{{ item.title }}</span>
              <span class="item-title">{{ item.part }}</span>
            </p>
            <span class="item-desc">{{ item.createTime | date }}</span>
          </li>
        </ul>
      </dashboard-component>
      <!-- 업무사전 협의건 -->

      <dashboard-component
        class="body-panel"
        :title="$t('main.DASHBOARD.check')"
        :new-item-counts="resourceDataLen"
        v-loading="resourceLoad"
      >
        <template #header>
          <i
            class="more-icon"
            @click="routeTo({ name: 'task-todo', query: { type: 'ticket', page: 1 } })"
          />
        </template>

        <ul
          v-if="resourceData.length > 0"
          class="note-lists"
        >
          <li
            class="notice-item flex-wrap -space-between"
            v-for="item in resourceData"
            :key="item.id"
            @click="checklistSelectItem(item)"
          >
            <p class="-contents">
              <small :class="['-status', { '-fail': item.isError }]">
                {{ item.isError ? $t('common.fail') : $t('common.success') }}
              </small>
            </p>
            <p class="title-arrange flex-wrap">
              <span class="item-title">{{ item.companyName }}</span>
              <span class="item-title">{{ item.groupName }}</span>
            </p>
            <span class="item-desc">{{ item.approvalCreateTime | date }}</span>
          </li>
        </ul>
      </dashboard-component>
    <!-- 확인사항 -->
    </article>
  </div>
</template>

<script>
import API, { DashboardComponent } from '@sd-fe/cmp-core'
import { mapState } from 'vuex'
import Dayjs from 'dayjs'

export default {
  name: 'DashboardWorks',
  components: { 'dashboard-component': DashboardComponent },
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  async created () {
    await this.getCodeList()
    await this.getNoticeList()
    await this.getTaskPre()
    this.getCheckList()

    this.$emit('work-Length', { notice: this.todayRegNotice, task: this.taskTotalLen })
  },
  methods: {
    routeTo (to) {
      this.$router.push(to)
    },
    async getCodeList () {
      try {
        const response = await API.config.getCodeList({ codeType: 'NOTICE' })

        if (response) {
          const filters = response.map(resp => { return { value: resp.codeVal, label: resp.codeName } })
          this.categoryOptions = [...filters]
        }
      } catch (error) {
        console.error('@@ getCodeList :: ', 'error')
      }
    },
    noticeTypeCheck (type) {
      const category = this.categoryOptions?.filter(cate => cate.value === type)[0]
      if (category) {
        const result = category.label
        const substr = `${result.substring(0, 3)}...`
        // 해당 css를 [업무 사전협의건, 확인사항]에서도 사용하고 있어서 css로 처리하지 않았습니다!
        return result.length > 3 ? substr : result
      } else {
        return this.$t('admin.NOTI.unClassified')
      }
    },
    async getNoticeList () {
      try {
        const response = await API.config.getNoticeInfo()
        const maxLen = response.length > 6 ? 6 : response.length

        this.noticeTotalLen = response.length
        for (let i = 0; i < maxLen; i++) this.noticeData.push(response[i])
        this.resourceLoad = false

        // 등록후 24시간안에 해당하는 공지사항 확인 및 내보내기
        const now = +new Date()
        const aDay = 86400000 // 24시간 => ms 변환
        this.todayRegNotice = response.filter(notice => now - notice.createTime < aDay).length
      } catch (err) {
        console.error('@@ getNoticeList', err)
      }
    },
    async getTaskPre () {
      try {
        console.log('ㅇㅅㅇ')
        const response = await API.work.getTaskPre()

        if (response.length) {
          const reverse = response.sort((resp1, resp2) => {
            const r1Tile = resp1.createTime
            const r2Tile = resp2.createTime

            if (r1Tile < r2Tile) return 1
            if (r1Tile > r2Tile) return -1
            else return 0
          })

          // PUBLIC 이면서 [AWS 프로젝트] 관련 티켓이 아닌것만 보여줌
          const publicClouds = reverse.filter(resp => resp.orders[0].cloudType === 'PUBLIC' && resp.orders[0].type !== 'PROJECT')
          this.taskTotalLen = reverse.filter(resp => resp.orders[0].cloudType === 'PUBLIC').length

          const rawData = publicClouds.map(resp => {
            // let taskStatus = '미정'
            let taskStatus = this.$t('task.STATE.unde')
            let state = 'WAIT'
            const cloudType = resp.orders?.[0].cloudType

            if (resp.finishTime) {
              const today = Dayjs(new Date())
              const date = Dayjs(new Date(resp.finishTime))
              // const interval = today.diff(date, 'days')
              const interval = this.$options.filters.interval(today, date)

              // console.log(interval)
              const proceedStatus = resp.orders.filter(order => order.proceedStatus).length
              state = proceedStatus ? 'PROCEED' : state
              if (interval > 0) state = 'DELAY'

              taskStatus = `D${interval < 0 ? '' : '+'}${interval} ${this.stateDesc[state].ko}`
            }

            return {
              id: resp.approvalNo,
              oldTaskNo: resp.approvalNo,
              title: resp.companyName,
              part: resp.groupName,
              sourceLength: resp.orders.length,
              createTime: resp.createTime,
              state,
              taskStatus,
              type: resp.type,
              cloudType: cloudType || 'PRIVATE',
              orderType: resp.orders?.[0].orderType
            }
          })

          const maxLen = rawData.length > 6 ? 6 : rawData.length
          for (let i = 0; i < maxLen; i++) this.taskData.push(rawData[i])
        }
        this.tasksLoad = false
      } catch (err) {
        console.error('@@ getTaskPre', err)
      }
    },
    conferenceSelectItem (item) {
      // [AWS생성/삭제] 는 대시보드 목록에 표기되지 않음
      const { type, cloudType } = item
      if (type === 'USER' && cloudType === 'PUBLIC') return this.$router.push({ name: 'conference-aws-detail', params: item })
    },

    /**
     * [확인사항]
     */
    async getCheckList () {
      const roleUpperList = this.user?.userPermUpperRoleList?.map(item => item.roleUpper)?.join(',')

      try {
        const response = await API.work.getTaskTodoList({ roleUpper: roleUpperList })

        const rawData = response.map(resp => {
          return {
            ...resp,
            id: resp.orderNo,
            cloudType: resp.cloudType,
            moduleType: resp.moduleType || 'PRIVATE',
            workType: resp.taskTodoRoleList?.[0]?.taskDataList?.[0]?.workType
          }
        })

        const publicClouds = rawData.filter(data => data.isError && data.cloudType === 'PUBLIC' && data.workType !== 'AWS_PROJECT')
        this.resourceDataLen = publicClouds.length

        const reverse = publicClouds.sort((resp1, resp2) => {
          const r1Tile = resp1.approvalCreateTime
          const r2Tile = resp2.approvalCreateTime

          if (r1Tile < r2Tile) return 1
          if (r1Tile > r2Tile) return -1
          else return 0
        })

        const maxLen = reverse.length > 6 ? 6 : reverse.length
        for (let i = 0; i < maxLen; i++) this.resourceData.push(reverse[i])

        this.noticeLoad = false
      } catch (err) {
        console.error('@@ getCheckList', err)
      }
    },
    /**
     * 티켓 또는 로우 선택시 발생 이벤트
     */
    checklistSelectItem (item) {
      // const { workType } = item
      return this.$router.push({ name: 'todo-aws-detail', params: item })
    }

  },
  data () {
    return {
      categoryOptions: [],
      noticeData: [],
      noticeLoad: true,
      taskData: [],
      tasksLoad: true,
      noticeTotalLen: 0,
      taskTotalLen: 0,
      resourceDataLen: 0,
      resourceData: [],
      resourceLoad: true,
      stateDesc: {
        REQUEST: { color: 'ing', ko: this.$t('task.STATE.request') },
        WAIT: { color: 'wait', ko: this.$t('task.STATE.wait') },
        PROCEED: { color: 'ing', ko: this.$t('task.STATE.progress') },
        DELAY: { color: 'delay', ko: this.$t('task.STATE.delay') },
        DONE: { color: 'complete', ko: this.$t('task.STATE.complete') },
        REJECT: { color: 'reject', ko: this.$t('task.STATE.reject') },
        ERROR: { color: 'delay', ko: this.$t('task.STATE.error') },
        confirm: { color: 'confirm', ko: this.$t('task.STATE.confirm') },
        undefined: { color: '', ko: this.$t('task.STATE.unde') }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .dashboard-works {
    display: flex;
    .body-panel {
      flex: 1 1 100%;
      & + .body-panel { margin-left: $gap; }

      .more-icon {
        display: block;
        width: 18px; height: 18px;
        position: relative;
        cursor: pointer;

        &::before,
        &::after {
          background-color: #9596a0;
          position: absolute;
          content: '';
        }
        &::before {
          width: 100%; height: 2px;
          top: 8px; left: 0;
        }
        &::after {
          width: 2px; height: 100%;
          top: 0; left: 8px;
        }
      }

      .note-lists {
        > .notice-item {
          &:hover { color: $white; }
          justify-content: space-between;
          height: 24px;
          cursor: pointer;
          transition: .3s ease;
          color: $light-gray;

          & + .notice-item { margin-top: $gap-s; }

          .-contents {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            flex: 1 1 auto;

            > .-status {
              border: 1px solid $general;
              text-overflow: ellipsis;
              overflow: hidden;
              color: $general;
              line-height: 22px;
              height: 20px;
              flex: 0 0 45px;
              text-align: center;
              display: block;
              border-radius: 22px;
              font-size: 13px;
              letter-spacing: -0.33px;
              margin-right: $gap-s;

              &.-fail {
                border: 1px solid $main-red;
                color: $main-red;
              }

              &.-is-deleted {
                border: none;
                color: #d95252;
              }
            }

            .item-title {
              max-width: 250px;
              text-overflow: ellipsis;
              overflow: hidden;
              height: 20px;
              white-space: nowrap;
              line-height: 20px;
            }
          }

          .title-arrange {
            flex: 0 0 224px;
            margin-left: 25px;
            > .item-title {
              margin-right: $gap;
              display: block;
              width: 102px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              max-width: 70%;
            }
          }

          > .item-desc {
            font-size: 13px;
            letter-spacing: -0.33px;
            color: $color-ticket;
            flex: 0 0 120px;
          }

          > .item-state {
            display: flex;
            align-items: center;
            justify-content: center;
            letter-spacing: -0.33px;
            padding: 0;
            width: 70px;
            font-size: 13px;
            font-family: 'Roboto';
            // font-weight: bold;
            .work-state {
              text-align: center;
              &.confirm {color: $violet;}
              &.ing {color: $success;}
              &.wait {color: $yellow;}
            }
          }
        }
      }
    }
  }
</style>
