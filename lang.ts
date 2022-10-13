enum DigDirection {
  Up = 'Up',
  Down = 'Down',
  Forward = '',
}

enum MoveDirection {
  Forward = 'Forward',
  Back = 'Back',
  Up = 'Up',
  Down = 'Down',
}

enum TurnDirection {
  Left,
  Right,
}

const str = (...args: string[]) => args.join('');

const dig = (direction = DigDirection.Forward) => `turtle.dig${direction}()\n`;
const turn = (direction: TurnDirection) => `turtle.turn${direction}()\n`;
const move = (direction = MoveDirection.Forward) => `turtle.move${direction}()\n`;

const line = (args: { dig?: boolean, len: number }) =>
  Array(args.len).fill(0).map(_ => args?.dig ? str(dig(), move()) : move()).join('');
  
// turtle moves 
const rect = (args: { dig?: boolean, depth: number, width: number }) =>
  

Deno.writeTextFileSync('mineout.lua', line({ dig: false, len: 50 }));