import { alert, accept, prompt } from 'taiko';
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

  @Step('Prompt <message> and await accept <text>')
  public async promptAndAccept(message: string, text: string) {
    prompt(message, async () => await accept(text));
  }

  @Step('Check if alert was accepted')
  public checkAlertAccepted() {
    assert.ok(scenarioStore.get('alert-text'));
  }
}
