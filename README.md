# type-thresholder
[![Build Status](https://travis-ci.org/wux5/type-thresholder.svg?branch=master)](https://travis-ci.org/wux5/type-thresholder)
[![Coverage Status](https://coveralls.io/repos/github/wux5/type-thresholder/badge.svg?branch=master)](https://coveralls.io/github/wux5/type-thresholder?branch=master)

Flexible thresholder for all kinds of threshold triggers.

```
npm i --save type-thresholder
```

## Usage
```js
describe('breaks when something happened X times consecutively', () => {
  it('should break on X occurrences with boolean values', done => {
    const t = new Thresholder<boolean>(3);
    spyOn(t, 'push').and.callThrough();
    t.on('break', () => {
      expect(t.push).toHaveBeenCalledTimes(3);
      done();
    });
    t.push(true);
    t.push(true);
    t.push(true);
  });
  it('should break on X occurrences with compare function', done => {
    const t = new Thresholder<number>(3, 0, 0, 10, '>');
    spyOn(t, 'push').and.callThrough();
    t.on('break', () => {
      expect(t.push).toHaveBeenCalledTimes(5);
      done();
    });
    t.push(9);  // ok
    t.push(10); // ok
    t.push(11); // hit
    t.push(12); // hit
    t.push(13); // hit
  });
  it('should restart counting occurence of violations on normal values', done => {
    const t = new Thresholder<number>(3, 0, 0, 10, '>');
    spyOn(t, 'push').and.callThrough();
    t.on('break', () => {
      expect(t.push).toHaveBeenCalledTimes(6);
      done();
    });
    t.push(11); // hit
    t.push(12); // hit
    t.push(9);  // ok, restart counting
    t.push(13); // hit
    t.push(14); // hit
    t.push(15); // hit
  });
  it('should clear after X times of normal values', done => {
    const t = new Thresholder<number>(3, 0, 0, 10, '>');
    spyOn(t, 'push').and.callThrough();
    t.on('break', () => {
      expect(t.push).toHaveBeenCalledTimes(5);
    });
    t.on('clear', () => {
      expect(t.push).toHaveBeenCalledTimes(8);
      done();
    });
    t.push(9);  // ok
    t.push(10); // ok
    t.push(11); // hit
    t.push(12); // hit
    t.push(13); // hit
    t.push(1);
    t.push(2);
    t.push(3);
  });
  it('should restart counting occurrence of clears on violations', done => {
    const t = new Thresholder<number>(3, 0, 0, 10, '>');
    spyOn(t, 'push').and.callThrough();
    t.on('break', () => {
      expect(t.push).toHaveBeenCalledTimes(3);
    });
    t.on('clear', () => {
      expect(t.push).toHaveBeenCalledTimes(8);
      done();
    });
    t.push(11); // hit
    t.push(12); // hit
    t.push(13); // hit
    t.push(1);  // ok
    t.push(11); // hit, restart counting
    t.push(2);  // ok
    t.push(3);  // ok
    t.push(4);  // ok
  });
  describe('breaks when something happened X times in last 3 seconds', () => {
    it('should break on X occurences in last 3 seconds', done => {
      const t = new Thresholder(3, 3, 60, 10, '<');
      spyOn(t, 'push').and.callThrough();
      t.on('break', () => {
        expect(t.push).toHaveBeenCalledTimes(6);
        done();
      });
      t.push(10); // ok
      t.push(9);  // hit, but will be removed as it happened 3 seconds before
      clock.tick(1000);
      t.push(8);  // hit
      t.push(11); // ok
      clock.tick(3000);
      t.push(7);  // hit
      t.push(6);  // hit
    });
    it('should do nothing when its already broken', done => {
      const t = new Thresholder(3, 3, 60, 10, '=');
      spyOn(t, 'push').and.callThrough();
      t.on('break', () => {
        expect(t.push).toHaveBeenCalledTimes(3);
        t.push(10); // hit
        t.push(10); // hit
        t.push(10); // hit
        done();
      });
      t.push(10); // hit
      t.push(10); // hit
      t.push(10); // hit
    });
    it('should clear on X consecutive occurences of normal value', done => {
      const t = new Thresholder(3, 3);
      spyOn(t, 'push').and.callThrough();
      t.on('clear', () => {
        expect(t.push).toHaveBeenCalledTimes(6);
        done();
      });
      t.push(true);
      t.push(true);
      t.push(true);
      t.push(false);
      t.push(false);
      t.push(false);
    });
    it('should clear 1 minute after it breaks', done => {
      const t = new Thresholder(3, 3, 60);
      const start = Date.now();
      spyOn(t, 'push').and.callThrough();
      t.on('clear', () => {
        expect(Date.now() - start).toEqual(60 * 1000);
        done();
      });
      t.push(true);
      t.push(true);
      t.push(true);
      clock.tick(2 * 60 * 1000);
    });
  });
  it('should check object property value against boundary', () => {
    let t = new Thresholder(3, 3, 0, 10, '>'); // 3 times in 3 seconds, value > 10
    t.push({ prop: 9 }, 'prop');
    expect(t.violations).toEqual(0);

    t.push({ prop: 10 }, 'prop');
    expect(t.violations).toEqual(0);

    t.push({ prop: 11 }, 'prop');
    expect(t.violations).toEqual(1);

    t = new Thresholder(3, 3, 0, 10, '<'); // 3 times in 3 seconds, value < 10
    t.push({ prop: 9 }, 'prop');
    expect(t.violations).toEqual(1);

    t.push({ prop: 10 }, 'prop');
    expect(t.violations).toEqual(1);

    t.push({ prop: 11 }, 'prop');
    expect(t.violations).toEqual(1);

    t = new Thresholder(3, 3, 0, 10, '='); // 3 times in 3 seconds, value < 10
    t.push({ prop: 9 }, 'prop');
    expect(t.violations).toEqual(0);

    t.push({ prop: 10 }, 'prop');
    expect(t.violations).toEqual(1);
  });
});
```
