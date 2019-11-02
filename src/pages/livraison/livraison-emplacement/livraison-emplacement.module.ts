import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {LivraisonEmplacementPage} from '@pages/livraison/livraison-emplacement/livraison-emplacement';


@NgModule({
    declarations: [
        LivraisonEmplacementPage,
    ],
    imports: [
        IonicPageModule.forChild(LivraisonEmplacementPage),
    ],
})
export class LivraisonEmplacementPageModule {
}
