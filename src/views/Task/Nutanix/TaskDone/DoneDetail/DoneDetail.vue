<!--
  * 파일명 : DoneDetail.vue
  * 파일 기능 : [한일 > 상세] 페이지 입니다. 주문한 내역, 완료된 정보를 확인할 수 있습니다.
  * 작성자 : 이경환 외 2명 test
  * 최종 작성일 : 2021-02-19
  * License By Shinsegae I&C
  * 2021-02-19 Merge branch 'publish/grid-editing' of https://gitlab-s.growthsoft.co.kr/SSG/cmp-web-admin into publish/grid-editing
 -->
<template>
  <component :is="'task-common-detail'" />
</template>

<script>
import TaskCommonDetail from '../../TaskCommonDetail/TaskCommonDetail'

export default {
  name: 'DoneDetail',
  components: {
    'task-common-detail': TaskCommonDetail
  }
}
</script>
