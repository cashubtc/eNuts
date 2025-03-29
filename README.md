<div align="center">
  <h1>⚠️ IMPORTANT NOTICE ⚠️</h1>
  <p><strong>This project is no longer maintained.</strong>

  Due to other commitments, I am no longer able to dedicate the time required to properly maintain this project. I plan to archive this repository in 90 days unless substantial progress is made on migrating to the latest Cashu protocol specs. I encourage developers to fork the repository and continue building on this foundation.</p>

  <p>I am deeply grateful for the community's support and interest in this project. Your feedback, contributions, and enthusiasm have made this one of the most exciting experiences of my life.</p>

  <h3>Moving Your Funds</h3>
  <p>Transfer funds to another Cashu wallet:</p>
  <ul>
    <li><a href="https://cashu.me">Cashu.me</a> - Web-based Cashu wallet</li>
    <li><a href="https://minibits.cash">Minibits</a> - Mobile wallet for Android</li>
    <li><a href="https://github.com/zeugmaster/macadamia">Macadamia</a> - Mobile wallet for iOS</li>
  </ul>

  <p>You can transfer funds by sending a Cashu token to yourself using another wallet, or by using the backup/restore functionality of your new wallet.</p>
  <p>If the mint URL has changed, you can add the new URL to your mint list and try to perform a backup/restore to be able to move the funds out of eNuts.</p>
  <p>Make sure the mint is still online.</p>
  <p>If you experience any issues, please join the Telegram group and we will try to find a solution.</p>

  <hr style="width:50%;margin:2rem auto;">
</div>

<div align="center">
  <p>
    <img src="https://www.enuts.cash/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fhero.110e6c49.png&w=3840&q=100" style="max-width:660px; width: 100%; height: auto;">
  </p>
  <h2>eNuts – A Cashu wallet for Android and iOS</h2>
  <!-- <p>
    <a href="https://apps.apple.com/de/app/enuts/id6477824421">
      <img src="https://www.enuts.cash/_next/image?url=%2F_next%2Fstatic%2Fmedia%2FappStore.91dc53dd.webp&w=3840&q=75" width="160" height="52">
    </a>
  </p> -->
  <div style="display: flex; align-items: center; justify-content: center;">

  [![Website eNuts](https://img.shields.io/badge/Website-eNuts-%230088cc?style=plastic&logo=WebMoney&logoColor=white&labelColor=%23666&color=%235DB075)](https://www.enuts.cash)
  [![codecov](https://codecov.io/gh/cashubtc/eNuts/branch/main/graph/badge.svg?token=MGBC95KGHQ)](https://codecov.io/gh/cashubtc/eNuts)
  ![example workflow](https://github.com/cashubtc/eNuts/actions/workflows/node.js.yml/badge.svg)
  ![ts](https://badgen.net/badge/Built%20with/TypeScript/blue)
  [![runs with Expo Go](https://img.shields.io/badge/Runs%20with%20Expo%20Go-4630EB.svg?style=flat-square&logo=EXPO&labelColor=f3f3f3&logoColor=000)](https://expo.dev/client)

  </div>
</div>

**eNuts** is a strictly typed mobile [**Cashu**](https://github.com/cashubtc) wallet that has Lightning support and can connect to multiple mints. The [**Nostr**](https://nostr-resources.com/) integration allows seemless transactions between you and your contacts. We aim to provide a great user experience by implementing features that make the usage of Ecash easier and safer at the same time. This project is in early stage and we **strongly** encourage you to exercise caution and only use it for **experimental** or **educational** purposes. Read more about Cashu at [**https://docs.cashu.space/**](https://docs.cashu.space/) or learn more about eNuts via the [**eNuts website**](https://enuts.cash/get-started)

## Contents

- ⚠️ [Disclaimer](#%EF%B8%8F-disclaimer)
- 👏 [Contribute](#-contribute)
- 🎉 [Releases](#-releases)
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

Please note that this disclaimer should be taken seriously and should not be ignored or underestimated. We appreciate your interest in this project and will continue to work on improving it. Should you identify a security vulnerability, we kindly ask you to consult our [security policy](https://github.com/cashubtc/eNuts/blob/main/SECURITY.md).

Thank you for your understanding.

## 👏 Contribute

The main purpose of this repository is to continue evolving and pushing the adoption of Ecash for Bitcoin using the Cashu protocol. We want to make contributing to this project as easy and transparent as possible, and we are grateful to the community for contributing bug fixes and improvements. Read more on [how to contribute](https://github.com/cashubtc/eNuts/blob/main/CONTRIBUTING.md).

**Here's how you can swiftly show your support:**

* Star the project on GitHub
* Leave a review on the app store or Google Play
* Share feedback and ideas with us
* Report bugs
* Recommend eNuts to friends and family
* Write translations
* Passionate about design? Explore our [Figma](https://www.figma.com/file/GWk1KbXXSUvd7sEHlFKBvD/eNuts?type=design&node-id=472-11122), suggest tweaks, or bring your own designs to the table!

## 🎉 Releases

[https://github.com/cashubtc/eNuts/releases](https://github.com/cashubtc/eNuts/releases)

## 📄 License

eNuts is distributed under the GNU Affero General Public License (AGPL v3). See the [LICENSE file](https://github.com/cashubtc/eNuts/blob/main/LICENSE).

<!-- ![Known Vulnerabilities](https://snyk.io/test/github//enuts/badge.svg) -->
<!-- ![Libraries.io dependency status for GitHub repo](https://img.shields.io/librariesio/github//enuts) -->
