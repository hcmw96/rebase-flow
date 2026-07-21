import { pickBookableClientServiceIdForBooking } from '../supabase/functions/_shared/mindbodyClientServices.ts';

const membership = [
  { Id: 1, Name: 'Unlimited Membership', Remaining: 99 },
  { Id: 2, Name: 'Class Pass 10', Remaining: 5 },
  { Id: 3, Name: 'Communal Contrast Drop-in', Remaining: 2 },
  { Id: 5, Name: 'Cryotherapy 5 Pack', Remaining: 3 },
  { Id: 6, Name: 'Private Suite Allowance', Remaining: 2 },
  { Id: 7, Name: 'Massage 60min Pack', Remaining: 1 },
  { Id: 8, Name: 'Hyperbaric 5 Pack', Remaining: 2 },
  { Id: 9, Name: 'Session Credits', Remaining: 10 },
];

const cases: Array<[
  'class' | 'appointment',
  string,
  number | null,
]> = [
  ['appointment', 'Sports Massage (60 mins)', 7],
  ['appointment', 'Premium Suite (60 mins)', 6],
  ['appointment', 'Infrared Suite (90 mins)', 6],
  ['appointment', 'Infrared Sauna/Ice bath (90 mins)', 6],
  ['appointment', 'Cryotherapy', 5],
  ['appointment', 'Hyperbaric Oxygen (60 mins)', 8],
  ['appointment', 'IV Drip - Glow', null],
  ['appointment', 'NAD+ (250MG)', null],
  ['class', 'Communal Contrast', 3],
];

const memberOnly = [
  { Id: 10, Name: 'Rebase Membership Unlimited', Remaining: 99 },
  { Id: 11, Name: 'Session Credits', Remaining: 10 },
  { Id: 12, Name: 'Unlimited Visits', Remaining: 99 },
  { Id: 13, Name: 'Class Pass', Remaining: 5 },
  { Id: 14, Name: 'Communal Contrast', Remaining: 3 },
];

let fail = 0;
for (const [bt, name, expect] of cases) {
  const got = pickBookableClientServiceIdForBooking(membership, {
    bookingType: bt,
    serviceName: name,
  });
  const ok = got === expect;
  if (!ok) fail++;
  console.log(`${ok ? 'OK' : 'FAIL'} ${bt} "${name}" => ${got} (want ${expect})`);
}

console.log('--- memberOnly must be null for paid extras ---');
for (const name of [
  'Sports Massage (60 mins)',
  'Premium Suite (60 mins)',
  'Deep Tissue Massage (60 mins)',
  'Divine Facial Healing',
  'Brazilian Lymphatic',
  'Assisted Stretching',
  'IV Drip',
  'Infrared Sauna/Ice bath (60 mins)',
  'Four Hand Massage',
]) {
  const got = pickBookableClientServiceIdForBooking(memberOnly, {
    bookingType: 'appointment',
    serviceName: name,
  });
  const ok = got === null;
  if (!ok) fail++;
  console.log(`${ok ? 'OK' : 'FAIL'} memberOnly "${name}" => ${got}`);
}

console.log(fail ? `${fail} FAILURES` : 'ALL PASS');
process.exit(fail ? 1 : 0);
