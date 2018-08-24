import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SortieAddPage } from './sortie-add.page';

describe('SortieAddPage', () => {
  let component: SortieAddPage;
  let fixture: ComponentFixture<SortieAddPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SortieAddPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SortieAddPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
