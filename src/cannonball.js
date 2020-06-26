import { t, makeSprite } from "@replay/core";

export const Cannonball = makeSprite({
  render({ props }) {
    return [
      t.circle({
        color: "#000000",
        radius: 3,
        x: props.originX,
        y: props.originY,
      }),
    ];
  },
});
