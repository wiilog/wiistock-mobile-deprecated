import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntreeRecapitulatifPage } from './entree-recapitulatif.page';

describe('EntreeRecapitulatifPage', () => {
  let component: EntreeRecapitulatifPage;
  let fixture: ComponentFixture<EntreeRecapitulatifPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EntreeRecapitulatifPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntreeRecapitulatifPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
