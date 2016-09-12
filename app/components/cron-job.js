import Ember from 'ember';

const { service } = Ember.inject;
import { task } from 'ember-concurrency';

export default Ember.Component.extend({
  classNames: ['settings-cron'],
  isDeleting: false,
  actionType: 'Save',
  store: service(),
  runOnlyWhenNewCommit: Ember.computed('cron.run_only_when_new_commit', function () {
    if (this.get('cron.run_only_when_new_commit')) {
      return 'Only if there is a new commit';
    } else {
      return 'Always run';
    }
  }),

  delete: task(function* () {
    yield this.get('cron').destroyRecord();
  }).drop()
});
