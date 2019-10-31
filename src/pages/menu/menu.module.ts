import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {MenuPage} from "@pages/menu/menu";

@NgModule({
    declarations: [
        MenuPage,
    ],
    imports: [
        IonicPageModule.forChild(MenuPage),
    ],
})
export class PreparationArticlesPageModule {
}
