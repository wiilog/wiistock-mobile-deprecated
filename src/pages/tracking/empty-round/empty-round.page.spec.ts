import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { EmptyRoundPage } from './empty-round.page';

describe('EmptyRoundPage', () => {
  let component: EmptyRoundPage;
  let fixture: ComponentFixture<EmptyRoundPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EmptyRoundPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyRoundPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
