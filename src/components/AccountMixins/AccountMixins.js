
// 비밀번호, 이메일, 핸드폰 패턴 (공통)
export const pwPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!#$%&*?@])[A-Za-z\d!#$%&*?@]{8,}$/
export const emailPattern = /^[a-zA-Z0-9]+([-._]?[a-zA-Z0-9]+)*[-_]?@[a-zA-Z]+[.]{1}([a-zA-Z]{3}|[a-zA-Z]{2,5}.[a-zA-z]{2})$/
export const phonePattern = /^\d{2,3}-\d{3,4}-\d{4}$/

/*
// (220803) 제공받은 패턴 - 안됨;;
const pwPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!#$%&*?@])[A-Za-z\d!#$%&*?@]{8,}$/
const emailPattern = /([\w-.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/
const phonePattern = /^\d{2,3}-\d{3,4}-\d{4}$/
*/

// 사번 (4~50)
export const validatorUserId = userId => (userId.length >= 4 && userId.length <= 50)
// 이름 (2~50)
export const validatorUserName = userName => (userName.length >= 2 && userName.length <= 50)
