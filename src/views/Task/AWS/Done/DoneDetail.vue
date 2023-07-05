<template>
  <task-common-detail
    task-type="DONE"
    style="border:1px solud red;"
  />
</template>

<script>

import TaskCommonDetail from '../TaskCommonDetail/TaskCommonDetail.vue'
export default {
  name: 'DoneDetail',
  components: {
    TaskCommonDetail
  }
}
</script>
