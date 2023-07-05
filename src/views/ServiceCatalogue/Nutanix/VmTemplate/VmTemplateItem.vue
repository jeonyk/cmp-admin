<template>
  <article
    :class="['vm-template-item', `-${theme}`]"
    v-loading="loading"
  >
    <h4
      class="sub-title"
      v-if="!titleEdit || !editable"
    >
      {{ contents.name }}
      <button
        v-if="editable"
        class="button -edit-button"
        type="is-primary"
        size="is-mini"
        @click="e => titleEdit = true"
      >
        <!-- 이름 변경 -->
        {{ $t('service.OVA.changeName') }}
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
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button -edit-button"
        type="is-primary"
        size="is-mini"
        :disabled="!afterName.trim()"
        @click="changeName"
      >
        {{ $t('common.BTN.save') }}
      </button>
    </div>
    <div class="-user-regist">
      <article class="flex-wrap">
        <h6 style="margin-right: 10px;">
          {{ $v('VM Template 노출 여부') }}
        </h6>
        <el-switch
          v-model="contents.isPub"
          :disabled="!editable
            || editable && contents.nicList.length > 1
            || editable && contents.osType === 'WINDOWS'"
          @click.native="(e) => {
            e.stopPropagation()
            $emit('changeIsPub', contents.isPub)
          }"
        />
      </article>
      <small v-if="editable && (contents.nicList.length > 1 || contents.osType === 'WINDOWS')">
        {{ $v('VM Template 노출 불가능 자원입니다.') }}
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
          v-if="col.binding === 'osName'"
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
        <div v-if="col.binding !== 'osName'">
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
import API, { DashboardPanel } from '@sd-fe/cmp-core'

export default {
  name: 'VmTemplateItem',
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
        const origin = cloneDeep(newVal)
        this.setTemplateData(origin)
        this.afterName = this.contents.name || ''
      }
    }
  },
  methods: {
    setTemplateData (data = this.data) {
      const { createTime, userInfo, installProgramList, spec, parentVmName } = data // OVA 정보

      let rootDiskSize = 0
      const externalDiskList = []

      if (spec?.diskList) {
        for (let i = 0; i < spec.diskList.length; i++) {
          if (spec.diskList[i].isCdrom ||
            (spec.diskList[i].deviceType === 'CDROM' && spec.diskList[i].deviceBus === 'IDE')) continue
          if ((spec.diskList[i].deviceIndex === 0 || spec.diskList[i].diskIndex === 0) && spec.diskList[i].deviceBus === 'SCSI') {
            rootDiskSize = this.$options.filters.byteToGb(spec.diskList[i].diskSize || spec.diskList[i].diskSizeBytes)
          } else {
            externalDiskList.push({
              diskSize: this.$options.filters.byteToGb(spec.diskList[i].diskSizeBytes),
              ...spec.diskList[i]
            })
          }
        }
      }

      this.contents = {
        name: data?.name,
        sourceVmName: parentVmName,
        createTime: this.$options.filters.date(createTime),
        osName: userInfo?.osName ? userInfo.osName + (userInfo.osBit ? `(${userInfo.osBit})` : '') : '-',
        osType: userInfo?.osType ? (userInfo?.osSystem ? `[${userInfo?.osSystem}] ` : '') + `${userInfo.osType} ${userInfo?.osVersion || ''}` : '-',
        vcpu: spec?.numSockets ? spec.numSockets + ' Core' : '-',
        memory: spec?.memorySizeMib ? spec?.memorySizeMib / 1024 + ' GB' : '-',
        rootDiskSize: !isNaN(rootDiskSize || userInfo?.osRootDiskSize || rootDiskSize)
          ? (rootDiskSize || userInfo?.osRootDiskSize) + ' GB'
          : '-',
        externalDiskList,
        installProgramList,
        summary: userInfo?.summary,
        isPub: userInfo?.isPub,
        nicList: spec?.nicList || []
      }
    },
    async changeName () {
      try {
        this.loading = true
        const uuid = this.data.ovaUuid
        if (!uuid) return

        const result = await API.compute.updateOVAName(uuid, { name: this.afterName.trim() })
        if (result) {
          this.$alert(this.$t('common.ALERT.BASE.043')) // 수정되었습니다.
          this.$emit('refresh')
        }
      } catch (error) {
        this.$alert(this.$t('common.ALERT.LOGGING.005'), { dangerouslyUseHTMLString: true })
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
          { binding: 'sourceVmName', header: '소스 VM', keyPath: 'service.OVA.sourceVmName' },
          { binding: 'createTime', header: '추가 날짜', keyPath: 'service.OVA.addData' }
        ], [
          // { binding: 'osType', header: 'OS 타입', keyPath: 'common.GRID.COMPUTE.osType' },
          { binding: 'osName', header: '이미지 (OS)', keyPath: 'common.GRID.COMPUTE.osName' },
          // { binding: 'osBit', header: 'OS Bit' },
          { binding: 'vcpu', header: 'vCPU' }, //
          { binding: 'memory', header: 'Memory' }, //
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
    padding: $gap-m 55px;
    gap: $gap-s;
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
