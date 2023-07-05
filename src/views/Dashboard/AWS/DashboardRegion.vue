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
    <h3 class="section-title3">
      <el-select
        v-model="regionName"
        class="selector"
        :popper-append-to-body="false"
        popper-class="region-selector"
      >
        <el-option
          v-for="item in regionOptions"
          :key="item.regionName"
          :label="item.displayName"
          :value="item.regionName"
        />
      </el-select>
      <!-- 🌸 selected region :: {{ region }} -->
    </h3>
    <!-- /. 리전 선택 -->

    <resource-filter-component
      ref="filter"
      :use-title="false"
      :use-project="false"
      @search="values => searchFilter(values)"
    />
    <!-- /. 관조 선택 -->

    <div class="region-core-service">
      <h3 class="section-title3">
        {{ $v('핵심 서비스') }}
      </h3>

      <div class="region-data-wrapper">
        <span class="sync-time">{{ $v('동기화 시간 :') }} {{ time }}</span>
        <!-- /. 동기화 시간 -->

        <dashboard-region-comp
          type="EC2"
          :data="ec2Data"
          route-to="set-resource-ec2-list"
        />
        <!-- /. Vcpu -->
        <dashboard-region-comp
          type="EBS"
          :data="ebsData"
          route-to="set-resource-ebs-list"
        />
        <!-- /. Memory -->
        <dashboard-region-comp
          type="EFS"
          :data="efsData"
          route-to="set-resource-efs-list"
        />
      <!-- /. Disk -->
      </div>
    </div>
    <!-- /. 핵심 서비스 -->

    <div class="usage-wrapper">
      <h3 class="section-title3">
        {{ $v('이용(신청)량') }}
      </h3>

      <div class="usage-data-wrapper">
        <span class="sync-time">{{ $v('동기화 시간 :') }} {{ time }}</span>
        <!-- /. 동기화 시간 -->

        <dashboard-usage
          v-for="item of usageData"
          :key="item.key"
          :type="item.key"
          :data="item"
        />
      </div>
    </div>
  </article>
</template>

<script>
import API, { ResourceFilterComponent } from '@sd-fe/cmp-core'
import DashboardRegionComp from './DashboardRegion/DashboardRegionComp'
import DashboardUsage from './DashboardRegion/DashboardUsage'

import ClusterUsageMixin from './DashboardRegion/ClusterUsageMixin'

export default {
  name: 'DashboardRegion',
  components: {
    DashboardRegionComp,
    DashboardUsage,
    ResourceFilterComponent
  },
  mixins: [ClusterUsageMixin],
  props: {
    time: {
      type: String,
      default: undefined
    }
  },
  watch: {
    async regionName (region) {
      this.projects = await this.getProject()
      this.getProjectResources(region)

      this.$refs.filter.resetAllFilter()

      this.$emit('region', region)
    }
  },
  async created () {
    await this.getRawRegions()

    this.projects = await this.getProject()
    this.getProjectResources(this.regionName)
    this.$emit('region', this.regionName)
  },
  methods: {

    /**
     * AWS 전체 리전을 가져옵니다
     */
    async getRawRegions () {
      try {
        this.loading = true
        const { data } = await API.aws.getRegionsPriorities()

        // 리전 가공
        this.regionOptions = data.map(({ displayName, regionName }) => ({ displayName, regionName }))
        this.regionOptions.unshift({ displayName: `${this.$v('전체 리전')}(${data.length})`, regionName: 'all' })
        this.regionName = this.regionOptions[0].regionName
      } catch (error) {
        console.error('@@ getRawRegions : ', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * 프로젝트 목록을 가져옵니다
     */
    async getProject () {
      try {
        const response = await API.iam.getProject()
        return response.map(({ companyIdx, companyName, groupIdx, groupName, projectIdx, projectName, ...project }) => ({ companyIdx, companyName, groupIdx, groupName, projectIdx, projectName }))
      } catch (error) {
        console.error('@@ getProject : ', error)
      }
    },

    /**
     * 프로젝트 데이터 목록 전체 가져오기 (리전 네임을 바탕으로)
     * @param { String } regionName 전체 (all) 일경우는 undefined 로 설정
     */
    async getProjectResources (regionName = this.regionName) {
      try {
        const params = regionName === 'all' ? undefined : regionName
        const { data } = await API.aws.getProjectResources({ regionName: params })

        this.rawSources = this.setDataWithProjects(data)
        return this.setRegionBasedData(this.rawSources)
      } catch (error) {
        console.error('@@ getProjectResources : ', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * 프로젝트 목록과 바인딩합니다.
     * 가공해서 그대로 내려줍니다
     */
    setDataWithProjects ({ todayResource, yesterdayResource }) {
      // [어제/오늘] 비교해서 더 큰 숫자가 있으면 기준으로 설정 (반복문 한번만 돌리려구)
      const length = todayResource.length > yesterdayResource.length ? todayResource.length : yesterdayResource.length

      // 맞는 프로젝트 찾으면 연결 + 순회 끝내기
      const setProject = item => {
        for (const p of this.projects) {
          if (p.projectIdx === item.projectIdx) {
            item = { ...item, ...p }
            break
          }
        }
        return item
      }

      for (let i = 0; i < length; i++) {
        const today = todayResource[i]
        const yesterday = yesterdayResource[i]

        if (today) todayResource[i] = setProject(today)
        if (yesterday) yesterdayResource[i] = setProject(yesterday)
      }

      return { todayResource, yesterdayResource }
    },

    /**
     * [핵심 서비스 / 이용(신청량)] 영역 데이터 공통으로 가공
     * @param { Array } todayResource
     * @param { Array } yesterdayResource
     */
    setRegionBasedData ({ todayResource, yesterdayResource }) {
      this.loading = true

      // [어제/오늘] 비교해서 더 큰 숫자가 있으면 기준으로 설정 (반복문 한번만 돌리려구)
      const length = todayResource.length > yesterdayResource.length ? todayResource.length : yesterdayResource.length

      // [전체/어제] 데이터 각각 순회해서 모두 더하기
      const total = { ec2: 0, ebs: 0, efs: 0, ip: 0, vcore: 0, memory: 0, disk: 0 }
      const before = { ec2: 0, ebs: 0, efs: 0, ip: 0, vcore: 0, memory: 0, disk: 0 }

      const top5 = { ec2Types: {}, ebsTypes: {} }

      for (let i = 0; i < length; i++) {
        const today = todayResource[i]
        const yesterday = yesterdayResource[i]

        // [EC2/EBS/EFS] 데이터 가공
        if (today) {
          const { ec2: todayEC2, ebs: todayEBS, efs: todayEFS, availableIp: todayIP, vcore: todayCore, memory: todayMemory, disk: todayDisk, ec2CountByTypes, ebsCountByTypes } = today

          total.ec2 += todayEC2
          total.ebs += todayEBS
          total.efs += todayEFS

          total.ip += todayIP
          total.vcore += todayCore
          total.memory += todayMemory
          total.disk += todayDisk

          // console.log(today)

          // Top5 데이터 세팅
          const top5TempData = this.setTop5Data(ec2CountByTypes, ebsCountByTypes)
          this.sumTop5DataDetail(top5, top5TempData)
        }

        if (yesterday) {
          const { ec2: yesterdayEC2, ebs: yesterdayEBS, efs: yesterdayEFS, availableIp: yesterdayIP, vcore: yesterdayCore, memory: yesterdayMemory, disk: yesterdayDisk } = yesterday

          before.ec2 += yesterdayEC2
          before.ebs += yesterdayEBS
          before.efs += yesterdayEFS

          before.ip += yesterdayIP
          before.vcore += yesterdayCore
          before.memory += yesterdayMemory
          before.disk += yesterdayDisk
        }
      }

      // console.log(total, before)

      // =========================
      // === 핵심 서비스 데이터 세팅 ===
      // =========================

      this.setCoreServiceData(total, before, top5)
      this.setUsageData(total, before)
      this.$emit('rawSources', todayResource)

      this.loading = false
    },

    /**
     * Top5 데이터 가공
     * @param { Object } result
     * @param { Object } temp
     * @return { Object }
     */
    setTop5Data (ec2List, ebsList) {
      const ec2Types = {}
      const ebsTypes = {}

      ec2List.forEach(({ instanceType, ...item }) => { ec2Types[instanceType] = { ...item } })
      ebsList.forEach(({ volumeType, ...item }) => { ebsTypes[volumeType] = { ...item } })

      return { ec2Types, ebsTypes }
    },
    /**
     * Top5 데이터 가공
     * @param { Object } result
     * @param { Object } temp
     * @return { Object }
     */
    sumTop5DataDetail (result, temp) {
      const types = ['ec2Types', 'ebsTypes']

      for (const type of types) {
        // ec2Type에 추가할건지 ? ebsType 에 추가할건지
        const data = temp[type]

        // 어차피 인스턴스/볼륨타입 데이터가 없으면 순회할 필요 없으니까 스킵
        if (!Object.keys(data).length) continue

        // name :: 각 인스턴스/볼륨타입 이름
        for (const name in data) {
          // values :: 각 인스턴스/볼륨타입이 가진 값
          const values = data[name]

          // 값에서 각자 Count 값을 순회함
          for (const key in values) {
            // 순회하면서 각 카운터 데이터를 더하기 함
            if (result[type][name] === undefined) result[type][name] = {} // name을 가지는 object가 없는경우 정의
            if (result[type][name][key] === undefined) result[type][name][key] = 0 // key가 없는 경우 0으로 일단 정의

            result[type][name][key] += values[key] // 값 누적으로 더하기
          }
        }
      }

      return result
    },

    /**
     * [핵심서비스] 영역 데이터 가공
     * @param { Object } total
     * @param { Object } before
     * @param { Object } top5 (ec2/ebs 무작위 Top5 데이터)
     */
    setCoreServiceData (total, before, top5) {
      const { ec2: totalEC2, ebs: totalEBS, ebs: totalEFS } = total
      const { ec2: beforeEC2, ebs: beforeEBS, ebs: beforeEFS } = before

      const getDiff = (total, before) => {
        // [오늘/어제] 차이 계산
        const result = (total - before)
        const sign = result >= 0 ? '+' : '-'
        return `${sign}${Math.abs(result).toLocaleString()}`
      }

      // console.log(top5)
      this.ec2Data = {
        total: totalEC2, // 전체량
        diff: getDiff(totalEC2, beforeEC2), // 전체 - 어제
        top5: top5.ec2Types // 인스턴스 유형 Top5
      }
      this.ebsData = {
        total: totalEBS, // 전체량
        diff: getDiff(totalEBS, beforeEBS), // 전체 - 어제
        top5: top5.ebsTypes // EBS 유형 Top5
      }
      this.efsData = {
        total: totalEFS, // 전체량
        diff: getDiff(totalEFS, beforeEFS) // 전체 - 어제
      }
    },
    /**
     * [이용(신청)량] 영역 데이터 가공
     * @param { Object } total
     * @param { Object } before
     */
    setUsageData (total, before) {
      const { ip: totalIp, vcore: totalCore, memory: totalMemory, disk: totalDisk } = total
      const { ip: beforeIp, vcore: beforeCore, memory: beforeMemory, disk: beforeDisk } = before

      const getDiff = (total, before, getUnit) => {
        // [오늘/어제] 차이 계산
        const result = (total - before)
        if (result === 0) return undefined // 차이가 없으면 안보임

        const sign = result > 0 ? '+' : '-'
        const abs = Math.abs(result)

        if (getUnit instanceof Object) { // 단위 변환 필요시 사용
          const value = getUnit(abs)
          return { value: `${sign}${value[0]}`, unit: value[1] }
        } else { // 그냥 하드코딩 (IP/CPU) 일경우
          return { value: `${sign}${abs.toLocaleString()}`, unit: getUnit }
        }
      }

      // memory / disk
      const mb = data => this.$options.filters.MB(data).split(' ')
      const gb = data => this.$options.filters.MB(data * 1024).split(' ')

      const memoryData = { unit: mb(totalMemory)[1], total: mb(totalMemory)[0], diff: getDiff(totalMemory, beforeMemory, mb) }
      const diskData = { unit: gb(totalDisk)[1], total: gb(totalDisk)[0], diff: getDiff(totalDisk, beforeDisk, gb) }

      this.usageData = [
        { key: 'ip', title: this.$v('IP 수'), image: 'ip', unit: 'EA', total: totalIp, diff: getDiff(totalIp, beforeIp, 'EA') }, // IP 수
        { key: 'vcore', title: this.$v('CPU Core 수'), image: 'cpucore', unit: 'Core', total: totalCore, diff: getDiff(totalCore, beforeCore, 'Core') }, // CPU Core 수
        { key: 'memory', title: this.$v('Memory 총량'), image: 'totalmemory', ...memoryData }, // Memory 총량
        { key: 'disk', title: this.$v('DISK 총량'), image: 'totaldisk', ...diskData } // DISK 총량
      ]
    },

    /**
     * [관조] 변경시 발생하는 이벤트 (리셋시에도 발생)
     */
    async searchFilter ({ companyIdx, groupIdx }) {
      const { todayResource: today, yesterdayResource: yesterday } = this.rawSources

      // '전체' 일때는 전체 데이터로 바인딩
      if (companyIdx === null && groupIdx === null) return this.setRegionBasedData({ todayResource: today, yesterdayResource: yesterday })

      // companyIdx / groupIdx 비교해서 일치하는 애들만 확인
      const filter = data => data.filter(data => {
        if (companyIdx && !groupIdx) return (companyIdx === data.companyIdx)
        if (companyIdx && groupIdx) return (companyIdx === data.companyIdx) && (groupIdx === data.groupIdx)
      })

      const todayResource = filter(today)
      const yesterdayResource = filter(yesterday)

      return this.setRegionBasedData({ todayResource, yesterdayResource })
    }
  },
  data () {
    return {
      loading: false,
      existCate: [],
      regionName: 'all',
      regionOptions: [],
      rawSources: {},
      projects: [],
      ec2Data: {},
      ebsData: {},
      efsData: {},
      usageData: []
    }
  }
}
</script>

<style lang="scss" scoped>
.region-core-service {
  .region-data-wrapper {
    display: grid;
    grid-template-columns: 385px 385px 385px 385px;
    column-gap: $gap;
    margin-bottom: 70px;
    position: relative;
  }
}

.usage-data-wrapper {
  height: 166px;
  background: #070A20;
  border-radius: 10px;
  box-sizing: border-box;
  padding: 40px 0 40px 40px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  column-gap: 40px;
  position: relative;
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
    width: 200px;
    z-index: 5;

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
    width: 200px;
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
