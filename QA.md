# QA checklist

## Desktop
- [ ] Chrome / Edge / Safari: title → battle → rematch
- [ ] P1 and P2 keyboard controls
- [ ] FIGHT timing input cannot double-confirm
- [ ] ACT / ITEM / MERCY submenu navigation
- [ ] ESC pause/resume
- [ ] tab switch auto-pauses

## Mobile
- [ ] iPhone portrait: no horizontal overflow
- [ ] iPhone landscape: stage and touch controls visible
- [ ] Android portrait / landscape
- [ ] notch / home-indicator safe-area
- [ ] multi-touch: joystick + attacker MOD simultaneously
- [ ] pointercancel/lostpointercapture resets controls
- [ ] orientation change does not reset match
- [ ] pinch zoom is not required for gameplay

## Simulation
- [ ] same seed creates same projectile layout
- [ ] frame rate does not change projectile speed
- [ ] BLUE projectile hurts only while moving
- [ ] ORANGE projectile hurts only while stationary
- [ ] invulnerability prevents hit stacking
- [ ] WARD consumes exactly two guarded hits
- [ ] hidden tab never advances battle in background