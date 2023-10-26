
class Node<T>{
	value: T
	prev?: Node<T>
	next?: Node<T>
	constructor(v: T, prev?: Node<T>) {
		this.value = v
		this.prev = prev
	}
}
export class LL<T> {
	#head?: Node<T>
	#tail?: Node<T>
	#size = 0
	get size() { return this.#size }
	constructor() { }
	push(v: T) {
		const node = new Node(v, this.#tail)
		if (this.#tail) { this.#tail.next = node }
		this.#tail = node
		if (!this.#head) { this.#head = node }
		this.#size++
	}
	shift() {
		if (!this.#head) { return undefined }
		const v = this.#head.value
		this.#head = this.#head.next
		this.#size--
		return v
	}
	*[Symbol.iterator]() {
		let node = this.#head
		while (node) {
			yield node.value
			node = node.next
		}
	}
}
