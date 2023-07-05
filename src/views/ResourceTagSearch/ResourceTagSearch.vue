<template>
  <div class="resource-tag-search">
    <section class="search-input-container">
      <tag-search-bar-at-page @search="handleSearchTag" />
    </section>
    <div
      class="resource-filter-component"
    >
      <resource-filter-component
        class="resource-filter-component"
        :table-data="filteredData"
        @search="handleSearchResource"
        @reset="() => {
          resetFilter()
          setInit($route.params.searchValue)
        }"
      >
        <div class="filter-options">
          <span class="filter-name">{{ $v('자원') }}</span>
          <el-select
            v-model="filterResource"
            :placeholder="$v('자원 선택')"
            :popper-append-to-body="false"
            @change="(value) => {
              handleChangeFilterRsc(value)
            }"
          >
            <!-- @change="filtering()" -->
            <el-option
              v-for="item in resourceFilterOption"
              :key="item.key"
              :label="item.label"
              :value="item"
            />
          </el-select>
        </div>
      </resource-filter-component>
    </div>
    <section
      v-loading="!allLoadingFinish"
      class="empty-block"
      v-if="!searchedRscTags.length && !loading"
    >
      <div
        class="empty-block__text"
      >
        {{ $v('태그 검색에 일치하는 자원이 없습니다.') }}
      </div>
    </section>

    <section
      v-for="cloud in moduleInfo"
      :key="cloud.label"
      class="resource-result-section"
    >
      <!-- 클라우드 타이틀 -->
      <div
        v-show="showCloudTitle(cloud)"
        class="cloud-title"
        :class="{'cloud-title--aws': cloud.label.toUpperCase() === 'AWS'}"
      >
        [{{ cloud.type.charAt(0).toUpperCase() + cloud.type.slice(1) }}]<span>{{ cloud.displayLabel }}</span>
      </div>
      <!-- 자원별 그리드 영역 -->
      <div

        v-for="(resource, index) in setModuleInfoUsedTag(cloud)"
        :key="index"
        class="resource-section"
      >
        <div
          v-show="showResourceGrid(resource)"
          class="resource-section-gird-wrap"
        >
          <!-- 자원별 그리드 영역 - 갯수 -->
          <section
            class="table-top-wrap"
          >
            <span class="table-title">{{ resource.label }}</span>
            <total-count
              :total-count="resourceTotalCnt[resource.id] ? resourceTotalCnt[resource.id].cnt : 0"
              class="total-count-wrap"
            />
          </section>
          <!-- 그리드 -->
          <component
            :is="componentLoader(resource.id)"
            is-only-grid
            :searched-tags="searchedRscTags"
            @getGrid="loading=>handleGetGrid(loading, resource.id)"
            @change="num=> handleChangeGridComponent(num, resource.id)"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import API, { FilteringComponent } from '@sd-fe/cmp-core'
import { createNamespacedHelpers } from 'vuex'

// 뉴타닉스 그리드 컴포넌트
import COMPUTE from '@/views/ConfigManage/Nutanix/SetResourceServer/SetResourceServerList.vue'
import STORAGE from '@/views/ConfigManage/Nutanix/SetResourceStorage/SetResourceVolumeGroupList/SetResourceVolumeGroupList.vue'
import DATABASE from '@/views/ConfigManage/Nutanix/SetResourceDatabase/SetResourceDatabaseList.vue'

// VMware 그리드 컴포넌트
import VM from '@/views/ConfigManage/Vmware/SetResourceVmwareServer/SetResourceVmwareServerList.vue'
import VSANISCSI from '@/views/ConfigManage/Vmware/SetResourceVmwareVsan/SetResourceVmwareVsanIscsiList.vue'

// Private 네트워크 자원 컴포넌트
// import NETWORKL4 from '@/views/SourceBasket/ResourceNetwork/NetworkL4List.vue'
// import NETWORKL7 from '@/views/SourceBasket/ResourceNetwork/NetworkL7List.vue'
// import SECURITY from './ResourceGrid/Nutanix/SecurityGrid.vue'

// AWS 그리드 컴포넌트
import EC2 from '@/views/ConfigManage/AWS/SetResourceEC2/SetResourceEC2List.vue'
import EFS from '@/views/ConfigManage/AWS/SetResourceEFS/SetResourceEFSList.vue'
import NLBL4 from '@/views/ConfigManage/AWS/SetResourceELB/SetResourceELBList/SetResourceNLBList.vue'
import SG from '@/views/ConfigManage/AWS/SecurityGroup/SecurityGroup.vue'
import TARGETGROUP from '@/views/ConfigManage/AWS/SetResourceELB/SetResourceELBList/SetResourceELBTargetGroupList.vue'

// 기타 컴포넌트
import TagSearchBarAtPage from './TagSearchBarAtPage.vue'

const { mapMutations } = createNamespacedHelpers('cloud')
export default {
  components: {
    COMPUTE,
    STORAGE,
    DATABASE,
    VM,
    VSANISCSI,
    // NETWORKL4,
    // NETWORKL7,
    // SECURITY,
    EC2,
    EFS,
    NLBL4,
    SG,
    TARGETGROUP,
    TagSearchBarAtPage,

    FilteringComponent
  },
  computed: {
    moduleInfo () {
      return this.$store?.getters?.['cloud/getModuleInfo']
    },
    allLoadingFinish () {
      const resourceStatus = this.resourceTotalCnt
      return this.checkLoadingStatus(resourceStatus)
    }
  },
  watch: {
    async allLoadingFinish (val) {
      if (val) {
        const filterOpt = {
          ...this.filterCGP,
          serviceType: this.filterResource?.value
        }
        await this.setInit(this.$route.params.searchValue, filterOpt)
      }
    }

  },
  methods: {
    resetFilter () {
      this.filterResource = { value: null, label: '전체' }
      this.filterCGP = null
    },
    handleChangeFilterRsc (value) {
      const filterOpt = {
        ...this.filterCGP,
        serviceType: this.filterResource?.value
      }
      this.setInit(this.$route.params.searchValue, filterOpt
      )
    },
    setOptionRsc (resourceLabelList) {
      let result = []

      result = Object.entries(resourceLabelList).map((rscType) =>
        ({ value: rscType[0], label: rscType[1].label }))
      return [{ value: null, label: '전체' }, ...result]
    },
    ...mapMutations({
      setIsRenderCloudSwitch: 'SET_IS_RENDER_CLOUD_SWITCH'
    }),
    handleGetGrid (loading, resourceId) {
      this.resourceTotalCnt[resourceId].loading = loading
    },
    handleSearchResource (e) {
      this.filterCGP = e
      const filterOpt = {
        ...this.filterCGP,
        serviceType: this.filterResource?.value
      }

      this.setInit(this.$route.params.searchValue, filterOpt)
    },
    handleChangeGridComponent (num, resourceId) {
      this.resourceTotalCnt[resourceId].cnt = num
    },
    showCloudTitle (cloud) {
      console.log(cloud)
      return this.searchedRscTags.some((el) => el.module === cloud.label.toUpperCase())
    },
    showResourceGrid (resource) {
      return this.searchedRscTags.some((el) => el.serviceType === resource.id)
    },
    async handleSearchTag (searchedText) {
      const filterOpt = {
        ...this.filterCGP,
        serviceType: this.filterResource?.value
      }
      this.setInit(searchedText, filterOpt)
    },

    /** 컴포넌트를 인자값을 받아서 반환합니다. */
    componentLoader (resource) {
      const a = resource.replaceAll('_', '')
      return `${a}`
    },
    /** 컴포넌트 데이터 초기 세팅 */
    async setInit (searchText, filtered) {
      try {
        this.searchedRscTags = await this.getResourceTag(searchText, filtered)
        return true
      } catch (err) {
        console.error('데이터를 초기화 하는데 에러가 발생하였습니다.', err)
      }
    },
    checkLoadingStatus (obj) {
      for (const key in obj) {
        if (obj[key].loading === false) {
          return false
        }
      }
      return true
    },
    async getResourceTag (searchText, filtered) {
      try {
        const payload = {
          searchTagName: searchText,
          ...filtered
        }
        const result = await API.work_v3.getResourceTag(payload)
        return result
      } catch (err) {
        console.error(err)
        this.$alert('자원태그로 검색을 실패했습니다.<br/> 관리자에게 문의해주세요.', { dangerouslyUseHTMLString: true })
      }
    },
    setModuleInfoUsedTag (cloud) {
      return cloud.serviceResources.filter((el) => el.isUsedTag)
    }
  },
  created () {
    // 필터옵션 설정
    this.resourceFilterOption =
      this.setOptionRsc(this.resourceTotalCnt)

    this.setIsRenderCloudSwitch(false)
  },
  beforeDestroy () {
    this.setIsRenderCloudSwitch(true)
  },
  mounted () {

  },
  data () {
    return {
      relationIdx: null,
      groupIdx: undefined,
      projectIdx: undefined,
      filteredData: [{}],
      resourceFilterOption: [],
      filterCGP: null,
      filterResource: { value: null, label: '전체' },
      isLoading: false,
      loading: false,
      columns: [{ binding: '' }],
      searchedRscTags: [],
      searchedText: '',
      resourceTotalCnt: {
        COMPUTE: { loading: false, cnt: 0, label: '(Nutanix) Compute' },
        DATABASE: { loading: false, cnt: 0, label: '(Nutanix) Database' },
        STORAGE: { loading: false, cnt: 0, label: '(Nutanix) Storage' },
        VM: { loading: false, cnt: 0, label: '(VMware) VM' },
        VSAN_ISCSI: { loading: false, cnt: 0, label: '(VMware) vSAN ISCSI' },
        EC2: { loading: false, cnt: 0, label: '(AWS) EC2' },
        EFS: { loading: false, cnt: 0, label: '(AWS) EFS' },
        NLB_L4: { loading: false, cnt: 0, label: '(AWS) NLB-L4' },
        SG: { loading: false, cnt: 0, label: `(AWS) ${this.$v('보안그룹')}` },
        TARGET_GROUP: { loading: false, cnt: 0, label: `(AWS) ${this.$v('대상그룹')}` }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.filter-options {
  display: flex;
  align-items: center;
  .filter-name {
    margin-right: 10px;
  }
}
.resource-tag-search {
  .search-input-container {
    position:relative;
    display: flex;
    justify-content: center;
  }
  .resource-filter-component {
    margin-top: 40px;
  }
}
.cloud-title {
  width: 100%;
  background-color: $primary;
  border-radius: 6px;
  color: white;
  font-size: 24px;
  font-weight: 200;
  padding: {
    top: 20px;
    bottom:20px;
    left:10px;
    right: 10px;
  }
  span {
    margin-left: 10px;
  font-weight: 600;
  }
  &--aws {
    background-color: #F8A117;
  }
}
.resource-section {
  margin-top: 20px;
  .resource-section-gird-wrap{
    padding-left: 20px;
    .table-top-wrap{
      display: flex;
      justify-content: flex-start;
      align-items: center;
      margin-top: 20px;
      margin-bottom: 10px;
      .total-count-wrap {
        display: flex;
      }
      .table-title{
        display: flex;
        size: 16px;
        font-weight: 600;
        margin-right: 10px;
        // margin-bottom: 20px;
      }
    }
  }
}
.empty-block {
  position: relative;
  display: block;
  width: 100%;
  height: 120px;
  color: $text-lighter-gray;
  border-radius: 8px;
  .empty-block__text {
    position: absolute;
    width: 240px;
    height: 20px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}
</style>
