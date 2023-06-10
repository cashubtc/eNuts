
import { getEncodedToken } from '@cashu/cashu-ts'
import {
	addInvoice,
	addMint,
	addMints,
	addToken,
	delInvoice,
	getAllInvoices,
	getBalance,
	getInvoice,
	getMints,
	getMintsBalances,
	hasMints,
	initDb
} from '@db'



describe('test db helper', () => {
	beforeEach(async () => { await initDb() })

	// setup vars
	const mints = [
		{ mintUrl: 'mint1-2Ids', id: 'mint1-id1' },
		{ mintUrl: 'mint1-2Ids', id: 'mint1-id2' },
		{ mintUrl: 'mint2', id: 'mint2-id' },
		{ mintUrl: 'mint3-noProofs', id: 'mint3-id' },
	]
	const rawToken = {
		token: [
			{
				mint: 'mint1-2Ids',
				proofs: [
					{
						amount: 1,
						secret: '1',
						C: '1',
						id: 'mint1-id1'
					}, {
						amount: 2,
						secret: '2',
						C: '2',
						id: 'mint1-id2'
					},
				]
			}, {
				mint: 'mint2',
				proofs: [
					{
						amount: 3,
						secret: '3',
						C: '3',
						id: 'mint2-id'
					}
				]
			}
		]
	}
	const token = getEncodedToken(rawToken)

	test('mint helper', async () => {
		// test hasMints
		expect(await hasMints()).toBe(false)
		// test getMints
		expect(await getMints()).toStrictEqual([])
		// add mint
		expect(await addMint('test', 'testid')).toBe(true)
		// add mints
		expect(await addMints(...mints)).toBe(true)
		// test hasMints
		expect(await hasMints()).toBe(true)
		// test getMints
		expect(await getMints()).toMatchObject(
			[{ mintUrl: 'test', id: 'testid' }, ...mints,]
		)
	})
	test('db Invoice', async () => {
		// setup vars
		const time = Math.ceil(Date.now() / 1000) - 60
		const invoiceTest = { pr: 'pr', hash: 'hash', amount: 100, mintUrl: 'minturl' }


		// test addInvoice
		expect(await addInvoice(
			{ pr: 'pr', hash: 'hash', amount: 100, mintUrl: 'minturl' }
		)).toBe(true)

		// test getInvoice
		const invoice = await getInvoice('hash')
		expect(invoice).toBeTruthy()
		expect(invoice)
			.toMatchObject(invoiceTest)
		expect(invoice?.time).toBeGreaterThanOrEqual(time)
		// test getAllInvoices
		expect(await getAllInvoices()).toMatchObject([invoiceTest])
		// test delInvoice
		expect(await delInvoice('hash')).toBe(true)
		// test getAllInvoices
		expect(await getAllInvoices()).toStrictEqual([])
	})
	test('db bal', async () => {
		expect(await hasMints()).toBe(false)
		expect(await getBalance()).toBe(0)
		expect(await addMints(...mints)).toBe(true)
		expect(await getMintsBalances()).toStrictEqual([
			{ mintUrl: 'mint1-2Ids', amount: 0, name: '' },
			{ mintUrl: 'mint2', amount: 0, name: '' },
			{ mintUrl: 'mint3-noProofs', amount: 0, name: '' },
		])

		await addToken(token)

		expect(await getMintsBalances()).toStrictEqual([
			{ mintUrl: 'mint1-2Ids', amount: 3, name: '' },
			{ mintUrl: 'mint2', amount: 3, name: '' },
			{ mintUrl: 'mint3-noProofs', amount: 0, name: '' },
		])
		expect(await getBalance()).toBe(6)
	})
})