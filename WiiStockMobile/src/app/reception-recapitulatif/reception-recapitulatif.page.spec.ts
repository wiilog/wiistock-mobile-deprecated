import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceptionRecapitulatifPage } from './reception-recapitulatif.page';

describe('ReceptionRecapitulatifPage', () => {
  let component: ReceptionRecapitulatifPage;
  let fixture: ComponentFixture<ReceptionRecapitulatifPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReceptionRecapitulatifPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceptionRecapitulatifPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
