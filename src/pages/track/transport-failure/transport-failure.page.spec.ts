import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {IonicModule} from '@ionic/angular';

import {TransportFailurePage} from './transport-failure.page';

describe('TransportFailurePage', () => {
    let component: TransportFailurePage;
    let fixture: ComponentFixture<TransportFailurePage>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TransportFailurePage],
            imports: [IonicModule.forRoot()]
        }).compileComponents();

        fixture = TestBed.createComponent(TransportFailurePage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
