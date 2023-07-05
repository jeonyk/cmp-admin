<template>
  <div class="instance-type-management">
    <h5 class="title">
      <!-- 리전 선택 -->
      {{ $t('service.InstanceType.PLACEHOLDER.001') }}
    </h5>

    <section class="instance-types-wrapper">
      <article
        class="region-items-article"
        v-loading="regionLoading"
      >
        <div class="region-items-scroller">
          <div class="region-item-title">
            <!-- 인스턴스 유형 -->
            {{ $t('service.InstanceType.instanceType') }}
            <span>{{ $t('service.InstanceType.instanceTypeCnt') }}</span><!-- 인스턴스 유형 수 -->
          </div>

          <ul class="region-items">
            <li
              :class="['region-item', { '-selected': region.value === regionName }]"
              v-for="region in regions"
              :key="region.label"
              @click="selectRegion(region)"
            >
              {{ region.label }}
              <strong>{{ region.count }}</strong>
            </li>
          </ul>
        </div>
      </article>
      <!-- /. 리전 목록 -->

      <article
        v-if="regionName !== undefined"
        v-loading="instanceLoading"
      >
        <div class="instance-type-option">
          <search-bar
            ref="search"
            :placeholder="$t('service.InstanceType.PLACEHOLDER.002')"
            @change="value => searchEvent(regionName, value)"
            @refresh="value => refreshEvent(regionName, undefined)"
          />
          <el-checkbox
            v-model="isShownUser"
            @change="isShownUser =>this.getInstanceTypes(regionName, searchText, isShownUser)"
          >
            <!-- 사용중인 인스턴스 유형 -->
            {{ $t('service.InstanceType.usingInstanceType') }}
          </el-checkbox>
        </div>
        <!-- /. 사용중인 인스턴스 유형 -->

        <div class="instance-list">
          <cmp-grid
            :item-source="instanceData"
            :columns="instanceColumns"
            :use-column-filter="false"
          >
            <template #expose="{ row }">
              <el-switch
                v-model="row.isShownUser"
                @change="changeExpose(row)"
              />
            </template>
          </cmp-grid>
        </div>
        <!-- /. 인스턴스 목록 -->
      </article>

      <div
        v-else
        class="-empty"
      >
        <!-- 리전을 먼저 선택해주세요. -->
        {{ $t('service.InstanceType.PLACEHOLDER.003') }}
      </div>
    </section>
  </div>
</template>

<script>
import SearchBar from '@/components/SearchBar/SearchBar'
import API from '@sd-fe/cmp-core'

export default {
  name: 'InstanceTypeManagement',
  components: {
    'search-bar': SearchBar
  },
  created () {
    this.getInstanceRegions()
  },
  methods: {
    selectRegion (region) {
      this.isShownUser = false
      this.regionName = region.value

      if (this.$refs.search) this.$refs.search.refresh()
      this.getInstanceTypes(this.regionName)
    },
    /**
     * [리전 목록]을 가져옵니다
     */
    async getInstanceRegions () {
      try {
        this.regionLoading = true
        const { data } = await API.aws.getInstanceRegions()
        this.regions = data.map(({ regionName, displayName, instanceTypeCount }) => ({ label: displayName, value: regionName, count: instanceTypeCount }))
      } catch (error) {
        console.error('@@ getInstanceRegions : ', error)
        this.regions = []
        throw error
      } finally {
        this.regionLoading = false
      }
    },
    /**
     * 선택된 리전을 바탕으로 인스턴스를 가져옵니다
     */
    async getInstanceTypes (regionName = this.regionName, value, isShownUser) {
      this.instanceLoading = true
      try {
        const param = { regionName, instanceType: value }
        if (isShownUser === true) param.isShownUser = isShownUser

        const { data } = await API.aws.getInstanceTypesAdm(param)
        this.instanceData = data.list.map(item => ({ ...item, memory: `${item.memory / 1024} Gib` })) /* 기본 데이터는 MiB 라고 함 */
      } catch (error) {
        console.error('@@ getInstanceTypes : ', error)
        this.instanceData = []
        throw error
      } finally {
        this.instanceLoading = false
      }
    },
    /**
     * [인스턴스 유형 검색] - 사용중인 인스턴스 유형 변경 이벤트 (그냥 깔끔하게 input 함수를 분리)
     * @param { String } regionName 리전 텍스트
     * @param { Boolean } value 검색 텍스트
     */
    searchEvent (regionName, value) {
      this.searchText = value
      return this.getInstanceTypes(regionName, value, this.isShownUser)
    },
    /**
     * [인스턴스 유형 검색] - 사용중인 인스턴스 유형 refresh 이벤트 (그냥 깔끔하게 input 함수를 분리)
     * refresh 라면 인스턴스타입 검색 API 호출 + 사용중인 인스턴스 유형 false 로 변경
     * @param { String } regionName 리전 텍스트
     * @param { Boolean } value 검색 텍스트
     */
    refreshEvent (regionName, value) {
      this.searchText = value
      this.isShownUser = false
      return this.getInstanceTypes(regionName, value, this.isShownUser)
    },
    /**
     * [사용자 노출여부] 이벤트
     */
    async changeExpose ({ instanceType, isShownUser, regionName }) {
      try {
        const params = `?instanceType=${instanceType}&isShownUser=${isShownUser}&regionName=${regionName}`
        await API.aws.updateInstanceUserShow(params)
      } catch (error) {
        console.error('@@ updateInstanceUserShow : ', error)
        throw error
      }
    }
  },
  data () {
    return {
      regionLoading: false,
      instanceLoading: false,
      searchText: undefined,
      isShownUser: false,
      regionName: undefined,
      regions: [],
      instanceColumns: [
        { header: this.$t('service.InstanceType.instanceType'), binding: 'instanceType' }, // 인스턴스 유형
        { header: 'vCPU', binding: 'vcpu' }, // vCPU
        { header: this.$t('service.InstanceType.memory'), binding: 'memory', format: '*d' }, // 메모리
        { header: this.$t('service.InstanceType.network'), binding: 'networkPerformance', width: 300 }, // 네트워크 성능
        { header: this.$t('service.InstanceType.userShown'), binding: 'expose', width: 155, customHtml: true } // 사용자 노출여부
      ],
      instanceData: []
    }
  }
}
</script>

<style lang="scss" scoped>
.instance-type-management {

  .title {
    font-weight: bold;
    font-size: 16px;
    line-height: 38px;
    margin-bottom: 15px;
  }

  .instance-types-wrapper {
    display: grid;
    grid-template-columns: 350px 1210px;
    grid-template-rows: 620px;
    column-gap: 15px;

    .region-items-article {
      position: relative;
    }

    .region-items-scroller {
      overflow-y: auto;
      height: 620px;
      padding-right: 8px;
      width: 350px;
      box-sizing: border-box;
      margin-top: 50px;
    }

    .region-item-title {
      position: absolute;
      top: 0; left: 0;
      width: 286px;
      color: $text-lighter-gray;
      font-size: 11px;
      border-radius: 6px 6px 0 0;
      height: 50px;
      background-color: $dark-navy;
      padding: 0 25px;
      display: flex;
      align-items: center;
      justify-content: space-between;

      &::after {
        content: '';
        position: absolute;
        width: 300px;
        height: 1px;
        background-color: #2A2D44;
        display: block;
        bottom: 0; left: calc(50% - 150px);
      }
    }

    .region-items {
      .region-item {
        height: 50px;
        background-color: $dark-navy;
        border-radius: 6px;
        margin-bottom: 5px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 25px;
        cursor: pointer;
        transition: ease background-color .2s;

        &:first-child { border-radius: 0 0 6px 6px; }
        &:last-child { margin: 0 }
        &.-selected { background-color: $primary; }
      }
    }

    .instance-type-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: $gap;
    }

    .-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      color: $input-placeholder;
      border: 1px solid $purple-gray;
      border-radius: 6px;
    }
  }
}
</style>

<style lang="scss">
.instance-type-management {
  .el-switch.is-checked .el-switch__core::before { left: -9px; }
}
</style>
