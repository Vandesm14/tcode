enum Direction {
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
const dig = (direction = Direction.Forward) => {
  if (direction === Direction.Back) {
    throw new Error('Turtles cannot dig back');
  } else if (direction === Direction.Forward) {
    return 'turtle.dig()\n';
  }

  return `turtle.dig${direction}()\n`;
};
const turn = (direction: Turn) => `turtle.turn${direction}()\n`;
const move = (direction = Direction.Forward) =>
  `turtle.${direction.toLowerCase()}()\n`;
const loop = (args: { len: number; code: string; v?: string }) =>
  `for ${args.v ?? 'i'} = 1,${args.len} do
${args.code.trim()}
end\n`;

const luaIf = (args: { cmp: string; yes: string; no: string }) => {
  let ret = `if ${args.cmp} then
${args.yes.trim()}\n`;

  if (args.no) {
    ret += `else
${args.no.trim()}\n`;
  }

  ret += 'end';
  return ret;
};

// Code Generators
const line = (args: { dig?: boolean; len: number; v?: string }) =>
  loop({
    ...args,
    len: args.len,
    code: args.dig ? str(dig(), move()) : move(),
  });

const rect = (args: {
  dig?: boolean;
  depth: number;
  width: number;
  height?: number;
}) => {
  args.height = args.height ?? 1;
  return loop({
    len: args.height,
    v: 'h',
    code: str(
      loop({
        v: 'w',
        len: args.width - 1,
        code: str(
          line({ ...args, len: args.depth - 1 }),
          luaIf({
            cmp: `w % 2 == 0`,
            yes: str(turn(Turn.Left), dig(), move(), turn(Turn.Left)),
            no: str(turn(Turn.Right), dig(), move(), turn(Turn.Right)),
          })
        ),
      }),
      line({ ...args, len: args.depth - 1 }),
      turn(Turn.Right),
      turn(Turn.Right),
      args.height > 1 ? str(dig(Direction.Down), move(Direction.Down)) : ''
    ),
  });
};

Deno.writeTextFileSync(
  'mineout.lua',
  rect({ depth: 3, width: 3, height: 3, dig: true })
);
