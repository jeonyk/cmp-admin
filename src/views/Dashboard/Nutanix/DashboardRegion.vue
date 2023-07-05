<!--
  * 파일명 : DashboardRegion.vue
  * 파일 기능 : 대시보드 - Cluster, Node, Vm 현황
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2021-02-19
  * License By Shinsegae I&C
  * 2021-02-19 Merge branch 'publish/dashboard' into 'dev'
 -->

<template>
  <article
    class="dashboard-region-wrapper"
    v-loading="loading"
  >
    <div class="title-wrapper">
      <h3 class="section-title3">
        <el-select
          v-model="regionTemp"
          class="selector"
          :popper-append-to-body="true"
          popper-class="region-selector"
          @change="changeRegion"
        >
          <el-option
            v-for="item in regionOptions"
            :key="item.cateIdx"
            :label="item.cateName"
            :value="item.cateName"
          />
        </el-select>
      <!-- 🌸 selected region :: {{ region }} -->
      </h3>
      <span class="sync-time">{{ $t('main.DASHBOARD.ntxNodeHAAlert') }}</span>
      <!-- 전체 값에는 HA 노드가 포함되어 계산되지 않습니다 -->
    </div>

    <div class="region-data-wrapper">
      <div
        class="source-infos"
        v-if="clustersData.length"
      >
        <div
          v-for="item in clustersData"
          :key="`data_${item.name}`"
          class="-data"
        >
          <p class="-count">
            <strong>{{ item.cnt | locale }}</strong>
            <small>EA</small>
          </p>

          <b>{{ item.name }}</b>
        </div>
      </div>
      <div
        class="source-infos -empty"
        v-else
      >
        {{ $t('common.PLACEHOLDER.noData') }}
        <!-- 데이터가 없습니다 -->
      </div>
      <!-- /. Cluster, Node, Vm -->

      <dashboard-region-comp
        :type="{ title: 'vCPU', top5: `vCPU ${$t('common.GRID.NUTA.virtualRate')}` }"
        :data="vcpuData"
      />
      <!-- /. Vcpu -->
      <dashboard-region-comp
        :type="{ title: 'Memory', top5: `Memory ${$t('main.DASHBOARD.quota')}` }"
        :data="memoryData"
      />
      <!-- /. Memory -->
      <dashboard-region-comp
        :type="{ title: 'Disk', top5: `Disk ${$t('main.DASHBOARD.quota')}` }"
        :data="diskData"
      />
      <!-- /. Disk -->
    </div>
  </article>
</template>

<script>
import DashboardRegionComp from './DashboardRegion/DashboardRegionComp'
import ClusterUsageMixin from './DashboardRegion/ClusterUsageMixin'
import API, { treeFindChild } from '@sd-fe/cmp-core'

export default {
  name: 'DashboardRegion',
  components: {
    DashboardRegionComp
  },
  mixins: [ClusterUsageMixin],
  watch: {
    async region (region) {
      await this.setChartDataFormat()
    }
  },
  async created () {
    await this.getRawClusterData()
    await this.setChartDataFormat()
    this.changeRegion(this.$t('main.DASHBOARD.all'))
  },
  methods: {
    /** */
    async getRawClusterData () {
      try {
        this.loading = true

        // const response = await API.compute.getClusters()
        const response = await API.compute.getElementData()
        const categories = await API.network.getNetworkCategory()
        const treeIpCates = await API.network.getNetworkCategoryTree()
        // console.log('%c @@@ getRawClusterData', 'color: #ff94ea')
        // console.log(response)
        // console.log(treeIpCates)

        // 해당 카테고리에 속한 Element 가 있는지 확인하기 위해 사용합니다.
        this.existCate = []

        response.forEach(cluster => {
          const cate = this.getCateTreeName(treeIpCates, cluster.cateIdx)
          const cateName = cate.cateKey.split('-')[0] // 제일 앞에있는 데이터 센터 명 떼오기
          if (cluster.cateIdx === cate.cateIdx) {
            // 김포/송도/부산/... 등을 cluster 에 임시로 지정합니다.
            cluster.center = cateName
            cluster.region = cateName
            if (this.existCate.indexOf(cateName) === -1) this.existCate.push(cateName)
          }
        })

        // Region 선택 옵션 가공 + 전체 옵션
        this.regionOptions = treeIpCates.filter(cate => (this.existCate.indexOf(cate.cateName) > -1))
        this.regionOptions.unshift({ cateName: this.$t('main.DASHBOARD.all'), cateIdx: 'all' }) // 전체
        // console.log(this.regionOptions)

        this.categories = [...categories]
        this.rawClusters = JSON.parse(JSON.stringify(response))
        return this.$emit('rawClusters', this.rawClusters)
      } catch (err) {
        console.error('@@ getRawClusterData', err)
        return this.$emit('rawClusters', [])
      } finally {
        this.loading = false
      }
    },
    /**
     * 카테고리 Tree 를 순회하며 일치할 경우 return 시킵니다.
     */
    getCateTreeName (tree, cateIdx) {
      // 11/24 - 첫번째 노드 아이템의 children을 제외한 다른 노드 아이템에서
      // 아이템을 return 하지 않고 있어서 treeFindChild로 대체 - 참고 부탁드립니다.
      return treeFindChild(tree, 'cateIdx', cateIdx)
      // for (let i = 0; i < tree.length; i++) {
      //   const cate = tree[i]
      //   if (cate.children) return this.getCateTreeName(cate.children, cateIdx)
      //   else {
      //     if (cate.cateIdx === cateIdx) return cate
      //   }
      // }
    },

    async setChartDataFormat () {
      try {
        this.loading = true

        // const response = await API.compute.getElementData()
        const response = this.rawClusters

        // vcpu, memory, disk [클러스터 순위 Top 5] 설정
        await this.setClusterTop5Data(this.rawClusters)

        // 차트 데이터 세팅
        const filteredCate = this.categories.filter(cate => cate.upperCategoryIdx === 0)
        const filteredCateNames = filteredCate.map(cate => cate.cateKey)
        // const setChartDataNew = (condition) => filteredCateNames.map(condition)

        // 🍎 response에서 cateNames를 기준으로 데이터를 나눕니다.
        // 김포/송도 외에 추가 데이터가 있을 경우도 가능합니다.
        // 데이터 형식 => { 김포: [...], 송도: [...], ... } ==> key 로 사용할 수있는 값이 한글밖에없어요..
        const filteredObj = {}
        filteredCateNames.filter(cate => {
          filteredObj[cate] = []
          response.forEach(resp => { if (resp.center === cate) filteredObj[resp.center].push(resp) })
        })

        this.setRegionData(filteredObj)
      } catch (err) {
        console.error('@@ getRawClusterData', err)
      } finally {
        this.loading = false
      }
    },
    /**
     * 해당 리젼 관련 데이터 저장
     */
    async setRegionData (filteredObj) {
      // region === 전체 일 때 :: 계산을 다르게 합니다.
      if (this.region === 'all') return this.setRegionAllData(filteredObj)

      // 리젼이 선택된경우 :: 해당 내용만 찾아 저장합니다.
      const data = filteredObj[this.region]

      // Cluster, Node, Vm 개수
      this.clustersData = [
        { name: 'Cluster', cnt: data?.length },
        { name: 'Node', cnt: this.reduced(data, 'hosts') },
        { name: 'Vm', cnt: this.totalCnt(data, 'allVmCnt') }
      ]

      // vCPU 사용중 / 전체
      const vCpuUsingCnt = this.totalCnt(data, 'vmCpuSum')
      const vCpuTotalCnt = this.totalCnt(data, 'nonNodeCpuSum')

      // Memory 사용중 / 전체
      const memoryUsingCnt = this.totalCnt(data, 'vmMemSum')
      const memoryTotalCnt = this.totalCnt(data, 'nonNodeMemSum')

      // Disk 사용중 / 전체
      const diskUsingCnt = this.totalCnt(data, 'vdiskCapacitySum')
      const diskTotalCnt = this.totalCnt(data, 'nonNodeStorageCapacityBytes')

      // 자원 할당량 { using: 사용중, total: 전체 갯수, unit: 단위, raw: 단위변환 없는 원본 데이터 }
      this.vcpuData = {
        using: vCpuUsingCnt,
        total: vCpuTotalCnt,
        unit: 'Core',
        raw: vCpuTotalCnt,
        top5: this.vCpuTop5
      }

      const memoryData = this.compareUnit(memoryUsingCnt, memoryTotalCnt)
      const diskData = this.compareUnit(diskUsingCnt, diskTotalCnt)

      this.memoryData = {
        ...memoryData, // using, total, unit
        raw: memoryTotalCnt,
        top5: this.memoryop5
      }

      this.diskData = {
        ...diskData, // using, total, unit
        raw: diskTotalCnt,
        top5: this.diskTop5
      }
    },
    /**
     * region === 전체 일 때
     * 클러스터, 노드, 가상서버, | Vcpu, 메모리, 가상디스크 데이터 세팅
     */
    setRegionAllData (filteredObj) {
      let clustersCnt = 0 // Cluster
      let nodesCnt = 0 // Node
      let vmsCnt = 0 // Vm 개수

      let vCpuUsingCnt = 0 // 사용중 vCpu
      let vCpuTotalCnt = 0 // 전체 vCpu
      let memoryUsingCnt = 0 // 사용중 Memory
      let memoryTotalCnt = 0 // 전체 Memory
      let diskUsingCnt = 0 // 사용중 Disk
      let diskTotalCnt = 0 // 전체 Disk

      // Region 이 [전체] 일 경우 모든 데이터의 합산을 구해야합니다
      for (const label in filteredObj) {
        const data = filteredObj[label]

        clustersCnt += data?.length
        nodesCnt += this.reduced(data, 'hosts')
        vmsCnt += this.totalCnt(data, 'allVmCnt')

        // vCPU 사용중 / 전체
        vCpuUsingCnt += this.totalCnt(data, 'vmCpuSum')
        vCpuTotalCnt += this.totalCnt(data, 'nonNodeCpuSum')

        // memory 사용중 / 전체
        memoryUsingCnt += this.totalCnt(data, 'vmMemSum')
        memoryTotalCnt += this.totalCnt(data, 'nonNodeMemSum')

        // disk 사용중 / 전체
        diskUsingCnt += this.totalCnt(data, 'vdiskCapacitySum')
        diskTotalCnt += this.totalCnt(data, 'nonNodeStorageCapacityBytes')
      }

      // cluster, node, vm 총 보유량
      this.clustersData = [
        { name: 'Cluster', cnt: clustersCnt },
        { name: 'Node', cnt: nodesCnt },
        { name: 'Vm', cnt: vmsCnt }
      ]
      // 자원 할당량 { using: 사용중, total: 전체 갯수, unit: 단위, raw: 단위변환 없는 원본 데이터 }
      this.vcpuData = {
        using: vCpuUsingCnt,
        total: vCpuTotalCnt,
        unit: 'Core',
        raw: vCpuTotalCnt,
        top5: this.vCpuTop5
      }

      const memoryData = this.compareUnit(memoryUsingCnt, memoryTotalCnt)
      const diskData = this.compareUnit(diskUsingCnt, diskTotalCnt)

      this.memoryData = {
        ...memoryData, // using, total, unit
        raw: memoryTotalCnt,
        top5: this.memoryop5
      }

      this.diskData = {
        ...diskData, // using, total, unit
        raw: diskTotalCnt,
        top5: this.diskTop5
      }
    },
    /**
     * 두 개의 유닛데이터가 같지 않은경우 단위 동일하게 처리
     * ex. 둘중 하나라도 1TB 가 안된다면 0.nTB 로 표시되도록 해야함
     */
    compareUnit (usingData, totalData) {
      const using = this.byte(usingData)
      const total = this.byte(totalData)
      const sizes = ['MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
      const usingUnitIdx = sizes.indexOf(using[1])
      const totalUnitIdx = sizes.indexOf(total[1])
      let result // 형식을 유지해야해요

      if (usingUnitIdx !== totalUnitIdx) {
        const setData = (item1, item2) => Number(item1[0] / 1024).toFixed(2)

        result = usingUnitIdx > totalUnitIdx
          ? ({ using: using[0], total: setData(total), unit: using[1] })
          : ({ using: setData(using), total: total[0], unit: total[1] })
      } else {
        result = { using: using[0], total: total[0], unit: total[1] }
      }

      return result
    },
    /**
     * Top5 클러스터 순위를 가져옵니다.
     * 클러스터현황 > 팝업 데이터와 동일하므로, mixin 을 사용합니다.
     */
    async setClusterTop5Data (rawClusters = this.rawClusters) {
      // ClusterUsageMixin.js 함수
      const { vcpuData, memoryData, diskData } = await this.getClusterUsageLists(rawClusters)

      this.vCpuTop5 = [...vcpuData]
      this.memoryop5 = [...memoryData]
      this.diskTop5 = [...diskData]
    },
    /**
     * Region 변경시 발생하는 이벤트
     * @param {String} region
     */
    changeRegion (region) {
      // 클러스터순위 Top 5 내용을 모두 접습니다.
      this.$children.forEach(child => {
        child.extend = false
        child.asc = true
      })

      const isAll = region === this.$t('main.DASHBOARD.all')
      this.region = isAll ? 'all' : region

      // 전체 일때 (전체 카테고리 갯수)
      this.regionTemp = isAll ? `${region} (${this.existCate.length})` : region
      this.$emit('region', this.region)
    }
  },
  data () {
    return {
      loading: false,
      existCate: [],
      region: 'all', // 전체
      regionTemp: '',
      regionOptions: [],
      clustersData: [],
      categories: [],
      rawClusters: [],
      vcpuData: {},
      memoryData: {},
      diskData: {},

      vCpuTop5: [],
      memoryop5: [],
      diskTop5: [],

      reduced (data, key) {
        // 특정 값의 갯수를 구할 수 있습니다.
        const reducer = (acc, curr) => acc + curr
        return data.length ? data.map(object => object[key] ? object[key].length : 0).reduce(reducer) : 0
      },
      totalCnt (data, key) {
        // vms 라는 key 값 내부에서 모든 값을 더해야할 경우에 사용합니다.
        const reducer = (acc, curr) => acc + curr

        const value = data.map(cluster => cluster[key] ? cluster[key] : 0)
        return data.length ? value.reduce(reducer) : 0
      },
      // GB, TB, PB... 계산 및 unit 설정
      byte (data) { return this.$options.filters.byte(data).split(' ') }
    }
  }
}
</script>

<style lang="scss" scoped>

.title-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.region-data-wrapper {
  display: grid;
  grid-template-columns: 520px 340px 340px 340px;
  column-gap: $gap;
  .source-infos {
    box-sizing: border-box;
    border-radius: $radius-m;
    height: 176px;
    padding: 60px 35px;
    background: linear-gradient(95.61deg, #71A8D9 -3.07%, $primary 103.34%);
    box-shadow: 10px 10px 50px #1B2659;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $white;

    .-data {
      border-left: 1px solid rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: flex-start;
      flex-direction: column;
      height: 50px;
      &:first-child { border: none; }

      &:nth-child(1) { padding-right: $gap-m; }
      &:nth-child(2) { padding: 0 $gap-m; }
      &:nth-child(3) { padding-left: $gap-m; }

      .-count {
        margin-bottom: 5px;
        strong { font-size: 30px; }
        small {
          font-size: 13px;
          font-weight: 300;
          display: inline-block;
          margin-left: 5px;
        }
      }
    }

    &.-empty {
      grid-template-columns: auto;
      align-items: center;
      text-align: center;
    }
  }
}

</style>

<style lang="scss">
.dashboard-region-wrapper {
  .selector {
    width: 105px;

    &.el-select {
      .el-input {
        .el-input__inner {
          padding: 0;
          font-weight: bold;
          font-size: 18px;
          color: #FCFBFC;
          display: flex;
          align-items: center;
          border: none;
          border-bottom: 1px solid $white;
          padding-bottom: $gap-s;

          &:focus {
            border: none;
            border-bottom: 1px solid $white;
          }
        }

        &.is-focus {
          .el-input__inner {
            background: none;
            border-bottom: 1px solid $white;
            color: $white;
            &:focus { color: $white; }
          }
        }

        &.el-input--suffix {
          .el-input__suffix {
            width: 15px;
            right: 0;
            height: 25px;
          }
          .el-select__caret.el-input__icon {
            width: 15px;
            color: $white;
            font-weight: 900;
            height: 25px;
            display: flex;
            align-items: center;
          }
        }
      }
    }

    .el-icon-arrow-up {
      &:before {
        font-size: 15px;
      }
    }
  }
}

.el-select-dropdown.el-popper {
  &.region-selector {
    width: 140px;
    border: 1px solid $main-red;
    z-index: 1 !important;

    .el-select-dropdown__wrap {
      border-top: 1px solid $main-red;
    }

    .el-select-dropdown__item {
      padding: 0 $gap-s;
      font-weight: normal;
      &.selected span {
        color: $text-black;
      }
    }
  }
}
</style>
