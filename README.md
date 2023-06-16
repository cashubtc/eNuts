<div align="center">
  <p>
    <img src="https://i.imgur.com/EI7Uvg1.jpeg">
  </p>
  <h3>A cashu wallet for Android and iOS</h3>
  <div style="display: flex; align-items: center; justify-content: center">

  [![codecov](https://codecov.io/gh/cashubtc/eNuts/branch/main/graph/badge.svg?token=MGBC95KGHQ)](https://codecov.io/gh/cashubtc/eNuts)
  ![example workflow](https://github.com/cashubtc/eNuts/actions/workflows/node.js.yml/badge.svg)
  ![ts](https://badgen.net/badge/Built%20With/TypeScript/blue)

  </div>

  <h5>Join the research and development groups</h5>

  <div style="display: flex; align-items: center; justify-content: center">

  [![Cashu R&D](https://img.shields.io/badge/Cashu_R&D-Telegram-0088cc.svg)](https://t.me/CashuBTC)
  [![Cashu R&D](https://img.shields.io/badge/eNuts_R&D-Telegram-0088cc.svg)](https://t.me/eNutsWallet)

  </div>
</div>

<!-- <a  href="cashu://cashuAeyJ0b2tlbiI6W3sicHJvb2ZzIjpbeyJpZCI6InVUWTFBTE5ZZmQ2ZyIsImFtb3VudCI6MSwic2VjcmV0IjoiRnRIL2EvWUppMGtPVHAvL2R0UkxHcFk2Mjl1VzcxNHBQZE1YZmJTRTFmQT0iLCJDIjoiMDJhZTg2ZWZjODk1OWZiYmU2MzUyM2NiMGVjMDY2MDMzOGNiZjAwNDUxZmFhNTYyNDQ2NGYxNDQ0Zjc4ODhiMDFhIn0seyJpZCI6InVUWTFBTE5ZZmQ2ZyIsImFtb3VudCI6NCwic2VjcmV0IjoiS3lJTDRrOWtNZkhrMjdQeER4MGFBV3E0Qk9RMWZUYzc3RmRjdG1sZVNFRT0iLCJDIjoiMDNiYWNjMjU3ZDFlYmRlNWQ0OThiOTQxNzZkZTFlNmEyYWM5Y2I0Njg4MjYwZDJkMjE1NzU3NWFkYTM1ODFmMjQyIn0seyJpZCI6InVUWTFBTE5ZZmQ2ZyIsImFtb3VudCI6NjQsInNlY3JldCI6IjZoYmptak1ZT01LMVpaS0pmek1LR0NjeXM3TEpUeE9MQ3p2VmJSZ1dqZ289IiwiQyI6IjAyODkwMTk5ODIyOTY4YzM1NWZlZDgzOTBkMDQxOWU2MjY3MjBlNWQ1NjQzMzNjYzRlOGQyOWM2NzdjZDA1MGM1NSJ9XSwibWludCI6Imh0dHBzOi8vdGVzdG51dC5jYXNodS5zcGFjZSJ9XX0"> token</a> -->
eNuts is a strongly typed mobile Cashu wallet for Android and iOS. It has Lightning support and can connect to multiple Cashu mints. This project uses the [**cashu-ts**](https://github.com/cashubtc/cashu-ts) library and manages proofs locally using SQLite. We aim to provide a great user experience by implementing features that make the usage of Ecash easier and safer at the same time. This project is in early stage and is not suitable for usage yet.

## Contents

- [Disclaimer](#-disclaimer)
- [Implemented NUTs](#-implemented-nuts)
- [Requirements](#-requirements)
- [Contribute](#-contribute)
- [Getting started](#-getting-started)
- [Releases](#-releases)
- [License](#-license)

### ⚠️ Disclaimer

**The author is NOT a cryptographer and this work has not been reviewed. This means that there is very likely a fatal flaw somewhere. [Cashu](https://github.com/cashubtc) is still experimental.**

Please be aware that there may be bugs, errors, and incomplete features that could cause unexpected behavior or loss of data. We do not assume any liability for any issues that may arise from using this project. We strongly encourage users to exercise caution and only use this project for experimental or educational purposes.

The entire db (database) layer of this system has not fully undergone thorough testing. This means that the functionality and performance of this particular layer have not been verified, and there may be unforeseen issues or bugs present.

The untested db layer poses potential risks and uncertainties, including but not limited to:

- **Data integrity**
There is a possibility of data corruption, loss, or inconsistency due to unverified interactions with the db layer.
- **Performance issues**
The untested db layer might have suboptimal performance characteristics, such as slow query execution or inefficient resource utilization.
- **Compatibility problems**
Interoperability issues might arise when integrating with other components or services that rely on the db layer.
- **Security vulnerabilities**
The untested db layer might contain security weaknesses, exposing sensitive information or allowing unauthorized access.

Remember that the use of this untested db layer is entirely at your discretion, and the developers, contributors, or maintainers of this software cannot be held liable for any damages, losses, or adverse effects arising from its usage. If you choose to proceed with the untested db layer, exercise extreme caution and consider seeking expert advice or assistance to mitigate potential risks effectively.

Please note that this disclaimer should be taken seriously and should not be ignored or underestimated.

We appreciate your interest in this project and will continue to work on improving it. Thank you for your understanding.

### 🥜 Implemented [NUTs](https://github.com/cashubtc/nuts)

The NUT documents (Notation, Usage, and Terminology) each specify parts of the Cashu protocol.

- [ ] NUT-00
- [ ] NUT-01
- [ ] NUT-02
- [ ] NUT-03
- [ ] NUT-04
- [ ] NUT-05
- [ ] NUT-06
- [ ] NUT-07
- [ ] NUT-08
- [ ] NUT-09

### 📋 Requirements

- eNuts is built using the managed workflow provided by Expo, so the easiest way to run a development environment is their [Expo Go](https://expo.dev/client) app.
- npm version or higher

### 👏 Contribute

The main purpose of this repository is to continue evolving and pushing the adoption of Ecash for Bitcoin using the Cashu protocol. We want to make contributing to this project as easy and transparent as possible, and we are grateful to the community for contributing bug fixes and improvements.

There are ways you can contribute without writing a single line of code. Here are a few things you can do to help out:

- **Replying and handling open issues**
Some issues may lack necessary information. You can help out by guiding people through the process of filling out the issue template, asking for clarifying information, or pointing them to existing issues that match their description of the problem.
- **Reviewing pull requests for the docs**
Reviewing Pull requests that contains documentation updates (marked with a documentation label) can be as simple as checking for spelling and grammar. If you encounter situations that can be explained better in the docs, just write a comment and we will or edit the file right away to get started with your own contribution.
- **Providing translations**
We will implement translations ASAP and provide a clear contribution guide to how you can help translating the application.

Each of these tasks is highly impactful, and maintainers will greatly appreciate your help.

If you are eager to start contributing code right away, we have a list of [good first issues](https://github.com/cashubtc/eNuts/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22) that contain bugs which have a relatively limited scope.

We use GitHub issues and pull requests to keep track of bug reports and contributions from the community. Pull request have to pass the tests and to be reviewed by a maintainer. So make sure to:

- Run the linter after you made your changes using `npm run lint`
- Run the tests to avoid a failing CI by using `npm run test`

### 🚀 Getting started

1. Clone this repository
2. Navigate inside the repository and run `npm install`
3. Start the Expo dev server by running `npm run start`
4. Download the [Expo Go](https://expo.dev/client) app.
5. Scan the QR code provided by your dev server's terminal using the app (iOS
   users will have to use the Camera app).
6. A browser tab will be opened. Press the "Expo Go" button in the bottom of the page.
7. eNuts will be bundled up and run on your device.

### 🎉 Releases

[https://github.com/cashubtc/eNuts/releases](https://github.com/cashubtc/eNuts/releases)

### 📄 License

eNuts is distributed under the GNU Affero General Public License (AGPL v3). See the [LICENSE file](https://github.com/cashubtc/eNuts/blob/main/LICENSE).

<!-- ![Known Vulnerabilities](https://snyk.io/test/github//enuts/badge.svg) -->
<!-- ![Libraries.io dependency status for GitHub repo](https://img.shields.io/librariesio/github//enuts) -->
