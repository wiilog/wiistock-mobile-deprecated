import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TransfertAddPage } from './transfert-add.page';

describe('TransfertAddPage', () => {
  let component: TransfertAddPage;
  let fixture: ComponentFixture<TransfertAddPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TransfertAddPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransfertAddPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
