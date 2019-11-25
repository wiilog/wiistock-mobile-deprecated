import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {NewEmplacementComponent} from "@pages/new-emplacement/new-emplacement";


@NgModule({
    declarations: [
        NewEmplacementComponent,
    ],
    imports: [
        IonicPageModule.forChild(NewEmplacementComponent)
    ]
})
export class NewEmplacementModule {
}
