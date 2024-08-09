import { getElements } from "./selectors";

import { type SearchElement, below, click, link } from "taiko";

import { Step } from "gauge-ts";

export default class Click {
  @Step("Click link <userlink> below <text>")
  public async clickLinkBelowTable(userlink: SearchElement, text: string) {
    await click(link(userlink, below(text)), { waitForNavigation: true });
  }
}
