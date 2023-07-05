<template>
  <div class="ami-image-management">
    <div class="header">
      <el-select
        v-model="region"
        :placeholder="$t('service.AMIImage.PLACEHOLDER.001')"
        class="region-selection"
        @change="changeRegion"
      >
        <el-option
          v-for="item in regionOption"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>
    <!-- /. 리전 선택 -->

    <section class="wrapper">
      <article
        class="-left"
        v-loading="imagesLoading"
      >
        <div class="-options">
          <div class="search-options">
            <div class="selections">
              <el-select
                v-model="searchType"
                :placeholder="$t('service.AMIImage.PLACEHOLDER.002')"
                class="region"
                :popper-append-to-body="false"
              >
                <el-option
                  v-for="item in searchOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <!-- /. AMI 타입 -->

              <search-bar
                ref="search"
                class="input"
                full-width
                :placeholder="$t('service.AMIImage.PLACEHOLDER.003')"
                @change="changeSearchText"
                @refresh="refreshSearchText"
              />
            <!-- /. 검색창 -->
            </div>

            <el-checkbox
              class="using-ami"
              v-model="isShownUser"
              @change="changeSearchText(searchText)"
            >
              <!-- 사용중인 AMI -->
              {{ $t('service.AMIImage.BTN.usingAMI') }}
            </el-checkbox>
            <!-- /. 사용중인 AMI 체크박스 -->
          </div>

          <button
            class="button"
            type="is-primary"
            @click="addAMIModal = true"
          >
            <!-- AMI 이미지 등록 -->
            {{ $t('service.AMIImage.BTN.registerAMIImage') }}
          </button>
          <!-- /. AMI 이미지 등록 -->
        </div>
        <!-- /. AMI Image 가 있을 때 -->

        <div :class="['reg-ami-images', { 'border' : !amiImages.length || !region }, { '-unoverflow': amiImages.length < 4 }]">
          <ami-ticket
            v-if="amiImages.length && region"
            :region="region"
            :data="amiImages"
            @selected-image="image => selectedAMI = image"
            @set-bastion="setAmiBastion"
          />
          <span
            v-if="!amiImages.length || !region"
            class="-empty"
          >
            <!-- 등록된 AMI 이미지가 없습니다. -->
            {{ $t('service.AMIImage.PLACEHOLDER.004') }}
          </span>
        </div>
        <!-- /. AMI Image 가 없을 때 || 리전을 선택하지 않았을때 -->
      </article>
      <!-- /. 좌측 - AMI 이미지 목록 -->

      <article
        :class="['script-area', { 'border': !selectedAMI }]"
        v-loading="scriptLoading"
      >
        <script-detail
          v-if="selectedAMI !== null"
          :image="selectedAMI"
          @refresh="refreshImages"
        />
        <span
          v-else
          class="-empty"
        >
          <!-- AMI 이미지를 선택하여 주세요. -->
          {{ $t('service.AMIImage.PLACEHOLDER.005') }}
        </span>
      </article>
      <!-- /. 우측 - AMI Script 정보 -->
    </section>
    <!-- /. AMI 목록 영역 -->

    <ami-add
      :active="addAMIModal"
      :region-options="regionOption"
      @apply-image="addAMIImage"
      @close="addAMIModal = false"
    />
    <!-- /. AMI 이미지 등록 모달 -->

    <ami-bastion-instance-setting
      :active="bastionData.view"
      :region="region"
      :image="bastionData.image"
      @close="setAmiBastion(undefined, false)"
      @save="() => setRegisteredAMIImages({ regionName: region })"
    />
    <!-- /. Bastion 이미지 등록 모달 -->
  </div>
</template>

<script>
import SearchBar from '@/components/SearchBar/SearchBar'
import AMIAdd from './AMIAdd'
import AMITicket from './AMITicket'
import AMIBastionInstanceSetting from './AMIBastionInstanceSetting'
import ScriptDetail from './ScriptDetail/ScriptDetail'
import API from '@sd-fe/cmp-core'

export default {
  name: 'AMIImageManagement',
  components: {
    'search-bar': SearchBar,
    'ami-add': AMIAdd,
    'ami-ticket': AMITicket,
    'ami-bastion-instance-setting': AMIBastionInstanceSetting,
    'script-detail': ScriptDetail
  },
  created () {
    this.getRegionsPriorities()
  },
  methods: {
    /**
     * [리전 목록] 소환
     */
    async getRegionsPriorities () {
      try {
        this.imagesLoading = true
        const { data } = await API.aws.getRegionsPriorities()
        this.regionOption = data.map(({ displayName, regionName }) => ({ label: displayName, value: regionName }))

        // 기본 페이지 로드시 0번째 리전 선택
        this.region = this.regionOption[0].value
        this.changeRegion(this.region)
      } catch (error) {
        console.error('@@ getRegionsPriorities : ', error)
        this.regionOption = []
        throw error
      } finally {
        this.imagesLoading = true
      }
    },
    /**
     * [리전] 변경 이벤트
     */
    changeRegion (region) {
      this.searchType = 'totalKeyword'
      this.selectedAMI = null
      this.$refs.search.refresh()
    },
    /**
     * [AMI 검색창] 변경이벤트
     * @param {String} value
     */
    changeSearchText (value) {
      if (this.region === undefined) return
      this.searchText = value

      const param = { regionName: this.region }
      if (value) param[this.searchType] = value // 전체/ID/명 설정해서 입력
      if (this.isShownUser === true) param.isShownUser = true // [사용중인 AMI 설정]
      this.setRegisteredAMIImages(param)
    },
    /**
     * [AMI 검색창] refresh 이벤트
     * @param {String} value
     */
    refreshSearchText (value) {
      if (this.region === undefined) return

      this.isShownUser = false
      this.searchText = undefined
      this.searchType = 'totalKeyword'
      this.setRegisteredAMIImages({ regionName: this.region })
    },
    /**
     * [AMI 이미지 목록] 불러오기
     * @param {Object} payload { regionName, totalKeyword(전체) || imageIdx(AMI ID) || name(AMI 명) }
     */
    async getRegisteredAMIImages (payload) {
      try {
        this.imagesLoading = true
        const { data } = await API.aws.getRegisteredAMIImages(payload)
        return data
      } catch (error) {
        console.error('@@ getRegisteredAMIImages : ', error)
        this.$alert(this.$t('service.AMIImage.ALERT.001')) // 등록된 AMI 이미지를 가져오는데 문제가 발생했습니다. 다시 시도해주세요.
        throw error
      } finally {
        this.imagesLoading = false
      }
    },
    /**
     * [AMI 이미지 목록] 불러오기 + 데이터를 저장 (API 호출 / 데이터 저장을 분리했음)
     * @param {Object} payload { regionName, totalKeyword(전체) || imageIdx(AMI ID) || name(AMI 명) }
     */
    async setRegisteredAMIImages (payload) {
      const data = await this.getRegisteredAMIImages(payload)
      this.amiImages = []
      this.amiImages = [...data]

      this.selectedAMI = null
    },
    /**
     * [AMI 이미지 등록] 적용
     * @param { Object } image { image, owner, region } 정보
     */
    async addAMIImage ({ image, owner, region }) {
      try {
        const { architecture, description, enaSupport, hypervisor, imageId, imageLocation, imageOwnerAlias, imageType, name, platformDetails, rootDeviceName, rootDeviceType, state, virtualizationType } = image
        const payload = {
          architecture,
          description,
          enaSupport,
          hypervisor,
          imageId,
          imageLocation,
          imageOwnerAlias,
          imageType,
          isPublic: image.public,
          name,
          platformDetail: platformDetails,
          regionName: region,
          rootDeviceName,
          rootDeviceType,
          state,
          virtualizationType
        }

        const { data } = await API.aws.addAMIImage(payload)
        if (data) {
          this.addAMIModal = false // 모달 닫기
          // 현재 보고있는 리전과 똑같은 리전 선택한 경우에는 해당 리전의 등록된 이미지 목록 다시 불러오기
          if (this.region === region) await this.changeRegion(this.region)
        }
      } catch (error) {
        const message = {
          'Not exist Amazon Image': this.$t('service.AMIImage.ALERT.014'), // 존재하지않는 이미지입니다.
          'Already exist Amazon Image': this.$t('service.AMIImage.ALERT.015') // 이미 존재하는 이미지입니다.
        }[error.response.data.message]

        this.$alert(message, '', { callback: () => false })
        console.error(error)
      }
    },
    /**
     * Init Script 를 적용했을 때, 이미지를 전체적으로 다시 호출하는게 아니라, 필요한 부분만 저장합니다
     */
    async refreshImages () {
      const data = await this.getRegisteredAMIImages({ regionName: this.region })

      data.forEach((item, idx) => {
        // 데이터 전체를 변경하는게 아니라, 특정 내용만 변경함 (전체 변경하면 오래걸림 + 이미지의 1번째로 올라가버려서)
        if (this.selectedAMI.imageId === item.imageId) {
          this.amiImages[idx].amiScriptHistoryIdx = item.amiScriptHistoryIdx
          this.selectedAMI.amiScriptHistoryIdx = item.amiScriptHistoryIdx
        }
      })
    },
    /**
     * Bastion 이미지 설정을 위한 Instance 설정 모달 제어
     */
    setAmiBastion (image, view = true) {
      this.bastionData = { view, image }
    }
  },
  data () {
    return {
      imagesLoading: false,
      scriptLoading: false,
      region: undefined,
      searchType: 'totalKeyword',
      regionOption: [],
      amiImages: [],
      selectedAMI: null,
      searchText: undefined,
      isShownUser: false,
      searchOptions: [
        { label: this.$t('service.INSTALL.COL.all'), value: 'totalKeyword' }, // 전체
        { label: 'AMI ID', value: 'imageId' }, // AMI ID
        { label: this.$t('service.AMIImage.BTN.AMIName'), value: 'name' } // AMI 명
      ],
      addAMIModal: false,
      bastionData: { view: false, imageId: undefined }
    }
  }
}
</script>

<style lang="scss" scoped>
.ami-image-management {
  .header {
    margin-bottom: 35px;
    .region-selection { width: 200px; }
  }

  .wrapper {
    box-sizing: border-box;
    display: grid;
    grid-template-columns: 800px 780px;
    column-gap: 20px;

    .-options {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-right: 15px;

      .search-options {
        flex: 0 0 530px;
        display: flex;
        align-items: center;
        justify-content: space-between;

        .selections {
          display: flex;
          align-items: center;
          flex: 0 0 405px;

          .region {
            flex: 0 0 100px;
            margin-right: 10px;
          }
          .input {
            width: 100%;
          }
        }
      }

      > button { width: 140px; }
    }

    .reg-ami-images {
      margin-top: 15px;
      // height: calc(100% - 45px);
      height: 655px;
      overflow-y: auto;
      padding-right: 10px;

      &.-unoverflow { padding-right: 15px; }
    }

    .script-area {
      height: 100%;
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
        padding: 0;
      }
      &.-unoverflow { width: 768px; }
    }
  }
}
</style>

<style lang="scss">
.ami-image-management {

  // 필터 영역
  .filter-wrapper {
    // border: 1px solid pink;
    height: 33px;
    display: flex;
    align-items: center;

    .filter-name {
      font-weight: 300;
      font-size: 13px;
      line-height: 15px;
      display: block;
      white-space: nowrap;
      margin-right: 10px;
    }

    .filtering-list {
      display: flex;
      align-items: center;
      margin-right: $gap-m;

      > .filter-options {
        width: 200px;
        > .el-select {
          min-width: 200px;
        }
      }
    }

    // select 박스
    .el-select {
      // width: 140px;
      .el-input {
        .el-input__inner {
          border-radius: 0;
          border: none;
          border-bottom: 1px solid $input-stroke;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
      }
    }
  }

  .region-selection {
    height: 50px;

    .el-input__inner {
      font-weight: bold;
      line-height: 50px;
      height: 50px;
      font-weight: 600;
    }

    .el-input.el-input--suffix .el-select__caret.el-input__icon {
      height: 50px;
      margin-right: 5px;
      &:before { font-weight: bold; }
    }
  }

  .using-ami {
    .el-checkbox__label {
      padding-left: 10px;
      color: $input-placeholder;
      font-size: 13px;
    }
  }

  .search-options {
    .region .el-input {
      .is-focus {
        border: none;
      }
      .el-input__inner {
        border: none;
        border-bottom: 1px solid $gray;
        border-radius: 3px 3px 0 0;
        &:focus {
          border: none;
          border-bottom: 1px solid $gray;
        }
      }
    }

    .el-select-dropdown {
      border-radius: 0 0 3px 3px;
      border: 1px solid $white;
      overflow: hidden;
      margin: 0;
    }
    .el-select-dropdown__wrap {
      border-top: 1px solid #d9d9d9;
    }
  }
}
</style>
