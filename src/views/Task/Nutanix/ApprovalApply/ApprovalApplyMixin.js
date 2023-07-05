export default {
  methods: {
    /**
     * [자원 정보] 영역 탭 설정
     * @param {Array} data 주문리스트
     */
    settingTabs (data) {
      const map = new Map()

      for (let i = 0; i < data.length; i++) {
        const order = data[i]
        const projectIdx = order.orderInfo.projectIdx

        // orderData가 없는 경우
        if (!order.orderInfo) return this.$router.replace({ name: 'not-found-status', params: { code: 404 } })
        // 있는경우
        else if (!map.has(projectIdx)) map.set(projectIdx, [])
        map.get(projectIdx).push(order)
      }

      const tabs = []
      map.forEach((e) => {
        for (let i = 0; i < e.length; i++) {
          const order = e[i]
          order.compute = 0
          order.network = 0
          order.storage = 0
          order.database = 0
          order.market = 0
          order.amount = 0

          for (let j = 0; j < order.orderDataList.length; j++) {
            const workType = order.orderDataList[j].workType
            if (workType === 'COMPUTE' || workType === 'OVA') order.compute++
            else if (workType === 'NETWORK_L4') order.network++
            else if (workType === 'NETWORK_L7') order.network++
            else if (workType === 'SECURITY') order.network++
            else if (workType === 'DATABASE') order.database++
            else if (workType === 'STORAGE') order.storage++
            else if (workType === 'MARKET') order.market++
            order.amount += Number(order.orderDataList[j].price)
          }

          order.total = order.compute + order.network + order.storage + order.database + order.market
        }

        const selectedPjName = e[0].orderInfo.projectName
        if (!this.selectTab) {
          this.selectTab = { field: selectedPjName, name: selectedPjName, data: e }
        }
        tabs.push({ field: selectedPjName, name: selectedPjName, data: e })
      })

      return tabs
    },
    settingTabs2 (data) {
      const map = new Map()
      console.log(data, '=???')

      for (let i = 0; i < data.length; i++) {
        const order = data[i]
        const projectIdx = order.projectIdx

        // orderData가 없는 경우
        if (!order.orderData) return this.$router.replace({ name: 'not-found-status', params: { code: 404 } })
        // 있는경우
        else if (!map.has(projectIdx)) map.set(projectIdx, [])
        map.get(projectIdx).push(order)
      }

      const tabs = []
      map.forEach((e) => {
        const selectedPjName = e[0].projectIdx
        if (!this.selectTab) {
          this.selectTab = { field: selectedPjName, name: selectedPjName, data: e }
        }
        tabs.push({ field: selectedPjName, name: selectedPjName, data: e })
      })

      return tabs
    }
  }
}
