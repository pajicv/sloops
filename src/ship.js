import { t, makeSprite } from "@replay/core";

export const Ship = makeSprite({
  render() {
    return [
      t.image({
        fileName: "ship1.png",
        color: "#aa6600",
        width: 80,
        height: 30,
      }),
    ];
  },
});
