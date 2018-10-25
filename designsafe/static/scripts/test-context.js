import angular from 'angular';

import mocks from 'angular-mocks';
import './ng-designsafe/ng-designsafe';
import './data-depot';
import './workspace/app';
import './search';
import './dashboard';
import './applications/app';
import './notifications/app';

let context = require.context('.', true, /\.spec\.js/);
context.keys().forEach(context);
