export type NodeStateCue = 'available' | 'opened' | 'selected' | 'locked';

/** Resolve one mutually exclusive structural cue for the sphere and DOM legend. */
export function resolveNodeStateCue(state: {
  available: boolean;
  selected: boolean;
  visited: boolean;
}): NodeStateCue {
  if (!state.available) {
    return 'locked';
  }
  if (state.selected) {
    return 'selected';
  }
  if (state.visited) {
    return 'opened';
  }
  return 'available';
}
