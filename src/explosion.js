import { t, makeSprite } from "@replay/core";

export const Explosion = makeSprite({
  init() {
    return {
      frame: 0,
    };
  },

  loop({ state }) {
    return {
      frame: state.frame < 7 ? state.frame + 1 : 7,
    };
  },

  render({ state }) {
    return [
      t.spriteSheet({
        fileName: "explode3.bmp",
        columns: 4,
        rows: 2,
        index: state.frame,
        width: 10,
        height: 10,
      }),
    ];
  },
});
