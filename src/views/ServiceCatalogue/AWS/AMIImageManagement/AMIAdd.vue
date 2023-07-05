<!-- S/W 라이선스 추가 모달 -->
<template>
  <el-dialog
    :visible="active"
    :title="$t('service.AMIImage.BTN.registerAMI')"
    width="850px"
    top="50px"
    @close="!loading ? $emit('close') : null"
    style="overflow-y: scroll;"
  >
    <div
      class="ami-modal-wrapper"
      v-loading="loading"
    >
      <div class="ami-os filter-wrapper flex-wrap -space-between">
        <div class="filtering-list">
          <span class="filter-name">
            <!-- 리전 -->
            {{ $t('service.AMIImage.BTN.region') }}
            <i class="required">*</i>
          </span>
          <div class="filter-options">
            <el-select
              v-model="region"
              :placeholder="$t('service.AMIImage.BTN.region')"
              @change="changeRegion"
              popper-class="width-160"
              :popper-append-to-body="false"
            >
              <el-option
                v-for="item in regionOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
        </div>
        <!-- /. 리전 선택 -->

        <div class="input-option flex-wrap -space-between">
          <div class="filter-options width-160">
            <el-select
              :placeholder="$t('service.INSTALL.COL.all')"
              v-model="searchType"
            >
              <el-option
                v-for="item in searchOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
          <!-- /. 옵션 선택 -->

          <search-bar
            ref="search"
            class="input"
            :placeholder="$t('service.AMIImage.PLACEHOLDER.006')"
            full-width
            @change="changeSearchText"
            @refresh="refreshSearchText"
          />
          <!-- /. AMI 검색창 -->
        </div>
      </div>

      <div class="ami-os flex-wrap">
        <div class="filter-wrapper flex-wrap -space-between">
          <div class="filtering-list">
            <span class="filter-name -os">
              <!-- AMI 운영체제 -->
              {{ $t('service.AMIImage.BTN.AMIOS') }}
              <i class="required">*</i>
            </span>
            <div class="filter-options width-220">
              <el-select
                v-model="amiOS"
                popper-class="width-220"
                :placeholder="$t('service.AMIImage.PLACEHOLDER.007')"
                :popper-append-to-body="false"
                @change="changeAmiOS"
              >
                <el-option
                  v-for="item in amiOSOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </div>
          </div>
          <!-- /. 리전 선택 -->
        </div>
      </div>

      <article :class="['ami-list', { 'border' : !amiImages.length }]">
        <ami-ticket
          v-if="amiImages.length"
          :region="region"
          :data="amiImages"
          is-ext
          @selected-image="selectedImage"
        />

        <span
          v-else
          class="-empty"
        >
          <!-- 리전을 선택하여 주세요. -->
          {{ $t('service.AMIImage.PLACEHOLDER.011') }}
        </span>
      </article>

      <section class="modal-button-area">
        <button
          class="button"
          type="is-anti"
          @click="$emit('close')"
        >
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          class="button"
          type="is-primary"
          :disabled="amiImage === null || amiOS === undefined"
          @click="applyImage"
        >
          <!-- AMI 이미지 등록 -->
          {{ $t('service.AMIImage.BTN.registerAMIImage') }}
        </button>
      </section>
      <!-- /. AMI 이미지 등록 -->
    </div>
  </el-dialog>
</template>

<script>
import AMITicket from './AMITicket'
import SearchBar from '@/components/SearchBar/SearchBar'
import API from '@sd-fe/cmp-core'

export default {
  name: 'AMIAdd',
  components: {
    'search-bar': SearchBar,
    'ami-ticket': AMITicket
  },
  props: {
    active: {
      type: Boolean,
      required: true
    },
    regionOptions: {
      type: Array,
      default: () => []
    }
  },
  watch: {
    active (status) {
      if (status === false) return this.closeSetting()
    }
  },
  methods: {
    /**
     * AMI 전체 목록 가져오기
     * @param {String} params 기타 파라미터
     */
    async getAMIImages (params) {
      try {
        this.loading = true
        this.amiImage = null
        this.amiImages = []
        const { data } = await API.aws.getAMIImages(params)
        this.amiImages = [...data]
      } catch (error) {
        console.error('@@ getAMIImages : ', error)
        this.amiImages = []
        throw error
      } finally {
        this.loading = false
      }
    },
    /**
     * [리전] 변경이벤트
     * @param {String} region 리전
     */
    changeRegion (region) {
      this.region = region
      this.amiImage = null
      this.amiOS = undefined
      this.$refs.search.refresh()
    },
    /**
     * [AMI 검색창] 변경이벤트
     * @param {String} value
     */
    changeSearchText (value) {
      if (this.region === undefined) return

      const param = { regionName: this.region }
      if (value) {
        this.searchText = value
        param[this.searchType] = value // 전체/ID/명 설정해서 입력
      }
      if (this.amiOS) param.os = this.amiOS // AMI 운영체제
      if (value) this.getAMIImages(param)
    },
    /**
     * 관련된 모든 데이터를 리셋합니다.
     */
    refreshSearchText () {
      if (this.region === undefined) return

      this.searchText = undefined
      this.searchType = 'totalKeyword'
      this.amiImages = []
    },
    changeAmiOS (os) {
      if (this.region === undefined) return

      const param = { regionName: this.region, os }
      if (this.searchText) param[this.searchType] = this.searchText // 전체/ID/명 설정해서 입력
      this.getAMIImages(param)
    },
    /**
     * [AMI 등록] 창을 닫을때 모두 리셋합니다.
     */
    closeSetting () {
      this.region = undefined
      this.searchType = 'totalKeyword'
      this.amiImages = []
      this.amiImage = null
      this.amiOS = undefined
    },
    /**
     * Image 선택
     */
    selectedImage (image) {
      this.amiImage = { ...image }
    },
    /**
     * [AMI 이미지 등록] 등록
     */
    applyImage () {
      this.$emit('apply-image', { image: this.amiImage, region: this.region })
    }
  },
  data () {
    return {
      loading: false,
      region: undefined,
      searchText: undefined,
      searchType: 'totalKeyword',
      amiImages: [],
      searchOptions: [
        { label: this.$t('service.INSTALL.COL.all'), value: 'totalKeyword' }, // 전체
        { label: 'AMI ID', value: 'imageId' }, // AMI ID
        { label: this.$t('service.AMIImage.BTN.AMIName'), value: 'name' } // AMI 명
      ],
      amiOS: undefined,
      amiOSOptions: [
        { label: 'Amazon Linux', value: 'AMAZON_LINUX' },
        { label: 'Cent OS', value: 'CENT_OS' },
        { label: 'Debian', value: 'DEBIAN' },
        { label: 'Fedora', value: 'FEDORA' },
        { label: 'Gentoo', value: 'GENTOO' },
        { label: 'openSUSE', value: 'OPEN_SUSE' },
        { label: 'Red Hat', value: 'RED_HAT' },
        { label: 'SUSE Linux', value: 'SUSE_LINUX' },
        { label: 'Windows', value: 'WINDOWS' },
        { label: 'macOS', value: 'MAC_OS' },
        { label: 'Ubuntu', value: 'UBUNTU' }
      ],
      amiImage: null
    }
  }
}
</script>

<style lang="scss" scoped>
.ami-modal-wrapper {
  .input-option {
    width: 435px;
    .input {
      flex: 1 1 100%;
      margin-left: 20px;
    }
  }

  .ami-list {
    width: 790px;
    height: 600px;
    margin-top: 20px;
    margin-bottom: $gap;
    position: relative;

    .ami-items {
      position: absolute;
      width: 795px;
      height: inherit;
      overflow-y: auto;
      padding-right: 5px;
    }
  }

  .ami-os {
    margin-top: 20px;
    .filter-name {
      display: flex;
    }

    .required {
      font-style: normal;
      color: $main-red;
      display: block;
      margin-left: 3px;
      margin-top: -1px;
    }
  }

  .border {
    border: 1px solid $purple-gray;
    border-radius: 6px;
    .-empty {
      color: $input-placeholder;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }
  }
}
</style>

<style lang="scss">
.ami-modal-wrapper {
  .filter-wrapper {
    .width-160 .el-select {
      .el-input { width: 160px; }
      .el-select-dropdown.el-popper.width-160 { min-width: 160px !important; }
    }
    .width-full .el-select .el-input {
      width: 100%;
    }
    .width-220 .el-select {
      .el-input { width: 220px; }
      .el-select-dropdown.el-popper.width-220 { min-width: 220px !important; }
    }
  }
}
</style>
