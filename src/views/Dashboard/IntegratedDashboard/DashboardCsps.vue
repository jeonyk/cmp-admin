<!--
  * 파일명 : DashboardCsps.vue
  * 파일 기능 : 대시보드 탭 컴포넌트
  * 작성자 : 이승엽
  * 최종 작성일 : 2023-05-09
  * License By Shinsegae I&C
 -->

 <template>
  <div class="dashboard-tab">
    <section class="dashboard-tab-main">
      <g-tab
        v-if="true"
        :data="codes"
        @click="clickTab"
        use-mobile
      />
    </section>
    <section class="dashboard-tab-contents" />
  </div>
</template>
<script>
import GTab from '@/components/common/g-tab/g-tab'

export default {
  name: 'DashboardCsps',
  components: {
    'g-tab': GTab
    // TermsModal
  },
  watch: {
  },
  mounted () {
    this.targetTab = { codeVal: 'NX', codeName: 'Nutanix', tab: 1 }
    this.initTab(this.targetTab.codeVal)
  },
  methods: {
    clickTab (tab) {
      this.targetTab = tab
      this.$emit('selectedTab', tab)
      // this.initTab(tab.codeVal)
    },
    async initTab (tabName) {
      this.codes = []
      const codeList = [
        // { codeVal: null, codeName: '전체', tab: 0 },
        { codeVal: 'NX', codeName: 'Nutanix', tab: 1 },
        { codeVal: 'VMWARE', codeName: 'Vmware', tab: 2 },
        { codeVal: 'AWS', codeName: 'AWS', tab: 3 }
      ]
      for (const i in codeList) {
        codeList[i].name = codeList[i].codeName
        codeList[i].field = codeList[i].codeVal ? codeList[i].codeVal : ''
        this.codes.push(codeList[i])

        if (codeList[i].codeVal === tabName) {
          codeList[i].isActive = true
          this.$emit('selectedTab', codeList[i])
        }
      }
    }
  },
  data () {
    return {
      targetTab: {},
      codes: []
    }
  }
}
</script>
<style lang="scss">
.dashboard-tab {
  // min-width: 1000px;
  // display: flex;

  .tab-contents-area {
    // min-width: 1000px;
    position: absolute;
    // width: 100%;
  }
  .dashboard-tab-contents {
    padding-top: 40px;
  }
}
</style>
