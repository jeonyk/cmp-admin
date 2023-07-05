<!--
  * 파일명 : register-contents.vue
  * 파일 기능 : [공통 컴포넌트] 데이터를 받아 <타이틀: 내용> 형식의 컴포넌트를 생성해줍니다.
  * 작성자 : 김예담
  * 최종 작성일 : 2021-01-07
  * License By Shinsegae I&C
  * 2021-01-07 fix: [환경설정 > 뉴타닉스 설정] - 로딩 추가 및 ui 자잘한 수정
 -->

<template>
  <div :class="['register-contents', `-${type}`]">
    <div
      :class="['contents-title', `-${labelAlign}`]"
      :style="`min-width: ${titleWidthPx - 40}px;`"
    >
      <span :class="['contents-title-text', { '-required': required }]">
        <slot name="title">
          <div class="flex-wrap">
            <span v-html="title" />
            <small
              class="contents-sub-title"
              v-html="subTitle"
              v-if="subTitle"
            />
            <el-tooltip
              placement="top"
              effect="light"
              v-if="titleHelp"
            >
              <span
                class="limit-width-tooltip"
                slot="content"
                v-html="titleHelp"
              />
              <!-- 정책 패턴 규격 보기 -->
              <i
                class="mdi mdi-help-circle-outline help-icon"
                size="is-small"
                style="margin-left: 5px;"
              />
            </el-tooltip>
          </div>
        </slot>
      </span>
    </div>
    <div :class="['contents', { '-stretch': stretch}]">
      <!-- 내용이 들어갑니다. -->
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'RegisterContents',
  props: {
    title: {
      type: String,
      default: ''
    },
    subTitle: {
      type: String,
      default: ''
    },
    stretch: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: '' // input
    },
    titleHelp: { // 타이틀 도움말 사용 시..
      type: String,
      default: ''
    },
    titleWidthPx: {
      type: Number,
      default: 200
    },
    labelAlign: {
      type: String,
      default: ''
    }
  },
  methods: {
  },
  data () {
    return {
      miniToolTipShow: false
    }
  }
}
</script>

<style lang="scss" scoped>
  .register-contents {
    display: flex;
    align-items: stretch;
    &.-center{
      align-items: center;
    }
    &:last-child {
      > .contents-title { border-color: $border2A; }
    }
    .contents-title{
      // font-weight: 500;
      min-height: 20px;
      min-width: 160px;
      display: flex;
      align-items: center;
      flex: 1 2 auto;
      padding: $gap-s $gap;
      background-color: $border2A;
      border-bottom: 1px solid $background-color;
      .contents-title-text {
        display: inline-block;
        color: $white;
        text-transform: capitalize;
      }
      .help-icon {
        &:before {
          line-height: 32px;
          font-size: 16px;
          color: $primary;
        }
      }
    }

    .contents {
      width: 100%;
      border-bottom: 1px solid $border2A;
      padding: $gap-s $gap;
      color: $text-color;
      line-height: 1.54;
    }
    .-stretch {
      width: 100%;
    }
    &.-input {
      > .contents-title{
        background-color: transparent;
        border-color: transparent;
        width: 250px;
        &.-top {
          display: inline-block;
          padding: 20px 20px;
        }
        .contents-title-text {
          color: $color-ticket-cont;
        }
      }
      > .contents {
        border-color: transparent;
        > span {
          display: block;
          color: $text-color;
        }
      }
    }
  }

.-required {
  position: relative;
  &::before {
    position: absolute;
    top: 0px;
    left: calc(100% + 5px);
    content: '*';
    font-size: 15px;
    color: $main-red;
    height: 100%;
  }
}

.flex-wrap {
  position:relative;
}

.contents-sub-title {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  display: block;
  white-space: pre-wrap;
  word-break: keep-all;
  width: 127px;
  color: $input-placeholder;
  font-size: 12px;
}
.-top {
  .contents-sub-title {
    white-space: nowrap;
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .2s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>
