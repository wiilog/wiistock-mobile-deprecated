import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SortieFlashPage } from './sortie-flash.page';

describe('SortieFlashPage', () => {
  let component: SortieFlashPage;
  let fixture: ComponentFixture<SortieFlashPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SortieFlashPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SortieFlashPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
