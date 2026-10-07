import assert from 'node:assert/strict';
import {slotsFor,wallTime,dayKey} from '../lib/scheduling.ts';
const m=60000,h=60*m;
assert.deepEqual(slotsFor([{start:0,end:h}],[{start:15*m,end:45*m}],15,-h,0),[0,45*m]);
assert.deepEqual(slotsFor([{start:0,end:h}],[],45,-h,0),[0,15*m]);
assert.deepEqual(slotsFor([{start:0,end:h}],[],30,0,.5),[30*m]);
assert.equal(wallTime('2026-07-01','10:00','America/Toronto'),Date.parse('2026-07-01T14:00:00Z'));
assert.equal(wallTime('2026-12-01','10:00','America/Toronto'),Date.parse('2026-12-01T15:00:00Z'));
assert.throws(()=>wallTime('2027-03-14','02:30','America/Toronto'));
assert.throws(()=>wallTime('2026-02-30','10:00','America/Toronto'));
assert.equal(dayKey(Date.parse('2026-10-07T01:00:00Z'),'America/Toronto'),'2026-10-06');
console.log('PASS: appointment duration, overlaps, adjacency, notice, summer/winter offsets, nonexistent DST times, invalid dates, business-day formatting.');

