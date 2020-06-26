import { t, makeSprite } from "@replay/core";
import isPointInTriangle from "point-in-triangle";
import { deg2rad, move } from "./utils";
import { Ship } from "./ship";
import { Cannonball } from "./cannonball";
import { Explosion } from "./explosion";

const gameCanvas = document.getElementById("game");

console.log(gameCanvas.clientWidth);

export const gameProps = {
  id: "Game",
  size: {
    landscape: {
      width: gameCanvas.clientWidth,
      height: gameCanvas.clientHeight,
      maxWidthMargin: 0,
    },
    portrait: {
      width: gameCanvas.clientWidth,
      height: gameCanvas.clientHeight,
      maxHeightMargin: 0,
    },
  },
  defaultFont: {
    name: "Courier",
    size: 10,
  },
};

const initialState = {
  cannonballs: [],
  explosions: [],
  player1: {
    id: "player1",
    x: -150,
    y: -150,
    speed: 0.5,
    direction: -90,
    isLoaded: true,
    score: 0,
    controls: {
      fire: " ",
      turnLeft: "ArrowLeft",
      turnRight: "ArrowRight",
    },
  },
  player2: {
    id: "player2",
    x: 150,
    y: 150,
    speed: 0.5,
    direction: 90,
    isLoaded: true,
    score: 0,
    controls: {
      fire: "f",
      turnLeft: "a",
      turnRight: "d",
    },
  },
  isGameOver: false,
  winner: null,
};

function getRotationChange(controls, device) {
  const { inputs } = device;
  if (inputs.keysDown[controls.turnLeft]) {
    return -1;
  } else if (inputs.keysDown[controls.turnRight]) {
    return 1;
  }
  return 0;
}

function isFiring(controls, device) {
  return !!device.inputs.keysDown[controls.fire];
}

function checkRestart(device) {
  return !!device.inputs.keysDown["Enter"];
}

function reloadPlayer(player) {
  return {
    ...player,
    isLoaded: true,
  };
}

function getCannonballDirection(player, enemy) {
  const { x, y, direction } = player;
  const topX = x + 40 * Math.cos(deg2rad(direction));
  const topY = y + 40 * Math.sin(deg2rad(direction));
  return Math.sign(
    (x - topX) * (enemy.y - topY) - (y - topY) * (enemy.x - topX)
  );
}

function createCannonball(player, enemy, updateState) {
  const { x, y, direction } = player;
  updateState((prevState) => ({
    ...prevState,
    cannonballs: [
      ...prevState.cannonballs,
      {
        x,
        y,
        direction: direction + getCannonballDirection(player, enemy) * 90,
        id: prevState.cannonballs.length,
        playerId: player.id,
      },
    ],
  }));
}

function createExplosion(cannonball, updateState) {
  const { x, y } = cannonball;
  updateState((prevState) => ({
    ...prevState,
    explosions: [
      ...prevState.explosions,
      {
        x,
        y,
        id: prevState.explosions.length,
      },
    ],
  }));
}

function deleteCannonballs(explodedCannonballs, updateState) {
  const explodedCannonballsIds = explodedCannonballs.map(({ id }) => id);
  updateState((prevState) => ({
    ...prevState,
    cannonballs: [
      ...prevState.cannonballs.filter(
        (cannonball) => !explodedCannonballsIds.includes(cannonball.id)
      ),
    ],
  }));
}

function updatePlayer(player, enemy, device, updateState) {
  const direction =
    player.direction + getRotationChange(player.controls, device);

  let { isLoaded } = player;
  if (isLoaded && isFiring(player.controls, device)) {
    device.audio("cannon.wav").play();
    createCannonball(player, enemy, updateState);
    isLoaded = false;
    device.timeout(
      () =>
        updateState((prevState) => ({
          ...prevState,
          [player.id]: reloadPlayer(prevState[player.id]),
        })),
      3000
    );
  }

  const { x, y } = move({
    x: player.x,
    y: player.y,
    speed: player.speed,
    angle: direction,
  });

  return {
    ...player,
    x,
    y,
    direction,
    isLoaded,
  };
}

function updateCannonballs(cannonballs) {
  return cannonballs.map((cannonball) => {
    const { x, y } = move({
      x: cannonball.x,
      y: cannonball.y,
      speed: 2,
      angle: cannonball.direction,
    });

    return {
      ...cannonball,
      x,
      y,
    };
  });
}

function checkCollision(player, cannonballs) {
  const { x, y, direction } = player;
  const width = 30;
  const height = 80;
  const angle = deg2rad(direction);
  const cx = (height * Math.cos(angle) + width * Math.sin(angle)) / 2;
  const cy = (width * Math.cos(angle) + height * Math.sin(angle)) / 2;
  const triangle1 = [
    [x - cx, y - cy],
    [x - cx, y + cy],
    [x + cx, y + cy],
  ];
  const triangle2 = [
    [x + cx, y + cy],
    [x + cx, y - cy],
    [x - cx, y - cy],
  ];
  return [
    ...cannonballs.filter(
      (cannonball) =>
        cannonball.playerId !== player.id &&
        (isPointInTriangle([cannonball.x, cannonball.y], triangle1) ||
          isPointInTriangle([cannonball.x, cannonball.y], triangle2))
    ),
  ];
}

function checkExit(player, device) {
  const { x, y, direction } = player;
  const width = 30;
  const height = 80;
  const angle = deg2rad(direction);
  const cx = (height * Math.cos(angle) + width * Math.sin(angle)) / 2;
  const cy = (width * Math.cos(angle) + height * Math.sin(angle)) / 2;
  const maxx = Math.max(x - cx, x + cx);
  const minx = Math.min(x - cx, x + cx);
  const maxy = Math.max(y - cy, y + cy);
  const miny = Math.min(y - cy, y + cy);
  return (
    maxx < -device.size.width / 2 ||
    minx > device.size.width / 2 ||
    maxy < -device.size.height / 2 ||
    miny > device.size.height / 2
  );
}

export const Game = makeSprite({
  init() {
    return initialState;
  },

  loop({ state, device, updateState }) {
    if (state.isGameOver) {
      if (checkRestart(device)) {
        return { ...initialState };
      } else {
        return { ...state };
      }
    }
    const cannonballs = updateCannonballs(state.cannonballs);
    const player1 = updatePlayer(
      state.player1,
      state.player2,
      device,
      updateState
    );
    const player2 = updatePlayer(
      state.player2,
      state.player1,
      device,
      updateState
    );

    let { isGameOver, winner } = state;
    if (checkExit(player1, device)) {
      isGameOver = true;
      winner = player2;
    } else if (checkExit(player2, device)) {
      isGameOver = true;
      winner = player1;
    }

    const hits1 = checkCollision(player1, cannonballs);
    if (hits1.length > 0) {
      player2.score = player2.score + hits1.length;
      if (player2.score >= 3) {
        isGameOver = true;
        winner = player2;
      }
      device.audio("explosion.wav").play();
      hits1.forEach((cannonball) => createExplosion(cannonball, updateState));
      deleteCannonballs(hits1, updateState);
    }

    const hits2 = checkCollision(player2, cannonballs);
    if (hits2.length > 0) {
      player1.score = player1.score + hits2.length;
      if (player1.score >= 3) {
        isGameOver = true;
        winner = player1;
      }
      device.audio("explosion.wav").play();
      hits2.forEach((cannonball) => createExplosion(cannonball, updateState));
      deleteCannonballs(hits2, updateState);
    }

    return {
      ...state,
      player1,
      player2,
      cannonballs,
      isGameOver,
      winner,
    };
  },

  render({ state, device }) {
    const gameOverMessage = state.isGameOver
      ? [
          t.text({
            font: { name: "Calibri", size: 18 },
            text: "Game Over",
            color: "#ffff00",
            x: 0,
            y: 20,
          }),
          t.text({
            font: { name: "Calibri", size: 18 },
            text: state.winner.id + " wins!",
            color: "#ffff00",
            x: 0,
            y: -20,
          }),
        ]
      : [];
    return [
      t.rectangle({
        color: "#add8e6",
        width: device.size.width,
        height: device.size.height,
      }),
      t.text({
        font: { name: "Calibri", size: 18 },
        text: "Player 1",
        color: "#ffff00",
        x: -device.size.width / 2 + 40,
        y: device.size.height / 2 - 20,
      }),
      t.text({
        font: { name: "Calibri", size: 18 },
        text: state.player1.score,
        color: "#ffff00",
        x: -device.size.width / 2 + 40,
        y: device.size.height / 2 - 40,
      }),
      t.text({
        font: { name: "Calibri", size: 18 },
        text: "Player 2",
        color: "#ffff00",
        x: device.size.width / 2 - 40,
        y: device.size.height / 2 - 20,
      }),
      t.text({
        font: { name: "Calibri", size: 18 },
        text: state.player2.score,
        color: "#ffff00",
        x: device.size.width / 2 - 40,
        y: device.size.height / 2 - 40,
      }),
      Ship({
        id: state.player1.id,
        x: state.player1.x,
        y: state.player1.y,
        rotation: state.player1.direction,
      }),
      Ship({
        id: state.player2.id,
        x: state.player2.x,
        y: state.player2.y,
        rotation: state.player2.direction,
      }),
      ...state.cannonballs.map(({ x, y, id }) =>
        Cannonball({ x, y, id: "cannonball" + id })
      ),
      ...state.explosions.map(({ x, y, id }) =>
        Explosion({ x, y, id: "explosion" + id })
      ),
      ...gameOverMessage,
    ];
  },
});
