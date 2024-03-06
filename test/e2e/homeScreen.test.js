describe('Home screen', () => {
	beforeAll(async () => {
		await device.launchApp()
	})

	beforeEach(async () => {
		await device.reloadReactNative()
	})

	it('"Click me" button should be visible', async () => {
		await expect(element(by.id('click-me-button'))).toBeVisible()
	})

	it('shows "Hi!" after tapping "Click me"', async () => {
		await element(by.id('click-me-button')).tap()
		await expect(element(by.text('Hi!'))).toBeVisible()
	})
})
