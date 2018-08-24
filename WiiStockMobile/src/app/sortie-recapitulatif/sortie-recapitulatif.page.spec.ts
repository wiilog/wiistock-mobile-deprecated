import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SortieRecapitulatifPage } from './sortie-recapitulatif.page';

describe('SortieRecapitulatifPage', () => {
  let component: SortieRecapitulatifPage;
  let fixture: ComponentFixture<SortieRecapitulatifPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SortieRecapitulatifPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SortieRecapitulatifPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
