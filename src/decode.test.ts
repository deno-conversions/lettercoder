import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { describe, it } from 'https://deno.land/std@0.208.0/testing/bdd.ts';

import {
  decodeQuotedPrintable,
  decodeMimeWords,
  decodeMimeWord,
} from './index.ts';

describe('letterparser', () => {
  it('decodes MIME word examples from section 8 of RFC 2047', () => {
    assertEquals(decodeMimeWord('=?US-ASCII?Q?Keith_Moore?='), 'Keith Moore');

    assertEquals(
      decodeMimeWord('=?ISO-8859-1?Q?Keld_J=F8rn_Simonsen?='),
      'Keld Jørn Simonsen'
    );
    assertEquals(decodeMimeWord('=?ISO-8859-1?Q?Andr=E9?='), 'André');
    assertEquals(
      decodeMimeWord('=?ISO-8859-1?B?SWYgeW91IGNhbiByZWFkIHRoaXMgeW8=?='),
      'If you can read this yo'
    );
    assertEquals(
      decodeMimeWord('=?ISO-8859-2?B?dSB1bmRlcnN0YW5kIHRoZSBleGFtcGxlLg==?='),
      'u understand the example.'
    );
    assertEquals(
      decodeMimeWord('=?ISO-8859-1?Q?Olle_J=E4rnefors?='),
      'Olle Järnefors'
    );
    assertEquals(
      decodeMimeWord('=?ISO-8859-1?Q?Patrik_F=E4ltstr=F6m?='),
      'Patrik Fältström'
    );
    assertEquals(
      decodeMimeWord('=?iso-8859-8?b?7eXs+SDv4SDp7Oj08A==?='),
      'םולש ןב ילטפנ'
    );
  });

  it('decodes Quoted-Printable', () => {
    assertEquals(
      decodeQuotedPrintable(
        "Now's the time =\nfor all folk to come=\n to the aid of their country.",
        'utf8'
      ),
      "Now's the time for all folk to come to the aid of their country."
    );

    assertEquals(
      decodeQuotedPrintable(
        "J'interdis aux marchands de vanter trop leurs marchandises. Car ils se font =\nvite p=C3=A9dagogues et t'enseignent comme but ce qui n'est par essence qu'=\nun moyen, et te trompant ainsi sur la route =C3=A0 suivre les voil=C3=A0 bi=\nent=C3=B4t qui te d=C3=A9gradent, car si leur musique est vulgaire ils te f=\nabriquent pour te la vendre une =C3=A2me vulgaire.",
        'utf8'
      ),
      "J'interdis aux marchands de vanter trop leurs marchandises. Car ils se font vite pédagogues et t'enseignent comme but ce qui n'est par essence qu'un moyen, et te trompant ainsi sur la route à suivre les voilà bientôt qui te dégradent, car si leur musique est vulgaire ils te fabriquent pour te la vendre une âme vulgaire."
    );

    assertEquals(decodeQuotedPrintable('=F0=9F=91=8D', 'utf8'), '👍');

    assertEquals(
      decodeQuotedPrintable('=DE=AD=BE=EF'),
      Uint8Array.from([0xde, 0xad, 0xbe, 0xef])
    );

    assertEquals(decodeQuotedPrintable('____', 'utf8'), '____');
  });

  it('handles multiple mime words properly', () => {
    assertEquals(decodeMimeWords('=?ISO-8859-1?Q?a?= b'), 'a b');
    assertEquals(decodeMimeWords('a =?ISO-8859-1?Q?a?= b'), 'a a b');
    assertEquals(
      decodeMimeWords('=?ISO-8859-1?Q?a?= =?ISO-8859-1?Q?b?='),
      'ab'
    );
    assertEquals(
      decodeMimeWords('=?ISO-8859-1?Q?a?=  =?ISO-8859-1?Q?b?='),
      'ab'
    );
    assertEquals(
      decodeMimeWords('=?ISO-8859-1?Q?a?=\n =?ISO-8859-1?Q?b?='),
      'ab'
    );
    assertEquals(
      decodeMimeWords(
        '=?ISO-8859-1?B?SWYgeW91IGNhbiByZWFkIHRoaXMgeW8=?= =?ISO-8859-2?B?dSB1bmRlcnN0YW5kIHRoZSBleGFtcGxlLg==?='
      ),
      'If you can read this you understand the example.'
    );

    assertEquals(decodeMimeWords('=?ISO-8859-1?Q?a_b_c?= b'), 'a b c b');
  });

  it('handles the lack of mime words properly', () => {
    assertEquals(decodeMimeWords('a b'), 'a b');
    assertEquals(decodeMimeWords('a@b.com'), 'a@b.com');
    assertEquals(decodeMimeWords('text/plain'), 'text/plain');
  });
});
