import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TransfertRecapitulatifPage } from './transfert-recapitulatif.page';

describe('TransfertRecapitulatifPage', () => {
  let component: TransfertRecapitulatifPage;
  let fixture: ComponentFixture<TransfertRecapitulatifPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TransfertRecapitulatifPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransfertRecapitulatifPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
