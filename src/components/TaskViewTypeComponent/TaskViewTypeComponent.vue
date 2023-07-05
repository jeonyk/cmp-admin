<!--
  * 파일명 : TaskViewTypeComponent.vue
  * 파일 기능 : [티켓으로보기 / 목록보기] 선택이 가능한 컴포넌트입니다.
  * 작성자 : 정재은 외 1명
  * 최종 작성일 : 2021-02-26
  * License By Shinsegae I&C
  * 2021-02-26 Update: 사전협의 목록보기 / 티켓보기 페이징 처리 완료
 -->

<template>
  <section class="button-area -right -convert task-view-type-component">
    <button
      :class="['button', '-convert-button', {'-active': viewList === 'ticket'}]"
      @click="clickEvent('ticket')"
      type="is-anti"
    >
      <i class="mdi mdi-view-grid-outline" />
      <span
        class="button-text"
        v-if="viewList === 'ticket'"
      >
        {{ $t('task.PRIOR.viewTicket') }}
      </span>
    </button>
    <!-- /. 티켓으로 보기 -->

    <button
      :class="['button', '-convert-button', {'-active': viewList === 'list'}]"
      @click="clickEvent('list')"
      type="is-anti"
    >
      <i class="mdi mdi-format-list-checkbox" />
      <span
        class="button-text"
        v-if="viewList === 'list'"
      >
        {{ $t('task.PRIOR.viewList') }}
      </span>
    </button>
    <!-- /. 목록으로 보기 -->
  </section>
</template>
<script>
export default {
  name: 'TaskViewTypeComponent',
  computed: {
    viewList () {
      return this.$route.query?.type || 'ticket'
    }
  },
  watch: {
    viewList (type) {
      this.$emit('changeView', type)
    }
  },
  methods: {
    clickEvent (param) {
      this.$router.push({ query: { type: param, page: 1 } })
      this.$emit('changeView', this.viewList)
    }
  }
}
</script>
<style lang="scss" scoped>
  .task-view-type-component.button-area.-convert {
    justify-content: center;
    >.button + .button {margin-left: 5px;}
    .-convert-button {
      display: flex;
      align-items: center;
      min-width: 32px;
      margin-top: $gap-s;
      border: 1px solid $main-gray;
      border-radius: 4px;
      padding: 0 $gap;
      height: 32px;
      font-size: 13px;
      // > .mdi {
      //   height: 24px; width: 24px;
      //   &::before { height: 24px; bottom: 9px; margin-top: -9px}
      // }
      > .button-text {
        line-height: 32px;
        margin-left: $gap-s;
      }
      &:not(.-active) {
        justify-content: center;
        padding: 0;
        width: 32px;
      }
      &.-active {
        background-color: $main-gray;
        border-color: $main-gray;
        color: $white;
        > .mdi { margin-top: -2px }
        &:hover {
          background-color: darken($dark-slate, 5%);
        }
      }
    }
  }
</style>
