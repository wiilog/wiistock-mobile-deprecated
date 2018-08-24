import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceptionAddPage } from './reception-add.page';

describe('ReceptionAddPage', () => {
  let component: ReceptionAddPage;
  let fixture: ComponentFixture<ReceptionAddPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReceptionAddPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceptionAddPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
