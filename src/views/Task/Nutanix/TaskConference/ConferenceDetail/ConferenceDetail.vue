<!--
  * 파일명 : ConferenceDetail.vue
  * 파일 기능 : [사전협의 > 상세] 페이지 입니다. 결재 내역을 한번에 볼 수 있으며, 주문내역 각각을 승인 / 반려 / 변경 할 수 있습니다.
  * 작성자 : 김예담 외 3명
  * 최종 작성일 : 2021-02-25
  * License By Shinsegae I&C
  * 2021-02-25 fix: 역할 생성/상세 - 담당자 선택 초기 선택 세팅
 -->
<template>
  <component :is="'task-common-detail'" />
</template>

<script>
import TaskCommonDetail from '../../TaskCommonDetail/TaskCommonDetail'

export default {
  name: 'ConferenceDetail',
  components: {
    'task-common-detail': TaskCommonDetail
  }
}
</script>
