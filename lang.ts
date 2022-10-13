enum Move {
  Forward = 'Forward',
  Back = 'Back',
  Up = 'Up',
  Down = 'Down',
}

enum Turn {
  Left = 'Left',
  Right = 'Right',
}

// TS Helpers
const str = (...args: string[]) => args.join('');
const map = <T>(fn: (i: number) => T, len: number) =>
  Array.from({ length: len }).map((_, i) => fn(i));

// Lua Primitives
const dig = (direction = Move.Forward) => {
  if (direction === Move.Back) {
    throw new Error('Turtles cannot dig back');
  }

  return `turtle.dig${direction}()\n`;
};
const turn = (direction: Turn) => `turtle.turn${direction}()\n`;
const move = (direction = Move.Forward) =>
  `turtle.${direction.toLowerCase()}()\n`;
const loop = (args: { len: number; code: string }) =>
  `for i = 1,${args.len} do
${args.code.trim()}
end\n`;

// Code Generators
const line = (args: { dig?: boolean; len: number }) =>
  loop({ len: args.len, code: args.dig ? str(dig(), move()) : move() });

const rect = (args: {
  dig?: boolean;
  depth: number;
  width: number;
  height?: number;
}) => {
  args.height = 1;
  return map((width) => {
    const doTurn = turn(width % 2 === 0 ? Turn.Right : Turn.Left);
    const isLast = width === args.width - 1;
    return str(
      line({ ...args, len: args.depth - 1 }),
      isLast ? '' : str(doTurn, dig(), move(), doTurn)
    );
  }, args.width).join('');
};

Deno.writeTextFileSync('mineout.lua', rect({ depth: 3, width: 3, dig: true }));
