import * as Memorystream from 'memorystream';
import * as chai from 'chai';
import * as clc from 'cli-color';
import * as sinon from 'sinon';

const { expect } = chai;

import { Childminder } from '..';

describe('Childminder', () => {
  describe('#create', () => {
    it('should create child without prefix', async () => {
      const cm = new Childminder();
      const stream = new Memorystream(null, { readable: false });
      const child = cm.create('echo', ['hello'], {
        stdout: stream,
      });

      await new Promise(resolve => child.terminal.on('exit', resolve));
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

      await new Promise(resolve => child.terminal.on('exit', resolve));
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
        new Promise(resolve => child1.terminal.on('exit', resolve)),
        new Promise(resolve => child2.terminal.on('exit', resolve)),
      ]);
      expect(stream1.toString()).to.equal(
        `${clc.xterm(120)('[blabla]')}    hello\n`
      );
      expect(stream2.toString()).to.equal(
        `${clc.xterm(130)('[blablabla]')} world\n`
      );
    });

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
});

describe('Child', () => {
  describe('#startOrRestart', () => {
    beforeEach(() => {
      console.warn = sinon.stub(console, 'warn');
    });

    afterEach(() => {
      (console.warn as Sinon.SinonStub).restore();
    });

    it('should not emit any warning message when called on stopped process', () => {
      const cm = new Childminder();
      const stream = new Memorystream(null, { readable: false });
      const child = cm.create('echo', ['hello'], {
        stdout: stream,
        lazy: true,
      });

      expect(child.isRunning()).to.equal(false);
      child.startOrRestart();
      expect(child.isRunning()).to.equal(true);
      expect((console.warn as Sinon.SinonStub).called).to.equal(false);
    });

    it('should restart child process', async () => {
      const cm = new Childminder();
      const stream = new Memorystream(null, { readable: false });

      const child = cm.create('echo', ['hello'], {
        stdout: stream,
      });
      await new Promise(resolve => child.terminal.on('exit', resolve));

      // Restart two times.
      child.startOrRestart();
      await new Promise(resolve => child.terminal.on('exit', resolve));

      child.startOrRestart();
      await new Promise(resolve => child.terminal.on('exit', resolve));

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

    it('should emit warning message when process is not running', () => {
      const cm = new Childminder();
      const stream = new Memorystream(null, { readable: false });
      const child = cm.create('echo', ['hello'], {
        stdout: stream,
        lazy: true,
      });

      expect(child.isRunning()).to.equal(false);
      child.restart();
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
      await new Promise(resolve => child.terminal.on('exit', resolve));

      // Restart two times.
      child.restart();
      await new Promise(resolve => child.terminal.on('exit', resolve));

      child.restart();
      await new Promise(resolve => child.terminal.on('exit', resolve));

      expect(stream.toString()).to.equal('hello\nhello\nhello\n');
    });
  });
});