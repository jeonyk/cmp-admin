export function mapReceiverNameFromAPI (receiverType) {
  return {
    allAdmin: '모든 관리자',
    superAdmin: '최고 관리자',
    manageAdmin: '운영 관리자',
    allUser: '모든 사용자',
    middleManager: '중간 관리자',
    billingManager: '빌링 관리자'
  }[receiverType]
}

export function mapReceiverUqFromAPI (receiverType) {
  return {
    allAdmin: 'allAdmin',
    superAdmin: 'CHIEF_MANAGER',
    manageAdmin: 'OPERATIONS_OFFICER',
    allUser: 'allUser',
    middleManager: 'MIDDLE_MANAGER',
    billingManager: 'BILLING_MANAGER'
  }[receiverType]
}

/**
 * ReceiverType
 * (그룹) 모든 관리자 - userPermLevel === null && isAdmin
 * (그룹) 최고 관리자 - userPermLevel === 0 && isAdmin
 * (그룹) 운영 관리자 - userPermLevel === 1 && isAdmin
 * (그룹) 역할 - userPermLevel === null && roleIdx
 * (그룹) 모든 사용자 - userPermLevel === null && !isAdmin
 * (그룹) 중간 관리자 - userPermLevel === 2 && !isAdmin
 * (그룹) 빌링 관리자 - userPermLevel === 3 && !isAdmin
 * (사용자 > 그룹) - groupIdx && companyIdx && !isAdmin
 * (사용자 > 유저) - userIdx && !isAdmin
 * (관리자 > 그룹) - groupIdx && companyIdx && isAdmin
 * (관리자 > 유저) - userIdx && isAdmin
 */
export function mapReceiverFromAPI (receiver) {
  const filteredReceivers = receiver => {
    let receiverType = ''

    const {
      userPermLevel,
      isAdmin,
      roleIdx,
      userIdx,
      groupIdx,
      companyIdx
    } = receiver

    if (userPermLevel === null && !userIdx && isAdmin) {
      receiverType = 'allAdmin'
    } else if (userPermLevel === 0 && !userIdx && isAdmin) {
      receiverType = 'superAdmin'
    } else if (userPermLevel === 1 && !userIdx && isAdmin) {
      receiverType = 'manageAdmin'
    } else if (userPermLevel === null && !userIdx && roleIdx) {
      receiverType = 'role'
    } else if (
      userPermLevel === null &&
      !groupIdx &&
      !roleIdx &&
      !userIdx &&
      !isAdmin
    ) {
      receiverType = 'allUser'
    } else if (userPermLevel === 2 && !userIdx && !isAdmin) {
      receiverType = 'middleManager'
    } else if (userPermLevel === 3 && !userIdx && !isAdmin) {
      receiverType = 'billingManager'
    } else if (groupIdx && companyIdx && !isAdmin && !userIdx) {
      receiverType = 'userGroup'
    } else if (userIdx && !isAdmin) {
      receiverType = 'userUser'
    } else if (groupIdx && companyIdx && isAdmin && !userIdx) {
      receiverType = 'adminGroup'
    } else if (userIdx && isAdmin) {
      receiverType = 'adminUser'
    }

    // receiverPool.push(receiverType)

    return {
      ...receiver,
      receiverType
    }
  }

  return filteredReceivers(receiver)
}
