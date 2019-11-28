import { NgModule } from '@angular/core';
import { FooterPriseDeposeComponent } from '../helpers/components/footer-prise-depose/footer-prise-depose';
import {HelpersModule} from "@helpers/helpers.module";
import {IonicModule} from "ionic-angular";
@NgModule({
	declarations: [FooterPriseDeposeComponent],
    imports: [
        HelpersModule,
        IonicModule
    ],
	exports: [FooterPriseDeposeComponent]
})
export class ComponentsModule {}
