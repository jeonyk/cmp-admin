<!--
  * 파일명 : ConfigManage.vue
  * 파일 기능 : 구성관리 Wrapper
  * 작성자 : 김예담
  * 최종 작성일 : 2020-08-14
  * License By Shinsegae I&C
  * 2020-08-14 fix: [자원관리] 어드민 관리 -> 구성 관리로 이관
 -->

<template>
  <div class="config-manage">
    <router-view />
  </div>
</template>
<script>
export default {
  name: 'ConfigManage',
  created () {
  },
  methods: {

  },
  data () {
    return {
    }
  }
}
</script>
<style lang="scss">
  .config-manage {
    .align-center-wrap {
      display: flex;
      align-items: center;
      height: 100%;
    }
    .join-comma-list {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      > span {
        &:not(:last-child) {
          &::after { content: ',' }
        }
      }
    }
  }
</style>
