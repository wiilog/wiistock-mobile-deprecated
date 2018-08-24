import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpeditionFlashPage } from './expedition-flash.page';

describe('ExpeditionFlashPage', () => {
  let component: ExpeditionFlashPage;
  let fixture: ComponentFixture<ExpeditionFlashPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExpeditionFlashPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpeditionFlashPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
