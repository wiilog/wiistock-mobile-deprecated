import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntreeAddPage } from './entree-add.page';

describe('EntreeAddPage', () => {
  let component: EntreeAddPage;
  let fixture: ComponentFixture<EntreeAddPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EntreeAddPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntreeAddPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
