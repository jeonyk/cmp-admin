<template>
  <el-dialog
    :title="$v('설치프로그램')"
    :visible="active"
    width="1000px"
    @close="$emit('close')"
    v-loading="isGetInstallData"
  >
    <select-install-program-grid
      :item-source="displayInstallProgramList"
      :sync-data="checkInstallDataList"
      @change="setCheckedRow"
      ref="installProgramRef"
    />

    <div class="modal-button-area -center">
      <button
        class="button"
        @click="$emit('close')"
      >
        {{ $v('취소') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="save"
      >
        {{ $v('확인') }}
      </button>
    </div>
  </el-dialog>
</template>

<script>
import API, { SelectInstallProgramGrid } from '@sd-fe/cmp-core'
import { mapState } from 'vuex'
import { groupBy, uniqBy } from 'lodash'

export default {
  name: 'SetDBEngineModal',
  props: {
    active: { // 모달 on/off
      type: Boolean,
      default: false
    },
    data: { // 모달 데이터 (반드시 필요한 값들만 충족해도 됨)
      type: [Object, Array],
      default: () => []
    }
  },
  components: {
    'select-install-program-grid': SelectInstallProgramGrid
  },
  watch: {
    active (active) {
      if (active) this.init()
      else {
        this.displayInstallProgramList = []
        this.checkInstallDataList = []
      }
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  methods: {
    async init () {
      await this.getInstallProgramList()
      this.checkInstallDataList = this.data.installProgramList

      this.checkInstallDataList.forEach(pre => {
        this.osInstallProgramList.forEach(item => {
          if (pre.softwareId === item.softwareId) {
            item.selectedVersion = pre.versionId
            return false
          }
        })
      })
      this.displayInstallProgramList = uniqBy([...this.checkInstallDataList, ...this.osInstallProgramList], 'swIdx')

      this.$forceUpdate()
    },

    /**
     * >> Compute, MP, DB
     * [설치프로그램 목록] 호출
     */
    async getInstallProgramList () {
      try {
        this.isGetInstallData = true
        const response = await API.sw.getUsableInstallList({ onlyUsable: true })

        const mappedCustomIdData = response.map(item => ({
          ...item,
          customId: `${item.osSystem}-${item.osType}-${item.osVersion}-${item.bitType}`
        }))

        const { osSystem, osType, osVersion, osBit } = this.data

        const softwareList = groupBy(mappedCustomIdData, 'customId')
        const origin = {}

        for (const [key, value] of Object.entries(softwareList)) {
          const uniqBySwIdData = uniqBy(value, 'versionId')

          const installList = []

          const groupedById = groupBy(uniqBySwIdData, 'id')

          for (const [key, value] of Object.entries(groupedById)) {
            // 버전 옵션
            const versionOptions = value.map(version => ({
              versionId: version.versionId,
              versionName: version.version,
              swIdx: +key,
              swList: version.swList,
              installType: version.installType
            }))
            // S/W 정보
            const sw = value[0]

            const item = {
              softwareName: sw.name,
              softwareId: +key,

              osSystem: sw.osSystem,
              osType: sw.osType,
              osBit: sw.bitType,
              selectedVersion: sw.selectedVersion || versionOptions.length ? versionOptions[0].versionId : '',
              versionOptions
            }

            installList.push(item)
          }

          origin[key.toUpperCase()] = installList
        }

        const customId = `${osSystem}-${osType}-${osVersion}-${osBit}`
        this.osInstallProgramList = origin[customId.toUpperCase()] || []
        // this.displayInstallProgramList = origin.LINUX // 🌸 디버깅용
          ?.sort((a, b) => {
            if (a.checked > b.checked) return -1
            else if (a.checked < b.checked) return 1
            else return 0
          })
      } catch (error) {
        console.error('@@ ResourceInfo > getInstallProgramList', error)
      } finally {
        this.isGetInstallData = false
      }
    },

    /**
     * 설치프로그램 변경 이벤트
     * @param {Array} data 체크한 데이터
     */
    setCheckedRow (data) {
      this.checkedRows = data
    },

    /**
     * [확인] 클릭 시 저장
     */
    save () {
      this.$emit('save', this.checkedRows)
      this.$emit('close')
    }
  },
  data: () => ({
    checkInstallDataList: [],
    osInstallProgramList: [],
    displayInstallProgramList: undefined,
    checkedRows: [],
    isGetInstallData: false
  })
}
</script>

<style lang="scss" scoped>
.db-engine {
  &-wrapper {
    height: 570px;
  }

}
.modal-button-area {
  border-top: 1px solid $purple-gray;
  padding-top: $gap;
}
</style>
