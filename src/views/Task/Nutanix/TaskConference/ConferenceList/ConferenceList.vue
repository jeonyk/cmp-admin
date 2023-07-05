<!--
  * 파일명 : ConferenceList.vue
  * 파일 기능 : 사전협의에 넘어온 모든 데이터를 리스트 형태로 보여줍니다.
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2021-02-26
  * License By Shinsegae I&C
  * 2021-02-26 Update: 사전협의 목록보기 / 티켓보기 페이징 처리 완료
 -->
<template>
  <component :is="'task-common-list'" />
</template>

<script>
import TaskCommonList from '../../TaskCommonList/TaskCommonList'

export default {
  name: 'TaskConferenceList',
  components: {
    'task-common-list': TaskCommonList
  }
}
</script>
