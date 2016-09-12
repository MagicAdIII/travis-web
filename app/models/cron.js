import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo } from 'ember-data/relationships';

export default Model.extend({
  branch: belongsTo('branch', { async: true }),
  interval: attr('string'),
  run_only_when_new_commit: attr('boolean'),
  created_at: attr('string'),
  last_run: attr('string'),
  next_run: attr('string')
});
