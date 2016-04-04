import * as Memorystream from 'memorystream';
import * as chai from 'chai';
import * as clc from 'cli-color';
import * as sinon from 'sinon';

const { expect } = chai;
const isRunning = require('is-running');

import { Childminder } from '..';

describe('Childminder', () => {
  describe('#create', () => {
    it('should create child without prefix', async () => {
      const cm = new Childminder();
      const stream = new Memorystream(null, { readable: false });
      const child = cm.create('echo', ['hello'], {
        stdout: stream,
      });

      await child.waitForExit();
      expect(stream.toString()).to.equal('hello\n');
    });

    it('should create child with prefix when option exists', async () => {
      const cm = new Childminder();
      const stream = new Memorystream(null, { readable: false });
      const child = cm.create('echo', ['hello'], {
        stdout: stream,
        prefix: 'blabla',
        prefixColor: 120,
      });

      await child.waitForExit();
      expect(stream.toString()).to.equal(
        `${clc.xterm(120)('[blabla]')} hello\n`
      );
    });

    it('should be able to be called multiple times', async () => {
      const cm = new Childminder();
      const stream1 = new Memorystream(null, { readable: false });
      const child1 = cm.create('echo', ['hello'], {
        stdout: stream1,
        prefix: 'blabla',
        prefixColor: 120,
      });
      const stream2 = new Memorystream(null, { readable: false });
      const child2 = cm.create('echo', ['world'], {
        stdout: stream2,
        prefix: 'blablabla',
        prefixColor: 130,
      });

      await Promise.all([
        await child1.waitForExit(),
        await child2.waitForExit(),
      ]);
      expect(stream1.toString()).to.equal(
        `${clc.xterm(120)('[blabla]')}    hello\n`
      );
      expect(stream2.toString()).to.equal(
        `${clc.xterm(130)('[blablabla]')} world\n`
      );
    });

    describe('options.lazy', () => {
      it('should immediately start running when instance is created without lazy option', () => {
        const cm = new Childminder();
        const stream = new Memorystream(null, { readable: false });
        const child = cm.create('echo', ['hello'], {
          stdout: stream,
        });
        expect(child.isRunning()).to.equal(true);
      });

      it('should not start running when instance is created with lazy option', () => {
        const cm = new Childminder();
        const stream = new Memorystream(null, { readable: false });
        const child = cm.create('echo', ['hello'], {
          stdout: stream,
          lazy: true,
        });
        expect(child.isRunning()).to.equal(false);
      });
    });

    describe('options.env', () => {
      it('should set environment variables', async () => {
        const cm = new Childminder();
        const stream = new Memorystream(null, { readable: false });
        const child = cm.create('node', ['-e', 'console.log(process.env.GREETING)'], {
          stdout: stream,
          env: { GREETING: 'Hi, there!' },
        });
        await child.waitForExit();
        expect(stream.toString()).to.equal('Hi, there!\n');
      });
    });
  });
});

describe('Child', () => {
  describe('#kill', () => {
    it('should kill child process', async () => {
      const cm = new Childminder();
      const stream = new Memorystream(null, { readable: false });
      const child = cm.create('node', ['-e', 'setTimeout(null, 10 * 1000)'], {
        stdout: stream,
      });

      const { pid } = child.terminal;
      expect(isRunning(pid)).to.equal(true);

      await child.kill();
      expect(isRunning(pid)).to.equal(false);
    });
  });

  describe('#startOrRestart', () => {
    beforeEach(() => {
      console.warn = sinon.stub(console, 'warn');
    });

    afterEach(() => {
      (console.warn as Sinon.SinonStub).restore();
    });

    it('should not emit any warning message when called on stopped process', async () => {
      const cm = new Childminder();
      const stream = new Memorystream(null, { readable: false });
      const child = cm.create('echo', ['hello'], {
        stdout: stream,
        lazy: true,
      });

      expect(child.isRunning()).to.equal(false);
      await child.startOrRestart();
      expect(child.isRunning()).to.equal(true);
      expect((console.warn as Sinon.SinonStub).called).to.equal(false);
    });

    it('should restart child process', async () => {
      const cm = new Childminder();
      const stream = new Memorystream(null, { readable: false });

      const child = cm.create('echo', ['hello'], {
        stdout: stream,
      });
      await child.waitForExit();
      expect(stream.toString()).to.equal('hello\n');

      // Restart two times.
      await child.startOrRestart();
      await child.waitForExit();
      expect(stream.toString()).to.equal('hello\nhello\n');

      await child.startOrRestart();
      await child.waitForExit();

      expect(stream.toString()).to.equal('hello\nhello\nhello\n');
    });
  });

  describe('#restart', () => {
    beforeEach(() => {
      console.warn = sinon.stub(console, 'warn');
    });

    afterEach(() => {
      (console.warn as Sinon.SinonStub).restore();
    });

    it('should emit warning message when process is not running', async () => {
      const cm = new Childminder();
      const stream = new Memorystream(null, { readable: false });
      const child = cm.create('echo', ['hello'], {
        stdout: stream,
        lazy: true,
      });
      expect(child.isRunning()).to.equal(false);
      await child.restart();
      expect(child.isRunning()).to.equal(true);
      expect(
        (console.warn as Sinon.SinonStub).calledWith('[Childminder] Process is not running.')
      ).to.equal(true);
    });

    it('should restart child process', async () => {
      const cm = new Childminder();
      const stream = new Memorystream(null, { readable: false });

      const child = cm.create('echo', ['hello'], {
        stdout: stream,
      });
      await child.waitForExit();
      expect(stream.toString()).to.equal('hello\n');

      // Restart two times.
      await child.restart();
      await child.waitForExit();
      expect(stream.toString()).to.equal('hello\nhello\n');

      await child.restart();
      await child.waitForExit();

      expect(stream.toString()).to.equal('hello\nhello\nhello\n');
    });
  });
});
