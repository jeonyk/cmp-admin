<!--
  * 파일명 : SetResourceStorage.vue
  * 파일 기능 : 구성관리 > 자원관리 > storage Wrapper
  * 작성자 : 김진범 외 1명
  * 최종 작성일 : 2020-11-13
  * License By Shinsegae I&C
  * 2020-11-13 뉴타닉스 설정 > 엘리먼트 > ip 관리대장의 정보로 매칭
 -->

<template>
  <div class="set-resource-storage">
    <g-tab :data="tabData">
      <!-- <template #sc>
        <set-resource-storage-container-list />
      </template> -->
      <template #vg>
        <set-resource-volume-group-list />
      </template>
    </g-tab>
  </div>
</template>
<script>

// import SetResourceStorageContainerList from './SetResourceStorageContainerList/SetResourceStorageContainerList'
import SetResourceVolumeGroupList from './SetResourceVolumeGroupList/SetResourceVolumeGroupList'
export default {
  name: 'SetResourceStorage',
  components: {

    // 'set-resource-storage-container-list': SetResourceStorageContainerList,
    'set-resource-volume-group-list': SetResourceVolumeGroupList
  },
  data () {
    return {
      tabData: [
        // { field: 'sc', name: 'Storage Container', isActive: true },
        { field: 'vg', name: 'Volume Group', isActive: true }
      ]
    }
  }
}
</script>
