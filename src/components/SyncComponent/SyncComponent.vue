<!--
  * 파일명 : SyncComponent.vue
  * 파일 기능 :
  * 작성자 : 김예담
  * 최종 작성일 : 2020-09-02
  * License By Shinsegae I&C
  * 2020-09-02 fix: z-index 변경
 -->

<template>
  <section class="sync-component">
    <div
      class="sync-state"
      v-if="lastInfo"
    >
      <b class="sync-state-info">
        마지막 동기화 시간
      </b>
      <span class="sync-state-info">
        {{ lastInfo | date }}
      </span>
    </div>

    <button
      class="button -sync-button"
      @click="clickAction"
      type="is-anti"
    >
      <i
        class="el-icon-loading"
        style="margin-right: 5px;"
      />
      <span>동기화</span>
    </button>
  </section>
</template>
<script>
export default {
  name: 'SyncComponent',
  props: {
    lastInfo: {
      type: Date,
      default: null
    }
  },
  methods: {
    clickAction () {
      this.$emit('click')
    }
  },
  data () {
    return {

    }
  }
}
</script>
<style lang="scss" scoped>
  .sync-component {
    display: flex;
    align-items: center;
    > .sync-state {
      margin-right: $gap-s;
      .sync-state-info {
        display: block;
        color: $pink;
        font-size: 12px;
        white-space: nowrap;
      }
    }
    > .-sync-button {
      font-size: 13px;
    }
  }
</style>
