import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { TransportRoundPackLoadValidatePage } from './transport-round-pack-load-validate.page';

describe('TransportRoundPackLoadConfirmPage', () => {
  let component: TransportRoundPackLoadValidatePage;
  let fixture: ComponentFixture<TransportRoundPackLoadValidatePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TransportRoundPackLoadValidatePage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(TransportRoundPackLoadValidatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
