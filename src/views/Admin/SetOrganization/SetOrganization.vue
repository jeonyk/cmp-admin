<!--
  * 파일명 : SetOrganization.vue
  * 파일 기능 : 조직 관리 Wrapper
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2020-08-25
  * License By Shinsegae I&C
  * 2020-08-25 fix: 버튼 통일 & 테이블 상단 total갯수와 버튼 영역 통일
 -->

<template>
  <div class="set-organization">
    <!-- <g-tab
      :data="tabData"
      @click="clickTabAction"
    >
      <template #project>
        <router-view />
      </template>

      <template #account>
        <router-view />
      </template>
    </g-tab> -->
    <router-view />
  </div>
</template>
<script>
/**
 * 어드민 관리 > 조직 관리 페이지, 기존 이동할 수 있는 페이지가 2개
 * (조직-프로젝트, 조직-계정) 인데, (조직-프로젝트)가 삭제됬으므로
 * 탭 형태가 아닌 Default로 조직-계정 탭에서 보이던 페이지가 렌더될 수 있도록 변경
 */
export default {
  name: 'SetOrganization',
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
      tabData: [
        // { field: 'project', name: '조직-프로젝트', routeTo: 'set-organization-project', keyPath: 'admin.ORG.orgProject' },
        { field: 'account', name: '조직-계정', routeTo: 'set-organization-account', keyPath: 'admin.ORG.orgAcc' }
      ]
    }
  }
}
</script>
<style lang="scss">
  .set-organization {
    .sync-state {
      // position: absolute;
      // bottom: 0;
      // right: 0;
    }
  }
</style>
