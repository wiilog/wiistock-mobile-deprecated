import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { TransportRoundFinishPackDropPage } from './transport-round-finish-pack-drop.page';

describe('TransportRoundFinishPackDropPage', () => {
  let component: TransportRoundFinishPackDropPage;
  let fixture: ComponentFixture<TransportRoundFinishPackDropPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TransportRoundFinishPackDropPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(TransportRoundFinishPackDropPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
