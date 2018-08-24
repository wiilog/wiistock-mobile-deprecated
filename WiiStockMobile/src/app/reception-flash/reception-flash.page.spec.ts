import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceptionFlashPage } from './reception-flash.page';

describe('ReceptionFlashPage', () => {
  let component: ReceptionFlashPage;
  let fixture: ComponentFixture<ReceptionFlashPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReceptionFlashPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceptionFlashPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
