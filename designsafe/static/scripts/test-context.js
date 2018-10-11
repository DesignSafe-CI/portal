import angular from 'angular';

import mocks from 'angular-mocks';
import * as main from './ng-designsafe/ng-designsafe';

let context = require.context('.', true, /\.spec\.js/);

context.keys().forEach(context);
