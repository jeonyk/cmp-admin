<!--
  * 파일명 : ConfigCode.vue
  * 파일 기능 : 타입 정의/코드 정의 탭 분리 및 타입, 코드 리스트 노출/관리(추가, 변경, 삭제)
  * 작성자 : 김예담
  * 최종 작성일 : 2020-09-04
  * License By Shinsegae I&C
  * 2020-09-04 fix: [코드 정의] tab 오류 수정
 -->

<template>
  <div class="config-code">
    <g-tab
      :data="codeTab"
      @click="clickTabAction"
    >
      <template #type>
        <router-view />
      </template>

      <template #all>
        <router-view />
      </template>
    </g-tab>
  </div>
</template>
<script>
export default {
  name: 'ConfigCode',
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
      codeTab: [
        { field: 'type', name: '타입 정의', routeTo: 'config-code-type', keyPath: 'admin.PREF.defType' },
        { field: 'all', name: '코드 정의', routeTo: 'config-code-all', keyPath: 'admin.PREF.defCode' }
      ]
    }
  }
}
</script>
