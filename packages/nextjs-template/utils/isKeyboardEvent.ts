export function isKeyboardEvent(e: Event | undefined): e is KeyboardEvent {
  return Boolean(e && ("metaKey" in e || "ctrlKey" in e));
}
