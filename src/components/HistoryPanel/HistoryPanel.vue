<!--
  * 파일명 : HistoryPanel.vue
  * 파일 기능 : 미터링 서버현황 > 히스토리 패널 컴포넌트
  * 작성자 : 김예담 외 2명
  * 최종 작성일 : 2021-02-22
  * License By Shinsegae I&C
  * 2021-02-22 fix: [미터링 서버현황] - 히스토리 추가된 S/W, 삭제된 S/W 표기 통일
 -->

<template>
  <div class="history-panel">
    <div
      v-if="historyData && historyData.length"
      class="history-panel-wrap"
    >
      <span class="vertical-bar" />
      <section
        class="history-contents"
        v-for="(list, idx) in historyData"
        :key="idx"
      >
        <template v-if="list.detail.length">
          <div class="history-date">
            {{ list.historyCreateDate | date }}
          </div>
          <ul class="history-list">
            <li
              class="history-item"
              v-for="item in list.detail"
              :key="item.field"
            >
              <template v-if="item.type !== 'added' && item.type !== 'deleted'">
                <span class="item-title">{{ $t(item.keyPath) || item.field }}</span>
                <div class="item-detail-contents">
                  <span class="item-detail-desc -before">{{ item.history.before }}&ensp;→&ensp;</span>
                  <span class="item-detail-desc -after">{{ item.history.after }}</span>
                </div>
              </template>

              <template v-else-if="item.history.length">
                <span class="item-title">{{ $t(item.keyPath) || item.field }}</span>
                <div class="item-detail-contents">
                  <p
                    v-for="(sw, index) in item.history"
                    :key="index"
                    class="item-detail-sw"
                    :class="[item.type === 'added' ? '-add' : '-subt']"
                  >
                    <template v-if="sw.storage">
                      <el-tooltip placement="top">
                        <template slot="content">
                          {{ sw.date }}
                        </template>
                        <span v-html="sw.name" />
                      </el-tooltip>
                    </template>
                    <template v-else>
                      {{ sw }}
                    </template>
                  </p>
                </div>
              </template>
            </li>
          </ul>
        </template>
      </section>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HistoryPanel',
  props: {
    historyData: {
      type: Array,
      default: () => []
    }
  }
}
</script>
<style lang="scss" scoped>
  .history-panel {
    overflow-y: auto;
    max-height: calc(80vh + #{$gap});
    height: calc(80vh + #{$gap});
    .history-panel-wrap {
      // position: relative;
      height: 100%;
    }
    .vertical-bar {
      display: inline-block;
      position: absolute;
      top: 5px;
      // bottom: 0;
      left: 4px;
      width: 2px;
      height: 100%;
      background-image: linear-gradient(to top, $sea-blue , $emerald);
    }

    .history-contents {
      margin-left: 24px;
      & + .history-contents {
        margin-top: $gap * 2;
      }
      > .history-date {
        position: relative;
        color: $emerald;
        font-weight: 500;
        font-size: 14px;
         &:before {
          content: '';
          position: absolute;
          top: 5px;
          left: -23px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: $emerald;
        }
      }
      > .history-list {
        margin-top: $gap;
        .history-item {
          display: flex;
          & + .history-item {
            margin-top: 5px;
          }
          >.item-title {
            color: $color-lightgrey;
            background-color: $black;
            padding: 0 5px;
            /* min-width: 45px; */
            line-height: $gap;
            height: $gap;
            text-align: center;
            // align-self: center;
            border-radius: $radius-s;
            white-space: nowrap;
          }

          >.item-detail-contents {
            margin-top: 3px;
            margin-left: $gap-s;
            height: 100%;
            .item-detail-sw {
              margin-bottom: 5px;
              &.-add {color: $sea-blue;}
              &.-subt {color: $danger;}
              ::v-deep .tooltip-target {
                text-decoration: underline;
                cursor: help;
              }
            }
            .item-detail-desc {
              .-before {color: $color-lightgrey;}
              .-after {color: #f0f0f0;}
            }
          }
        }
      }
    }
  }
</style>
