<template>
  <el-dialog
    title="DB Engine"
    :visible="active"
    width="1200px"
    @close="$emit('close')"
  >
    <filtering-component>
      <div class="filtering-list">
        <span class="filter-name">{{ $v('DB Engine 명') }}</span>
        <div class="filter-options">
          <search-component
            v-model="filterName"
            :placeholder="$v('DB Engine명 검색')"
            :use-reset-btn="false"
            @input="inputChange"
          />
        </div>
      </div>
    </filtering-component>

    <section
      class="db-engine-wrapper"
      v-loading="loading"
    >
      <total-count :total-count="gridData.length" />
      <cmp-grid
        :item-source="gridData"
        :columns="columns"
        :use-column-filter="false"
        :init-auto-select-row="data ? data : null"
        init-auto-select-row-key="engineType"
        keep-select
        selectable
        @selectedRow="setSelectedRow"
      />
      <!-- /. DB Engine 목록 -->
    </section>

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
import API, { FilteringComponent } from '@sd-fe/cmp-core'
import { mapState } from 'vuex'
import { cloneDeep } from 'lodash'

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
    'filtering-component': FilteringComponent
  },
  watch: {
    active (active) {
      if (active) this.init()
      else this.filterName = undefined
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  created () {
  },
  methods: {
    async init () {
      this.selectedRow = null

      await this.getUserProfiles()
      await this.getEngineType()
    },

    /**
     * Profile 목록 가져오기
     */
    async getUserProfiles () {
      try {
        this.loading = true

        // 유저 Profile 조회
        const response = await API.database.getUserProfiles()
        if (!Object.keys(response).length) return

        if (response?.SOFTWARE) {
          this.engineTypes = {}

          for (const { userProfMap } of response.SOFTWARE) {
            const { engineType } = userProfMap
            this.engineTypes[engineType] = userProfMap
          }
        }
      } catch (error) {
        console.error('@@ ResourceInfo > getSpec', error)
      } finally {
        this.loading = false
      }
    },

    /**
    * Database Engine 목록 세팅
    */
    async getEngineType () {
      try {
        this.loading = true
        this.rawData = []

        const response = await API.database.getEngineType()

        for (const engine of response) {
          const { displayName } = engine

          // 필터 옵션 설정
          // this.options.push({ label: displayName, value: engine.key })

          // 테이블 데이터 세팅 시작
          if (!this.engineTypes[engine.key]) continue
          const { engineVersion, osVendor, osVersion, osPlatform } = this.engineTypes[engine.key]

          // console.log(engine)
          // console.log(this.engineTypes[engine.key])
          const data = {
            displayName,
            engineVersion,
            osVendor,
            osVersion,
            osPlatform,
            engineType: engine.key
            // engineInfo: `${engine.key}/${engineVersion}/${topology}`
          }

          this.rawData.push(data)
        }

        // console.log(this.rawData)
        this.gridData = cloneDeep(this.rawData)
      } catch (error) {
        console.error('DB Engine 조회에 문제가 발생했습니다.: ', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * Engine 검색시 발생하는 이벤트
     * @param {String} text
     */
    inputChange (text) {
      const regex = new RegExp(text, 'gi')
      this.gridData = this.rawData.filter(({ displayName }) => regex.test(displayName))
    },

    /**
     * 선택된 DB Engine 저장
     */
    setSelectedRow ({ dataItem }) {
      this.selectedRow = dataItem
    },

    /**
     * [확인] 클릭 시 저장
     */
    save () {
      const validator = [
        { condition: !!this.selectedRow, message: this.$v('DB Engine 을 선택해주세요.') }
      ]

      const validation = validator.every(({ condition, message }) => {
        if (!condition) this.$alert(message)
        return condition
      })

      if (!validation) return

      this.$emit('save', this.selectedRow)
      this.$emit('close')
    }
  },
  data: () => ({
    loading: false,
    engineTypes: {},
    selectedDBEngine: undefined,
    selectedRow: null,
    filterName: undefined,
    // options: [], // 필터 옵션
    columns: [
      { header: '이름', binding: 'displayName' },
      { header: 'DB Version', binding: 'engineVersion' },
      { header: 'OS Vendor', binding: 'osVendor' },
      { header: 'OS Version', binding: 'osVersion' },
      { header: 'OS Bit', binding: 'osPlatform' }
    ],
    rawData: [],
    gridData: []
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
