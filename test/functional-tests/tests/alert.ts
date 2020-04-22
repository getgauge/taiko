import { alert, accept } from 'taiko';
import {Step,DataStoreFactory,DataStore} from 'gauge-ts';
const assert = require('assert');
let scenarioStore: DataStore = DataStoreFactory.getSpecDataStore();

export default class Alert{
@Step('Alert <text> and await accept')
public async alertAndAwait(text) {
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
