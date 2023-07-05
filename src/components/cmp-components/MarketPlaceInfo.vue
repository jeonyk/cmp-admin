<!--
  * 파일명 : MarketPlaceInfo.vue
  * 파일 기능 : 서비스 카탈로그 > 마켓플레이스 상세 상단: 제품 정보, 편집 기능 (서비스타입 / S/W라이선스 / 상세설명)
  * 작성자 : 김예담 외 3명
  * 최종 작성일 : 2021-02-26
  * License By Shinsegae I&C
  * 2021-02-26 fix: 네트워크 - 편집 가능 그리드 버그 픽스
 -->

<template>
  <article class="marketplace-info-arti">
    <div
      class="-user-regist"
      v-if="mpDetailData && mpDetailData[infoKey] && mpDetailData[infoKey].iconImage &&
        mpDetailData[infoKey].category &&
        mpDetailData[infoKey].summary &&
        mpDetailData.bpImg.osName &&
        (isOva ? true : swLicense && swLicense.length) &&
        (isOva ? mpDetailData[infoKey].osType : true) &&
        (isOva ? mpDetailData[infoKey].osName : true) &&
        (isOva ? mpDetailData[infoKey].osBit : true)"
    >
      <span style="margin-right: 10px;">{{ $t('service.portal') }}</span>
      <el-switch
        v-model="isPub"
        @change="registerBp(!isPub)"
      />
    </div>
    <div
      class="-user-regist -empty-info"
      v-else
    >
      <i class="mdi mdi-information-outline" />
      <span style="margin-left: 10px;">{{ $t('service.requireRegister') }}</span>
    </div>
    <el-upload
      class="server-image"
      action=""
      accept="image/jpeg, image/png, image/jpg"
      :show-file-list="false"
      :auto-upload="false"
      :multiple="false"
      :on-change="getFile"
    >
      <span
        v-if="!mpDetailData[infoKey] || !mpDetailData[infoKey].iconImage"
        class="no-img"
        style="width: 100px; height: 100px;"
      >
        <i class="add-icon -image" />
      </span>
      <span
        class="server-img"
        v-else
      >
        <img
          :width="100"
          height="auto"
          :src="mpDetailData[infoKey].iconImage"
        >
      </span>
    </el-upload>
    <!-- 좌측 이미지 -->

    <section class="list-info">
      <dt class="-sv-name">
        <el-select
          class="category-select"
          v-model="selectedCate"
          placeholder="선택"
          :popper-append-to-body="false"
          @change="selectCate"
          popper-class="category-select-popper"
        >
          <el-option
            v-for="cate in categoryOptions"
            :key="cate.codeIdx"
            :label="cate.codeVal"
            :value="cate.codeVal"
          />
        </el-select>
        <el-select
          v-if="isOva"
          key="os-select"
          class="category-select"
          v-model="selectedOS"
          placeholder="선택"
          :popper-append-to-body="false"
          @change="selectOS"
          popper-class="category-select-popper"
        >
          <el-option
            v-for="os in osOptions"
            :key="os.label"
            :label="os.value"
            :value="os.value"
          />
        </el-select>
        <span style="margin-left: 10px;">
          {{ isOva ? mpDetailData.name : mpDetailData.bpName }}
        </span>
      </dt>

      <div class="-sv-detail">
        <span v-if="!isOva && mpDetailData.pgVersion">
          <b>Version</b>
          {{ mpDetailData.pgVersion }}
          <small v-if="mpDetailData.createTime">&nbsp;({{ mpDetailData.createTime | date }})</small>
        </span>
        <span>
          <b>{{ $v('이미지') + ' (OS)' }}</b>
          <!--
          {{ !isOva ? mpDetailData.osInfo : mpDetailData[infoKey].osType }} -->
        </span>
        <section class="detail-contents">
          <dashboard-panel
            style="background-color: #070a20;"
            :padding-top="0"
          >
            <template>
              <div
                v-if="mpDetailData.osInfo"
                class="flex-wrap after-data os-wrap"
              >
                <set-os-icon :os-name="mpDetailData.osInfo" />
                <span v-if="mpDetailData.osInfo">{{ mpDetailData.osInfo }}</span>
              </div>
              <span
                v-else
                class="empty-content"
              >-</span>
              <div class="os-list-wrap">
                <register-contents
                  title="OS Bit"
                  :title-width-px="100"
                >
                  <div
                    v-if="mpDetailData.bpImg.osBit"
                    class="flex-wrap after-data"
                  >
                    <span v-if="mpDetailData.bpImg.osBit">{{ mpDetailData.bpImg.osBit }}</span>
                  </div>
                  <span
                    v-else
                    class="empty-content"
                  >-</span>
                </register-contents>
                <register-contents
                  title="OS Type"
                  :title-width-px="100"
                >
                  <div
                    v-if="mpDetailData.osType"
                    class="flex-wrap after-data"
                  >
                    <span v-if="mpDetailData.osType">{{ mpDetailData.osType }}</span>
                  </div>
                  <span
                    v-else
                    class="empty-content"
                  >-</span>
                </register-contents>
              </div>
            </template>
          </dashboard-panel>
        </section>

        <div
          v-if="!mpDetailData.bpImg.osName"
          class="no-register-image"
        >
          * {{ mpDetailData.bpImg.imageName }}은 CMP 미등록 이미지입니다. <router-link :to="{ name: 'nutanix-central'}">
            이미지 등록
          </router-link> 후 사용 가능합니다.
        </div>

        <span
          v-if="isOva"
          @click="() => activeOsNameModal = true"
          style="cursor: pointer;"
        >
          <b>OS Name</b>
          <template v-if="mpDetailData[infoKey].osName">
            {{ mpDetailData[infoKey].osName }}
          </template>
          <template v-else>
            <i
              class="mdi mdi-pencil"
              style="display: inline-block; margin-left: 5px;"
            />
          </template>
        </span>
        <small
          v-if="isOva"
          style="margin-top: 5px;"
        >
          <b>OS Bit</b>
          <el-radio-group
            v-model="mpDetailData[infoKey].osBit"
            style="display: inline-flex; margin-left: 10px;"
            @change="$emit('update-blueprint-info', { ...mpDetailData.userInfo })"
          >
            <el-radio
              value="X64"
              label="X64"
            />
            <el-radio
              value="X86"
              label="X86"
            />
          </el-radio-group>
        </small>
        <div class="flex-wrap -sw-license">
          <b>{{ $t('service.sw') }}</b>
          <add-license-modal
            get-data-once
            ref="addLicenseModal"
            :data="swLicense"
            @save="onSaveLicense"
            @loaded="onLoadedLicense"
          />
          <!-- <button
            type="is-primary"
            class="button"
            @click="swLicenseModal = true"
            size="is-mini"
          >
            {{ $t('common.BTN.change') }}
          </button> -->
          <div class="flex-wrap sw-license-wrap">
            <el-tag
              v-for="item in selectedSwLicenseList"
              :key="item.swIdx"
              size="small"
              class="sw-license-tag"
            >
              <span v-if="item.version === null">{{ item.name }}</span>
              <span v-else> {{ item.name + ' (' + item.version + ')' }}</span>
            </el-tag>
          </div>
        </div>
      </div>
      <!-- /. -sv-detail :: 버전 / os 정보 -->

      <article
        :class="['-description', { '-editing': mpDescEditing || ((mpDetailData[infoKey] && mpDetailData[infoKey].summary)?mpDetailData[infoKey].summary:'') }]"
      >
        <div
          class="empty-description"
          v-if="(!mpDetailData[infoKey] || !mpDetailData[infoKey].summary) && !mpDescEditing"
          @click="changeDescEditMode"
        >
          <span>{{ $t('service.enterDetail') }}</span>
        </div>

        <div
          v-else
          class="desc-area"
        >
          <div class="text-area">
            <pre v-if="!mpDescEditing">{{ mpDetailData[infoKey].summary ? mpDetailData[infoKey].summary : '상세 설명을 입력해주세요.' }}</pre>
            <el-input
              v-else
              class="_textarea"
              type="textarea"
              :rows="3"
              resize="none"
              v-model="mpTempDesc"
              :placeholder="$t('service.enterDetail')"
            />
          </div>
          <!-- /. 개요 / textarea -->
          <div class="edit-handler-wrap">
            <i
              class="mdi mdi-pencil -edit"
              @click="mpDescEditing ? saveEditedDesc() : changeDescEditMode()"
            />
            <i
              v-if="mpDescEditing"
              class="mdi mdi-window-close -edit"
              @click="cancelDescEditMode"
            />
          </div>
          <!-- /. 수정 버튼들 -->
        </div>
      </article>
      <!-- /. 마켓플레이스 개요 -->
    </section>
    <!-- 디테일 -->
    <!-- <el-dialog
      :title="$t('service.selectSw')"
      :visible.sync="swLicenseModal"
      width="500px"
      top="15vh"
      @close="swLicenseModal = false"
    >
      <section class="modal-body">
        <div class="table-area">
          <cmp-grid
            :columns="swLicenseColumns"
            :item-source="swLicenseList"
            :init-custom-action="init"
            :header-checkbox="true"
            paging-type="list"
            :height="450"
            @checkedRowsData="setCheckedSwLicenseList"
            :init-auto-select-row="selectedSwLicenseList"
            init-auto-select-row-key="swIdx"
            :changing-page-reset="false"
          />
        </div>
      </section>

      <section class="modal-footer">
        <div class="modal-button-area">
          <button
            class="button -modal-button"
            type="is-anti"
            @click="cancelUpdateSwLicense"
          >
            {{ $t('common.BTN.cancel') }}
          </button>
          <button
            class="button -modal-button"
            @click="saveSwLicense"
            type="is-primary"
          >
            {{ $t('common.BTN.confirm') }}
          </button>
        </div>
      </section>
    </el-dialog> -->
    <!-- S/W 라이선스 -->
    <el-dialog
      :visible.sync="activeOsNameModal"
      title="OS Name 설정"
      @open="() => osName = mpDetailData[infoKey].osName"
      class="os-name-modal"
    >
      <register-contents
        title="OS Name"
        type="input"
        required
      >
        <el-input v-model="osName" />
      </register-contents>
      <section class="modal-button-area">
        <button
          class="button"
          type="is-anti"
          @click="() => {
            activeOsNameModal = false
            osName = ''
          }"
        >
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          class="button"
          type="is-primary"
          @click="closeOsNameModal"
        >
          {{ $t('common.BTN.modify') }}
        </button>
      </section>
    </el-dialog>
    <!-- OS Name (임시) -->
  </article>
</template>

<script>
import API, { SetOSIcon, AddLicenseModal, DashboardPanel } from '@sd-fe/cmp-core'
import { cloneDeep } from 'lodash'
// import axios from 'axios'

export default {
  name: 'MarketPlaceInfo',
  components: {
    AddLicenseModal,
    'set-os-icon': SetOSIcon,
    'dashboard-panel': DashboardPanel
  },
  props: {
    updateOnProp: {
      type: Function,
      required: true
    },
    data: {
      type: Object,
      default () {
        return {}
      }
    },
    // marektplace일 경우 true
    sbNetwork: {
      type: Boolean,
      default: true
    },
    isOva: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  watch: {
    data: {
      immediate: true,
      handler: 'initData'
    },
    isEmpty (newVal) {
      if (newVal) {
        // const payload = {
        //   bpIdx: this.mpDetailData.bpIdx,
        //   bpUuid: this.mpDetailData.bpUuid,
        //   bpName: this.mpDetailData.bpName,
        //   isPub: false,
        //   iconImage: this.mpDetailData.iconImage,
        //   summary: this.mpDetailData.summary,
        //   category: this.mpDetailData.category
        // }
        // this.$emit('update-blueprint-info', payload, true)
      }
    },
    swLicenseList (newVal) { return newVal },
    swLicenseModal (visible) {
      if (visible) {
        const itemSwIdxList = JSON.parse(this.data[this.infoKey].swIdxList) || []
        const itemPool = []

        itemSwIdxList.forEach(sw => {
          itemPool.push(this.swLicenseList.find(v => v.swIdx === sw))
        })

        this.checkedSwLicenseList = itemPool.map(item => {
          if (item) {
            item.checked = true
            return item
          }
        }).filter(t => t)
      } else {
        this.checkedSwLicenseList.forEach(item => (item.checked = false))
      }
    }
  },
  async created () {
    await this.initData()
    await this.getMktCategory()
    // await this.getSwLicenseList()
  },
  computed: {
    ttt () {
      return (this.isOva ? true : this.selectedSwLicenseList && this.selectedSwLicenseList.length) &&
        (this.isOva ? this.mpDetailData[this.infoKey].osType : true) &&
        (this.isOva ? this.mpDetailData[this.infoKey].osName : true) &&
        (this.isOva ? this.mpDetailData[this.infoKey].osBit : true)
    },
    isEmpty () {
      if (this.mpDetailData && this.mpDetailData[this.infoKey]?.iconImage && this.mpDetailData[this.infoKey]?.category && this.mpDetailData[this.infoKey]?.summary) return false
      else return true
    },
    infoKey () {
      return this.isOva ? 'userInfo' : 'bpInfo'
    },
    requestPayload () {
      return {
        ...this.mpDetailData[this.infoKey],
        ...(this.isOva && { osName: this.osName, osBit: this.osBit, osType: this.selectedOS })
      }
    }
  },
  methods: {
    onLoadedLicense (rows) {
      if (this.mappedLicense) return

      const swIdxs = this.swIdxLists
      const filtered = rows.filter(row => swIdxs.includes(row.swIdx))

      this.swLicense = filtered
      this.mappedLicense = true
      this.loadedLicense = rows
    },
    async onSaveLicense (license) {
      this.swLicense = license
      const payload = { ...this.mpDetailData[this.infoKey] }
      payload.displayName = this.$t('service.swLicenseList') // S/W 라이선스 리스트
      payload.swIdxList = JSON.stringify(this.swLicense.map(license => license.swIdx))
      await this.updateOnProp(payload)
    },
    closeOsNameModal () {
      if (this.osName !== this.mpDetailData[this.infoKey].osName) {
        this.mpDetailData[this.infoKey].osName = this.osName
        this.$emit('update-blueprint-info', { ...this.mpDetailData.userInfo })
      }
      this.osName = ''
      this.activeOsNameModal = false
    },
    selectOS () {
      this.$emit('update-blueprint-info', { ...this.mpDetailData.userInfo, osType: this.selectedOS })
    },
    async initData (newVal = this.data) {
      newVal = cloneDeep(newVal)
      this.mpDetailData = newVal

      /*
      const config = {
        url: process.env.VUE_APP_ZUUL_URL
      }
      await axios.get(config.url + '/api/cmp/v3/metering/sw', {}) */
      // const swLicenseList =
      // await this.getSwLicenseList()
      // console.log('const swLicenseList:', swLicenseList, this.infoKey, newVal[this.infoKey])
      if (this.infoKey && this.data && this.data[this.infoKey]) {
        this.selectedCate = newVal[this.infoKey]?.category ? newVal[this.infoKey].category : null
        this.selectedOS = newVal[this.infoKey]?.osType ? newVal[this.infoKey].osType : null
        this.mpTempDesc = newVal[this.infoKey]?.summary ? newVal[this.infoKey].summary : null
        this.isPub = newVal[this.infoKey]?.isPub ? newVal[this.infoKey].isPub : false
        this.swIdxLists = JSON.parse(this.data[this.infoKey].swIdxList) || []
        this.setCheckedSwLicense(newVal)
        if (this.isOva) {
          this.osName = newVal[this.infoKey]?.osName
          this.osBit = newVal[this.infoKey]?.osBit
        }
        if (this.mappedLicense && this.loadedLicense) {
          this.swLicense = this.loadedLicense.filter(row => this.swIdxLists.includes(row.swIdx))
        }
      }
    },
    setCheckedSwLicense () {
      const swIdxList = JSON.parse(this.mpDetailData[this.infoKey].swIdxList)
      // 배열에서 배열 찾기
      this.selectedSwLicenseList = swIdxList && swIdxList.length
        ? this.swLicenseList.filter(rawSw => swIdxList.findIndex(q => rawSw.swIdx === q) !== -1)
        : []
    },
    // category 모달 '확인' 버튼 클릭시
    saveCategory () {
      const payload = { ...this.mpDetailData[this.infoKey] }
      payload.category = this.selectedCate
      payload.displayName = this.$t('common.GRID.category') // 카테고리
      this.$emit('update-blueprint-info', payload)
    },
    // category 모달을 닫습니다
    closeCategorySettingModal () {
      this.mpCategoryModal = false
    },
    // MP 제품 개요 편집 취소시
    cancelDescEditMode () {
      this.mpTempDesc = this.mpDetailData[this.infoKey].summary
      this.mpDescEditing = false
    },
    // MP 제품 개요 편집 활성화시
    changeDescEditMode () {
      this.mpDescEditing = true
    },
    // MP 제품 개요 편집 저장시
    saveEditedDesc () {
      const payload = { ...this.mpDetailData[this.infoKey] }
      payload.summary = this.mpTempDesc ? this.mpTempDesc.trim() : ''
      payload.displayName = this.$t('service.product') // 제품 개요
      this.$emit('update-blueprint-info', payload)
      this.mpDescEditing = false
    },
    /**
     * 이미지 파일 선택 시 파일 정보 설정
     */
    getFile (file, fileList) {
      if (file.size > (1024 * 1024 * 20)) { // 20Mb 이하 파일만 업로드 가능
        return this.$alert(this.$t('common.ALERT.PROJECT.059', { size: '20Mb' }))
      } else {
        this.getBase64(file.raw).then(res => {
          const payload = { ...this.mpDetailData[this.infoKey] }
          payload.iconImage = res
          payload.displayName = this.$t('service.iconImage') // 아이콘 이미지
          this.$emit('update-blueprint-info', payload)
        }, rejected => {
          this.$alert(this.$t('common.ALERT.BASE.046'))
          console.error(rejected)
        })
      }
    },
    /**
     * 이미지 파일 -> Base64로
     */
    getBase64 (file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        let imgResult = ''
        reader.readAsDataURL(file)
        reader.onload = () => {
          imgResult = reader.result
        }
        reader.onerror = (err) => {
          reject(err)
        }
        reader.onloadend = () => {
          resolve(imgResult)
        }
      })
    },
    /**
     * 이미지 파일 -> URL로
     */
    toUrl (file) {
      if (file) {
        // Base64 decode
        this.examImage = window.URL.createObjectURL(file)
      }
    },
    async registerBp (state) {
      const alarmMsg = this.isPub
        ? this.$t('common.CONFIRM.SERVICE.001') // 사용자 화면에 등록하시겠습니까?
        : this.$t('common.CONFIRM.SERVICE.002') // 사용자 화면에서 등록 해제하시겠습니까?

      this.$confirm(alarmMsg, '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        const payload = { ...this.mpDetailData[this.infoKey] }
        payload.isPub = this.isPub
        payload.displayName = this.$t('service.expoPortal') // 사용자 포탈 노출 여부
        this.$emit('update-blueprint-info', payload)
      }).catch(() => { this.isPub = state })
    },
    async getMktCategory () {
      const response = await API.config.getCodeList({ codeType: 'MKT_CATEGORY' })
      this.categoryOptions = response
    },
    selectCate (item) {
      this.selectedCate = item
      this.saveCategory()
    },
    init (grid) {
      this.swGrid = grid
    },
    gridRefresh (grid) {
      const cv = grid.collectionView
      cv.refresh()
    },

    setCheckedSwLicenseList (checkedRows) {
      this.checkedSwLicenseList = checkedRows
    },
    cancelUpdateSwLicense () {
      this.swLicenseModal = false
    },
    saveSwLicense () {
      this.$confirm(this.$t('common.CONFIRM.SERVICE.005'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        const payload = { ...this.mpDetailData[this.infoKey] }
        payload.swIdxList = JSON.stringify(this.checkedSwLicenseList.map(sw => sw.swIdx))
        payload.displayName = this.$t('service.swLicenseList') // S/W 라이선스 리스트
        const temp = cloneDeep(this.selectedSwLicenseList)
        this.swLicenseList.forEach(sw => (sw.checked = false))
        try {
          await this.updateOnProp(payload)
          this.selectedSwLicenseList = cloneDeep(this.checkedSwLicenseList)
        } catch (error) {
          this.checkedSwLicenseList = temp
          this.selectedSwLicenseList = temp
        } finally {
          this.swLicenseModal = false
        }
      }).catch((error) => console.error(error))
    },
    async getSwLicenseList () {
      // if (this.loadingSw) return
      if (!this.installationSwLicenseList.length && !this.osSwLicenseList.length) {
        // 임시.... 리팩토링 필요
        this.loadingSw = true
        this.installationSwLicenseList = await API.config.getSwLicenseList({ category: 'installation', isDeleted: true })
        this.osSwLicenseList = await API.config.getSwLicenseList({ category: 'image', isDeleted: true })
        this.loadingSw = false
      }
      const installationSwLicenseList = this.installationSwLicenseList
      const osSwLicenseList = this.osSwLicenseList

      // S/W 라이선스 모두 합친 것
      const combined = installationSwLicenseList.concat(osSwLicenseList)
      // 삭제된 S/W 라이선스만
      const deleted = combined.filter(sw => sw.isDeleted)
      // 삭제된걸 [1, 2, 3] 꼴로
      const deletedSwIdxLists = deleted.map(sw => sw.swIdx)
      // 현재 마켓플레이스에서 삭제된 라이센스를 포함한 것
      if (this.swIdxLists) {
        const selectDeleted = this.swIdxLists.filter(sw => deletedSwIdxLists.includes(sw))
        // 삭제된 S/W 라이선스 인덱스로 실 객체를 찾음
        const deletedSw = selectDeleted.map(w => combined.find(s => s.swIdx === w))

        this.swLicenseList = combined.filter(sw => !sw.isDeleted).concat(deletedSw)
      } else {
        this.swLicenseList = installationSwLicenseList.concat(osSwLicenseList)
      }

      this.swLicenseList.sort((a, b) => b.swIdx - a.swIdx)
    }
  },
  data () {
    return {
      loadedLicense: [],
      mappedLicense: false,
      swLicense: [],
      activeOsNameModal: false,
      osName: null,
      osBit: null,
      loadingSw: false,
      installationSwLicenseList: [],
      osSwLicenseList: [],
      swIdxLists: [],
      isTemplate: false,
      bpDetail: {},
      isPub: false,
      imgResult: '',
      userPageRegist: false,
      mpDetailData: null,
      mpCategoryModal: false, // category를 추가하기 위한 모달을 띄울지 말지 설정합니다.
      selectedCate: undefined, // category를 저장할 임시 데이터 프로퍼티입니다.
      selectedOS: undefined,
      categoryOptions: [
        { label: 'WAS', value: 'A' },
        { label: 'WEB', value: 'B' },
        { label: 'DB', value: 'C' },
        { label: 'APP', value: 'D' }
      ],
      osOptions: [
        { label: 'WINDOWS', value: 'WINDOWS' },
        { label: 'LINUX', value: 'LINUX' },
        { label: 'UBUNTU', value: 'UBUNTU' }
      ],
      mpDescEditing: false, // 마켓플레이스의 개요를 수정할 것인지 말지 설정합니다.
      mpTempDesc: undefined,
      buttonLabel: '사용자 화면 등록',
      examImage: undefined,

      // S/W 라이선스
      selectedSwLicenseList: [],
      swLicenseModal: false,
      swLicenseColumns: [
        { header: '이름', binding: 'name', width: '*', customHtml: true, keyPath: 'common.REGCON.name' },
        { header: '버전', binding: 'version', width: '*', customHtml: true, keyPath: 'common.TERMS.version' },
        { header: 'OS', binding: 'osType', width: '*', customHtml: true }
      ],
      swGrid: undefined,
      checkedSwLicenseList: [],
      swLicenseList: []
    }
  }
}

</script>

<style lang="scss" scoped>
$select-size: 80px;

.os-name-modal {
  .register-contents {
    &::v-deep .contents-title {
      width: 70px;
      min-width: 70px;
    }
  }
}

.marketplace-info-arti {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: $gap-m ($gap * 2);
  background-color: $ticket-back-color;

  .-user-regist {
    position: absolute;
    top: $gap-m;
    right: $gap * 2;
    display: flex;
    align-items: center;
    &.-empty-info { color: $color-lightgrey;}
  }

  .-sw-license {
    align-items: flex-start;
    margin-top: $gap;
  }

  .server-image {
    display: flex;
    align-items: center;
    margin-right: 50px;
    width: 100px;
    height: 100px;
    .no-img {
      position: relative;
      display: inline-block;
      margin-left: $gap-s;
      width: 100px;
      height: 100px;
      border: 1px dotted #515458;
      border-radius: $radius-s;
    }
    .server-img {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100px;
      height: 100px;
      > img {
        display: block;
        margin: 0 auto;
      }
    }
  }

  .list-info {
    width: calc(100% - 150px);
    > .-sv-name {
      display: flex;
      align-items: center;
      > .category-tag {
        width: 56px;
        background-color: $black;
        color: $white;
      }

      >span {
        font-weight: 500;
        font-size: 18px;
      }
    }

    > .-sv-detail {
      line-height: 1.57;
      color: $text-color;
      padding: $gap 0;
      width: 100%;
      letter-spacing: -0.35px;
      > span { display: flex; align-items: center; }

      b {
        display: block;
        min-width: 90px;
      }
      small {
        font-size: 13px;
      }
      .-sw-license {
        align-items: center;
        .sw-license-wrap {
          flex-wrap: wrap;
          margin-left: $gap-s;
        }
      }
    }

    >.-description {
      // border-top: 1px solid $main-black;
      overflow: hidden;
      text-overflow: ellipsis;
      position: relative;
      font-size: 14px;
      line-height: 1.57;
      text-align: left;
      color: $input-placeholder;
      padding-top: calc(#{$gap} + 1px);
      &:before {
        content :'';
        position: absolute;
        top: 0;
        left: 0;
        width: 15px;
        height: 1px;
        background-color: #b3b3b3;
      }
      > .empty-description {
        padding: $gap-s;
        height: 35px;
        border: 1px solid $gray;
        border-radius: $radius-s;
        color: $input-placeholder;
      }
      > .desc-area {
        position: relative;
        padding-right: 50px;
        min-height: 25px;
        // min-height: 80px;
        > .text-area {
          > pre {
            white-space: pre-wrap;
          }
        }
        > .edit-handler-wrap {
          position: absolute;
          top: 0;
          right: 0;
          display: flex;
          align-items: flex-start;
        }
      }
    }
  }
  // .list-info

  .no-data-wrap {
    position: absolute;
    top: 0;
    left: 50%;
    display: flex;
    align-items: center;
    color: $color-lightgrey;
    transform: translate(-50%, -50%);
    z-index: 2;
    >span {
      &:hover {text-decoration: underline;}
    }
  }
  .add-icon {
    display: inline-block;
    width: 24px;
    height: 24px;
    background-position: center;
    background-size: contain;
    background-repeat: no-repeat;
    background-image: url('../../assets/images/icon-add-circle.svg');
    &.-image {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }

  .category-select {
    width: $select-size;
    margin-right: $gap-s;
    &::v-deep .el-select-dropdown {
      border: none;

      &__wrap {
        border-top: none !important;
      }
    }

    &::v-deep .el-input {
      > .el-input__inner {
        background-color: $white;
        color: $primary;

        &:focus {
          color: $primary !important;
        }
      }
      > .el-input__inner {
        padding: 5px $gap-s;
        min-width: 30px;
        width: $select-size;
        height: 22px;
        background-color: transparent;
        border: 1px solid $primary;
        border-radius: 11px;
        font-size: 12px;
        text-align: left;
        color: $primary;
      }
      > .el-input__suffix {
        display: flex;
        align-items: center;
        right: 0;
        height: 22px;
        color: $primary;
      }
    }
    &.-license {
      margin-left: $gap-s;
      width: 120px;
      > .el-input {
        > .el-input__inner {width: 120px;}
      }
    }
  }

  // 카테고리 모달
  &::v-deep .el-popper.category-select-popper {
    padding-top: 5px;
    width: $select-size;
    max-width: 106px;
    border-radius: $radius-m;
    background-color: transparent;
    > .el-scrollbar {
      width: $select-size;
      > .el-select-dropdown__wrap.el-scrollbar__wrap {
        padding: 0;
        .el-select-dropdown__list {
          padding: 5px 0;
          border-radius: 5px;
          > .el-select-dropdown__item {
            padding: 0 $gap-s;
            height: 20px;
            text-align: left;
            font-size: 12px;
            line-height: 20px;
          }
        }
      }
    }
    &.-license {
      width: 120px;
      > .el-scrollbar {
        width: 120px;
      }
    }
  }
}

.no-register-image {
  margin-top: $gap-s;
  color: $primary;
  font-weight: bold;

  a {
    color: $primary;
  }
}

</style>
