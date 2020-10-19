'use strict';
import { getElements } from './selectors';

import { link, click, below, SearchElement } from 'taiko';

import { Step } from 'gauge-ts';

export default class Click {
  @Step('Click link <userlink> below <text>')
  public async clickLinkBelowTable(userlink: SearchElement, text: string) {
    await click(link(userlink, below(text)), { waitForNavigation: true });
  }
}
