<!--
  * 파일명 : TodoDetail.vue
  * 파일 기능 : [할일 > 상세] 페이지 입니다. 주문한 내역의 정보를 볼 수 있으며, 업무를 변경 / 작업 실행 / 작업완료 시킬 수 있습니다.
  * 작성자 : 김예담 외 3명
  * 최종 작성일 : 2021-02-24
  * License By Shinsegae I&C
  * 2021-02-24 fix: 보안그룹 > 경유지 정보 있을 때만 노출, 할 일에서 경유지 정보가 없을 때, 작업 실행 불가능하게 처리
 -->
<template>
  <component :is="'task-common-detail'" />
</template>

<script>
import TaskCommonDetail from '../../TaskCommonDetail/TaskCommonDetail'

export default {
  name: 'TodoDetail',
  components: {
    'task-common-detail': TaskCommonDetail
  }
}
</script>
