<template>
  <div class="task-calendar-board">
    <div class="header">
      <h5 class="header__title">
        {{ $v('업무 일정') }}
        <el-tooltip
          effect="light"
          placement="top"
        >
          <div slot="content">
            {{ $v('주문 결재 내 완료 희망일 기준') }}
          </div>
          <i
            class="el-icon-warning-outline"
            style="color: #9e85fa;"
          />
        </el-tooltip>
      </h5>
      <div class="header__status">
        <div>
          <span class="circle REVIEW" />
          <span>{{ $v('잔여 업무') }}</span>
        </div>
        <div>
          <span class="circle TODO" />
          <span>{{ $v('업무 완료') }}</span>
        </div>
      </div>
    </div>
    <ul class="card-wrapper">
      <div
        v-if="data.length === 0 "
        style="display:flex; flex-direction:column; align-items:center; padding-top:30px;"
      >
        <div>
          <i
            class="mdi mdi-alert-circle-outline"
            type="is-info"
            size="is-medium"
          />
        </div>
        <div style="margin-top:10px;">
          {{ $v('해당 날짜에 업무가 없습니다.') }}
        </div>
      </div>

      <li
        v-else
        class="card"
        v-for="(x, idx) in data"
        :key="idx"
        @click="goToRoute(x)"
      >
        <h5 class="card__date">
          <span
            class="circle circle--red"
            :class="getClass(getWorkStep(x.workState))"
          />

          {{ selectedDate }}
        </h5>
        <div class="card__info">
          <div class="card__row card__row--first f-12">
            <span class="tag"> {{ getWorkStepText(getWorkStep(x.workState)) }}</span>
            <span>{{ $v('완료희망일') }}</span>
            <delay-or-remaining-tag
              :date="x.expectDate"
              style="color: #fff;"
            />
          </div>
          <div class="card__row card__row--second f-14">
            <el-tooltip
              effect="light"
              placement="top"
              :disabled="x.orderReqNote.length < 12"
            >
              <div slot="content">
                {{ x.orderReqNote }}
              </div>
              <p
                class="card__title"
              >
                {{ x.orderReqNote }}
              </p>
            </el-tooltip>

            <span class="f-12">{{ x.companyName }}</span>
            <span class="f-12">| {{ x.groupName }}</span>
            <span class="f-12">| {{ x.userName }}</span>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { ReviewStates, TodoStates, DoneStates } from '@/utils/work/workEnums'
import DelayOrRemainingTag from '@/components/Tag/DelayOrRemainingTag.vue'
export default {
  components: {
    'delay-or-remaining-tag': DelayOrRemainingTag
  },
  props: {
    data: {
      type: [Object, Array],
      default: () => {}
    },
    selectedDate: {
      type: String,
      default: ''
    }
  },
  computed: {
    ...mapState({
      csp: state => state.cloud.cloudType.toUpperCase()
    })
  },

  methods: {
    getWorkStepText (workStep) {
      return {
        REVIEW: '사전협의',
        TODO: '할일',
        DONE: '한일'
      }[workStep] ?? workStep
    },
    getClass (scheduleStatus) {
      return {
        REVIEW: 'REVIEW',
        TODO: 'TODO',
        DONE: 'DONE'
      }[scheduleStatus]
    },
    getWorkStep (state) {
      console.log(43434343434, DoneStates)
      if (Object.keys(ReviewStates).includes(state)) return 'REVIEW'
      if (Object.keys(TodoStates).includes(state)) return 'TODO'
      if (Object.keys(DoneStates).includes(state)) return 'DONE'
      return state
    },
    goToRoute (obj) {
      const { workState, orderNo } = obj
      const workStep = this.getWorkStep(workState)
      const params = { id: orderNo }

      const routerTo = {
        REVIEW: {
          PRIVATE: { name: 'conference-detail', params },
          PUBLIC: { name: 'conference-aws-detail', params }
        },
        TODO: {
          PRIVATE: { name: 'todo-detail', params },
          PUBLIC: { name: 'todo-aws-detail', params }
        },
        DONE: {
          PRIVATE: { name: 'done-detail', params },
          PUBLIC: { name: 'done-aws-detail', params }
        }
      }[workStep][this.csp]

      return this.$router.push(routerTo)
    }
  }
}
</script>

<style lang="scss" scoped>
.task-calendar-board {
  width:100%;
  height:350px;
}

.header {
  height: 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  &__title {
    margin-top:15px;
    font-size: 18px;
    font-weight: 700;
  }

  &__status {
    display: flex;
    gap: 20px;
    margin-right:40px;
  }

  &__circle {
  }
}

.card-wrapper {
  width: 720px;
  height: 260px;
  overflow-y: auto;
  box-sizing: border-box;
}

.card {
  &:hover {
    cursor: pointer;
    background-color: rgba(63, 85, 187, 0.3);
  }
  border-bottom: 1px solid rgba(42, 45, 68, 1);
  height: 64px;
  box-sizing: border-box;
  display: flex;
  align-items: center;

  &__title {
    // style="width:120px; height:100%; overflow:hidden;"
    width: 120px;
    height:100%;
    overflow: hidden;
    text-overflow:ellipsis;
    white-space: nowrap;
    width:auto;
    max-width: 150px;
  }

  &__date {
    flex: 0 0 120px;
    font-size: 14px;
    text-align: center;
  }

  &__row {
    height: 22px;
    line-height: 22px;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  &__row--first {}

  &__row--second {
    span { color: rgba(114, 119, 151, 1); }
  }

}

.tag {
  display: inline-block;
  width: auto;
  height: 22px;
  line-height: 22px;
  background: #39394b;
  color: #fff;
  border-radius: 6px;
  font-size: 12px;
  padding: 1px 4px;
  box-sizing: border-box;
}

.circle {
  width: 7px;
  height: 7px;
  display: inline-block;
  border-radius: 50%;
  margin-right: 5px;

  &.REVIEW { background:#FA5657; }
  &.TODO { background:#5462FF; }
  &.DONE { background:#5462FF;}

}

.f-12 {
  font-size: 12px;
}

.f-13 {
  font-size: 13px;
}

.f-14 {
  font-size: 14px;
}
</style>
