export function isMouseEvent(e: Event | undefined): e is MouseEvent {
  return Boolean(e && "button" in e);
}
