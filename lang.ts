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

const repeat = (args: { code: string; len: number }) =>
  map(() => args.code, args.len)
    .join('')
    .trim();

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

const luaIf = (args: { cmp: string; yes: string; no?: string }) => {
  let ret = `if ${args.cmp} then
${args.yes.trim()}\n`;

  if (args.no) {
    ret += `else
${args.no.trim()}\n`;
  }

  ret += 'end\n';
  return ret;
};
const comment = (str: string) => `-- ${str}\n`;
const print = (str: string) => `print('${str}')\n`;

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
  invert?: boolean;
}) =>
  str(
    comment('loop through rows'),
    loop({
      v: 'w',
      len: args.width - 1,
      code: str(
        comment('go straight'),
        line({ ...args, len: args.depth - 1 }),
        comment(
          'turn to the next row, dig forward, then move to the line and turn into it'
        ),
        luaIf({
          cmp: `${args.invert ? 'not ' : ''}(w % 2 == 1)`,
          yes: str(turn(Turn.Right), dig(), move(), turn(Turn.Right)),
          no: str(turn(Turn.Left), dig(), move(), turn(Turn.Left)),
        })
      ),
    }),
    comment('finish last row'),
    line({ ...args, len: args.depth - 1 })
  );

const box = (args: {
  dig?: boolean;
  depth: number;
  width: number;
  height: number;
}) => {
  const appendDig = str(
    comment('dig down and move down if not at end'),
    luaIf({
      cmp: `h ~= ${args.height}`,
      yes: str(dig(Direction.Down), move(Direction.Down)),
    }),
    comment('turn left if on even level and right if on odd'),
    turn(Turn.Right),
    turn(Turn.Right)
  );

  const digTwoLevels = str(
    comment('dig rect'),
    rect({
      dig: args.dig,
      depth: args.depth,
      width: args.width,
    }),
    appendDig,
    // -------------------------------------
    comment('dig rect inverted'),
    rect({
      dig: args.dig,
      depth: args.depth,
      width: args.width,
      invert: true,
    }),
    appendDig
  );

  return str(
    args.width % 2 === 0
      ? // Is even (difficult)
        str(
          loop({
            len: Math.floor(args.height / 2),
            v: 'h',
            code: digTwoLevels,
          }),
          comment('dig final row(s)'),
          args.height % 2 === 0
            ? loop({ len: 2, code: digTwoLevels })
            : str(
                rect({
                  dig: args.dig,
                  depth: args.depth,
                  width: args.width,
                }),
                appendDig
              )
        )
      : // Is odd (easy)
        loop({
          len: args.height,
          v: 'h',
          code: str(
            comment('dig rect'),
            rect({ dig: args.dig, depth: args.depth, width: args.width }),
            comment('dig down and move down if not at end'),
            luaIf({
              cmp: `h ~= ${args.height}`,
              yes: str(dig(Direction.Down), move(Direction.Down)),
            }),
            comment('turn left if on even level and right if on odd'),
            turn(Turn.Right),
            turn(Turn.Right)
          ),
        })
  );
};

const code = str(box({ dig: true, depth: 6, width: 1, height: 3 })).trim();

console.log(`Generated ${code.split('\n').length} loc`);
Deno.writeTextFileSync('mineout.lua', code);

const conn = Deno.listen({ port: 3000 });
console.log(`Serving on http://localhost:3000`);
console.log('Get the program using `wget run http://mr.thedevbird.com:3000`');
const s = Deno.serveHttp(await conn.accept());
for await (const req of s) await req.respondWith(new Response(code));
