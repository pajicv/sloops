import { t, makeSprite } from "@replay/core";

export const Ship = makeSprite({
  render({ props }) {
    return [
      t.image({
        fileName: props.fileName,
        color: "#aa6600",
        width: 80,
        height: 80,
      }),
    ];
  },
});
