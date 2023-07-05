<template>
  <div class="set-resource-modal modal-resource">
    <section class="modal-body">
      <fold-panal-service
        v-for="access of accessPermissions"
        :foldable="true"
        :is-collapsed="access.isCollapsed"
        :custom-id="access.header"
        :title="access.header"
        :key="access.header"
        @label="()=>{access.isCollapsed = !access.isCollapsed}"
      >
        <fold-panal-service-2
          v-for="service of access.header==='Public'?publicService:privateService"
          :foldable="true"
          :is-collapsed="true"
          :custom-id="service.id"
          :title="service.displayLabel"
          :key="service.id"
          :execute-perm-cnt="setCntPermission(service.serviceResources,'executePermission')"
          :read-perm-cnt="setCntPermission(service.serviceResources,'readPermission')"
        >
          <cmp-tree
            :item-source="service.serviceResources"
            :columns="authColumns"
            header-visibility="None"
            :init-custom-action="init"
            @updateGrid="updateTree"
            ref="tree"
            :use-all-expand="false"
            max-height="48vh"
            :init-collapsed="true"
          >
            <template #readPermission="props">
              <el-checkbox
                v-model="props.row.readPermission"
                @change="toggleCheckbox(service,'readPermission', props.row)"
                :disabled="checkboxDisabled"
                ref="treeCheckbox"
                class="auth-tree-checkbox"
              />
            </template>
            <template #executePermission="props">
              <el-checkbox
                v-model="props.row.executePermission"
                @change="toggleCheckbox(service,'executePermission', props.row)"
                :disabled="checkboxDisabled"
                ref="treeCheckbox"
                class="auth-tree-checkbox"
              />
            </template>
          </cmp-tree>
        </fold-panal-service-2>
      </fold-panal-service>
    </section>
  </div>
</template>

<script>

import { createNamespacedHelpers } from 'vuex'
import FoldPanalService from './FoldPanalService.vue'
import FoldPanalService2 from './FoldPanalService2.vue'
import { cloneDeep } from 'lodash'
const { mapGetters } = createNamespacedHelpers('cloud')
export default {
  components: { FoldPanalService, FoldPanalService2 },
  props: {
    active: {
      type: Boolean,
      default: false

    },
    title: {
      type: String,
      default: ''
    },
    serviceList: {
      type: Array,
      default () {
        return []
      }
    },
    selectedRoleIdx: {
      type: Number,
      default () {
        return null
      }
    },
    checkboxDisabled: {
      type: Boolean,
      default: false
    },
    handleConfirm: {
      type: Boolean,
      default: false
    },
    handleInit: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapGetters({
      publicClouds: 'getPublicClouds',
      privateClouds: 'getPrivateClouds'
    })
  },
  watch: {
    selectedRoleIdx: {
      immediate: true,
      handler () {
        this.publicService = cloneDeep(this.publicClouds)
        this.privateService = cloneDeep(this.privateClouds)
        this.setDataService(this.publicService, this.privateService, this.serviceList)
      }
    },
    handleConfirm (val) {
      if (val) { this.handleConfirmModal() }
    },
    handleInit (val) {
      if (val) {
        this.privateService = cloneDeep(this.initialPrService)
        this.publicService = cloneDeep(this.initialPuService)
        this.$emit('init')
      }
    }
  },
  created () {

    // this.setDataService(this.publicService, this.privateService, this.serviceList)
  },
  mounted () {

  },
  methods: {
    setCntPermission (serviceResources, key) {
      let permCount = 0
      serviceResources.forEach((service) => {
        if (service[key]) permCount++
      })
      return permCount
    },
    handleCloseModal () {
      console.log('handleCloseModal')
      this.$emit('close')
    },
    handleConfirmModal () {
      // 서비스 리스트를 반환합니다.
      function getServiceList (arr) {
        const serviceList = []
        arr.forEach(item => {
          item.serviceResources.forEach(resource => {
            const { id, executePermission, readPermission } = resource
            serviceList.push({
              moduleType: item.moduleType,
              executePermission,
              readPermission,
              serviceName: id
            })
          })
        })
        return serviceList
      }
      this.updateServiceList.push(...getServiceList(this.publicService))
      this.updateServiceList.push(...getServiceList(this.privateService))
      this.$emit('confirm', { serviceList: this.updateServiceList })
      this.updateServiceList = []
    },
    init (grid) {
      this.grid = grid
      this.updateTree(this.grid)
    },
    updateTree (grid) {
      console.log('update발생')
      this.grid = grid
    },
    toggleCheckbox (service, key, selectedRow) {
      if (key === 'executePermission') {
        if (!service.readPermission) {
          selectedRow.readPermission = true
        }
      }

      if (key === 'readPermission') {
        if (!selectedRow.readPermission && selectedRow.executePermission) {
          selectedRow.executePermission = false
        }
      }
    },

    setDataService (publicService, privateService, serviceList) {
      const setServicePermission = (resource, serviceData) => {
        const theService = serviceList.filter(service => {
          return resource.id === service.serviceName
        })

        return {
          ...resource,
          readPermission: theService[0]?.readPermission || false,
          executePermission: theService[0]?.executePermission || false
        }
      }

      for (const serviceData of privateService) {
        serviceData.serviceResources = serviceData.serviceResources
          .map((el) => setServicePermission(el, serviceData))
      }
      for (const serviceData of publicService) {
        serviceData.serviceResources = serviceData.serviceResources
          .map((el) => setServicePermission(el, serviceData))
      }
      this.initialPrService = cloneDeep(privateService)
      this.initialPuService = cloneDeep(publicService)
    }
  },
  data () {
    return {
      authColumns: [
        { binding: 'label', header: '메뉴', width: 400, foldable: true, keyPath: 'admin.ROLE.menu' },
        { binding: 'readPermission', header: ' ', width: 120, customHtml: true },
        { binding: 'executePermission', header: ' ', width: '*', customHtml: true }
      ],
      accessPermissions: [{ header: 'Private', isCollapsed: false }, { header: 'Public', isCollapsed: false }],
      serviceByCsp: [],
      privateService: [],
      initialPrService: [],
      initialPuService: [],
      publicService: [],
      updateServiceList: []

    }
  }
}
</script>

<style lang="scss" scoped>

.modal-body {
  height: 500px;
  overflow-y: scroll;

  &::v-deep{
    .wj-row {
      .wj-cell:nth-child(1) {
        padding-left:$gap * 3.5 !important;
      }
      .wj-cell:nth-child(3) {
        padding-left:$gap * 1 !important;
      }
      .wj-cell:nth-child(2) {
      }
    }
  }
}

</style>
