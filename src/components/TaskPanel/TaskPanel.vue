<!--
  * 파일명 : TaskPanel.vue
  * 파일 기능 :
  * 작성자 : 정재은 외 1명
  * 최종 작성일 : 2020-11-13
  * License By Shinsegae I&C
  * 2020-11-13 Fix: 한일 수정 진행중
 -->

<template>
  <section
    :class="['task-panel', { '-confirm': data.state === 'confirm' }]"
  >
    <div class="panel-main">
      <div class="task-state-wrap">
        <div :class="['task-state-tag', `is-${data.state}`]">
          <strong
            v-if="data.state !== 'confirm'"
          >D + {{ data.sourceLength }}</strong>
          <span :class="{ 'wide': data.state === 'ing' }">
            {{ stateDesc(data.state) }}
          </span>
        </div>

        <div class="manager">
          <span>{{ data.part }}&nbsp;</span>
          <span class="name">{{ data.name }}</span><br>
        </div>
      </div>

      <article class="contents-wrap">
        <el-tooltip
          v-if="data.title.length > 10"
          :content="data.title"
          placement="top-end"
          popper-class="panel-title-popper"
        >
          <h4 class="panel-title">
            {{ data.title }}
          </h4>
        </el-tooltip>

        <h4
          v-else
          class="panel-title"
        >
          {{ data.title }}
        </h4>

        <ul class="panel-detail">
          <li>
            <span class="tit">업무구분: </span>
            <span class="info">{{ data.service }}</span>
          </li>
          <li>
            <span class="tit">프로젝트: </span>
            <span class="info">{{ data.service }}</span>
          </li>
          <li>
            <span class="tit">설정일자: </span>
            <span class="info">{{ data.applyDate }}</span>
          </li>
          <li>
            <span class="tit">완료 희망일: </span>
            <span class="info">{{ data.processDate | date('YYY.MM.DD') }}</span>
          </li>
        </ul>

        <div class="panel-more">
          <div class="progress-step">
            <span
              class="processed"
              :style="`width: ${drawProgressStep(data.progressStep, 'width')}%`"
            />
            <!-- 서버=2%, 네트워크=50%, 보안=100% -->
          </div>

          <div class="progress-tooltip-wrap">
            <div class="tooltip-sect">
              <span
                v-if="data.progressStep"
                :class="[
                  'tooltip', `-${data.progressStep}`
                ]"
              >
                {{ drawProgressStep(data.progressStep, 'statusNameKo') }}
              </span>
            </div>
          </div>
        </div>
      </article>
    </div>

    <div class="source-count">
      <span class="source-title">자원</span>
      <span class="count">
        <strong>{{ data.sourceLength }}</strong>
        EA
      </span>
    </div>
  </section>
</template>
<script>
export default {
  name: 'TaskPanel',
  props: {
    data: {
      type: Object,
      default: () => {}
    }
  },
  methods: {
    stateDesc (state = undefined) {
      return {
        wait: this.$t('task.STATE.wait'),
        ing: this.$t('task.STATE.progress'),
        delay: this.$t('task.STATE.delay'),
        complete: this.$t('task.STATE.complete'),
        reject: this.$t('task.STATE.reject'),
        confirm: this.$t('task.STATE.confirm'),
        undefined: this.$t('task.STATE.unde')
      }[state]
    },
    drawProgressStep (state = undefined, need) {
      if (state) {
        const informations = {
          undefined: { width: 0, statusNameKo: undefined },
          server: { width: 2, statusNameKo: '서버' },
          network: { width: 50, statusNameKo: '네트워크' },
          security: { width: 100, statusNameKo: '보안' }
        }[state]

        return informations[need] ? informations[need] : undefined
      } else return undefined
    }
  }
}
</script>
<style lang="scss" scoped>
  .task-panel {
    box-sizing: border-box;
    position: relative;
    height: 100%;
    transition: .3s ease;

    &.-confirm {
      @include statusOpacity(#9e85fa);
      color: $white;
    }

    .panel-main {
      padding: calc(#{$gap-m} + 10px);
    }

    .task-state-wrap {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .task-state-tag {
        height: 70px; width: 70px;
        border-radius: 8px;
        text-align: center;
        font-size: 18.5px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        > strong,
        > span {
          display: block;
          letter-spacing: -2px;
        }

        > span {
          font-weight: 300;
          text-align: center;
          letter-spacing: 0px;

          &.wide { width: 60px; }
        }

        &.is-delay { @include statusOpacity($danger) }
        &.is-complete { @include statusOpacity($info) }
        &.is-ing { @include statusOpacity($success) }
      }

      .manager {
        flex: 1 1 auto;
        height: 40px;
        font-size: 16px;
        text-align: right;
        color: $color-lightgrey;
        font-weight: 300;
        line-height: 16px;

        > span { display: block; }
        > .name {
          font-size: 20px;
          margin-top: 6px;
        }
      }
    }

    .contents-wrap {
      > .panel-title {
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        font-size: 28px;
        margin: 40px 0 $gap-m 0;
      }

      .panel-detail {
        > li {
          height: 14px;
          padding: $gap-s 0;
          line-height: 14px;
          display: flex;
          > span { display: block; }

          > .tit {
            color: $color-ticket;
            flex: 0 0 90px;
            position: relative;
            padding-left: 10px;
            transition: .5s ease;
            &:before {
              content: '';
              position: absolute;
              top: 7px; left: 0;
              width: 2px; height: 2px;
              border-radius: 50%;
              background-color: $color-ticket;
            }
          }

          > .info {
            font-family: 'Roboto';
            color: $color-ticket-cont;
            flex: 1 1 auto;
            text-align: right;
          }
        }
      }

      .panel-more {
        margin-top: 62px;
        display: flex;
        align-items: center;
        flex-direction: column;
        position: relative;
        // border: 1px solid palegoldenrod;

        > .progress-step {
          overflow: hidden;
          height: 4px;
          border-radius: 2px;
          width: 250px;
          position: relative;
          height: 4px;
          background: rgb($white, .2);

          .processed {
            top: 0; left: 0;
            overflow: hidden;
            position: absolute;
            display: block;
            height: 8px;

            &::before {
              content: '';
              top: 0; left: 0;
              position: absolute;
              width: 250px;
              height: 4px;
              @include gradientBackground;
            }
          }
        }

        > .progress-tooltip-wrap {
          position: absolute;
          bottom: calc(100% + 10px); left: 0;
          height: 31px;
          width: 100%;

          .tooltip-sect {
            // border: 1px solid orange;
            height: 100%;

            > .tooltip {
              border: 1px solid $server;
              border-radius: $radius-r;
              position: relative;
              display: inline-block;
              height: 100%;
              line-height: 31px;
              padding: 0 10px;

              &:after {
                content: '';
                position: absolute;
                width: 5px; height: 5px;
                border: 1px solid $server;
                border-top-color: transparent !important;
                border-left-color: transparent !important;
                top: calc(100% - 3px); left: calc(50% - 3px);
                transform: rotate(45deg)
              }

              &.-server {
                color: $server;
                border-color: $server;
                &:after { border-color: $server }
              }
              &.-network {
                color: $network;
                border-color: $network;
                transform: translateX(107px);
                &:after { border-color: $network }
              }
              &.-security {
                color: $security;
                border-color: $security;
                transform: translateX(240px);
                &:after { border-color: $security }
              }
            }
          }
        }
      }

    }
    .source-count {
      height: 80px;
      color: $color-lightgrey;
      padding: 20px 38px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-sizing: border-box;
        // background: $panel-bg;

      > .source-title {
        font-size: 24px;
        display: block;
        height: 24px;
        line-height: 24px;
        font-weight: 300;
      }

      > .count {
        font-family: 'Roboto';
        font-weight: 500;
        font-size: 32px;
        height: 48px;
        line-height: 48px;
        > strong {
          font-weight: bold;
          font-size: 48px;
        }
      }
    }
  }
</style>
