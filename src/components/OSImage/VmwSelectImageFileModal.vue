<template>
  <el-dialog
    :visible="active"
    title="이미지 파일 선택"
    width="85%"
    @close="$emit('close')"
  >
    <div
      v-loading="isLoadingFiles"
      class="select-image-wrapper"
    >
      <div class="select-image">
        <div class="side-tree-area tiny-scroll select-image-tree">
          <g-tree
            ref="tree"
            :data="treeData"
            :view-line="true"
            @selected="onSelectNode"
            selectable-company
            init-open
            no-root-toggle
            unique-key="__ui_uid__"
          >
            <template #title="{ node }">
              <div class="center-tree-node-name">
                <vcenter-icon
                  v-if="node.customType === 'vcenter'"
                  :width="13"
                  :height="13"
                  :icon-color="iconColor(node)"
                />
                <datacenter-icon
                  v-if="node.customType === 'datacenter'"
                  :width="13"
                  :height="13"
                  :icon-color="iconColor(node)"
                />
                <cluster-icon
                  v-if="node.customType === 'cluster'"
                  :width="13"
                  :height="13"
                  :icon-color="iconColor(node)"
                />
                <host-icon
                  v-if="node.customType === 'host'"
                  :width="13"
                  :height="13"
                  :icon-color="iconColor(node)"
                />
          &nbsp;
                <span :class="{'-selected': selectedTreeItem && selectedTreeItem.customId === node.customId}">
                  {{ node.customType === 'vcenter' ? node.instanceName :node.name }}
                </span>
              </div>
            </template>
          </g-tree>
        </div>
        <div class="select-image-grid">
          <template v-if="selectedTreeItem">
            <div class="select-image-grid__head">
              <h3>{{ selectedTreeItem.name }}</h3>
            </div>
            <div class="select-image-grid__filter">
              <search-component
                v-model="filterText"
                :placeholder="$v('검색어를 입력해주세요.')"
                @input="onChangeFilterText"
              />
            </div>
            <div class="select-image-grid__grid">
              <cmp-grid
                :columns="datastoreFileColumns"
                :item-source="isFiltered ? filteredViewFiles : viewFiles"
              >
                <template #checked-el="{ row }">
                  <el-checkbox
                    :value="row.checked"
                    :disabled="row.disabled"
                    @change="val => onCheckFile(row, val)"
                  />
                </template>
                <template #connectedHostList="{ row }">
                  {{ row.connectedHostList }}
                </template>
              </cmp-grid>
            </div>
          </template>
          <template v-else>
            <div
              class="empty-data"
              style="height: 500px;"
            >
              {{ $v('데이터스토어를 선택해주세요.') }}
            </div>
          </template>
        </div>
      </div>
      <div class="checked-files">
        <h3>선택된 파일 목록</h3>
        <div class="checked-files-grid">
          <cmp-grid
            :columns="checkedFileColumns"
            :item-source="checkedFiles"
          >
            <template #checked-el="{ row }">
              <el-checkbox
                :value="true"
                @change="_ => onUnCheckFile(row)"
              />
            </template>
            <template #connectedHostList="{ row }">
              <el-tooltip
                v-if="row.connectedHostList && row.connectedHostList.length > 1"
                effect="light"
              >
                <span>
                  {{ row.connectedHostList[0].hostname }} 외 {{ row.connectedHostList.length - 1 }}
                </span>
                <div slot="content">
                  <div
                    v-for="host in row.connectedHostList"
                    :key="host.hostUuid"
                  >
                    {{ host.hostname }}
                  </div>
                </div>
              </el-tooltip>
              <span v-else-if="row.connectedHostList && row.connectedHostList.length === 1">
                {{ row.connectedHostList[0].hostname }}
              </span>
            </template>
          </cmp-grid>
        </div>
      </div>
      <div class="host-list">
        <h3>프로비저닝 가능한 호스트</h3>
        <div class="host-list-wrap">
          <clearable-tag
            v-for="host in canProvisionHosts"
            :key="host.hostUuid"
            :clearable="false"
            :content="host.hostname"
            unique-key="-"
          />
        </div>
      </div>
    </div>
    <section class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="$emit('close')"
      >
        {{ $v('닫기') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="onSaveImageFile"
      >
        {{ $v('저장') }}
      </button>
    </section>
  </el-dialog>
</template>

<script>
import API, { GTree } from '@sd-fe/cmp-core'
import VcenterIcon from '~/components/Icons/VcenterIcon.vue'
import DatacenterIcon from '~/components/Icons/DatacenterIcon.vue'
import ClusterIcon from '~/components/Icons/ClusterIcon.vue'
import HostIcon from '~/components/Icons/HostIcon.vue'
import Fuse from 'fuse.js'
import { omit } from 'lodash'

export default {
  name: 'VmwSelectImageFileModal',
  props: {
    active: {
      type: Boolean,
      required: true
    },
    treeData: {
      type: Array,
      default: () => []
    },
    hostList: {
      type: Array,
      default: () => []
    },
    datastore: {
      type: Array,
      default: () => []
    },
    findVCenter: {
      type: Function,
      default: () => ({})
    },
    editFiles: {
      type: Array,
      default: () => []
    }
  },
  components: {
    'g-tree': GTree,
    VcenterIcon,
    DatacenterIcon,
    ClusterIcon,
    HostIcon
  },
  watch: {
    filterText (value) {
      this.isFiltered = !!value
    },
    active (visible) {
      if (visible && this.editFiles && this.editFiles.length) {
        this.setEditFiles()
      } else {
        this.resetForm()
      }
    }
  },
  created () {
    if (this.editFiles && this.editFiles.length) {
      this.setEditState()
    }
  },
  methods: {
    resetForm () {
      if (this.$refs.tree) {
        this.$refs.tree.setTreeSelectDefault(this.$refs.tree.nodes)
      }
      this.checkedFiles = []
      this.selectedTreeItem = null
      this.viewFiles = []
      this.filteredViewFiles = []
      this.filterText = ''
      this.canProvisionHosts = this.getCanProvisionHosts()
      this.handleDisabledTree()
    },
    setEditFiles () {
      if (!this.editFiles.length) return

      this.checkedFiles = this.editFiles.map(file => {
        const datastore = this.datastore.find(store => store.datastoreId === file.datastoreId) || {}
        const host = this.hostList.find(h => h.hostUuid === file.hostUuid) || {}
        // 테스트: 임시! (파일 PK 값이 필요해서 ㅠ)
        const uiFileUuid = this.getFileUuid(file)
        let vcenter = null

        const traversal = (node) => {
          if (vcenter) return
          if (node.children && node.children.length) {
            node.children.forEach(child => traversal(child))
          }
          if (node.customType === 'vcenter' && node.vcenterUuid === host.vcenterUuid) vcenter = node
        }

        this.treeData.forEach(node => traversal(node))

        return {
          ...file,
          formattedUpdateTime: this.$options.filters.date(file.updateTime, 'YYYY.MM.DD HH:MM:ss'),
          formattedFileSize: this.$options.filters.byte(file.fileSize),
          connectedHostList: datastore.hostList,
          currentHost: file.hostUuid,
          datastoreName: datastore.name,
          __ui_file_uuid__: uiFileUuid,
          hostUuid: file.hostUuid,
          connectedHostName: host.name,
          connectedHostUuid: file.hostUuid,
          vCenterName: vcenter?.instanceName
        }
      })

      this.$nextTick(() => {
        this.getTreeHosts()
        this.canProvisionHosts = this.getCanProvisionHosts()
        this.handleDisabledTree()
      })
    },
    onSaveImageFile () {
      this.$confirm(this.$v('선택한 이미지 파일을 저장하시겠습니까?'))
        .then(() => {
          const omitFiles = this.checkedFiles
            .map(file => ({ ...file, connectHostList: file.connectedHostList }))
            .map(file => omit(file, ['index', 'checked', 'formattedFileSize', 'formattedUpdateTime', '__ui_file_uuid__', 'connectedHostList', 'disabled', 'isFile']))

          this.$emit('save', JSON.parse(JSON.stringify(omitFiles)))
          this.$emit('close')
        })
        .catch(() => false)
    },
    setEditState () {

    },
    handleDisabledTree () {
      // 대상
      const hostUuids = this.canProvisionHosts.map(host => host.hostUuid)

      this.treeHosts.forEach(host => {
        if (hostUuids.includes(host.hostUuid)) {
          host.disabled = true
        } else {
          host.children.forEach(child => (child.disabled = false))
          host.disabled = false
        }
      })
    },
    onUnCheckFile (checkedFile) {
      this.onCheckFile(checkedFile, false)
    },
    getCanProvisionHosts () {
      const hosts = []

      this.checkedFiles.forEach(file => {
        const hostUuids = hosts.map(host => host.hostUuid)

        file.connectedHostList.forEach(host => {
          if (hostUuids.includes(host.hostUuid)) return
          hosts.push(host)
        })
      })

      return hosts
    },
    onChangeFilterText (value) {
      if (value) {
        const fuse = new Fuse(this.viewFiles, {
          threshold: 0.25,
          keys: ['path', 'parentPath']
        })

        const nodes = fuse.search(value)

        this.filteredViewFiles = nodes.map(node => node.item)
      } else {
        this.filteredViewFiles = []
      }
    },
    onCheckFile (item, checked) {
      item.checked = checked

      if (checked) {
        // 배열에 넣고
        // 선택한 데이터스토어의 모든 파일 disabled
        this.checkedFiles.push(item)
        this.viewFiles.filter(file => !file.checked).forEach(file => (file.disabled = true))
      } else {
        // 배열에서 빼고
        // 선택한 데이터스토어에서 파일을 체크할 수 있는 상황인 경우
        // disabled 해제
        this.checkedFiles = this.checkedFiles.filter(file => file.__ui_file_uuid__ !== item.__ui_file_uuid__)
      }

      // 두 케이스 전부 프로비저닝 가능한 호스트 재계산
      // 가능한 호스트들의 하위 항목(데이터스토어) 트리에서 선택 못하게
      // disabled 처리 필요
      // 프로비저닝 가능한 호스트 조회 로직 필요
      const hosts = this.getCanProvisionHosts()

      this.canProvisionHosts = hosts

      if (!checked) {
        const hostUuids = this.canProvisionHosts.map(host => host.hostUuid)
        if (!hostUuids.includes(item.currentHost)) {
          this.viewFiles.forEach(file => (file.disabled = false))
        }
      }

      // 프로비저닝 가능한 호스트는 트리에서 선택 불가능하게 처리
      this.handleDisabledTree()
    },
    getTreeHosts () {
      if (this.treeHosts && this.treeHosts.length) return

      const tree = this.$refs.tree

      if (tree) {
        const hosts = []

        const traversal = (node) => {
          if (node.children && node.children.length) {
            node.children.forEach(child => traversal(child))
          }
          if (node.customType === 'host') hosts.push(node)
        }

        tree.nodes.forEach(node => traversal(node))
        this.treeHosts = hosts
      } else {
        this.treeHosts = []
      }
    },
    onSelectNode (item) {
      this.selectedTreeItem = item

      if (!this.selectedTreeItem) return

      this.getTreeHosts()
      this.getFilesByDatastore(item.datastoreId, item.connectIdx)
    },
    iconColor (node) {
      if (this.selectedTreeItem?.customId === node?.customId) return '#3E57C9'
      else return '#717987'
    },
    async getFilesByDatastore (datastoreId, connectIdx) {
      try {
        this.isLoadingFiles = true
        const res = await API.vmware.datastore.getDatastoreFileUnregister({
          datastoreId,
          connectIdx
        })
        this.viewFiles = (res || [])
          .filter(file => file.isFile)
          .map(this.mapFileInDatastore)
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('파일 조회에 실패하였습니다.'))
      } finally {
        this.isLoadingFiles = false
      }
    },
    mapFileInDatastore (file) {
      // 데이터스토어와 연결된 호스트
      const connectedHostList = this.selectedTreeItem.hostList
      // 현재 선택한 호스트
      const currentHost = this.selectedTreeItem.parentNode.hostUuid
      // 현재 선택한 호스트 이름
      const currentHostName = this.selectedTreeItem.parentNode.name
      // 데이터스토어 이름
      const datastoreName = this.selectedTreeItem.name
      // vCenter
      const vCenter = this.findVCenter(this.selectedTreeItem.parentNode.vcenterUuid)
      const vCenterName = vCenter ? vCenter.instanceName : ''
      // 테스트: 임시! (파일 PK 값이 필요해서 ㅠ)
      const uiFileUuid = this.getFileUuid(file)
      // 체크된 상태
      const checked = this.checkedFiles.map(file => file.__ui_file_uuid__).includes(uiFileUuid)
      // 비활성화 상태
      const disabled = this.canProvisionHosts.map(host => host.hostUuid).includes(currentHost)

      return {
        ...file,
        formattedUpdateTime: this.$options.filters.date(file.updateTime, 'YYYY.MM.DD HH:MM:ss'),
        formattedFileSize: this.$options.filters.byte(file.fileSize),
        checked,
        disabled,
        connectedHostList,
        currentHost,
        datastoreName,
        vCenterName,
        __ui_file_uuid__: uiFileUuid,
        hostUuid: currentHost,
        connectedHostName: currentHostName,
        connectedHostUuid: currentHost
      }
    },
    getFileUuid (file) {
      return `${file.datastoreId}-${file.parentPath}-${file.path}`
    }
  },
  data: (root) => ({
    isFiltered: false,
    filterText: '',
    isLoadingFiles: false,
    checkedFiles: [],
    viewFiles: [],
    filteredViewFiles: [],
    connectedHostList: [],
    treeHosts: [],
    canProvisionHosts: [],
    selectedTreeItem: null,
    datastoreFileColumns: [
      { binding: 'checked-el', header: ' ', sortable: false, filtable: false, width: 50, customHtml: true },
      { binding: 'path', header: root.$v('파일명'), width: '0.9*' },
      { binding: 'formattedFileSize', header: root.$v('크기'), width: '0.3*' },
      { binding: 'formattedUpdateTime', header: root.$v('수정한 날짜'), width: '0.45*' },
      { binding: 'parentPath', header: root.$v('경로') }
    ],
    checkedFileColumns: [
      { binding: 'checked-el', header: ' ', sortable: false, filtable: false, width: 50, customHtml: true },
      { binding: 'path', header: root.$v('파일명'), width: '1.7*' },
      { binding: 'connectedHostList', header: root.$v('연결된 호스트'), customHtml: true, sortable: false, filtable: false, width: '0.8*' },
      { binding: 'datastoreName', header: root.$v('데이터스토어') },
      { binding: 'vCenterName', header: 'vCenter', width: '0.5*' },
      { binding: 'formattedFileSize', header: root.$v('크기'), width: '0.4*' },
      { binding: 'formattedUpdateTime', header: root.$v('수정한 날짜'), width: '0.65*' },
      { binding: 'parentPath', header: root.$v('경로'), width: '2*' }
    ]
  })
}
</script>

<style lang="scss" scoped>
.select-image-wrapper {
  padding: 0 $gap-s;
  max-height: 700px;
  overflow-y: auto;
  padding-bottom: $gap-m;
}

.select-image {
  display: flex;
  overflow: hidden;
  flex-wrap: nowrap;
  width: 100%;

  &-tree,
  &-grid {
    min-height: 630px;
    max-height: 630px;
    overflow-y: auto;
    box-sizing: border-box;
  }

  &-tree {
    flex: 1;
    padding: $gap;
    margin-right: $gap;
    overflow: auto;
  }

  &-grid {
    flex: 0 1 75%;

    &__head {
      margin-bottom: $gap;
    }

    &__filter {
      margin-bottom: $gap;
    }

    &__grid {
      overflow: hidden;
    }
  }
}

.checked-files {
  margin: $gap-m 0;

  h3 {
    margin-bottom: $gap;
  }

  &-grid {
    min-height: 100px;
  }
}

.host-list {
  h3 {
    margin-bottom: $gap;
  }

  &-wrap {
    display: flex;
  }
}
</style>
