import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpeditionRecapitulatifPage } from './expedition-recapitulatif.page';

describe('ExpeditionRecapitulatifPage', () => {
  let component: ExpeditionRecapitulatifPage;
  let fixture: ComponentFixture<ExpeditionRecapitulatifPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExpeditionRecapitulatifPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpeditionRecapitulatifPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
