<!--
  * 파일명 : DoneList.vue
  * 파일 기능 : 한일에 넘어온 모든 데이터를 리스트 형태로 보여줍니다.
  * 작성자 : 정재은 외 3명
  * 최종 작성일 : 2021-02-18
  * License By Shinsegae I&C
  * 2021-02-18 Add: fix: 업무 > 한일 태 상태 날짜 표기 오류 동일하게 수정
 -->

<template>
  <component :is="'task-common-list'" />
</template>

<script>
import TaskCommonList from '../../TaskCommonList/TaskCommonList'

export default {
  name: 'TaskDoneList',
  components: {
    'task-common-list': TaskCommonList
  }
}
</script>
