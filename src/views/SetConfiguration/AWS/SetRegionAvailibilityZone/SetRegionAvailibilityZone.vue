<template>
  <div class="region-availability-zone">
    <div style="display: flex; justify-content: flex-end">
      <button
        type="is-primary"
        class="button"
        style="margin-right: 10px"
        @click="isOpenRegionList = true"
      >
        {{ $v('리전 우선순위 결정') }}
      </button>
    </div>
    <main style="margin-top: 15px">
      <div
        v-if="isLoading"
        v-loading="isLoading"
      />
      <ul
        v-else-if="!isLoading && regionList && regionList.length"
        class="card-list"
      >
        <region-card
          v-for="item, index in regionList"
          :key="item.regionName"
          :data="{...item, index: index +1}"
          @update-regions="updateRegions"
          @switch="showToPublic"
        />
      </ul>
      <div
        class="empty-data"
        v-else
      >
        <p>{{ $v('데이터가 없습니다.') }}</p>
      </div>
    </main>

    <region-list-modal
      :is-visible="isOpenRegionList"
      :region-list="regionList"
      @close="isOpenRegionList = false"
      @save-regions="saveRegions"
    />

    <!-- 가용 영역 선택 팝업 -->
    <select-list-modal
      :title="`${selectedRegionTitle} ${$v('리전 가용 영역 선택')}`"
      :active="isOpenSelectedRegionList"
      @close="resetSelectedRegions"
      @select="selectRegions"
      :data="availableZoneList"
      is-region
    >
      <div class="select-list-modal-header">
        {{ selectedRegionTitle }} {{ $v('리전 선택 가능 가용 영역') }}
      </div>
    </select-list-modal>
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
import RegionCard from '@/components/ConfigAws/RegionCard'
import RegionListModal from '@/components/ConfigAws/RegionListModal'
import SelectListModal from '@/components/Modal/SelectListModal/SelectListModal'
export default {
  name: 'SetRegionAvailibilityZone',
  components: {
    'region-card': RegionCard,
    'region-list-modal': RegionListModal,
    'select-list-modal': SelectListModal
  },
  async created () {
    await this.setRegionList()
  },
  watch: {
    isOpenRegionList: {
      immediate: true,
      handler (newVal) {
        if (!newVal) {
          this.selectedRegion = undefined
        }
      }
    }
  },
  computed: {
    selectedRegionTitle () {
      return this.selectedRegion?.regionName || ''
    }
  },
  methods: {
    async showToPublic (regionName, bool) {
      const payload = {
        name: regionName,
        isActivated: bool
      }
      console.log('리전 스위치 :', regionName, bool)
      const res = await API.aws.activateRegion(payload)
      console.log('@activateRegion', res)
    },
    async setRegionList () {
      this.isLoading = true
      this.regionList = await API.aws.getRegionsAdmin()
      this.regionList = this.setAvailableRegions(this.regionList)
      this.regionIndexOrders = await this.getRegionIndexOrders()
      this.regionList.find(region => {
        const found = this.regionIndexOrders.find(order => order.regionName === region.regionName)
        if (found) {
          region.orderBy = found.orderBy
        }
      })
      this.getRegionOrder(this.regionList)
      this.isLoading = false
    },
    async getRegionIndexOrders () {
      const { data } = await API.aws.getRegionIndexOrders()
      data.map((r, idx) => {
        r.orderBy = idx + 1
      })
      return data
    },
    getRegionOrder (list) {
      list.sort((a, b) => {
        return a.orderBy - b.orderBy
      })
    },
    setAvailableRegions (regionList) {
      const result = regionList.filter((region, index, list) => {
        const isUnique =
          index ===
          list.findIndex((item) => item.regionName === region.regionName)
        let foundIdx = list.findIndex(
          (item) => item.regionName === region.regionName
        )
        let id
        region.availableZones = []
        region.name = region.displayName

        region.isExposed = region.isShownUser
        if (foundIdx === 0) foundIdx = 'temp'
        if (foundIdx) {
          if (foundIdx === 'temp') foundIdx = 0
          id = foundIdx
          list[id].availableZones.push({
            label: region.zoneName,
            zoneName: region.zoneName,
            zoneId: region.zoneId,
            selected: region.isDefault
          })
        }
        return isUnique
      })
      return result
    },
    updateRegions (availableZones, id) {
      this.availableZoneList = availableZones
      this.selectedRegion = this.regionList.find(
        (region) => region.regionName === id
      )
      this.isOpenSelectedRegionList = true
    },
    async selectRegions (selectedRegions) {
      const zoneIds = [] // 내일 아침 확인해보기
      selectedRegions.forEach((t) => zoneIds.push(t.zoneId))
      if (zoneIds.length > 2) { return this.$alert(this.$v('가용 영역은 2개만 선택이 가능합니다')) }
      await this.updateDefaultRegions(zoneIds) // Default Zones 변경
    },
    async updateDefaultRegions (zoneIds) {
      const response = await API.aws.updateDefaultZones(zoneIds)
      if (response?.status === 200) {
        await this.$alert(this.$v('가용 영역이 변경되었습니다'))
        await this.setRegionList() // 재호출
      } else {
        await this.$alert(this.$v('에러가 발생했습니다'))
      }
    },
    resetSelectedRegions () {
      this.isOpenSelectedRegionList = false
    },

    saveRegions (newRegionLust) {
      const result = []
      newRegionLust.forEach(region => {
        result.push(region.regionName)
      })
      console.log('@SAVED__REGIONS', result)
      this.setRegionOrder(result)
    },
    async setRegionOrder (regionOrderList) {
      const res = await API.aws.setRegionOrder(regionOrderList)
      if (res.status === 200) {
        this.isOpenRegionList = false
        this.setRegionList() // 우선 순위 변경 후 리전 재호출;
      }
    }
    // getRegionIndex (regionList) {
    //   regionList.map((region, index) => {
    //     region.index = index + 1
    //   })
    // }
  },
  data () {
    return {
      isLoading: false,
      selectedRegion: undefined,
      isOpenSelectedRegionList: false,
      isOpenRegionList: false,
      availableRegionList: [],
      availableZoneList: [],
      regionList: []
    }
  }
}
</script>

<style lang="scss" scoped>
.empty-data {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #64676b;
  padding: 80px 0;
}
.region-availability-zone {
  .card-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    box-sizing: border-box;
  }

  .select-list-modal-header {
    height: 42px;
    line-height: 42px;
    text-align: center;
    background: #2a2d44;
  }
}
</style>
