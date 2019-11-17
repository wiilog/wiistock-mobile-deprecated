import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {InventaireAnomaliePage} from './inventaire-anomalie';
import {HelpersModule} from '@helpers/helpers.module';


@NgModule({
    declarations: [
        InventaireAnomaliePage,
    ],
    imports: [
        HelpersModule,
        IonicPageModule.forChild(InventaireAnomaliePage),
    ],
})
export class InventaireAnomaliePageModule {
}
