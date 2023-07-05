<!--
  * 파일명 : SBDetailInfoTable.vue
  * 파일 기능 :
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2020-08-25
  * License By Shinsegae I&C
  * 2020-08-25 fix: 버튼 통일 & 테이블 상단 total갯수와 버튼 영역 통일
 -->

<template>
  <ul class="sourcebasket-service-detail-table">
    <li
      class="detail-item"
      v-for="(col, idx) in column"
      :key="idx"
    >
      <article
        v-if="col.rowSpan"
        class="detail-item-wrap -external"
      >
        <h6 class="skip-article-header">
          자원바구니 상세
        </h6>
        <b class="detail-item-title">
          ExternalDisk
        </b>

        <div class="detail-item-external">
          <span class="detail-item-text">
            {{ data.ExternalDisk[0].storage }}
          </span>
          <span class="detail-item-text">
            {{ data.ExternalDisk[1].storage }}
          </span>
        </div>
      </article>
      <!-- /.detail-item-wrap -->
      <article
        v-else
        class="detail-item-wrap"
      >
        <b class="detail-item-title">
          {{ col.label }}
        </b>

        <div
          v-if="col.field === 'Hostname'"
          class="detail-item-contents"
        >
          <span class="detail-item-text">
            {{ data.Hostname }}
          </span>
          <button
            class="basic-buttons"
          >
            복사
          </button>
        </div>
        <span
          class="detail-item-text"
          v-else
        >{{ data[col.field] }}</span>
      </article>
      <!-- /.detail-item-wrap -->
    </li>
  </ul>
</template>

<script>
export default {
  name: 'SourcebasketServiceDetailTable',
  props: {
    data: {
      type: Object,
      default: () => {}
    },
    column: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      sampleData: [
        { name: 'HostName', contents: 'blahblha...' },
        { name: 'HostName', contents: 'blahblha...' },
        { name: 'HostName', contents: 'blahblha...' },
        { name: 'HostName', contents: 'blahblha...' },
        { name: 'HostName', contents: 'blahblha...' }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
  .sourcebasket-service-detail-table {
    .detail-item {
      margin-top: -1px;
      padding: 0 $gap;
      border-top: 1px solid #f0f0f0;
      border-bottom: 1px solid #f0f0f0;
      &-wrap {
        display: flex;
        align-items: center;
      }
      &-title {
        min-width: 140px;
        line-height: 49px;
      }
      &-contents {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }
      &-text {
        line-height: 50px;
      }

      &-external {
        display: flex;
        flex-direction: column;
      }
    }
  }
</style>
