<template>
  <div class="storage-list">
    <div
      v-if="amiSelected"
      class="storage-body"
    >
      <div
        v-for="(sto, stoIdx) in storage"
        :key="`storage-${stoIdx}`"
        class="storage-body-wrap"
        :class="{ new: sto.isNew }"
      >
        <div class="storage-body-item">
          <div class="storage-body-item__columns">
            <div
              v-for="(size, idx) in columnSizes"
              :style="{
                flex: `1 0 ${size}px`,
                marginRight: columnSizes.length - 1 === idx ? 0 : '7px'
              }"
              :key="idx"
            >
              {{ columnNames[idx] }}
            </div>
          </div>
          <div class="storage-body-item__inputs">
            <div
              v-for="(size, idx) in columnSizes"
              :style="{
                flex: `1 1 ${size}px`,
                marginRight: columnSizes.length - 1 === idx ? 0 : '10px'
              }"
              :key="idx"
            >
              <template v-if="idx === 0">
                <el-input
                  :value="mapRootVolumeType[sto.volumeRootType]"
                  disabled
                />
              </template>
              <!-- 루트 볼륨 유형 -->
              <template v-else-if="idx === 1">
                <el-select
                  v-model="sto.device"
                  :disabled="stoIdx === 0 || (shared.isEdit && !sto.isNew)"
                  @change="onChangeDevice"
                >
                  <el-option
                    v-for="device in devices"
                    :key="device.label"
                    :label="device.label"
                    :value="device.value"
                  />
                </el-select>
              </template>
              <!-- 디바이스 -->
              <template v-else-if="idx === 2">
                <el-input
                  v-model="sto.volumeSize"
                  type="number"
                  class="half-start"
                  style="margin-right: 5px;"
                  :class="{ error: sto.error.when === 2 }"
                  @input="onChangeVolumeSize(sto)"
                />
                <el-select
                  v-model="sto.volumeSizeType"
                  class="half-end"
                  :disabled="shared.isEdit && !sto.isNew"
                >
                  <el-option
                    label="GB"
                    value="GB"
                  />
                </el-select>
              </template>
              <!-- 볼륨 크기 -->
              <template v-else-if="idx === 3">
                <el-select
                  v-model="sto.volumeType"
                  @change="e => onChangeVolumeType(e, stoIdx)"
                  :disabled="shared.isEdit && !sto.isNew"
                >
                  <el-option
                    v-for="type in volumeTypes"
                    :key="type.label"
                    :label="type.label"
                    :value="type.value"
                  />
                </el-select>
              </template>
              <!-- 볼륨 유형 -->
              <template v-else-if="idx === 4">
                <el-input
                  v-model="sto.iops"
                  :type="
                    getDisabledIops(sto.volumeType, stoIdx === 0)
                      ? 'text'
                      : 'number'
                  "
                  :disabled="
                    getDisabledIops(sto.volumeType, stoIdx === 0) ||
                      (!sto.isNew && shared.isEdit && sto.volumeType !== 'gp3')
                  "
                  :class="{ error: sto.error.when === 5 }"
                  @input="onChangeIops(sto)"
                />
              </template>
              <!-- IOPS -->
              <template v-else>
                <el-input
                  v-model="sto.throughput"
                  :type="
                    getDisabledThroughput(sto.volumeType, stoIdx === 0)
                      ? 'text'
                      : 'number'
                  "
                  :disabled="
                    getDisabledThroughput(sto.volumeType, stoIdx === 0) ||
                      (!sto.isNew && shared.isEdit && sto.volumeType !== 'gp3')
                  "
                  :class="{ error: sto.error.when === 6 }"
                  @input="onChangeThroughput(sto)"
                />
              </template>
              <!-- 처리량(MB/초) -->
            </div>
          </div>
        </div>
        <div
          class="storage-validate-error"
          :class="{ hidden: !sto.error.value }"
        >
          {{ sto.error.message }}
        </div>
        <div
          v-if="stoIdx !== 0"
          class="storage-remove"
        >
          <i
            class="mdi mdi-close"
            @click="removeStorage(stoIdx)"
          />
        </div>
      </div>
      <div
        class="storage-add"
        @click="addStorage"
      >
        <i class="mdi mdi-plus-circle-outline" />
      </div>
    </div>
    <ami-empty v-else />
  </div>
</template>

<script>
import AmiEmpty from './AmiEmpty.vue'
import { cloneDeep, isEqual, pick } from 'lodash'

export default {
  components: { AmiEmpty },
  name: 'InstanceStorageList',
  props: {
    amiSelected: {
      type: Boolean,
      required: true
    },
    instanceInfoChanges: {
      type: Array,
      default: () => []
    },
    ami: {
      type: Object,
      default: () => null
    }
  },
  inject: ['shared'],
  watch: {
    amiSelected: {
      immediate: true,
      handler (selected) {
        if (selected) {
          if (!this.shared.isEdit && !this.shared.basketEdit) this.storage = [this.getDefaultData('gp2', true)]
          if (!this.basketEditFirstStorageMapped && this.shared.basketEdit) {
            this.mappingStorageFromServerBasket(this.shared.basketData.orderData.blockDeviceMapping)
          }
          this.initDeviceSelects()
        } else {
          this.storage = []
        }
      }
    },
    storage: {
      immediate: true,
      handler (items) {
        this.$emit('sync-storage', items)
        this.initDeviceSelects()
      }
    },
    ami (_) {
      this.initDeviceSelects()
    },
    'shared.active' (visible) {
      if (visible) {
        this.initDeviceSelects()
        if (this.shared.isEdit) this.mappingStorageFromServer(this.shared.editData)
      } else if (!visible && this.shared.isEdit && !this.shared.basketEdit) {
        this.editStorageData = []
        this.storage = []
      } else if (!visible && this.shared.basketEdit) {
        this.basketEditFirstStorageMapped = false
      }
    }
  },
  created () {
    if (this.shared.active && this.shared.isEdit) {
      this.mappingStorageFromServer(this.shared.editData)
    }
  },
  methods: {
    /**
     * 디바이스 목록 최신화
     */
    syncDeviceSelects () {
      const devices = this.storage.map(sto => sto.device)
      this.devices = this.devices.filter(selectDevice => !devices.includes(selectDevice.value))
    },
    /**
     * 디바이스 목록을 초기화
     */
    initDeviceSelects () {
      const defaultRootDevice = { label: '/dev/sda1', value: '/dev/sda1' }
      const availableDevices = []

      if (this.ami) {
        defaultRootDevice.label = this.ami.rootDeviceName
        defaultRootDevice.value = this.ami.rootDeviceName

        if (this.storage.length) this.storage[0].device = this.ami.rootDeviceName
      }

      for (let i = 0; i < 2; i++) {
        const start = i === 0 ? 97 : 98
        for (let j = start; j < 123; j++) {
          const device = '/dev/' + (i === 0 ? 'sd' : 'xvd') + String.fromCharCode(j)
          availableDevices.push({ label: device, value: device })
        }
      }

      this.devices = [defaultRootDevice, ...availableDevices]
      this.syncDeviceSelects()
    },
    onChangeIops (sto) {
      if (this.shared.isEdit && sto.volumeType === 'gp3') this.checkChanges()
    },
    onChangeThroughput (sto) {
      if (this.shared.isEdit && sto.volumeType === 'gp3') this.checkChanges()
    },
    onChangeDevice () {
      if (this.shared.isEdit) this.checkChanges()
      this.initDeviceSelects()
    },
    /**
     * 변경점 체크
     */
    checkChanges (beforeChanges = this.instanceInfoChanges) {
      // 수정시에만 적용
      if (!this.shared.isEdit) return

      const changes = []

      const getCompareResult = (before, current) => {
        // 비교할 객체의 키를 가져온다.
        // 기존에 존재하던 스토리지는 볼륨 유형별 수정할 수 있는 범위가
        // 다르지만, gp3를 제외하고 모든 볼륨 유형은
        // volumeSize만 변경이 가능하다.
        const pickKeys = ['volumeSize', 'iops', 'throughput', 'volumeId']
        // 비교할 대상의 스토리지 객체들에서 비교하려는 키만 선택한다.
        const pickBefore = pick(before, pickKeys)
        const pickAfter = pick(current, pickKeys)

        // 볼륨 사이즈의 타입을 통일시킨다.
        pickBefore.volumeSize = parseInt(pickBefore.volumeSize)
        pickAfter.volumeSize = parseInt(pickAfter.volumeSize)

        return isEqual(pickBefore, pickAfter)
      }

      if (
        this.storage.length &&
        this.editStorageData.length === this.storage.length
      ) {
        // 변경 이전 스토리지 데이터와 변경 후 스토리지 데이터의 길이가
        // 같은 경우 각 데이터 값의 키 isNew를 비교해서
        // 새로 신청된 데이터인지를 한번 더 체크한 후에
        // 새로 신청되는 데이터인 경우 '추가' 타입의 변경 사항 추가
        this.storage.forEach((sto, stoIdx) => {
          // 사전 작업
          const beforeStorage = this.editStorageData[stoIdx]

          if (!sto.isNew && !beforeStorage.isNew) {
            // 스토리지가 기존에 존재하던 스토리지고
            // 비교하는 스토리지도 기존에 존재하던 스토리지다.
            // = 같은 스토리지
            const isSame = getCompareResult(beforeStorage, sto)

            if (isSame) {
              // 변경점이 없을 때 (동일)
            } else {
              // 기존 스토리지에 변경점이 생겼다고 판단될 때
              changes.push({
                id: 'ec2-edit-storage-' + stoIdx,
                title: '변경',
                type: 'change',
                items: [
                  {
                    title: '변경 전',
                    changeValue: beforeStorage
                  },
                  {
                    title: '변경 후',
                    changeValue: sto
                  }
                ]
              })
            }
          }
        })
      } else if (this.storage.length) {
        // 기존 스토리지 갯수와 현재 스토리지 갯수가 다른 경우를 처리한다.
        this.storage.forEach((sto, stoIdx) => {
          // 현재 루프에서 스토리지가 기존의 스토리지라면 원본 스토리지의
          // 같은 인덱스가 기존 스토리지인지 체크한다.
          if (
            !sto.isNew &&
            this.editStorageData[stoIdx] &&
            !this.editStorageData[stoIdx].isNew
          ) {
            const beforeStorage = this.editStorageData[stoIdx]
            const isSame = getCompareResult(beforeStorage, sto)

            if (isSame) {
            } else {
              changes.push({
                id: 'ec2-edit-storage-' + stoIdx,
                title: '변경',
                type: 'change',
                items: [
                  {
                    title: '변경 전',
                    changeValue: beforeStorage
                  },
                  {
                    title: '변경 후',
                    changeValue: sto
                  }
                ]
              })
            }
          } else if (sto.isNew) {
            changes.push({
              id: 'ec2-edit-storage-' + stoIdx,
              title: '추가',
              type: 'add',
              items: [{ title: '추가', changeValue: sto }]
            })
          }
        })
      }

      this.$emit('change-storage', changes.concat(...this.removedStorageChange))
    },
    /**
     * 변경시 서버에서 받아온 스토리지 데이터 적용 (장바구니)
     */
    mappingStorageFromServerBasket (storage) {
      if (!storage || !this.shared.basketEdit) return

      const transform = (sto, stoIdx) => ({
        ...sto,
        iops: sto.iops || '해당 사항 없음',
        volumeRootType: stoIdx === 0 ? 0 : 1,
        volumeSize: sto.size || '0',
        volumeSizeType: 'GB',
        device: sto.attachedDevice || sto.deviceName || '',
        error: {
          when: 0,
          value: false,
          message: ''
        },
        isNew: sto.isNew || false,
        throughput: sto.throughput || '해당 사항 없음'
      })
      if (!this.shared.isEdit) storage.map(s => { s.isNew = false })
      // ec2 "변경" 건 진입 시 기존에 생성된 스토리지만 나열 isNew = false
      const copied = storage.filter(s => !s.isNew).map(transform)

      copied.forEach(this.onChangeVolumeSize)

      this.editStorageData = cloneDeep(copied)

      if (this.shared.isEdit && this.shared.basketEdit) {
        this.editStorageData = this.shared.basketData.orderData.beforeData.blockDeviceMapping.map(transform)
      }

      this.storage = copied
      this.basketEditFirstStorageMapped = true
      this.storage.forEach(this.onChangeVolumeSize)
      this.checkChanges()
    },
    /**
     * 변경시 서버에서 받아온 스토리지 데이터 적용
     */
    mappingStorageFromServer (editData) {
      if (!editData) return

      const copied = editData.orderData.blockDeviceMapping.map((sto, stoIdx) => ({
        ...sto,
        volumeRootType: stoIdx === 0 ? 0 : 1,
        volumeSize: sto.size || '0',
        volumeSizeType: 'GB',
        device: sto.attachedDevice,
        error: {
          when: 0,
          value: false,
          message: ''
        },
        isNew: false,
        throughput: sto.throughput || '해당 사항 없음'
      }))

      copied.forEach(this.onChangeVolumeSize)

      this.editStorageData = cloneDeep(copied)
      this.storage = copied
      this.$emit('edit-origin-data', this.editStorageData)
    },
    rangeCheck (min, max, size) {
      return size >= min && size < max
    },
    /**
     * 볼륨 크기가 변경될 때 이벤트
     */
    onChangeVolumeSize (storage) {
      if (storage.volumeType === 'gp2') {
        // gp2 볼륨 크기가 변경할 때 IOPS를 변화시킨다.
        const suffix = '/3000'
        const size = storage.volumeSize

        if (!size || parseInt(size) <= 33) {
          storage.iops = 100 + suffix
        } else if (parseInt(size) === 34) {
          storage.iops = 102 + suffix
        } else {
          storage.iops = 102 + (parseInt(size) - 34) * 3 + suffix
        }
      } else if (storage.volumeType === 'sc1' || storage.volumeType === 'st1') {
        const sizeMap =
          storage.volumeType === 'sc1' ? this.sc1SizeMap : this.st1SizeMap
        const volumeMap =
          storage.volumeType === 'sc1' ? this.sc1VolumeMap : this.st1VolumeMap

        // sc1, st1 볼륨 크기를 변경할 때 처리량을 변화시킨다.
        let prefix = 0
        let suffix = 0
        const size = parseInt(storage.volumeSize)

        if (size < 125) {
          if (storage.volumeType === 'sc1') {
            prefix = 2
            suffix = 10
          } else {
            prefix = 5
            suffix = 31
          }
        } else {
          let i = 0

          for (i = 0; i < sizeMap.length - 1; i++) {
            if (this.rangeCheck(sizeMap[i], sizeMap[i + 1], size)) {
              prefix = volumeMap[i][0]
              suffix = volumeMap[i][1]
              break
            }
          }

          if (i === 18 && size >= 16000) {
            prefix = volumeMap[volumeMap.length - 1][0]
            suffix = volumeMap[volumeMap.length - 1][1]
          }
        }

        storage.throughput = prefix + '/' + suffix
      }

      if (this.shared.isEdit) this.checkChanges()
    },
    resetData () {
      this.storage = [this.getDefaultData('gp2', true)]
    },
    removeStorage (idx) {
      if (idx === 0) return

      /**
       * 기존 볼륨 삭제시 confirm
       */
      if (this.shared.isEdit && this.storage[idx].attachedDevice) {
        const text = `기존 볼륨 삭제 시 볼륨 내의 데이터가<br>
        모두 삭제되며, 복구는 불가합니다.<br>
        삭제를 진행하시겠습니까?<br>
        <p class="modal-error-text">* 실제 복륨 삭제는 결재 이후 작업시 처리됩니다.</p>`
        return this.$confirm(text, { dangerouslyUseHTMLString: true })
          .then(() => {
            // 기존에 등록된 스토리지 삭제시 원본 컴포넌트 데이터에서도 삭제해야됨
            this.storage.splice(idx, 1)
            const removed = this.editStorageData.splice(idx, 1)
            const changes = [
              {
                id: 'ec2-edit-storage-remove-' + idx,
                title: '삭제',
                type: 'remove',
                items: [{ title: '삭제', changeValue: removed[0] }]
              }
            ]
            this.removedStorageChange.push(changes)
            this.$emit(
              'change-storage',
              this.instanceInfoChanges.concat(changes)
            )
          })
          .catch(() => false)
      } else {
        this.storage.splice(idx, 1)
      }

      if (this.shared.isEdit) this.checkChanges()
    },
    onChangeVolumeType (e, idx) {
      this.storage.splice(idx, 1, this.getDefaultData(e, idx === 0))
      if (this.shared.isEdit) this.checkChanges()
    },
    getDisabledIops (volumeType, isRoot) {
      return !['gp3'].includes(volumeType)
    },
    getDisabledThroughput (volumeType, isRoot) {
      return (
        volumeType === 'gp2' ||
        volumeType === 'standard' ||
        volumeType === 'sc1' ||
        volumeType === 'st1'
      )
    },
    addStorage () {
      this.storage.push(this.getDefaultData('gp2'))
      this.checkChanges()
    },
    /**
     * 볼륨 유형별 Default 처리량 반환
     */
    getDefaultThroughput (volumeType) {
      switch (volumeType) {
        case 'standard':
        case 'gp2':
          return '해당 사항 없음'
        case 'gp3':
          return '125'
        case 'sc1':
          return '2/10'
        case 'st1':
          return '5/31'
        default:
          return '해당 사항 없음'
      }
    },
    /**
     * 볼륨 유형별 Default 데이터 반환
     */
    getDefaultData (volumeType, isRoot) {
      const defaultData = {
        volumeRootType: 1,
        device: this.devices[0].value,
        volumeType: 'gp2',
        volumeSize: 8,
        volumeSizeType: 'GB',
        iops: '100/3000',
        throughput: '해당 사항 없음',
        error: {
          when: 0,
          value: false,
          message: ''
        },
        isNew: this.shared.isEdit
      }

      defaultData.volumeRootType = isRoot ? 0 : 1
      defaultData.volumeType = volumeType

      switch (volumeType) {
        case 'gp2':
          break
        case 'gp3':
          defaultData.iops = '3000'
          defaultData.throughput = '125'
          break
        case 'sc1':
          defaultData.volumeSize = 125
          defaultData.iops = '해당 사항 없음'
          defaultData.throughput = '2/10'
          break
        case 'st1':
          defaultData.volumeSize = 125
          defaultData.iops = '해당 사항 없음'
          defaultData.throughput = '5/31'
          break
        case 'standard':
          defaultData.volumeSize = 8
          defaultData.iops = '해당 사항 없음'
          defaultData.throughput = '해당 사항 없음'
          break
        default:
          break
      }

      return defaultData
    },
    /**
     * 모든 스토리지를 벨리데이션 한다.
     */
    validationStorage () {
      this.storage.forEach((sto, idx) => {
        // 모든 스토리지의 에러 값을 초기 상태로 바꾼다.
        sto.error.value = false
        sto.error.when = -1
        sto.error.message = ''
        // 유형별 다른 벨리데이션을 적용한다.
        switch (sto.volumeType) {
          case 'gp2':
            // 볼륨 크기 1GB 이상 여부를 체크한다.
            // GB가 아닌 경우 GB로 변환한다.
            // 볼륨 크기 유형의 종류가 정해지면 개발 필요
            if (sto.volumeSize < 1) {
              const limit = 1
              sto.error.value = true
              sto.error.when = 2
              sto.error.message =
                sto.volumeType +
                ' 유형의 볼륨 크기는 ' +
                limit +
                'GB 이상 입력해야 합니다.'
              break
            }
            // (자원 수정시)
            // 기존 스토리지보다 낮은 볼륨 설정시 에러 메세지 노출
            if (this.shared.isEdit && !sto.isNew) {
              if (this.editStorageData[idx].size > parseInt(sto.volumeSize)) {
                sto.error.value = true
                sto.error.when = 2
                sto.error.message =
                  '볼륨 크기는 기존 볼륨 크기보다 작게 설정할 수 없습니다. 기존 볼륨 크기 : ' +
                  this.editStorageData[idx].volumeSize +
                  'GB'
              }
            }
            break
          case 'gp3':
            // 볼륨 크기 1GB 이상 여부를 체크한다.
            if (sto.volumeSize < 1) {
              const limit = 1
              sto.error.value = true
              sto.error.when = 2
              sto.error.message =
                sto.volumeType +
                ' 유형의 볼륨 크기는 ' +
                limit +
                'GB 이상 입력해야 합니다.'
            } else if (!sto.iops) {
              sto.error.value = true
              sto.error.when = 5
              sto.error.message = 'IOPS를 입력해주세요.'
            } else {
              const iops = parseInt(sto.iops)
              const invalidIops = Number.isNaN(iops)

              if (invalidIops || iops < 3000 || iops > 16000) {
                // IOPS 3000 ~ 16000 사이의 값인지 체크한다.
                sto.error.value = true
                sto.error.when = 5
                sto.error.message =
                  sto.volumeType +
                  ' 유형의 IOPS는 3000 ~ 16000 사이의 값을 입력해야 합니다.'
                break
              }

              const throughput = parseInt(sto.throughput)
              const invalidThroughput = Number.isNaN(throughput)

              if (invalidThroughput || throughput < 125 || throughput > 1000) {
                // 처리량 125 ~ 1000 사이의 값인지 체크한다.
                sto.error.value = true
                sto.error.when = 6
                sto.error.message =
                  sto.volumeType +
                  ' 유형의 처리량은 125 ~ 1000 사이의 값을 입력해야 합니다.'
              }
              break
            }

            // (자원 수정시)
            // 기존 스토리지보다 낮은 볼륨 설정시 에러 메세지 노출
            if (this.shared.isEdit && !sto.isNew) {
              if (this.editStorageData[idx].volumeSize > sto.volumeSize) {
                sto.error.value = true
                sto.error.when = 2
                sto.error.message =
                  '볼륨 크기는 기존 볼륨 크기보다 작게 설정할 수 없습니다. 기존 볼륨 크기 : ' +
                  this.editStorageData[idx].volumeSize +
                  'GB'
              }
            }
            break
          case 'sc1':
          case 'st1':
          case 'standard': {
            // sc1, st1, standard 유형의 볼륨 크기는 125GB 이상
            const volume = parseInt(sto.volumeSize)
            const invalid = Number.isNaN(volume)

            if (invalid || volume < 125) {
              const limit = 125
              sto.error.value = true
              sto.error.when = 2
              sto.error.message =
                sto.volumeType +
                ' 유형의 볼륨 크기는 ' +
                limit +
                'GB 이상 입력해야 합니다.'
              break
            }

            // (자원 수정시)
            // 기존 스토리지보다 낮은 볼륨 설정시 에러 메세지 노출
            if (this.shared.isEdit && !sto.isNew) {
              if (this.editStorageData[idx].volumeSize > sto.volumeSize) {
                sto.error.value = true
                sto.error.when = 2
                sto.error.message =
                  '볼륨 크기는 기존 볼륨 크기보다 작게 설정할 수 없습니다. 기존 볼륨 크기 : ' +
                  this.editStorageData[idx].volumeSize +
                  'GB'
              }
            }
            break
          }
        }
      })

      const isStorageError = this.storage
        .map(sto => sto.error.value)
        .some(Boolean)

      if (isStorageError) {
        // 에러가 난 위치의 input을 강조 처리 한다.
      }

      return isStorageError
    }
  },
  data: () => ({
    /**
     * 장바구니 데이터 수정시 스토리지 매핑이 끝난 후 트리거
     */
    basketEditFirstStorageMapped: false,
    /**
     * 기존에 존재하던 스토리지를 삭제했을 경우
     * 변경 사항을 아래다 담음
     */
    removedStorageChange: [],
    editStorageData: [],
    /**
     * 볼륨 유형
     */
    volumeTypes: [
      { label: '범용 SSD(gp2)', value: 'gp2' },
      { label: 'General Purpose SSD(gp3)', value: 'gp3' },
      { label: '콜드 HDD(sc1)', value: 'sc1' },
      { label: '처리량에 최적화된 HDD(st1)', value: 'st1' },
      { label: '마그네틱(standard)', value: 'standard' }
    ],
    /**
     * 루트 볼륨 유형
     */
    mapRootVolumeType: {
      0: '루트',
      1: 'EBS'
    },
    /**
     * 디바이스
     */
    devices: [
      { label: '/dev/sda1', value: '/dev/sda1' }
    ],
    /**
     * 볼륨 유형 (루트, EBS) - 루트 외엔 다 EBS인듯 disabled
     * 디바이스 select
     * 볼륨 크기 input, number + select
     * 볼륨 유형 select
     * IOPS - 루트 default 100/3000
     * 처리량(MB/초) - input
     */
    storage: [],
    /**
     * 컬럼 사이즈
     */
    columnSizes: [60, 100, 135, 190, 110, 110],
    /**
     * 컬럼 이름
     */
    columnNames: [
      '볼륨 유형',
      '디바이스',
      '볼륨 크기',
      '볼륨 유형',
      'IOPS',
      '처리량(MB/초)'
    ],
    st1VolumeMap: [
      [5, 31],
      [20, 125],
      [40, 250],
      [80, 500],
      [120, 500],
      [160, 500],
      [200, 500],
      [240, 500],
      [280, 500],
      [320, 500],
      [360, 500],
      [400, 500],
      [440, 500],
      [480, 500],
      [500, 500],
      [500, 500],
      [500, 500],
      [500, 500],
      [500, 500]
    ],
    sc1VolumeMap: [
      [2, 10],
      [6, 40],
      [12, 80],
      [24, 160],
      [36, 240],
      [38, 250],
      [48, 250],
      [60, 250],
      [72, 250],
      [84, 250],
      [96, 250],
      [108, 250],
      [120, 250],
      [132, 250],
      [144, 250],
      [156, 250],
      [168, 250],
      [180, 250],
      [192, 250]
    ],
    sc1SizeMap: [
      125,
      500,
      1000,
      2000,
      3000,
      3125,
      4000,
      5000,
      6000,
      7000,
      8000,
      9000,
      10000,
      11000,
      12000,
      13000,
      14000,
      15000,
      16000
    ],
    st1SizeMap: [
      125,
      500,
      1000,
      2000,
      3000,
      4000,
      5000,
      6000,
      7000,
      8000,
      9000,
      10000,
      11000,
      12000,
      12500,
      13000,
      14000,
      15000,
      16000
    ]
  })
}
</script>

<style lang="scss" scoped>
.storage-body {
  &-wrap {
    position: relative;

    &.new {
      .storage-body-item {
        background-color: #0A0C20;
        box-shadow: 4px 4px 20px rgba(96, 8, 8, 0.1);
        border: 1px solid #f8dcdc;
        border-radius: 6px;

        &::v-deep {
          .el-input__inner:not([disabled]) {
            // background-color: $white;
          }
        }
      }
    }

    .storage-remove {
      position: absolute;
      top: 5px;
      right: 10px;

      .mdi::before {
        font-size: 16px;
        cursor: pointer;
      }
    }
  }

  &-item {
    height: 108px;
    max-height: 108px;
    box-sizing: border-box;
    padding: $gap;
    box-shadow: 4px 4px 20px rgba(11, 1, 1, 0.1);
    background-color: #232642;

    &__columns {
      display: flex;
      flex-wrap: nowrap;
      padding-bottom: $gap-s;
      border-bottom: 1px solid #2A2D44;
    }

    &__inputs {
      display: flex;
      flex-wrap: nowrap;
      padding-top: $gap-s;

      &::v-deep {
        .el-input.error {
          .el-input__inner {
            border-color: $primary;
            color: $primary;

            &:focus {
              color: $primary !important;
            }
          }
        }

        .el-select {
          width: 100%;

          .el-input__inner {
            width: 100%;
          }
        }

        .half-start {
          width: calc(40% - 5px);
          margin-right: 5px;
        }

        .half-end {
          width: 60%;
        }
      }
    }
  }

  .storage-add {
    display: block;
    border-radius: 6px;
    padding: $gap-s 0;
    text-align: center;
    border: 1px dashed $input-placeholder;
    background-color: rgba(193, 188, 208, 0.05);
    cursor: pointer;
    margin-top: $gap-s;

    .mdi {
      justify-content: center;

      &::before {
        font-size: 25px;
        color: $input-stroke;
      }
    }
  }

  .storage-validate-error {
    margin: 10px 0 15px 0;
    opacity: 1;
    color: $main-blue;

    &.hidden {
      opacity: 0;
    }
  }
}
</style>
