import { expect } from 'detox'

/**
 * This test file is to test the happy path of the app
 * ===================================================
 * 1. Go through the onboarding screens
 * 2. Create a quick wallet
 * 3. Skip PIN setup
 * 4. Add the testnut mint
 * 5. Mint some cashu token
 * 6. Check history entry
 * 7. Create new cashu token
 * 8. Claim the cashu token
 * 9. // TODO Melt a cashu token
 */
// const testmint = 'testnut.cashu.space'
const noFeesMint = 'nofees.testnut.cashu.space'
const testAmount = '100'

describe('Test the happy path of the app', () => {
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
		const skipBtn = element(by.id('Skip-button'))
		await expect(skipBtn).toBeVisible()
		await skipBtn.tap()
	})

	it('should navigate to mint screen and press "Add a new mint"', async () => {
		const header1 = element(by.text('No transactions yet'))
		await expect(header1).toBeVisible()
		const addMintBtn = element(by.id('Mint-btn'))
		await expect(addMintBtn).toBeVisible()
		await addMintBtn.tap()
		const addNewMintBtn = element(by.id('Add a new mint-modal-button'))
		await expect(addNewMintBtn).toBeVisible()
		await addNewMintBtn.tap()
	})

	it('BAD CASE: open the text input and type an invalid mint url', async () => {
		const input = element(by.id('Mint URL-input'))
		const submitBtn = element(by.id('Add mint-modal-button'))
		await expect(input).toBeVisible()
		await expect(submitBtn).toBeVisible()
		await input.typeText('invalid-mint-url')
		await submitBtn.tap()
		const errorToaster = element(by.id('error-toaster'))
		await expect(errorToaster).toBeVisible()
		await errorToaster.tap()
		await input.clearText()
	})

	it('should type the valid testnut url and submit', async () => {
		const input = element(by.id('Mint URL-input'))
		const submitBtn = element(by.id('Add mint-modal-button'))
		await expect(input).toBeVisible()
		await expect(submitBtn).toBeVisible()
		await input.typeText(noFeesMint)
		await submitBtn.tap()
		const successModalHeader = element(by.id('new-mint-success'))
		await expect(successModalHeader).toBeVisible()
	})

	it('should mint the first cashu token', async () => {
		await device.disableSynchronization()
		await element(by.id('Yes-modal-button')).tap()
		const continueBtn = element(by.id('Continue-modal-button'))
		await waitFor(continueBtn).toBeVisible().withTimeout(5000)
		await continueBtn.tap()
		const input = element(by.id('mint-amount-input'))
		await input.typeText(testAmount)
		await continueBtn.tap()
		const qr = element(by.id('qr-code'))
		await waitFor(qr).toBeVisible().withTimeout(10000)
		await expect(qr).toBeVisible()
		const amount = element(by.id(`amount: ${testAmount}`))
		await waitFor(amount).toBeVisible().withTimeout(25000)
		await expect(amount).toBeVisible()
		await element(by.id('Back to dashboard-modal-button')).tap()
		await device.enableSynchronization()
	})

	it('should show the transaction in the History', async () => {
		await device.disableSynchronization()
		const historyEntry = element(by.id('history-entry-0'))
		await expect(historyEntry).toBeVisible()
		await historyEntry.tap()
		await expect(element(by.id('history-entry-details'))).toBeVisible()
		await element(by.id('back-btn-top-nav')).tap()
		await expect(element(by.id(`balance: ${testAmount}`))).toBeVisible()
		await device.enableSynchronization()
	})

	it('should create a new cashu token', async () => {
		await device.disableSynchronization()
		await element(by.id('Send-btn')).tap()
		await element(by.id('send-ecash-option')).tap()
		await element(by.id('mint-amount-input')).typeText('50')
		await element(by.id('continue-send-ecash')).tap()
		await element(by.id('swipe-confirm-button')).swipe('right')
		const qr = element(by.id('qr-code'))
		await waitFor(qr).toBeVisible().withTimeout(10000)
		await expect(element(by.id('50-txt'))).toBeVisible()
		await qr.tap()
		await element(by.id('back-btn-top-nav')).tap()
		await expect(element(by.id('history-entry-1'))).toBeVisible()
		await device.enableSynchronization()
	})

	it('should claim the cashu token', async () => {
		await device.disableSynchronization()
		const receiveBtn = element(by.id('Receive-btn'))
		await expect(receiveBtn).toBeVisible()
		await receiveBtn.tap()
		await element(by.id('send-ecash-option')).tap()
		const amount = element(by.id('amount: 50'))
		await waitFor(amount).toBeVisible().withTimeout(5000)
		await expect(amount).toBeVisible()
		await element(by.id('Back to dashboard-modal-button')).tap()
		await expect(element(by.id('history-entry-2'))).toBeVisible()
		await device.enableSynchronization()
	})

	it('should fail claiming the same token twice', async () => {
		await device.disableSynchronization()
		const receiveBtn = element(by.id('Receive-btn'))
		await receiveBtn.tap()
		await element(by.id('send-ecash-option')).tap()
		const errorToaster = element(by.id('error-toaster'))
		await waitFor(errorToaster).toBeVisible().withTimeout(5000)
		await expect(errorToaster).toBeVisible()
		await device.enableSynchronization()
	})

	// eslint-disable-next-line jest/no-commented-out-tests
	// it('should melt a cashu token', async () => {
	// 	await device.disableSynchronization()
	// 	await element(by.id('Send-btn')).tap()
	// 	await element(by.id('send-option-LN invoice or LNURL')).tap()
	// 	// TODO generate a valid LN invoice
	// 	await element(by.id('paste-input')).tap()
	// 	await device.enableSynchronization()
	// })
})