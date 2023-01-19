import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {DispatchLogisticUnitReferenceAssociationRoutingModule} from './dispatch-logistic-unit-reference-association-routing.module';
import {DispatchLogisticUnitReferenceAssociationPage} from './dispatch-logistic-unit-reference-association.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@app/common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        DispatchLogisticUnitReferenceAssociationRoutingModule,
        CommonModule
    ],
    declarations: [DispatchLogisticUnitReferenceAssociationPage]
})
export class DispatchLogisticUnitReferenceAssociationModule {
}
