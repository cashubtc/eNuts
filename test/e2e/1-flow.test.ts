import { expect } from 'detox'

/**
 * This test file is to test the happy path of the app
 * ===================================================
 * 1. Go through the onboarding screens
 * 2. Create a quick wallet
 * 3. Skip PIN setup
 * 4. Add the first default mint
 */

describe('Add the default mint', () => {
	beforeAll(async () => {
		await device.launchApp()
	})

	it('should go through the 3 onboarding screens', async () => {
		const header1 = element(by.text('eNuts & Ecash'))
		const header2 = element(by.text('Cashu & Mints'))
		const header3 = element(by.text('Send & receive'))
		const doneBtn = element(by.id('onboarding-done'))
		await expect(header1).toBeVisible()
		await header1.swipe('left')
		await expect(header2).toBeVisible()
		await header2.swipe('left')
		await expect(header3).toBeVisible()
		await header3.swipe('right')
		await expect(header2).toBeVisible()
		await header2.swipe('left')
		await expect(header3).toBeVisible()
		await expect(doneBtn).toBeVisible()
		await doneBtn.tap()
	})

	it('should start a quick wallet without seed', async () => {
		const createWalletBtn = element(by.id('create-quick-wallet'))
		await expect(createWalletBtn).toBeVisible()
		await createWalletBtn.tap()
	})

	it('should skip PIN setup', async () => {
		const skipBtn = element(by.id('Skip-pin-button'))
		await expect(skipBtn).toBeVisible()
		await skipBtn.tap()
	})

	it('should add the first default mint', async () => {
		const header1 = element(by.text('No transactions yet'))
		await expect(header1).toBeVisible()
		const addMintBtn = element(by.id('Mint-btn'))
		await expect(addMintBtn).toBeVisible()
		await addMintBtn.tap()
		const initialModalHeader = element(by.id('initial-modal-header'))
		await expect(initialModalHeader).toBeVisible()
		const addMintUrlBtn = element(by.id('Use the eNuts mint-modal-button'))
		await addMintUrlBtn.tap()
		const successModalHeader = element(by.id('new-mint-success'))
		await expect(successModalHeader).toBeVisible()
	})
})
