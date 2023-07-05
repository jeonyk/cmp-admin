export const digitMap = (root) => ({
  TENS: root.$t('bill.UNIT.TENS'),
  HUNDREDS: root.$t('bill.UNIT.HUNDREDS'),
  THOUSANDS: root.$t('bill.UNIT.THOUSANDS'),
  TEN_THOUSANDS: root.$t('bill.UNIT.TEN_THOUSANDS')
})

export const roundMap = root => ({
  ROUND: root.$t('bill.round'),
  ROUND_UP: root.$t('bill.ceil'),
  ROUND_DOWN: root.$t('bill.floor')
})

export const digitOptions = (root) => [
  {
    value: 'TEN_THOUSANDS',
    name: root.$t('bill.UNIT.TEN_THOUSANDS')
  },
  {
    value: 'THOUSANDS',
    name: root.$t('bill.UNIT.THOUSANDS')
  },
  {
    value: 'HUNDREDS',
    name: root.$t('bill.UNIT.HUNDREDS')
  },
  {
    value: 'TENS',
    name: root.$t('bill.UNIT.TENS')
  }
]

export const digitSetOptions = root => [
  {
    value: 'ROUND_UP',
    name: root.$t('bill.ceil')
  },
  {
    value: 'ROUND',
    name: root.$t('bill.round')
  },
  {
    value: 'ROUND_DOWN',
    name: root.$t('bill.floor')
  }
]

export const tabData = root => [
  {
    isActive: true,
    name: root.$t('bill.MODEL.hardware'),
    field: 'hardware',
    type: 1,
    moduleType: ['NX', 'VMWARE']
  },
  {
    isActive: false,
    name: root.$t('bill.MODEL.software'),
    field: 'software',
    type: 2,
    moduleType: ['NX', 'VMWARE']
  },
  {
    isActive: false,
    name: 'L4',
    field: 'l4',
    type: 3,
    moduleType: ['NX', 'VMWARE']
  },
  {
    isActive: false,
    name: 'L7',
    field: 'l7',
    type: 4,
    moduleType: ['NX', 'VMWARE']
  },
  {
    isActive: false,
    name: 'FIREWALL',
    field: 'firewall',
    type: 5,
    moduleType: ['NX', 'VMWARE']
  },
  {
    isActive: false,
    name: 'Custom 요금',
    field: 'custom',
    type: 6,
    moduleType: ['NX', 'VMWARE']
  },
  {
    isActive: false,
    name: '고정 Compute 요금',
    field: 'fixed-compute',
    type: 10,
    moduleType: ['NX', 'VMWARE']
  },
  {
    isActive: false,
    name: 'Nutanix Files',
    field: 'nas',
    type: 8,
    moduleType: ['NX']
  }
]
