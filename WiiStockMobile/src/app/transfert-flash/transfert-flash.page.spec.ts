import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TransfertFlashPage } from './transfert-flash.page';

describe('TransfertFlashPage', () => {
  let component: TransfertFlashPage;
  let fixture: ComponentFixture<TransfertFlashPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TransfertFlashPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransfertFlashPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
