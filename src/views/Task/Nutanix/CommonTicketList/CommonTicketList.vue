<!--
  * 파일명 : CommonTicketList.vue
  * 파일 기능 : [티켓으로 보기]시 티켓 하나의 컴포넌트 입니다. 티켓 내부 컨텐츠를 감싸는 외부 컨텐츠입니다.
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2021-02-26
  * License By Shinsegae I&C
  * 2021-02-26 Update: 사전협의 티켓보기시 page 처리
 -->

<template>
  <div class="common-ticket-lsit">
    <total-count :total-count="data.length">
      <!-- {{ currPage }} -->
      <div
        class="progress-step"
        v-if="process && data.length > 0"
      >
        <span
          class="processed -active"
          v-for="(step, idx) in 3"
          :key="idx"
        />
        <span class="progress-desc">{{ $t('task.TODO.progress') }}</span>
      </div>
    </total-count>

    <ul
      class="ticket-panel-list"
      v-if="data.length"
    >
      <li
        :class="['ticket-panel-item', { '-confirm': item.state === 'confirm' }]"
        v-for="(item, idx) in allData"
        :key="idx"
        @click="selectItem(item)"
      >
        <!-- <small class="transition-back" /> -->
        <ticket-panel
          class="ticket-panel-contents"
          :data="item"
          :is-conf="isConf"
          :process="process"
          :is-project="!item.orderLists"
        />
        <!-- * [임시] orderLists 키가 없을 때, 프로젝트 티켓으로 판별 -->

        <span
          class="order-number"
          v-if="!isConf"
        >
          {{ $t('common.TERMS.orderNumber') }} &nbsp; {{ item.id }}
        </span>
        <span
          class="order-number"
          v-else
        >
          {{ $t('common.TERMS.payNumber') }} &nbsp; {{ item.id }}
        </span>
      </li>
    </ul>

    <div
      v-if="data.length && data.length >= initDataCount"
      class="pagination-wrap"
    >
      <el-pagination
        layout="prev, pager, next"
        :total="data.length"
        :page-size="initDataCount"
        :current-page.sync="currpage"
        @current-change="clickChangePageEvent"
      />
    </div>

    <p
      v-if="!data.length"
      class="-empty"
    >
      {{ $t('common.PLACEHOLDER.noData') }}
    </p>
  </div>
</template>
<script>
import TicketPanel from '@/components/TaskPanel/TicketPanel'
export default {
  name: 'CommonTicketList',
  components: {
    'ticket-panel': TicketPanel
  },
  props: {
    data: {
      type: Array,
      default: undefined
    },
    isConf: { // 사전 협의 주문번호 -> 결재변호로 바꾸기 위해서 설정했습니다.
      type: Boolean,
      default: false
    },
    process: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    page () { return Number(this.$route.query?.page) || 1 },
    allData () {
      const copyData = JSON.parse(JSON.stringify(this.data))
      const changeData = copyData.slice(this.initDataCount * (this.page - 1), this.initDataCount * this.page)
      return changeData
    }
  },
  watch: {
    /**
     * 티켓 데이터 내용 변경시 발생
     */
    data (data) {
      if (data.length) this.changingPage(this.page)
    },
    page (page) {
      this.currpage = page
      this.changingPage(page)
    }
  },
  methods: {
    changingPage (page) {
      this.currpage = page
      this.$emit('chageCurrentPage', page)

      this.$router.push({ query: { type: 'ticket', page } })
    },
    clickChangePageEvent (page) {
      this.changingPage(page)
      this.$emit('chageCurrentPage', page)
    },
    selectItem (item) {
      this.$emit('select-item', item)
    }
  },
  data () {
    return {
      initDataCount: 12,
      currpage: 0
    }
  }
}
</script>
<style lang="scss">
  .common-ticket-lsit {
    .progress-step {
      display: flex;
      align-items: center;
      .processed {
        width: 17px;
        height: 5px;
        opacity: .15;
        background-color: $main-gray;
        border-radius: $radius-s;

        & + .processed {margin-left: 2px;}

        &.-active {
          opacity: 1;
        }
      }
      .progress-desc {
        margin-left: $gap-s;
        color: $input-placeholder;
      }
    }
    .ticket-panel-list {
      display: grid;
      grid-template-columns: 250px 250px 250px 250px 250px 250px;
      column-gap: $gap;
      row-gap: 28px;

      > .ticket-panel-item {
        border-radius: 0 $radius $radius $radius;
        margin-top: 15px;
        height: 250px;
        box-sizing: border-box;
        cursor: pointer;
        position: relative;
        transition: .5s ease;
        background: $ticket-back-color;
        box-shadow: 0px -8px $purple-gray;

        .ticket-panel-contents {
          overflow: hidden;
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
        }
        .order-number {
          position: absolute;
          right: 0;
          top: -32px;
          color: #999;
          font-size: 12px;
          letter-spacing: -0.3px;
          font-family: 'Roboto';
        }

        &::before {
          content:'';
          position: absolute;
          top: -15px;
          left: 0;
          border-radius: $radius 0 0 0;
          width: 50px;
          height: 15px;
          background-color: inherit;
        }
        &::after {
          content:'';
          position: absolute;
          top: -15px;
          left: 50px;
          border-radius: $radius;
          width: 50px;
          height: 30px;
          background-color: inherit;
          transform: skewX(45deg);
        }

        &:hover {
          // border: 1px solid $navy;

          // .transition-back {
          //   transform: translateX(0);
          //   &::after {
          //     transform: translateX(0);
          //   }
          // }
          background: $white;
          box-shadow: 0px -8px #dfe2e5;
          .ticket-panel-contents.ticket-panel {

            .icon-aws {
              background: url('../../../../assets/images/clouds/aws-black.png') no-repeat center center;
              transition: background 0.3s ease
            }
            .contents-wrap {
            > .panel-title {
              color: #666;
            }

            > .admin-info {
              color: #bbb;
            }

            .panel-detail-list {
              .panel-detail-item {
                > .tit {
                  color: #a7abb4;
                  background-color: #edeff2;
                }

                > .info {
                  color: $color-black;
                  background-color: transparent;
                  &.state-info {margin: 0;}
                  &.is-delay { color: $danger; }
                  &.is-wait { color: $alert; }
                  &.is-complete { color: $info; }
                  &.is-ing { color: $success; }
                }
              }
            }

            .panel-more {
              color: #666;
              > .progress-step {
               .processed { background-color: #333; }
              }
              > .view-history {
                > .box-icon {
                  -webkit-filter: invert(0%);
                  filter: invert(0%);
                }
              }

            }

          }
        }
      }
      }
    }

    .-empty {
      color: $disable;
      text-align: center;
      padding: 80px 0;
      margin-top: $gap-s;
    }
  }
</style>
