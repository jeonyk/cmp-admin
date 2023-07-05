export const tabData = root => [
  {
    isActive: true,
    name: 'EC2',
    field: 'EC2',
    type: 1
  },
  {
    isActive: false,
    name: 'EBS',
    field: 'EBS',
    type: 2
  },
  {
    isActive: false,
    name: 'EFS',
    field: 'EFS',
    type: 3
  },
  {
    isActive: false,
    name: 'NLB',
    field: 'NLB',
    type: 4
  }
  // {
  //   isActive: false,
  //   name: 'ALB',
  //   field: 'ALB',
  //   type: 5
  // }
]

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
