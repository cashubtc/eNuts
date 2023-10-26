<div align="center">
  <p>
    <img src="https://i.imgur.com/yVlwtmz.jpeg">
  </p>
  <h2>eNuts – A Cashu wallet for Android and iOS</h2>
  <div style="display: flex; align-items: center; justify-content: center">

  [![Website eNuts](https://img.shields.io/badge/Website-eNuts-%230088cc?style=plastic&logo=WebMoney&logoColor=white&labelColor=%23666&color=%235DB075)](https://www.enuts.cash)
  [![codecov](https://codecov.io/gh/cashubtc/eNuts/branch/main/graph/badge.svg?token=MGBC95KGHQ)](https://codecov.io/gh/cashubtc/eNuts)
  ![example workflow](https://github.com/cashubtc/eNuts/actions/workflows/node.js.yml/badge.svg)
  ![ts](https://badgen.net/badge/Built%20with/TypeScript/blue)
  [![runs with Expo Go](https://img.shields.io/badge/Runs%20with%20Expo%20Go-4630EB.svg?style=flat-square&logo=EXPO&labelColor=f3f3f3&logoColor=000)](https://expo.dev/client)

  </div>
</div>

**eNuts** is a strictly typed mobile [**Cashu**](https://github.com/cashubtc) wallet that has Lightning support and can connect to multiple mints. The [**Nostr**](https://nostr-resources.com/) integration allows seemless transactions between you and your contacts. We aim to provide a great user experience by implementing features that make the usage of Ecash easier and safer at the same time. The [**cashu-ts**](https://github.com/cashubtc/cashu-ts) library and SQLite are used to manage the Cashu related features. This project is in early stage and we **strongly** encourage you to exercise caution and only use it for **experimental** or **educational** purposes. Read more about Cashu at [https://docs.cashu.space/](https://docs.cashu.space/) or learn more about eNuts via the **eNuts website** at [https://www.enuts.cash/](https://www.enuts.cash/)

## 🐿️ Join the research and development groups

[![Cashu R&D](https://img.shields.io/badge/Cashu_R&D-Telegram-0088cc.svg)](https://t.me/CashuBTC)
[![eNuts R&D](https://img.shields.io/badge/eNuts_R&D-Telegram-0088cc.svg)](https://t.me/eNutsWallet)

## Contents

- ⚠️ [Disclaimer](#%EF%B8%8F-disclaimer)
- 🥜 [Implemented NUTs](#-implemented-nuts)
- 📋 [Requirements](#-requirements)
- 🚀 [Getting started](#-getting-started)
- 👏 [Contribute](#-contribute)
- 🎉 [Releases](#-releases)
- 🔐 [Verify releases](#-verify-releases)
- 📄 [License](#-license)

## ⚠️ Disclaimer

**The author is NOT a cryptographer and this work has not been reviewed. This means that there is very likely a fatal flaw somewhere. Cashu is still experimental.**

Please be aware that there may be bugs, errors, and incomplete features that could cause unexpected behavior or loss of data. We do not assume any liability for any issues that may arise from using this project.

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

Please note that this disclaimer should be taken seriously and should not be ignored or underestimated. We appreciate your interest in this project and will continue to work on improving it.

Thank you for your understanding.

## 🥜 Implemented NUTs

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

## 📋 Requirements

- eNuts is built using the managed workflow provided by Expo, so the easiest way to run a development environment is their [Expo Go](https://expo.dev/client) app.
- NodeJS 16 or higher.

## 🚀 Getting started

1. Fork this repository and create a local clone.
2. Navigate inside the repository and run `npm i`
3. Start the Expo dev server by running `npm run start`
4. Download the [Expo Go](https://expo.dev/client) app.
    - **Android users**: Scan the QR code provided by your terminal using the Expo-go app
    - **iOS users**: Press on the local dev server shown in the Expo-go app or scan the QR code using your camera app.
5. A browser tab will be opened. Press the "Expo Go" button in the bottom of the page.
6. eNuts will be bundled up and will run on your device.

**Tip**

- Perform a factory reset to start as a "new user" anytime under `Settings/Factory reset` (Dev mode only)

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

## 👏 Contribute

The main purpose of this repository is to continue evolving and pushing the adoption of Ecash for Bitcoin using the Cashu protocol. We want to make contributing to this project as easy and transparent as possible, and we are grateful to the community for contributing bug fixes and improvements. Read more on [how to contribute](https://github.com/cashubtc/eNuts/blob/main/CONTRIBUTING.md).

## 🎉 Releases

[https://github.com/cashubtc/eNuts/releases](https://github.com/cashubtc/eNuts/releases)

## 🔐 Verify releases

A verification process adds an extra layer of security to our releases. It's important to verify the integrity of software you download to ensure that the files are those originally posted by the maintainers. You should both check that the hashes of your files match those on the signed list, and that the signature on the list is valid.

**Download the Release APK:**
- Go to the [release](https://github.com/cashubtc/eNuts/releases) section of this repository.
- Download the APK file you want to verify.

**Download Verification Files:**
In the same release section, locate and download the following verification files:
- `chosen_app_version.apk.sig` (Detached signature for the APK)
- `hash_list.txt` (List of hash values for all releases)
- `gpg_key.asc` (Our GPG public key)

**Import the GPG Public Key:**
Import our GPG public key using the following command:
```bash
gpg --import gpg_key.asc
```

**Verify the Detached Signature:**
 Run the following command to verify the detached signature:
```bash
gpg --verify chosen_app_version.apk.sig chosen_app_version.apk
```

**Verify the Hash Value:**
- Open the `hash_list.txt` file and locate the hash value associated with the downloaded APK file.
- Calculate the hash value of your downloaded APK file using a hash tool, for example, sha256sum:
```bash
sha256sum chosen_app_version.apk
```
- Compare the calculated hash value with the one in the `hash_list.txt` file.

If the verification process is successful, you can be confident that the release is authentic and hasn't been tampered with. If you encounter any issues or have questions, please [contact us](https://t.me/eNutsWallet).

## 📄 License

eNuts is distributed under the GNU Affero General Public License (AGPL v3). See the [LICENSE file](https://github.com/cashubtc/eNuts/blob/main/LICENSE).

<!-- ![Known Vulnerabilities](https://snyk.io/test/github//enuts/badge.svg) -->
<!-- ![Libraries.io dependency status for GitHub repo](https://img.shields.io/librariesio/github//enuts) -->
