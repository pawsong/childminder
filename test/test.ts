import * as es from 'event-stream';
import * as Memorystream from 'memorystream';
import * as chai from 'chai';
import * as clc from 'cli-color';
const { expect } = chai;

import { Childminder } from '..';

describe('Childminder', () => {
  describe('#create', () => {
    it('should create child without prefix', done => {
      const cm = new Childminder();
      const stream = new Memorystream(null, { readable: false });
      const child = cm.create('echo', ['hello'], {
        stdout: stream,
      });
      child.terminal.on('end', () => {
        expect(stream.toString()).to.equal('hello\n');
        done();
      });
    });

    it('should create child with prefix when option exists', done => {
      const cm = new Childminder();
      const stream = new Memorystream(null, { readable: false });
      const child = cm.create('echo', ['hello'], {
        stdout: stream,
        prefix: 'blabla',
        prefixColor: 120,
      });
      child.terminal.on('end', () => {
        expect(stream.toString())
          .to.equal(`${clc.xterm(120)('[blabla]')} hello\n`);
        done();
      });
    });

    it('should be able to be called multiple times', done => {
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

      es.merge([
        child1.terminal,
        child2.terminal,
      ]).on('end', () => {
        expect(stream1.toString())
          .to.equal(`${clc.xterm(120)('[blabla]')}    hello\n`);
        expect(stream2.toString())
          .to.equal(`${clc.xterm(130)('[blablabla]')} world\n`);
        done();
      });
    });
  });
});

describe('Child', () => {
  describe('#restart', () => {
    it('should restart child process', async () => {
      const cm = new Childminder();
      const stream = new Memorystream(null, { readable: false });

      const child = cm.create('echo', ['hello'], {
        stdout: stream,
      });
      await new Promise(resolve => child.terminal.on('end', resolve));

      // Restart two times.
      child.restart();
      await new Promise(resolve => child.terminal.on('end', resolve));

      child.restart();
      await new Promise(resolve => child.terminal.on('end', resolve));

      expect(stream.toString()).to.equal('hello\nhello\nhello\n');
    });
  });
});