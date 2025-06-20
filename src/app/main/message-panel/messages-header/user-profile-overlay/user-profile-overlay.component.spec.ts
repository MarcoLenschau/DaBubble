import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserProfileOverlayComponent } from './user-profile-overlay.component';

describe('UserProfileOverlayComponent', () => {
  let component: UserProfileOverlayComponent;
  let fixture: ComponentFixture<UserProfileOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserProfileOverlayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserProfileOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
