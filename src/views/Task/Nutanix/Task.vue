<!--
  * 파일명 : Task.vue
  * 파일 기능 : [업무] 모든 페이지를 포괄하는 컴포넌트입니다.
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2020-07-30
  * License By Shinsegae I&C
  * 2020-07-30 add: detail영역을 위한 router 수정
 -->

<template>
  <div class="admin-task">
    <router-view />
  </div>
</template>
<script>

export default {
  name: 'Task',
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
