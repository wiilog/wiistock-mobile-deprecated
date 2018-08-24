import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntreeFlashPage } from './entree-flash.page';

describe('EntreeFlashPage', () => {
  let component: EntreeFlashPage;
  let fixture: ComponentFixture<EntreeFlashPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EntreeFlashPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntreeFlashPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
