// Import shim first to set up crypto polyfill before any other modules
import "./src/shim";

import { registerRootComponent } from "expo";

import App from "./src/components/App";

registerRootComponent(App);
