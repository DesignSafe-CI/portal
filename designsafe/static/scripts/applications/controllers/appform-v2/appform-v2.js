export default function($scope) {
    // Set-up schema
    $scope.formSchema = require('./utils/schema');
    $scope.pages = { 1: 'Basics', 2: 'Dependences', 3: 'Environment', 4: 'Parameters', 5: 'Inputs' };
    $scope.page = 1;
    $scope.currentPage = $scope.formSchema[$scope.page];

    /** Match the value to provided regular expression */
    $scope.showValidation = function(input, matcher) {
        if (input === undefined) return true;
        const regex = new RegExp(matcher);
        return regex.test(input);
    };

    // Set-up model
    $scope.formBody = Object.entries($scope.currentPage).reduce((obj, val) => {
        const [key, values] = val;
        const { defaultValue } = values;
        return Object.assign(obj, {
            [key]: defaultValue ? defaultValue : '',
        });
    }, {});

    $scope.addModel = function(array, value) {
        // console.log('click');
        if (array === undefined) {
            array = [];
        }
        if (value !== '') {
            array.push(value);
            value = '';
        }
        return null;
    };
}
