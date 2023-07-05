<!--
  * 파일명 : TodoList.vue
  * 파일 기능 : 할일에 넘어온 모든 데이터를 리스트 형태로 보여줍니다.
  * 작성자 : 이경환 외 4명
  * 최종 작성일 : 2021-02-19
  * License By Shinsegae I&C
  * 2021-02-19 add: 업무 proceedStatus ERROR 추가
 -->

<template>
  <component :is="'task-common-list'" />
</template>

<script>
import TaskCommonList from '../../TaskCommonList/TaskCommonList'

export default {
  name: 'TaskTodoList',
  components: {
    'task-common-list': TaskCommonList
  }
}
</script>
