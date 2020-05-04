import { alert, accept } from 'taiko';
// eslint-disable-next-line no-unused-vars
import { Step, DataStoreFactory, DataStore } from 'gauge-ts';
const assert = require('assert');
const scenarioStore: DataStore = DataStoreFactory.getSpecDataStore();

export default class Alert {
  @Step('Alert <text> and await accept')
  public async alertAndAwait(text: string) {
    alert(text, async () => {
      await accept();
      scenarioStore.put('alert-text', true);
    });
  }

  @Step('Check if alert was accepted')
  public checkAlertAccepted() {
    assert.ok(scenarioStore.get('alert-text'));
  }
}
