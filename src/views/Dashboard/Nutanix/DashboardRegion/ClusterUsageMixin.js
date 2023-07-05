
export default {
  methods: {
    async getClusterUsageLists (elements) {
      try {
        this.loading = true
        await this.getElementList(elements)
        await this.setStatus(elements)
        return this.sourceStatusFilter(this.region)
      } catch (error) {
        console.error('@@ getClusterUsageLists in Mixin', error)
      } finally {
        this.loading = false
      }
    },
    /**
     * [자원 현황] cpu, memory, disk 임계치 설정
     */
    async getElementList (elements) {
      // const elements = await API.compute.getElementList()
      this.elements = await elements.map(el => {
        const {
          clusterName, clusterUuid,
          firstCpuPercent, firstDiskPercent, firstMemoryPercent, // 1차 임계치
          secondCpuPercent, secondDiskPercent, secondMemoryPercent, // 2차 임계치
          virtualPercent // 최대 가상화율
        } = el

        return { clusterName, clusterUuid, firstCpuPercent, firstDiskPercent, firstMemoryPercent, secondCpuPercent, secondDiskPercent, secondMemoryPercent, virtualPercent }
      })
    },
    /**
     * [자원 현황] 데이터 세팅
     */
    setStatus (data) {
      // console.log('%c @@ getStatus', 'color: #A6FF94')
      // console.log(data)

      const trendCpuList = [] // 김포/송도 전체 vCPU 가상화율 리스트
      const trendCpuUsageList = [] // 김포/송도 전체 vCPU 사용률 리스트

      const trendMemList = [] // 김포/송도 전체 메모리 할당량 리스트
      const trendMemUsageList = [] // 김포/송도 전체 메모리 사용률 리스트

      const trendDiskList = [] // 김포/송도 전체 디스크 할당량 리스트
      const trendDiskUsageList = [] // 김포/송도 전체 디스크 사용률 리스트

      for (const d of data) {
        // const { clusterName, clusterUuid, region, date, cpuUsagePct, hypervisorCpuUsage, memUsagePct, hypervisorMemoryUsage, diskCapacityPct, diskUsagePct } = d
        // const standard = this.elements.filter(el => el.clusterUuid === clusterUuid)[0]
        // const {
        //   firstCpuPercent, firstDiskPercent, firstMemoryPercent,
        //   secondCpuPercent, secondDiskPercent, secondMemoryPercent,
        //   virtualPercent
        // } = standard

        const {
          clusterName, clusterUuid, region, date,
          cpuUsagePct, hypervisorCpuUsage, memUsagePct,
          hypervisorMemoryUsage, diskCapacityPct, diskUsagePct,
          firstCpuPercent, firstDiskPercent, firstMemoryPercent,
          secondCpuPercent, secondDiskPercent, secondMemoryPercent,
          virtualPercent
        } = d

        // { ... standard: 임계치, rate: 가상화율, max: 최대가상화율 }
        const dataObj = { clusterName, clusterUuid, region, date }
        // 가상화율, 할당량
        const cpuObj = { ...dataObj, max: virtualPercent, standard1: firstCpuPercent, standard2: secondCpuPercent, rate: cpuUsagePct }
        const memObj = { ...dataObj, max: virtualPercent, standard1: firstMemoryPercent, standard2: secondMemoryPercent, rate: memUsagePct }
        const diskObj = { ...dataObj, max: virtualPercent, standard1: firstDiskPercent, standard2: secondDiskPercent, rate: diskCapacityPct }

        // 사용률
        const cpuUsageObj = { ...dataObj, rate: hypervisorCpuUsage }
        const memUsageObj = { ...dataObj, rate: hypervisorMemoryUsage }
        const diskUsageObj = { ...dataObj, rate: diskUsagePct }

        // ===
        // ===
        // ===

        trendCpuList.push(cpuObj)
        trendCpuUsageList.push(cpuUsageObj)

        trendMemList.push(memObj)
        trendMemUsageList.push(memUsageObj)

        trendDiskList.push(diskObj)
        trendDiskUsageList.push(diskUsageObj)
      }

      this.allVcpuData = [...trendCpuList]
      this.allVcpuUsageData = [...trendCpuUsageList]

      this.allMemoryData = [...trendMemList]
      this.allMemoryUsageData = [...trendMemUsageList]

      this.allDiskData = [...trendDiskList]
      this.allDiskUsageData = [...trendDiskUsageList]
    },
    /**
     * 가상화율/사용율/할당량 그래프를 위한 데이터
     * @param {String} region
     */
    sourceStatusFilter (region) {
      // console.log(this.region)
      // console.log('%c //// data====', 'color: #94EFFF; font-weight: bold')
      // console.log(this.region)
      // console.log(this.allVcpuData, '---- default Data')
      // console.log(this.allMemoryData, '---- default Data')

      const dataFilter = (data) => {
        const allClusters = this.region === 'all' ? [...data] : data.filter((d) => d.region === region)
        // const allClusterNames = Array.from(new Set(allClusters.map(cluster => cluster.clusterName)))
        const allClusterNames = Array.from(allClusters.map(cluster => cluster.clusterName))

        const filteredObj = {}
        allClusterNames.map(name => {
          filteredObj[name] = []
          allClusters.forEach(cluster => { if (cluster.clusterName === name) filteredObj[name].push(cluster) })
        })
        // console.log(filteredObj)
        const currClusterData = []
        for (const name in filteredObj) {
          // const clusters = filteredObj[name]
          // currClusterData.push(clusters[clusters.length - 1])
          const clusters = filteredObj[name]
          clusters.forEach((cluster, idx) => currClusterData.push(clusters[idx]))
        }

        currClusterData.sort((d1, d2) => {
          if (d1.rate > d2.rate) return 1
          else if (d1.rate < d2.rate) return -1
          else return 0
        })
        return currClusterData
      }

      const result = {
        vcpuData: dataFilter(this.allVcpuData),
        vcpuUsageData: dataFilter(this.allVcpuUsageData),
        memoryData: dataFilter(this.allMemoryData),
        memoryUsageData: dataFilter(this.allMemoryUsageData),
        diskData: dataFilter(this.allDiskData),
        diskUsageData: dataFilter(this.allDiskUsageData)
      }

      return result
    }
  },
  data () {
    return {
      elements: null,
      allVcpuData: [],
      allVcpuUsageData: [],
      allMemoryData: [],
      allMemoryUsageData: [],
      allDiskData: [],
      allDiskUsageData: []
    }
  }
}
