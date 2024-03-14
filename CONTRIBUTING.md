# 👏 Contribute

There are ways you can contribute without writing a single line of code. Here are a few things you can do to help out:

- **Replying and handling open issues**
Some issues may lack necessary information. You can help out by guiding people through the process of filling out the issue template, asking for clarifying information, or pointing them to existing issues that match their description of the problem.
- **Reviewing pull requests for the docs**
Reviewing Pull requests that contains documentation updates (marked with a documentation label) can be as simple as checking for spelling and grammar. If you encounter situations that can be explained better in the docs, just write a comment or edit the file right away to get started with your own contribution.
- **Providing translations**
The translation files are located in [assets/translations](https://github.com/cashubtc/eNuts/tree/main/assets/translations). There are 2 ways to contribute your translation and in both cases, we will take care of adding your language into the app shortly.
  1. You can either just [copy](https://github.com/cashubtc/eNuts/blob/main/assets/translations/en.json) the content of an available translation file and send us the modified `.json` file with your language of choice via our [Telegram group](https://t.me/eNutsWallet).
  2. You can fork the repo and create a pull request with your additional translation file.
- **Passionate about design?**
Explore our [Figma](https://www.figma.com/file/GWk1KbXXSUvd7sEHlFKBvD/eNuts?type=design&node-id=472-11122&mode=design&t=pWFMCeHzP2sBnvuQ-0), suggest tweaks, or bring your own designs to the table!
- **Share feedback and ideas with us**
- **Recommend eNuts to friends and family**
- **Star the project on GitHub**
- **Leave a review on the app store or Google Play**

Each of these tasks is highly impactful, and maintainers will greatly appreciate your help.

If you are eager to start contributing code right away, we have a list of [good first issues](https://github.com/cashubtc/eNuts/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22) that contain bugs which have a relatively limited scope. We use GitHub [issues](https://github.com/cashubtc/eNuts/issues) and [pull requests](https://github.com/cashubtc/eNuts/pulls) to keep track of bug reports and contributions from the community. Pull request have to pass the tests and to be reviewed by a maintainer.

## 📋 Requirements

- eNuts is built using the managed workflow provided by Expo, so the easiest way to run a development environment is their [Expo Go](https://expo.dev/client) app.
- **NodeJS 18** or higher.

## 🥜 Already Implemented NUTs

The NUT documents (**N**otation, **U**sage and **T**erminology) each specify parts of the Cashu protocol.

- [x] [NUT-00](https://github.com/cashubtc/nuts/blob/main/00.md)
- [x] [NUT-01](https://github.com/cashubtc/nuts/blob/main/01.md)
- [x] [NUT-02](https://github.com/cashubtc/nuts/blob/main/02.md)
- [x] [NUT-03](https://github.com/cashubtc/nuts/blob/main/03.md)
- [x] [NUT-04](https://github.com/cashubtc/nuts/blob/main/04.md)
- [x] [NUT-05](https://github.com/cashubtc/nuts/blob/main/05.md)
- [x] [NUT-06](https://github.com/cashubtc/nuts/blob/main/06.md)
- [x] [NUT-07](https://github.com/cashubtc/nuts/blob/main/07.md)
- [x] [NUT-08](https://github.com/cashubtc/nuts/blob/main/08.md)
- [x] [NUT-09](https://github.com/cashubtc/nuts/blob/main/09.md)
- [ ] [NUT-10](https://github.com/cashubtc/nuts/blob/main/10.md)
- [ ] [NUT-11](https://github.com/cashubtc/nuts/blob/main/11.md)

## 🚀 Getting started

The [**cashu-ts**](https://github.com/cashubtc/cashu-ts) library and SQLite are used to manage the Cashu related features.

1. Fork this repository and create a local clone.
2. Navigate inside the repository and run `npm i`
3. Start the Expo dev server by running `npm run start`
4. Download the [Expo Go](https://expo.dev/client) app.
    - **Android users**: Scan the QR code provided by your terminal using the Expo-go app
    - **iOS users**: Press on the local dev server shown in the Expo-go app or scan the QR code using your camera app.
5. A browser tab will be opened. Press the "Expo Go" button in the bottom of the page.
6. eNuts will be bundled up and will run on your device.

**Troubleshooting**

- If you see this build error: `[GraphQL] Entity not authorized` in you terminal, you can simply remove the following line from the `config/app.config.ts` file:

```javascript
// Unauthorized error related to the project ID used in the expo organization for eNuts
// If you are not a member of the organization, you will encounter the build error.
{
  ...
  extra: {
    // Delete the following line to fix the issue:
    eas: { projectId: 'edb75ccd-71ac-4934-9147-baf1c7f2b068' },
    ...
  }
  ...
}
```

If you have any questions, do not hesitate to join the R&D group on [Telegram](https://t.me/eNutsWallet).