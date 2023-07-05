<!--
  * 파일명 : SetResource.vue
  * 파일 기능 : 구성관리 > 자원관리 Wrapper
  * 작성자 : 김예담
  * 최종 작성일 : 2020-10-26
  * License By Shinsegae I&C
  * 2020-10-26 fix: 구성 관리 구조 변경 및 메뉴명 수정
 -->

<template>
  <div class="set-resource">
    <router-view />
    <!-- <g-tab
      :data="resourceTab"
      @click="clickTabAction"
    >
      <template #compute>
        <router-view />
      </template>

      <template #network>
        <router-view />
      </template>

      <template #storage>
        <router-view />
      </template>

      <template #database>
        <router-view />
      </template>
    </g-tab> -->
  </div>
</template>
<script>
export default {
  name: 'SetResource',
  methods: {
    routeTo (to) {
      this.$router.push(to)
    },
    clickTabAction (item) {
      this.routeTo({ name: item.routeTo })
    }
  },
  data () {
    return {
      resourceTab: [
        { field: 'compute', name: 'Compute', routeTo: 'set-compute' },
        { field: 'network', name: 'Network', routeTo: 'set-network' },
        { field: 'storage', name: 'Storage', routeTo: 'set-storage' },
        { field: 'database', name: 'Database', routeTo: 'set-database' }
      ]
    }
  }
}
</script>
<style lang="scss">
  .set-resource {
    .pass-name-form {
      .name-form-noti {
        display: block;
        text-align: center;
        line-height: 22px;
        margin-bottom: $gap;
        white-space: nowrap;
      }
      .-reference {
        display: block;
        margin-top: $gap-s;
        width: 100%;
        color: $main-red;
      }
      .convert-urgent-form {
        margin-top: $gap-m;
      }
    }
  }
</style>
