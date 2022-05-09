import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { TransportRoundPackLoadPage } from './transport-round-pack-load.page';

describe('TransportRoundPackLoadPage', () => {
  let component: TransportRoundPackLoadPage;
  let fixture: ComponentFixture<TransportRoundPackLoadPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TransportRoundPackLoadPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(TransportRoundPackLoadPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
