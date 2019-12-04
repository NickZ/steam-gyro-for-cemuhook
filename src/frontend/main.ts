import "core-js/es7/reflect";
import "hammerjs";
import "zone.js/dist/zone";
import "./style.global.scss";

import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { AppModule } from "./app/app.module";

if (process.env.NODE_ENV === "production") {
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);

