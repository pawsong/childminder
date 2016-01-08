# childminder

`childminder` is a simple process manager for development.

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]

```typescript
import { Childminder } from 'childminder';

const cm = new Childminder();
const child = cm.create('echo', ['Hello, world'], {
  prefix: 'greeting',
  prefixColor: 12,
});

child.restart();
```

## Features

- Colorful console prefix
- Preserve child process console message color
- Handle multiple processes

## Motivation

[nodemon][nodemon] is a useful tool in node.js server
programming. It watches file changes and restarts node.js process automatically. However, if we use transpilers like [Babel][Babel], [CoffeeScript][coffeeScript] or [TypeScript][TypeScript], the appropriate time to reload node process is not when file is changed but when transpilation is completed. Maybe in this case, we should monitor events from transpiler and reload process manually.

`childminder` is yet another tool for development like [nodemon][nodemon], but does not watch file changes. When using `childminder`, you should call `childminder` process restart function manually, which looks cumbersome but indeed is a clear way.

## API

### Class: `Childminder`

Process manager that contains multiple Child instances.

`Childminder#create(command[, args][, options])`

Create `Child` instance.

- `command` *String* The command to run
- `args` *Array* List of string arguments
- `options` *Object*
  - `cwd` *String* Current working directory of the child process
  - `env` *Object* Environment key-value pairs
  - `prefix` *String* `stdout` message prefix
  - `prefixColor` *Number* Prefix xTerm colors
  - `stdout` *stream.Writable* Child's stdout stream (Default: `process.stdout`)
  - `lazy` *Boolean* Whether or not to run immediately when created (Default: `false`)
- returns `Child` instance.


### Class: `Child`

Thin wrapper of node.js ChildProcess object, which supports restart. `Child` instance is created by `Childminder#create` method.

`Child#startOrRestart()`

Start or restart child process.

`Child#restart()`

Restart running child process.

`Child#isRunning()`

Returns if the child process is running.

## License

MIT

[npm-image]: https://img.shields.io/npm/v/childminder.svg
[npm-url]: https://npmjs.org/package/childminder
[travis-image]: https://img.shields.io/travis/pawsong/childminder/master.svg
[travis-url]: https://travis-ci.org/pawsong/childminder

[nodemon]: https://github.com/remy/nodemon
[Babel]: https://github.com/babel/babel
[CoffeeScript]: https://github.com/jashkenas/coffeescript
[TypeScript]: https://github.com/Microsoft/TypeScript
