<!--
  * 파일명 : NetworkExcelFormDownload.vue
  * 파일 기능 : 엑셀 양식 다운로드 컴포넌트
  * 작성자 : 김예담
  * 최종 작성일 : 2022-03-15
  * License By Shinsegae I&C
 -->
<template>
  <button
    class="button"
    @click="fileFormDownload"
  >
    {{ title ? title + ' ' : '' }}
    <!-- Excel 파일 양식 다운로드 -->
    {{ $t('common.BTN.excelFormDownload') }}
    <download-icon style="position: relative; top: 3px" />
  </button>
</template>

<script>
import DownloadIcon from '@/components/Icons/DownloadIcon.vue'

export default {
  name: 'NetworkExcelFormDownload',
  components: {
    DownloadIcon
  },
  props: {
    title: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: ''
    },
    excelColumns: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    /**
     * Excel 양식 다운로드
     */
    fileFormDownload () {
      try {
        window.location.assign(process.env.VUE_APP_ZUUL_URL + `/api/cmp/v1/network/file/download/excel?type=${this.type}`)
      } catch (error) {
        this.$alert(this.$t('common.ALERT.BASE.071'), { // 파일 다운로드에 문제가 발생했습니다.<br>관리자 문의 바랍니다.
          dangerouslyUseHTMLString: true
        })
        console.error(error)
      }
    }
  },
  data: () => ({

  })
}
</script>

<style lang="scss" scoped>

</style>
