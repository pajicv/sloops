import { t, makeSprite } from "@replay/core";

export const Explosion = makeSprite({
  init() {
    return {
      frame: 0,
    };
  },

  loop({ props, state }) {
    if (state.frame === 15) {
      props.onExplode();
      return state;
    }
    return {
      frame: state.frame + 1,
    };
  },

  render({ state }) {
    return [
      t.spriteSheet({
        fileName: "ex.png",
        columns: 4,
        rows: 4,
        index: state.frame,
        width: 20,
        height: 20,
      }),
    ];
  },
});
