/**
 * 购物车本地存储
 * 结构：[{ id, name, desc, price, img, qty }]
 * 仅用于演示购买链路，不涉及真实订单与支付。
 */
const CART_KEY = 'wy_cart'

export function getCart() {
	try {
		const raw = uni.getStorageSync(CART_KEY)
		return Array.isArray(raw) ? raw : []
	} catch (e) {
		return []
	}
}

function saveCart(list) {
	try {
		uni.setStorageSync(CART_KEY, list)
	} catch (e) {
		// ignore
	}
}

export function addToCart(item, qty = 1) {
	if (!item || !item.id) return getCart()
	const list = getCart()
	const idx = list.findIndex((x) => x.id === item.id)
	if (idx >= 0) {
		list[idx].qty = (list[idx].qty || 1) + qty
	} else {
		list.push({
			id: item.id,
			name: item.name || '商品',
			desc: item.desc || '',
			price: item.price || '0',
			img: item.img || '',
			qty: qty
		})
	}
	saveCart(list)
	return list
}

export function updateQty(id, qty) {
	const list = getCart()
	const idx = list.findIndex((x) => x.id === id)
	if (idx >= 0) {
		list[idx].qty = Math.max(1, qty)
		saveCart(list)
	}
	return list
}

export function removeCart(id) {
	const list = getCart().filter((x) => x.id !== id)
	saveCart(list)
	return list
}

export function cartCount() {
	return getCart().reduce((sum, x) => sum + (x.qty || 1), 0)
}

/** 从「¥ 89」这类文案里取出数值 */
export function toNumber(v) {
	const n = parseFloat(String(v).replace(/[^\d.]/g, ''))
	return isNaN(n) ? 0 : n
}
