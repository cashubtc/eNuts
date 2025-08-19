// Import shim first to set up crypto polyfill before any other modules
import "./src/shim";
//TODO: Find a workaround for this polyfill. Maybe we should use NDK instead.
import "message-port-polyfill";

import { registerRootComponent } from "expo";

import App from "./src/components/App";

registerRootComponent(App);
