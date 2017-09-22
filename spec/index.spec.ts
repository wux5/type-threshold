import { Thresholder } from "../src/index";

describe('Thresholder class', () => {
  const clock = jasmine.clock();
  beforeEach(() => {
    clock.install();
    clock.mockDate(new Date());
  });
  afterEach(() => {
    clock.uninstall();
  });
  describe('constructor', () => {
    it('should create a valid instance', () => {
      const t = new Thresholder(3, 5, 60, 60, '>');
      expect(t).toBeDefined();
    });
    it('should throw when boundary is specified but operator is not', () => {
      expect(() => { new Thresholder(3, 5, 60, 60) }).toThrowError();
    });
  });

  describe('#push', () => {
    it('should add a new item to bucket when its not broken', () => {
      const t = new Thresholder(3, 5); // 3 times in 5 seconds
      t.push(true);
      expect(t.length).toEqual(1);
    });
    it('should remove expired items from bucket', () => {
      const t = new Thresholder(3, 3); // 3 times in 3 seconds
      t.push(true);
      clock.tick(2000);

      t.push(true);
      expect(t.length).toEqual(2);
      clock.tick(2000);

      t.push(true);
      expect(t.length).toEqual(2);
    });
    it('should check single value against boundary', () => {
      const t = new Thresholder(3, 3, 0, 10, '>'); // 3 times in 3 seconds, value > 10
      t.push(9);
      expect(t.length).toEqual(0);

      t.push(10);
      expect(t.length).toEqual(0);

      t.push(11);
      expect(t.length).toEqual(1);
    });
    it('should check object property value against boundary', () => {
      let t = new Thresholder(3, 3, 0, 10, '>'); // 3 times in 3 seconds, value > 10
      t.push({prop: 9}, 'prop');
      expect(t.length).toEqual(0);

      t.push({ prop: 10 }, 'prop');
      expect(t.length).toEqual(0);

      t.push({ prop: 11 }, 'prop');
      expect(t.length).toEqual(1);

      t = new Thresholder(3, 3, 0, 10, '<'); // 3 times in 3 seconds, value < 10
      t.push({ prop: 9 }, 'prop');
      expect(t.length).toEqual(1);

      t.push({ prop: 10 }, 'prop');
      expect(t.length).toEqual(1);

      t.push({ prop: 11 }, 'prop');
      expect(t.length).toEqual(1);

      t = new Thresholder(3, 3, 0, 10, '='); // 3 times in 3 seconds, value < 10
      t.push({ prop: 9 }, 'prop');
      expect(t.length).toEqual(0);

      t.push({ prop: 10 }, 'prop');
      expect(t.length).toEqual(1);
    });
    it('should check truthy of value when boundary is not specified', () => {
      const t = new Thresholder(3, 3);
      t.push(true);
      expect(t.length).toEqual(1);

      t.push(false);
      expect(t.length).toEqual(1);
    });
    it('should break when threshold is met', () => {
      const t = new Thresholder(3, 5);
      t.on('break', () => {
        expect(t.isBroken).toBeTruthy();
      });
      t.push(true);
      t.push(true);
      expect(t.length).toEqual(2);
      t.push(true);
    });
    it('should push a new item when its already broken and clearAfter = 0', () => {
      const t = new Thresholder(3, 5);
      t.on('break', () => {
        expect(t.isBroken).toBeTruthy();
        t.push(true);
        expect(t.length).toEqual(1);
      });
      t.push(true);
      t.push(true);
      expect(t.length).toEqual(2);
      t.push(true);
    });
    it('should do nothing when its already broken and clearAfter > 0', () => {
      const t = new Thresholder(3, 5, 10);
      t.on('break', () => {
        expect(t.isBroken).toBeTruthy();
        t.push(true);
        expect(t.length).toEqual(0);
      });
      t.push(true);
      t.push(true);
      expect(t.length).toEqual(2);
      t.push(true);
    });
    it('should clear on a valid value when clearAfter = 0', done => {
      const t = new Thresholder(2, 5);
      t.on('break', () => {
        expect(t.isBroken).toBeTruthy();
      });
      t.on('clear', () => {
        expect(t.isBroken).toBeFalsy();
        done();
      });
      t.push(true);
      t.push(true);
      t.push(false)
    });
    it('should clear after clearAfter', done => {
      const t = new Thresholder(2, 5, 10);
      let breakTime: number;
      t.on('break', () => {
        breakTime = Date.now();
      });
      t.on('clear', () => {
        expect(t.isBroken).toBeFalsy();
        expect(Date.now() - breakTime).toEqual(10 * 1000);
        done();
      });
      t.push(true);
      clock.tick(2000);
      t.push(true);
      clock.tick(10000);
    });
  });
});
