<!--
  * 파일명 : g-foldable.vue
  * 파일 기능 : [공통컴포넌트] 컨텐츠를 <타이틀: 내용> 형식으로 입력하여 접었다/폈다 할 수 있는 기능을 지닌 컴포넌트입니다.
  * 작성자 : 김예담 외 3명
  * 최종 작성일 : 2020-12-14
  * License By Shinsegae I&C
  * 2020-12-14 fix: g-foldable 내부 모달 radio 스타일 지정
 -->

<template>
  <section class="fordable-wrap">
    <article
      :class="['foldable-title', { '-opened': foldState }, { '-reference': reference }, {'-reverse': expandReverseColor}]"
      @click.stop="e => {foldStatus(e)}"
    >
      <cmp-status-tag
        v-if="useState"
        :type="`is-${setState(useState).color}`"
        :line-style="foldState"
        :contents="setState(useState).label"
      />
      <h6 :style="useState ? 'margin-left: 10px' : null">
        {{ title }}
      </h6>

      <span
        class="total-count-information"
        v-if="eaCount || totalAmount"
      >
        <span>
          {{ $t('common.TERMS.total') }} <b>{{ eaCount.toLocaleString() }}</b> EA
        </span>
        <span>
          {{ $t('common.TERMS.month') }} <b>{{ totalAmount.toLocaleString() }}</b> {{ $t('common.TERMS.won') }}
        </span>
      </span>

      <span
        class="stable-member"
        v-if="overlappedMem"
      >
        {{ overlappedMem }}
      </span>

      <slot name="header-suffix" />

      <slot
        name="fold-arrow"
        :state="foldState"
      >
        <span class="fold-status">
          <i class="fold-icon" />
          <i :class="['fold-icon-plus', { 'transition': foldState }]" />
        </span>
      </slot>
    </article>

    <transition
      name="slide-fade"
      mode="out-in"
    >
      <article
        v-show="foldState"
        class="foldable-article"
        :class="{'-reverse': expandReverseColor}"
      >
        <h6 class="skip-article-header">
          {{ title }}
        </h6>
        <slot name="contents" />
      </article>
    </transition>
  </section>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: ''
    },
    eaCount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    defaultStatus: { // 기본적으로 펴져있을지 결정합니다.
      type: Boolean,
      default: false
    },
    reference: { // 색상이 다를 때 사용 - 체크리스트에만 쓰는데 이유를 모르겠음..
      type: Boolean,
      default: false
    },
    useState: {
      type: String, // 타이틀 앞에 상태를 표시할 경우 사용합니다.
      default: null
    },
    overlappedMem: {
      type: String, // 타이틀 뒤에 중복되는 요청자 정보 입력시
      default: null
    },
    expandReverseColor: { // 펼쳤을 때, reverse color 테마 적용 여부
      type: Boolean,
      default: true
    }
  },
  watch: {
    title () {
      this.foldState = false
    }
  },
  methods: {
    foldStatus (e) {
      if (!this.isInFoldable(e.target)) this.foldState = !this.foldState
    },
    isInFoldable (target) {
      const el = document.querySelector('.foldable-wrap')
      if (el) {
        const children = el.querySelectorAll('*')
        return Array.from(children).every(child => target === child)
      }
      if (target === el) return true

      return false
    },
    setState (state) {
      return {
        wait: { label: this.$v('대기'), color: 'wait' },
        complete: { label: this.$v('승인'), color: 'complete' },
        new: { label: this.$v('신규'), color: 'new' },
        change: { label: this.$v('변경'), color: 'changed' },
        removed: { label: this.$v('삭제'), color: 'removed' },
        NEW: { label: this.$v('신규'), color: 'new' },
        CHANGE: { label: this.$v('변경'), color: 'changed' },
        DELETE: { label: this.$v('삭제'), color: 'removed' },
        URGENT: { label: this.$v('긴급'), color: 'removed' },
        delete: { label: this.$v('삭제'), color: 'removed' }
      }[state]
    }
  },
  data () {
    return {
      foldState: !!this.defaultStatus
    }
  }
}
</script>

<style lang="scss">
  .fordable-wrap {
    margin-bottom: $gap-s;
    display: flex;
    flex-wrap: wrap;
    > .foldable-title {
      display: flex;
      align-items: center;
      order: 1;
      // padding: $gap;
      width: 100%;
      background-color: $navy;
      border-radius: $radius;
      line-height: 1.5;
      font-size: 22px;
      font-weight: 500;
      background-color: $ticket-back-color;
      box-sizing: border-box;
      padding: 15px 40px;
      height: 50px;
      transition: .2s ease;
      cursor: pointer;

      &.-opened {
        border-radius: $radius $radius 0 0;
        &.-reverse {
          color: #222;
          background-color: $white;
        }

        .conference-checklist > .icon-button span { // 확인사항
          color: $text-black;
        }
      }
      &.-reference {
        border: 1px solid #2c2f47;
        color: $color-ticket-cont;
      }

      > h6 {
        font-size: 16px;
        flex: 2 1 80%;
        font-weight: normal;
        // height: 25px;
        // line-height: 25px;
      }
      > span {
        display: block;
        box-sizing: border-box;
        width: 25px;
        height: 22px;
        > i {
          position: absolute;
          cursor: pointer;
          top: 0;
          right: 0;
        }
        .fold-icon {
          display: block;
          width: 25px;
          height: 25px;
        }
        .fold-icon-plus {
          width: 25px;
          height: 25px;
          &:after,
          &:before {
            content: '';
            position: absolute;
            background-color: $color-lightgrey;
            transition: .2s ease;
          }
          &:after {
            width: 2px; height: 16px;
            top: 8px;
            left: 15px;
            }
          &:before {
            height: 2px; width: 16px;
            top: 15px;
            right: 1px;
          }
        }

        .transition {
          &:after {
            transform: rotate(90deg);
          }
        }
      }

      > .total-count-information {
        flex: 1 1 22%;
        color: $white;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        > span{
          > b {
            margin: 0 3px;
            font-weight: normal;
          }
          &:first-child {
            margin-right: $gap-s;
          }
        }
      }

      > .stable-member {
        width: 150px;
        display: block;
        font-size: 14px;
        text-align: right;
        font-weight: normal;
      }

      > .fold-status {
        width: 30px;
        height: 30px;
        margin-left: $gap;
        position: relative;
      }
    }

    > .foldable-article {
      border-radius: 0 0 $radius $radius;
      box-sizing: border-box;
      order: 2;
      padding: $gap $gap*2;
      width: 100%;
      &.-reverse {
        border-top: 1px solid #d9d9d9;
        background-color: $white;
        color: #222;
        *::-webkit-scrollbar {
          background-color:  #f0f0f0;
        }

        *::-webkit-scrollbar-track {
          background-color:  #f0f0f0;
        }

        *::-webkit-scrollbar-thumb {
          background-color: #999;
        }

        *::-webkit-scrollbar-corner {
          background-color:  #f0f0f0;
        }

        .task-resource-grid.cmp-grid-wrapper { // 펼쳐졌을 때 테이블 스타일
          @import '@/style/wijmo_style-light.scss';
        }
        .network-tab {
          ul.g-tab.block { // 탭 스타일
            display: flex;
            flex-direction: row;
            justify-content: flex-start;
            li.tab {
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
              margin-right: 2px;
              width: 150px;
              font-weight: 400;
              letter-spacing: -0.8px;
              text-align: center;
              cursor: pointer;
              color: $color-lightestgrey;
              // line-height: 50px;
              padding: $gap-s 0 $gap 0;
              border-bottom: 1px solid transparent;
              &:before {
                content: "";
                position: absolute;
                top: 100%;
                left: 50%;
                width: 0;
                height: 3px;
                background-color: $main-red;
                transition: width .1s ease;
              }
              &:after {
                content: "";
                position: absolute;
                top: 100%;
                right: 50%;
                width: 0;
                height: 3px;
                background-color: $main-red;
                transition: width .1s ease;
              }
            }

            li.tab.-active {
              color: $color-black;
              font-weight: bold;
              background: transparent;
              &:before {
                width: 50%;
                transition: width .4s ease;
              }
              &:after {
                width: 50%;
                transition: width .4s ease;
              }
            }
          }
          .tab-contents-area {
            border-top: 1px solid #f0f0f0;
          }
        }
      }

    }
  }

  .slide-fade-enter-active,
  .slide-fade-leave-active {
    transition: all .3s ease;
  }
  .slide-fade-enter, .slide-fade-leave-to {
    transform: translateY(-0px);
    opacity: 0;
  }
</style>
