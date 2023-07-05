<template>
  <article
    :class="['vm-template-item', `-${theme}`]"
    v-loading="loading"
  >
    <template
      v-if="
        contents.name
          || (contents.templateIdx && editable)
          || (contents.templateIdx && !editable && contents.name)"
    >
      <h4
        class="sub-title"
        v-if="!titleEdit || !editable"
      >
        {{ contents.name }}
        <button
          v-if="editable && contents.templateIdx !== undefined"
          class="button -edit-button"
          type="is-primary"
          size="is-mini"
          @click="e => titleEdit = true"
        >
          {{ $v('이름 변경') }}
        </button>
      </h4>
      <div
        v-else
        class="flex-wrap"
      >
        <el-input
          v-model="afterName"
          class="template-name-input"
        />
        <button
          class="button -edit-button"
          type="is-anti"
          size="is-mini"
          @click="e => titleEdit = false"
        >
          {{ $v('취소') }}
        </button>
        <button
          class="button -edit-button"
          type="is-primary"
          size="is-mini"
          @click="changeVmwareTemplateName"
        >
          {{ $v('저장') }}
        </button>
      </div>
    </template>
    <div class="-user-regist">
      <article class="flex-wrap">
        <h6 style="margin-right: 10px;">
          {{ $v('VM Template 노출 여부') }}
        </h6>
        <el-switch
          v-model="contents.isPub"
          :disabled="!editable
            || editable && !contents.templateIdx"
          @click.native="(e) => {
            e.stopPropagation()
            $emit('changeIsPub', contents.isPub)
          }"
        />
      </article>
      <small v-if="editable && !contents.templateIdx">
        {{ $v('VM Template 노출 불가능 자원입니다.(미등록 템플릿)') }}
      </small>
    </div>

    <ul
      class="template-info-list"
      v-for="(columns, idx) in templateItemCols"
      :key="idx"
    >
      <li
        class="template-info-item"
        v-for="col in columns"
        :key="col.binding"
      >
        <b>{{ $t(col.keyPath) || col.header }}</b>
        <div
          v-if="col.binding === 'osSystem'"
          class="tag-list"
        >
          <section class="detail-contents">
            <dashboard-panel :padding-top="0">
              <template>
                <div
                  v-if="contents[col.binding]"
                  class="flex-wrap after-data os-wrap"
                >
                  <set-os-icon :os-name="contents[col.binding]" />
                  <span v-if="contents[col.binding]">{{ contents[col.binding] }}</span>
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
                      v-if="contents.osBit"
                      class="flex-wrap after-data"
                    >
                      <span v-if="contents.osBit">{{ contents.osBit }}</span>
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
                      v-if="contents.osType"
                      class="flex-wrap after-data"
                    >
                      <span v-if="contents.osType">{{ contents.osType }}</span>
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
        </div>
        <div
          v-if="col.binding === 'installProgramList'"
          class="tag-list"
        >
          <el-tag
            v-for="pkg in contents.installProgramList"
            :key="pkg.swIdx"
            size="small"
          >
            {{ `${pkg.softwareName} ${pkg.versionName}` || pkg }}
          </el-tag>
        </div>
        <div v-if="col.binding !== 'osSystem'">
          {{ contents[col.binding] }} {{ col.binding }}
        </div>
      </li>
    </ul>

    <i
      class="bottom-line"
      v-if="contents.summary"
    />
    <div
      v-if="contents.summary"
      class="desc-area"
      style="white-space: pre-wrap;"
    >
      {{ contents.summary }}
    </div>
  </article>
</template>

<script>
import { cloneDeep } from 'lodash'
import { mapState } from 'vuex'
import API, { DashboardPanel } from '@sd-fe/cmp-core'

export default {
  name: 'VmwareTemplateItem',
  props: {
    data: {
      type: Object,
      default: undefined
    },
    editable: {
      type: Boolean,
      default: false
    },
    theme: {
      type: String,
      default: 'light'
    }
  },
  components: {
    'dashboard-panel': DashboardPanel
  },
  watch: {
    data: {
      immediate: true,
      handler (newVal) {
        if (newVal?.templateIdx) {
          const origin = cloneDeep(newVal)
          this.setTemplateData(origin)
          this.afterName = this.contents.name
          if (!this.contents.name) this.titleEdit = true
        }
      }
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  methods: {
    setTemplateData (data = this.data) {
      const {
        vm,
        templateName,
        createTime,
        memory,
        installProgramList,
        isPub,
        summary,
        templateIdx,
        osSystem, osType, osBit, osVersion, osName
      } = data // OVA 정보

      let rootDiskSize
      const externalDiskList = []

      if (vm?.diskList) {
        for (let i = 0; i < vm.diskList.length; i++) {
          const disk = vm.diskList[i]
          const diskSize = disk?.capacityKB
            ? this.$options.filters.byteToGb(disk.capacityKB * 1024)
            : (disk?.size || 0)

          if (disk.unitNumber === 0) {
            rootDiskSize = diskSize
            continue
          } else {
            externalDiskList.push(disk)
          }
        }
      }

      this.contents = {
        name: templateName || vm?.name,
        // sourceVmName: vm?.name,
        createTime: createTime ? this.$options.filters.date(createTime) : '-',
        osName: osName ? osName + (osBit ? `(${osBit})` : '') : '-',
        osType: osType ? (osSystem ? `[${osSystem}] ` : '') + `${osType} ${osVersion || ''}` : '-',
        vcpu: vm?.cpuCores
          ? vm.cpuCores + ' Core'
          : '-',
        memory: (memory || vm?.memorySize)
          ? (memory || this.$options.filters.MB(vm?.memorySize))
          : '-',
        rootDiskSize: rootDiskSize === undefined ? '-' : rootDiskSize + ' GB',
        externalDiskList,
        installProgramList,
        isPub: !!isPub,
        summary,
        templateIdx
      }
    },
    async changeVmwareTemplateName () {
      if (this.contents.name?.trim() === this.afterName.trim()) {
        this.titleEdit = false
        return
      }

      try {
        this.loading = true
        const { templateIdx } = this.contents

        if (!await this.isAvailableTemplateName(this.afterName, templateIdx)) return this.$alert('이미 사용 중인 vm 명입니다.', () => false)

        const result = await API.vmware.template.changeVmwareTemplateName({
          newName: this.afterName,
          reqUserId: this.user.userId,
          ...(templateIdx && { templateIdx })
        })
        if (result) {
          this.$alert(this.$v('성공적으로 변경되었습니다.'), () => false)
          this.$emit('refresh')
        }
      } catch (error) {
        this.$alert(this.$v('수정에 실패하였습니다.<br>관리자 문의 부탁드립니다.'), { dangerouslyUseHTMLString: true })
      } finally {
        this.loading = false
      }
    },
    /**
     * Template이름 사용 가능 여부를 반환합니다.
     * [vm템플릿 명+ vm 호스트 명] 통틀어 중복 불가능합니다.
     */
    async  isAvailableTemplateName (name = this.afterName, templateIdx) {
      try {
        this.loading = true

        const isInVMware = await API.vmware.vm.checkHostnameInVmware({ hostName: name })
        return !isInVMware
      } catch (error) {
        console.error(error)
      } finally {
        this.loading = false
      }
    }
  },
  data (root) {
    return {
      titleEdit: false,
      afterName: '',
      contents: {
        name: '',
        isPub: false
      },
      loading: false,
      templateItemCols: [
        [
          // VMware vm 템플릿은 소스 vm 이름을 알 수 없다.
          // { binding: 'sourceVmName', header: root.$v('소스') + ' VM' },
          { binding: 'createTime', header: root.$v('추가 날짜') }
        ], [
          { binding: 'osSystem', header: root.$v('이미지') + ' (OS)' },
          // { binding: 'osType', header: root.$v('OS 타입') },
          // { binding: 'osBit', header: 'OS Bit' },
          { binding: 'vcpu', header: 'vCPU' },
          { binding: 'memory', header: 'Memory' },
          { binding: 'rootDiskSize', header: 'RootDisk' }
          // { binding: 'pkgList', header: '설치프로그램', keyPath: 'common.GRID.COMPUTE.install' }
        ]
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
  .vm-template-item {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: $gap-s;
    padding: $gap-m 55px;
    &.-dark {
      background-color: $ticket-back-color;
      // margin-bottom: $gap;
    }
    .sub-title {
      font-weight: bold;
    }
  }
  // 사용자 노출 여부
  .-user-regist {
    position: absolute;
    top: $gap-m;
    right: $gap * 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    h6 {
      font-size: 13px;
      font-weight: normal;
    }
    small { margin-top: 8px; color: $input-placeholder; }
  }

  .-edit-button { margin-left: $gap-s; }
  .template-name-input {
    width: 300px;
  }

  .template-info-list {
    & + .template-info-list {
      margin-top: $gap-s;
    }
    .template-info-item {
      display: flex;
      line-height: 20px;
      > b {
        font-weight: normal;
        width: 150px;
      }
    }
  }
  .bottom-line {
    border-top: 1px solid #b3b3b3;
    display: block;
    width: 15px;
    margin: 15px 0;
  }
  .desc-area { color: #888;}

  .dashboard-panel {
    background-color: inherit !important;
    margin-top: -20px;
  }
  .os-wrap {
    padding-bottom: 10px !important;

    .set-os-type {
      margin-right: 5px;
    }
  }
  .os-list-wrap {
    border-top: 1px solid $common-border !important;
  }
</style>
