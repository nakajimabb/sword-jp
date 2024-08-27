import kjv from './canons/kjv.json';
import german from './canons/german.json';
import catholic from './canons/catholic.json';
import catholic2 from './canons/catholic2.json';
import kjva from './canons/kjva.json';
import leningrad from './canons/leningrad.json';
import luther from './canons/luther.json';
import lxx from './canons/lxx.json';
import mt from './canons/mt.json';
import nrsv from './canons/nrsv.json';
import nrsva from './canons/nrsva.json';
import orthodox from './canons/orthodox.json';
import synodal from './canons/synodal.json';
import synodalprot from './canons/synodalprot.json';
import vulg from './canons/vulg.json';

class Canon {
  static canons: {
    [key: string]: {
      [key in 'ot' | 'nt']?: {
        [book: string]: {
          name: string;
          maxChapter: number;
          maxVerses: number[];
        };
      };
    };
  } = {
    kjv,
    german,
    catholic,
    catholic2,
    kjva,
    leningrad,
    luther,
    lxx,
    mt,
    nrsv,
    nrsva,
    orthodox,
    synodal,
    synodalprot,
    vulg
  };

  static bookInfos(vers: string, otnt: 'ot' | 'nt') {
    const canon = Canon.canons[vers];
    if (canon && canon[otnt]) {
      return canon[otnt];
    }
    throw Error(`cannot find canon ${vers} ${otnt}`);
  }

  static bookInfo(vers: string, book: string) {
    const canon = Canon.canons[vers];
    if (canon) {
      if (canon.ot && book in canon.ot) {
        return canon.ot[book];
      }
      if (canon.nt && book in canon.nt) {
        return canon.nt[book];
      }
    }
    throw Error(`cannot find canon ${vers} ${book}`);
  }

  static bookNames(vers: string) {
    const canon = Canon.canons[vers];
    if (canon) {
      if (canon.ot) {
        const names = Object.keys(canon.ot);
        return canon.nt ? names.concat(Object.keys(canon.nt)) : names;
      } else if (canon.nt) {
        return Object.keys(canon.nt);
      }
    }
    throw Error(`cannot find canon ${vers}`);
  }

  static bookNum(vers: string, book: string) {
    return Canon.bookNames(vers).indexOf(book);
  }
}

export default Canon;
