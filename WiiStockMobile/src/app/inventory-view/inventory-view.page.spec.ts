import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryViewPage } from './inventory-view.page';

describe('InventoryViewPage', () => {
  let component: InventoryViewPage;
  let fixture: ComponentFixture<InventoryViewPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InventoryViewPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryViewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
