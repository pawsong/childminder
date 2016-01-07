import * as through from 'through2';
import * as pty from 'pty.js';
import * as byline from 'byline';
import { Terminal, TerminalOptions } from 'pty.js';
import * as clc from 'cli-color';

export interface ChildOptions extends TerminalOptions {
  prefix?: string;
  prefixColor?: number;
  stdout?: NodeJS.WritableStream;
}

export interface Prefix {
  raw: string;
  formatted: string;
}

/**
 * Thin wrapper of node.js ChildProcess object, which supports restart.
 */
export class Child {

  /**
   * pty terminal object
   */
  terminal: Terminal = null;
  prefix: Prefix;

  private cm: Childminder;
  private command: string;
  private args: string[];
  private options: TerminalOptions;
  private stdout: NodeJS.ReadWriteStream;

  constructor(cm: Childminder, prefix: Prefix, command: string, args?: string[], options?: ChildOptions) {
    this.cm = cm;
    this.command = command;
    this.args = args || [];
    this.options = options || {};
    this.prefix = prefix;

    this.stdout = through(function (chunk, encoding, callback) {
      this.push([
        prefix.formatted,
        Array(cm._prefixLen - prefix.raw.length + 1).join(' '),
        chunk, '\n',
      ].join(''));
      return callback();
    });

    this.stdout.pipe(options.stdout || process.stdout);

    this.startOrRestartProcess();
  }

  /**
   * Restart child process.
   */
  restart() {
    this.startOrRestartProcess();
  }

  private kill() {
    if (this.terminal) {
      this.terminal.kill();
      this.terminal = null;
    }
  }

  private startOrRestartProcess() {
    this.kill();
    this.terminal = pty.spawn(this.command, this.args, this.options);
    byline.createStream(this.terminal.stdout as any).pipe(this.stdout, { end: false });
  }
}

/**
 * Process manager that contains multiple Child instances.
 */
export class Childminder {
  _prefixLen: number = 0;

  private children: Child[] = [];

  /**
   * Create a child process.
   */
  create(command: string, args?: string[], options?: ChildOptions): Child {
    const opts = options || {};
    const rawPrefix = opts.prefix ? `[${opts.prefix}]` : '';
    const prefix = typeof opts.prefixColor === 'number' ? clc.xterm(opts.prefixColor)(rawPrefix) : rawPrefix;
    this._prefixLen = Math.max(
      rawPrefix.length === 0 ? 0 : rawPrefix.length + 1 /* space between prefix and message */,
      this._prefixLen
    );

    const child = new Child(this, {
      raw: rawPrefix,
      formatted: prefix,
    }, command, args, opts);

    this.children.push(child);
    return child;
  }
}
