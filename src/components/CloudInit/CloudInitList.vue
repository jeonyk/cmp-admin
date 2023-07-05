<template>
  <div class="cloud-init">
    <div class="cloud-init-filter">
      <filtering-component @reset-data="onResetFilter">
        <div class="filter-form">
          <span class="filter-name">
            {{ $v('Script명') }}
          </span>
          <search-component
            v-model="searchFilter.name"
            :placeholder="$v('Cloud Init Script명을 입력하세요.')"
            @input="onSearchFilterName"
          />
        </div>
      </filtering-component>
    </div>
    <div class="count-wrap">
      <total-count :total-count="viewCloudInitList.length" />
      <div class="button-wrap">
        <button
          v-for="button in buttons"
          :key="button.content"
          type="is-primary"
          @click="button.handler"
          class="button"
          :disabled="button.disabled"
        >
          {{ button.content }}
        </button>
      </div>
    </div>
    <div class="grid-wrap">
      <cmp-grid
        :columns="cloudInitColumns"
        :item-source="viewCloudInitList"
        :changing-page-reset="false"
        use-checkbox
        header-checkbox
        @checkedRowsData="onCheckGridItem"
      >
        <template #createTime="{ column, row }">
          {{ column.formatter(null, row, 'createTime') }}
        </template>
        <template #updateTime="{ column, row }">
          {{ column.formatter(null, row, 'updateTime') }}
        </template>
      </cmp-grid>
    </div>
    <cloud-init-detail-modal
      :mode="detailModalMode"
      :active="isActiveDetailModal"
      :template-info="detailModalInfo"
      :loading="isModalLoading"
      :grid-list="cloudInitList"
      @close="onCloseDetailModal"
      @create="onCreateScript"
    />
  </div>
</template>

<script>
import CloudInitDetailModal from './CloudInitDetailModal.vue'
import API from '@sd-fe/cmp-core'
import dayjs from 'dayjs'
import Fuse from 'fuse.js'
import { mapGetters } from 'vuex'

export default {
  name: 'CloudInitList',
  components: {
    CloudInitDetailModal
  },
  computed: {
    ...mapGetters(['user']),
    buttons () {
      return [
        {
          content: '추가',
          handler: this.onClickCreateCloudInit,
          disabled: false
        },
        {
          content: '복제',
          handler: this.onClickCopyCloudInit,
          disabled: this.selectedRows.length !== 1
        },
        {
          content: '수정',
          handler: this.onClickUpdateCloudInit,
          disabled: this.selectedRows.length !== 1
        },
        {
          content: '삭제',
          handler: this.onClickDeleteCloudInit,
          disabled: !this.selectedRows.length
        }
      ]
    },
    viewCloudInitList () {
      if (!this.cloudInitList || !this.cloudInitList.length) return []

      if (!this.isOnFilter) return this.cloudInitList

      const fuse = new Fuse(this.cloudInitList, {
        keys: ['initScriptName'],
        threshold: 0.1
      })

      return fuse.search(this.searchFilter.name).map(node => node.item)
    }
  },
  created () {
    this.getCloudInitScripts()
  },
  methods: {
    onResetFilter () {
      this.searchFilter.name = ''
      this.isOnFilter = false
    },
    async onCreateScript (form, mode) {
      this.isModalLoading = true

      const currentUser = {
        id: this.user.userId,
        name: this.user.userName
      }

      try {
        if (mode === 'edit') {
          await API.script.updateScript({
            description: form.description,
            initScript: form.content,
            initScriptName: form.title,
            userInitScriptIdx: form.userInitScriptIdx,
            updateUserId: currentUser.id,
            updateUserName: currentUser.name
          }, form.userInitScriptIdx)
        } else {
          // 추가, 복제
          await API.script.createScript({
            description: form.description,
            initScript: form.content,
            initScriptName: form.title,
            createUserId: currentUser.id,
            createUserName: currentUser.name,
            updateUserId: currentUser.id,
            updateUserName: currentUser.name
          })
        }
        this.onCloseDetailModal()
        this.getCloudInitScripts()

        if (mode === 'edit') {
          return this.$alert(this.$v('스크립트 변경이 완료되었습니다.'))
        } else if (mode === 'copy') {
          return this.$alert(this.$v('스크립트 복제가 완료되었습니다.'))
        } else {
          return this.$alert(this.$v('스크립트 추가를 완료하였습니다.'))
        }
      } catch (error) {
        this.$alert(this.$v('스크립트 추가에 실패하였습니다.'))
      } finally {
        this.isModalLoading = false
      }
    },
    onCloseDetailModal () {
      this.isActiveDetailModal = false
      this.detailModalMode = ''
    },
    onCheckGridItem (items) {
      this.selectedRows = items
    },
    /**
     * "추가" 버튼 클릭시 이벤트
     */
    onClickCreateCloudInit () {
      // this.$router.push({
      //   name: 'set-config-cloud-init-detail'
      // })
      this.isActiveDetailModal = true
      this.detailModalMode = 'create'
    },
    /**
     * "복제" 버튼 클릭시 이벤트
     */
    onClickCopyCloudInit () {
      // this.$router.push({
      //   name: 'set-config-cloud-init-detail',
      //   query: {
      //     mode: 'copy',
      //     templateId: /** @TODO */ 0
      //   }
      // })
      this.isActiveDetailModal = true
      this.detailModalMode = 'copy'
      this.detailModalInfo = this.selectedRows[0]
    },
    /**
     * "변경" 버튼 클릭시 이벤트
     */
    onClickUpdateCloudInit () {
      // this.$router.push({
      //   name: 'set-config-cloud-init-detail',
      //   query: {
      //     mode: 'edit',
      //     templateId: /** @TODO */ 0
      //   }
      // })
      this.isActiveDetailModal = true
      this.detailModalMode = 'edit'
      this.detailModalInfo = this.selectedRows[0]
    },
    /**
     * "삭제" 버튼 클릭시 이벤트
     */
    onClickDeleteCloudInit () {
      if (!this.selectedRows || !this.selectedRows.length) {
        return this.$alert(this.$v('선택된 항목이 없습니다.'))
      }
      let confirmMsg = this.$v('선택된 항목을 삭제하시겠습니까?')
      if (this.selectedRows.length > 1) {
        confirmMsg = this.$v('선택된 항목들을 삭제하시겠습니까?')
      }
      this.$confirm(confirmMsg)
        .then(async () => {
          const promisePool = this.selectedRows.map(row => API.script.removeScript(row.userInitScriptIdx))
          this.isLoadingCloudInitList = true
          Promise.all(promisePool)
            .then(() => {
              this.isLoadingCloudInitList = false
              let alertMsg = this.$v('항목을 삭제 완료하였습니다.')
              if (this.selectedRows.length > 1) {
                alertMsg = this.$v('항목들을 삭제 완료하였습니다.')
              }
              this.$alert(alertMsg, {
                callback: () => this.getCloudInitScripts()
              })
              this.selectedRows = []
            })
            .catch(() => {
              let failMsg = this.$v('항목을 삭제하는데에 실패하였습니다.')
              if (this.selectedRows.length > 1) {
                failMsg = this.$v('항목들을 삭제하는데에 실패하였습니다.')
              }
              this.$alert(failMsg)
            })
        })
        .catch(() => false)
    },
    onSearchFilterName (filterName) {
      this.isOnFilter = !!filterName
      this.searchFilter.name = filterName
    },
    /**
     * 항목 조회
     */
    async getCloudInitScripts () {
      if (this.isLoadingCloudInitList) return

      this.isLoadingCloudInitList = true

      try {
        const { data } = await API.script.getScriptList()
        const display = (id, name) => `${name}(${this.$options.filters.maskingName(id)})`
        this.cloudInitList = data.map(script => ({
          ...script,
          displayCreateUser: script.createUserId ? display(script.createUserId, script.createUserName) : null,
          displayUpdateUser: script.updateUserId ? display(script.updateUserId, script.updateUserName) : null
        }))
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('스크립트 조회에 실패하였습니다.'))
      } finally {
        this.isLoadingCloudInitList = false
      }
    }
  },
  data: () => ({
    searchFilter: {
      name: ''
    },
    // 그리드에 선택된 Row (복수)
    selectedRows: [],
    cloudInitList: [],
    cloudInitColumns: [
      { binding: 'initScriptName', header: 'Cloud Init Script명', width: 500 },
      { binding: 'description', header: '설명', width: 300 },
      {
        binding: 'createTime',
        header: '등록일',
        customHtml: true,
        formatter: (args, item, binding) => {
          return item[binding] ? dayjs(new Date(item[binding])).format('YYYY-MM-DD HH:mm:ss') : ''
        }
      },
      { binding: 'displayCreateUser', header: '등록 관리자' },
      {
        binding: 'updateTime',
        header: '수정일',
        customHtml: true,
        formatter: (args, item, binding) => {
          return item[binding] ? dayjs(new Date(item[binding])).format('YYYY-MM-DD HH:mm:ss') : ''
        }
      },
      { binding: 'displayUpdateUser', header: '수정 관리자' }
    ],
    isActiveDetailModal: false,
    detailModalMode: '',
    detailModalInfo: null,
    isLoadingCloudInitList: false,
    isModalLoading: false,
    isOnFilter: false
  })
}
</script>

<style lang="scss" scoped>
.cloud-init {
  .count-wrap {
    display: flex;
    justify-content: space-between;
  }

  .button-wrap {
    button:not(:last-of-type) {
      margin-right: $gap-s;
    }
  }
}
</style>
