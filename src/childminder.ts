import * as through from 'through2';
import * as pty from 'pty.js';
import * as byline from 'byline';
import { Terminal, TerminalOptions } from 'pty.js';
import * as clc from 'cli-color';
import objectAssign = require('object-assign');
import * as Promise from 'bluebird';

export interface ChildOptions extends TerminalOptions {
  prefix?: string;
  prefixColor?: number;
  stdout?: NodeJS.WritableStream;
  lazy? : boolean;
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
  private options: ChildOptions;
  private stdout: NodeJS.ReadWriteStream;

  constructor(cm: Childminder, prefix: Prefix, command: string, args?: string[], options?: ChildOptions) {
    this.cm = cm;
    this.command = command;
    this.args = args || [];
    this.options = objectAssign({
      stdout: process.stdout,
      lazy: false,
    }, options || {});
    this.prefix = prefix;

    this.stdout = through(function (chunk, encoding, callback) {
      this.push([
        prefix.formatted,
        Array(cm._prefixLen - prefix.raw.length + 1).join(' '),
        chunk, '\n',
      ].join(''));
      return callback();
    });

    this.stdout.pipe(this.options.stdout);

    if (!options.lazy) {
      this.startProcess();
    }
  }

  /**
   * Start or restart child process.
   */
  startOrRestart(): Promise<void> {
    return this.startOrRestartProcess();
  }

  /**
   * Restart child process.
   */
  restart(): Promise<void> {
    if (!this.isRunning()) {
      console.warn('[Childminder] Process is not running.');
    }
    return this.startOrRestartProcess();
  }

  /**
   * Returns if the child process is running.
   */
  isRunning(): boolean {
    return !!this.terminal;
  }

  waitForExit(): Promise<void> {
    if (!this.terminal) {
      return Promise.resolve();
    }
    return new Promise<void>(resolve => {
      this.terminal.on('exit', () => resolve());
    });
  }

  kill(): Promise<void> {
    if (this.terminal) {
      this.terminal.kill();
    }
    return this.waitForExit();
  }

  private startProcess() {
    this.terminal = pty.spawn(this.command, this.args, this.options);
    this.terminal.on('exit', () => {
      this.terminal = null;
    });
    byline.createStream(this.terminal.stdout as any).pipe(this.stdout, { end: false });
  }

  private startOrRestartProcess(): Promise<void> {
    return this.kill().then(() => this.startProcess());
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
