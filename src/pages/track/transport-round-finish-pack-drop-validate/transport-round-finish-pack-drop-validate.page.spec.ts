import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { TransportRoundFinishPackDropValidatePage } from './transport-round-finish-pack-drop-validate.page';

describe('TransportRoundFinishPackDropValidatePage', () => {
  let component: TransportRoundFinishPackDropValidatePage;
  let fixture: ComponentFixture<TransportRoundFinishPackDropValidatePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TransportRoundFinishPackDropValidatePage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(TransportRoundFinishPackDropValidatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
