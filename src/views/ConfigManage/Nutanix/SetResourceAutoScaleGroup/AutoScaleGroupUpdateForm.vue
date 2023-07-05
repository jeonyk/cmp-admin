<template>
  <div
    v-loading="modalLoading || loading.isGroupTree"
    class="auto-scale-group-update-form"
  >
    <vertical-table
      :data="data || {}"
      :columns="verticalTableColumns"
    >
      <template #projectInfo>
        <div class="flex-wrap">
          <button
            class="button"
            type="is-primary"
            @click="visibleProject = true"
            style="min-width: 140px;"
            ref="projectTrigger"
          >
            {{ asgInfo.projectInfo.company !== null ? $v('프로젝트 변경'):$v('프로젝트 선택') }}
          </button>
          <text-display
            v-if="asgInfo.projectInfo.company !== null"
            style="margin-left:10px;"
            :content01="asgInfo.projectInfo.company.groupName"
            :content02="asgInfo.projectInfo.group.groupName"
            :content03="asgInfo.projectInfo.project.projectName"
          />
        </div>
        <div
          v-if="visibleProject"
          class="custom-popup -app-manager"
        >
          <select-from-tree
            type="project"
            :search-title="$v('프로젝트를 검색하세요.')"
            :header="$v('프로젝트 리스트')"
            v-if="visibleProject"
            class="-body"
            @close="visibleProject = false"
            :group-tree-data="groupTreeData"
            :loading="loading.isGroupTree"
            :user-group-idx="user.userGroup"
            :selected-project-info="asgInfo.projectInfo ? asgInfo.projectInfo.project : {}"
            :trigger-btn="$refs"
            @select="param => {
              asgInfo.projectInfo = param
            }"
          />
        </div>
      </template>
      <!-- 프로젝트 선택 -->

      <el-input
        slot="autoScaleName"
        :placeholder="$v('Auto Scale 그룹 명을 입력하세요')"
        v-model="asgInfo.autoScaleName"
        maxlength="25"
        show-word-limit
        style="width: 510px;"
      />
      <!-- 그룹명 -->

      <template #VMTemplateImage>
        <div class="image-search">
          <wj-flex-grid-search
            ref="theSearch"
            :placeholder="$v('VM 템플릿 명 or 원본 VM 명')"
            id="imageSearch"
          />
        </div>
        <cmp-grid
          ref="imageListGrid"
          v-loading="imageListLoading"
          :item-source="vmImages"
          :selectable="canChange"
          :columns="imageColumns"
          :use-excel-download="false"
          :paging-size="5"
          searching
          search-box-id="imageSearch"
          @selectedRow="selectImageFunction"
          :init-auto-select-row="asgInfo.selectImage"
          init-auto-select-row-key="ovaUuid"
        />
      </template>
      <!-- VM 템플릿 이미지 -->

      <template #networkOrganization>
        <network-category-selection
          ref="networkCate"
          @data="saveNetworkOrg"
          :cate-limit="1"
          :cate-lists="asgInfo.networkList"
          :disabled="!canChange"
        />
      </template>
      <!-- 네트워크 조직 -->

      <template #vmCount>
        <el-select
          v-model="asgInfo.vmCount"
          :placeholder="$t('common.PLACEHOLDER.serviceSelectCate')"
          :popper-append-to-body="false"
          class="form-input"
          :disabled="!canChange"
        >
          <el-option
            v-for="(item, idx) in countOptions"
            :key="idx"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <span :style="{'margin-left': '10px'}"> {{ $v('개') }}</span>
      </template>
      <!-- 최소 VM 수 -->
      <el-date-picker
        slot="startDateTime"
        class="service-date-pick"
        v-model="asgInfo.startDateTime"
        type="datetime"
        default-time="12:00:00"
        :placeholder="$v('그룹 시작 시간을 지정해주세요')"
        :disabled="!canChange"
      />
      <!-- 그룹 시작일 -->
    </vertical-table>
    <section class="modal-button-area">
      <button
        class="button -modal-button"
        type="is-anti"
        @click="closeFunction"
      >
        {{ $v('취소') }}
      </button>
      <button
        class="button -modal-button"
        type="is-primary"
        @click="updateASG()"
      >
        {{ editMode ? $v('변경'): $v('생성') }}
      </button>
    </section>
  </div>
</template>
<script>
// ResourceFilterComponent
import { mapState } from 'vuex'
import API, { SelectFromTree, VerticalTable, NetworkCategorySelection } from '@sd-fe/cmp-core'
import TextDisplay from '@/components/Text/TextDisplay.vue'
export default {
  name: 'AutoScaleGroupUpdateForm',
  components: {
    VerticalTable,
    SelectFromTree,
    // ResourceFilterComponent,
    NetworkCategorySelection,
    TextDisplay
  },
  props: {
    data: {
      type: Object,
      default: () => {}
    },
    selectedProject: {
      type: Object,
      default: () => {}
    },
    editMode: {
      type: Boolean,
      default: false
    },
    vmImages: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  watch: {
    data: {
      immediate: true,
      deep: true,
      handler (newData) {
        if (newData) {
          console.log(newData)
          this.asgInfo = {
            projectInfo: { // 프로젝트 정보
              company: { companyIdx: newData.originData.companyIdx },
              group: { groupIdx: newData.originData.groupIdx },
              project: { projectIdx: newData.originData.projectIdx }
            },
            autoScaleName: newData.originData.autoScaleName,
            selectImage: newData.originData.ova,
            networkList: [{
              cateIdx: newData.originData.cateIdx,
              cateKey: newData.originData.cateKey,
              cateName: newData.originData.cateName
            }],
            vmCount: newData.originData.vmCount,
            startDateTime: new Date(newData.originData.startTime)
          }
          this.autoScaleIdx = newData.autoScaleIdx
          this.forceRerender()
          this.$nextTick(() => {
            this.setImageGridPage(newData.originData.ova)
            this.checkDateTime(newData.originData.startTime)
          })
        }
      }
    }
  },
  mounted () {
    this.getManageTree()
  },
  methods: {
    /**
     * 관계사-그룹 트리 데이터 조회
     */
    async getManageTree () {
      try {
        this.loading.isGroupTree = true
        const response = await API.iam.getGroupManageTree({ project: true })
        if (!response) return
        this.groupTreeData = [...response]
      } catch (error) {
        this.groupTreeData = []
        this.loading.isGroupTree = false
        console.error(error)
      } finally {
        this.loading.isGroupTree = false
      }
    },
    /**
     * 그룹 시작일 전에는 전체 수정 가능,
     * 그룹 시작일 이후에는 프로젝트, 그룹 명만 수정 가능
     */
    checkDateTime (startTime) {
      const now = new Date()
      if (now.valueOf() > startTime) this.canChange = false
    },
    /**
     * 초기 이미지 그리드 선택된 페이지 세팅
     */
    setImageGridPage (ova) {
      if (!ova?.ovaUuid) return

      const ref = this.$refs.imageListGrid
      if (!ref) return

      const foundImage = this.vmImages.find(image => {
        return image.ovaUuid === ova.ovaUuid
      })
      const curPage = parseInt(Number(foundImage.index) / 5)
      return ref.changingPage(curPage + 1)
    },
    selectImageFunction (row) {
      console.log('@selectImageFunction', row)
      if (row) {
        this.$set(this.asgInfo, 'selectImage', row._data)
      } else {
        this.asgInfo.selectImage = null
      }
    },
    saveNetworkOrg (list) {
      console.log(list)
      this.$set(this.asgInfo, 'networkList', list)
    },
    closeFunction () {
      this.asgInfo = {
        projectInfo: {
          company: null,
          group: null,
          project: null
        },
        autoScaleName: '',
        selectImage: null,
        networkList: [],
        vmCount: 1,
        startDateTime: null
      }
      this.$refs.imageListGrid.initDataSetting()
      this.$refs.projectInfo.resetAllFilter()
      this.$refs.networkCate.resetOptions()
      this.$emit('close')
    },
    async updateASG (data = this.asgInfo, editMode = this.editMode) {
      console.log(data)
      if (this.dataValidation(data)) {
        this.modalLoading = true

        const payload = {
          autoScaleName: data.autoScaleName,
          cateIdx: data.networkList[0].cateIdx,
          cateKey: data.networkList[0].cateKey,
          cateName: data.networkList[0].cateName,
          ovaUuid: data.selectImage.ovaUuid,
          projectIdx: data.projectInfo.project.projectIdx,
          startTime: data.startDateTime.toISOString(),
          vmCount: data.vmCount
        }
        if (editMode) Object.assign(payload, { autoScaleIdx: this.autoScaleIdx })
        const text = editMode ? this.$v('변경') : this.$v('생성')
        console.log(payload)
        try {
          let result
          if (editMode) {
            result = await API.compute.updateAutoScaleGroup(payload)
          } else {
            result = await API.compute.createAutoScaleGroup(payload)
          }
          if (result) {
            this.$alert(this.$v('오토스케일 그룹이{text}되었습니다.', { text: text }), {
              callback: () => {
                this.modalLoading = false
                this.closeFunction()
                this.$emit('done')
              }
            })
          }
        } catch (error) {
          if (error.code === 'COMMON0006') {
            this.$alert(this.$v('중복된 그룹명이 존재합니다. 다시 설정해주세요.'), {
              callback: () => {
                this.modalLoading = false
              }
            })
          } else {
            this.$alert(this.$v('{text} 실패했습니다.', { text: text }), {
              callback: () => {
                this.modalLoading = false
              }
            })
          }
        }
      }
    },
    dataValidation (data) {
      if (!data?.projectInfo?.project?.projectIdx) {
        this.$alert(this.$v('프로젝트를 선택해주세요.'), { callback: () => { return false } })
        return false
      }
      if (!data?.autoScaleName) {
        this.$alert(this.$v('Auto Scale 그룹 명을 입력하세요'), { callback: () => { return false } })
        return false
      }
      if (!data?.selectImage) {
        this.$alert(this.$v('이미지를 선택해주세요.'), { callback: () => { return false } })
        return false
      }
      if (!data?.networkList?.length) {
        this.$alert(this.$v('네트워크를 선택하세요.'), { callback: () => { return false } })
        return false
      }
      if (!data?.startDateTime) {
        this.$alert(this.$v('그룹 시작 시간을 지정해주세요'), { callback: () => { return false } })
        return false
      }
      if (!data?.vmCount || data?.vmCount < 1) {
        this.$alert(this.$v('희망 VM 수는 그룹의 최소 VM 수 ({vmCount}개) 보다 많아야 합니다.'), { callback: () => { return false } })
        return false
      }
      return true
    },
    forceRerender () {
      this.componentRefreshKey += 1
    }

  },
  data () {
    return {
      loading: {
        isGroupTree: false
      },
      groupTreeData: [],
      visibleProject: false,
      verticalTableColumns: [
        { header: '프로젝트 선택', binding: 'projectInfo', keyPath: 'autoScale.selectProject', required: true },
        { header: '그룹명', binding: 'autoScaleName', keyPath: 'autoScale.groupName', required: true },
        { header: 'VM 템플릿 이미지', binding: 'VMTemplateImage', keyPath: 'autoScale.VMTemplateImage', required: true },
        { header: '네트워크 조직', binding: 'networkOrganization', keyPath: 'autoScale.networkOrganization', required: true },
        { header: '최소 VM 수', binding: 'vmCount', keyPath: 'autoScale.numberOfMinVms', required: true },
        { header: '그룹 시작 시간', binding: 'startDateTime', keyPath: 'autoScale.groupStartDateTime', required: true },
        { header: '신청 용량', binding: 'externalDisk', required: true, keyPath: 'common.GRID.STORAGE.appCapa', subTitle: this.$t('common.ALERT.COMP.071', { size: '50GB', field: this.$t('common.GRID.STORAGE.appCapa') }) }
      ],
      asgInfo: {
        projectInfo: { // 프로젝트 정보
          company: null,
          group: null,
          project: null
        },
        autoScaleName: '', // 그룹명
        selectImage: null, // 이미지
        networkList: [], // 네트워크 조직
        vmCount: 1, // 기본 vm 수
        startDateTime: null
      },
      imageColumns: [
        { binding: 'templateName', header: 'VM 템플릿 명', keyPath: 'autoScale.templateName' },
        { binding: 'parentVmName', header: '원본 VM 명', keyPath: 'autoScale.originVmName' },
        { binding: 'osType', header: 'OS 타입', keyPath: 'autoScale.osType' },
        { binding: 'osName', header: 'OS 명', keyPath: 'autoScale.osName' },
        { binding: 'osBit', header: 'OS Bit', keyPath: 'autoScale.osBit' },
        { binding: 'vCpu', header: 'vCPU', keyPath: 'autoScale.vCPU' },
        { binding: 'memory', header: 'Memory', keyPath: 'autoScale.memory' },
        { binding: 'rootDisk', header: 'RootDisk', keyPath: 'autoScale.rootDisk' }
      ],
      countOptions: [
        { label: '1', value: 1 },
        { label: '2', value: 2 },
        { label: '3', value: 3 },
        { label: '4', value: 4 },
        { label: '5', value: 5 }
      ],
      imageListLoading: false,
      modalLoading: false,
      componentRefreshKey: 0,
      autoScaleIdx: null,
      canChange: true
    }
  }
}
</script>

<style lang="scss">
.auto-scale-group-update-form {
  .image-search {
    margin-bottom: 10px;
    width: 300px;
  }
}
</style>
