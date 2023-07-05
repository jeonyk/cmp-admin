<template>
  <div
    v-loading="!getIsProjectLoaded"
    class="tgw-list"
  >
    <div class="filter-wrap">
      <resource-filter-component
        :table-data="tgwList"
        cloud-type="public"
        @search="onSearchResource"
        @reset="onResetFilter"
      >
        <div class="filter-form">
          <span class="filter-name">Transit Gateway 이름</span>
          <search-component
            v-model="filterData.transitGatewayName"
          />
        </div>
      </resource-filter-component>
    </div>
    <div class="grid-wrap">
      <cmp-grid
        :columns="columns"
        :item-source="tgwList"
        selectable
        @selectedRow="onSelectedRow"
      />
    </div>
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
import { mapGetters } from 'vuex'
import TransitGatewayStateMap from '@/components/AWS/TGW/TransitGatewayStateMap'

/**
 * Transit Gateway 리스트
 */
export default {
  name: 'TransitGatewayList',
  mixins: [TransitGatewayStateMap],
  computed: {
    ...mapGetters({
      getIsProjectLoaded: 'project/getIsProjectLoaded',
      getProject: 'project/getProject'
    })
  },
  watch: {
    /**
     * 관/조/프 데이터를 TGW 데이터의 projectIdx와 매핑 시키기 위해
     * 프로젝트 정보를 조회한 후 TGW 데이터를 조회한다.
     */
    getIsProjectLoaded: {
      handler (loaded) {
        if (loaded) this.getTransitGatewayData()
      },
      immediate: true
    },
    'filterData.transitGatewayName' (_) {
      this.onSearchFilter()
    }
  },
  methods: {
    onSelectedRow (row) {
      if (row && row.dataItem) {
        this.$router.push({
          name: 'resource-tgw-detail',
          params: {
            tgwId: row.dataItem.transitGatewayId
          }
        })
      }
    },
    onResetFilter () {
      this.filterData.transitGatewayName = ''
      this.filterParam = {}
      this.onSearchFilter()
    },
    onSearchFilter () {
      let filterResult = [...this.originTgwList]

      Object.keys(this.filterParam).forEach(key => {
        if (this.filterParam[key]) filterResult = filterResult.filter(tgw => tgw[key] === this.filterParam[key])
      })

      if (this.filterData.transitGatewayName) filterResult = filterResult.filter(tgw => tgw.transitGatewayName.includes(this.filterData.transitGatewayName))

      this.tgwList = filterResult
    },
    onSearchResource (param) {
      this.filterParam = param
      this.onSearchFilter()
    },
    /**
     * Transit Gateway 조회
     */
    async getTransitGatewayData () {
      if (!this.getIsProjectLoaded) return

      try {
        const { data } = await API.aws.getTransitGatewayListAdm()
        this.originTgwList = data.map(tgw => {
          const project = this.getProject(tgw.projectIdx)
          return {
            ...tgw,
            mappedState: this.tgwStateMap(tgw.state),
            companyName: project.companyName || '',
            companyIdx: project.companyIdx,
            groupName: project.groupName || '',
            groupIdx: project.groupIdx,
            projectName: project.projectName || '',
            createTime: this.$options.filters.date(tgw.createTime)
          }
        })
        this.tgwList = [...this.originTgwList]
      } catch (error) {
        console.log(error)
        this.$alert('Transit Gateway 리스트 조회에 실패하였습니다.')
      }
    }
  },
  data: (root) => ({
    columns: [
      { header: 'Transit Gateway ID', binding: 'transitGatewayId', width: 200 },
      { header: 'Transit Gateway Name', binding: 'transitGatewayName', width: '*' },
      { header: '연결 상태', binding: 'mappedState', width: 150 },
      { header: 'ASN', binding: 'amazonSideAsn', width: 150 },
      { header: root.$v('관계사'), binding: 'companyName', width: 150 },
      { header: root.$v('조직'), binding: 'groupName', width: 150 },
      { header: root.$v('프로젝트'), binding: 'projectName', width: 200 },
      { header: root.$v('생성 시간'), binding: 'createTime', width: 200 }
    ],
    tgwList: [],
    filterData: {
      transitGatewayName: ''
    },
    filterParam: {},
    originTgwList: []
  })
}
</script>

<style lang="scss" scoped>
.tgw-list {
}
</style>
