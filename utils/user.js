/**
 * 当前登录用户的收货身份信息
 *
 * 网站端（H5）：从本地登录态自动读取并匹配收货人 / 手机号 / 地址，
 *   登录后可通过 uni.setStorageSync('wy_user', { name, phone, address }) 写入；
 *   未取到登录信息时回退到演示身份，保证页面不出现空字段。
 * 小程序端：不返回任何地址与手机号，配套 SHOW_CONTACT = false 整块隐藏。
 */

const USER_KEYS = ['wy_user', 'wy_user_info', 'userInfo', 'uni-id-pages-userInfo']

const GUEST = {
	name: '婺绣友人',
	phone: '138****6724',
	address: '浙江省金华市婺城区XX路XX号'
}

/** 兼容不同登录来源的字段命名 */
function normalize(u) {
	if (!u || typeof u !== 'object') return null
	const name = u.name || u.nickName || u.nickname || u.userName || u.account || ''
	const phone = u.phone || u.mobile || u.tel || u.phoneNumber || ''
	let address = u.address || u.addr || u.detailAddress || ''
	if (!address && (u.province || u.city || u.district)) {
		address = [u.province, u.city, u.district, u.detail].filter(Boolean).join('')
	}
	if (!name && !phone && !address) return null
	return {
		name: name || GUEST.name,
		phone: phone,
		address: address
	}
}

/** 读取当前登录用户；未登录或无资料时回退演示身份（仅 H5 有值） */
export function getCurrentUser() {
	// #ifdef H5
	try {
		for (let i = 0; i < USER_KEYS.length; i++) {
			const raw = uni.getStorageSync(USER_KEYS[i])
			const hit = normalize(raw)
			if (hit) return hit
		}
	} catch (e) {
		// ignore
	}
	return { ...GUEST }
	// #endif
	// #ifndef H5
	return { name: '', phone: '', address: '' }
	// #endif
}

/** 地址 / 手机号是否展示：网站端展示，小程序端完全隐藏 */
export const SHOW_CONTACT = (() => {
	// #ifdef H5
	return true
	// #endif
	// #ifndef H5
	return false
	// #endif
})()
