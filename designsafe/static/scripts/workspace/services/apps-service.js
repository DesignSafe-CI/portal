import _ from 'underscore';

export function appsService($http, $q, $translate, Django) {
    'ngInject';
    let service = {};

    service.list = function(query) {
        return $http({
            url: '/rw/workspace/api/meta/',
            method: 'GET',
            params: { q: query },
            cache: true,
        });
    };

    service.get = function(appId) {
        return $http({
            url: '/rw/workspace/api/apps/',
            method: 'GET',
            params: { app_id: appId },
        });
    };

    service.getMeta = function(appId) {
        return $http({
            url: '/applications/api/meta/',
            method: 'GET',
            params: { q: { name: $translate.instant('apps_metadata_name'), 'value.definition.id': appId } },
        });
    };

    service.getAppDropdownDescription = function(appId) {
        return $http({
            url: '/rw/workspace/api/description/',
            method: 'GET',
            params: { app_id: appId },
        });
    };

    service.getDateString = function() {
        let result = new Date().toISOString();
        return result.slice(0, result.indexOf('.'));
    };

    service.formSchema = function(app) {
        /**
         * Generate a JSON.schema for the app ready for angular-schema-form
         * https://github.com/json-schema-form/angular-schema-form
         */
        if (typeof app === 'string') {
            app = service.get(app);
        }
        let params = app.parameters || [],
            inputs = app.inputs || [],
            schema = {
                type: 'object',
                properties: {},
            };

        if (params.length > 0) {
            schema.properties.parameters = {
                type: 'object',
                properties: {},
            };
            _.each(params, (param) => {
                if (!param.value.visible || param.id.startsWith('_')) {
                    return;
                }
                try {
                    RegExp(param.value.validator);
                } catch (e) {
                    param.value.validator = null;
                }
                let field = {
                    title: param.details.label,
                    description: param.details.description,
                    required: param.value.required,
                    default: param.value.default,
                    pattern: param.value.validator || undefined,
                };
                switch (param.value.type) {
                    case 'bool':
                    case 'flag':
                        field.type = 'boolean';
                        break;

                    case 'enumeration':
                        field.type = 'string';
                        field.enum = _.map(param.value.enum_values, function(enumVal) {
                            return Object.keys(enumVal)[0];
                        });
                        field['x-schema-form'] = {
                            titleMap: _.map(param.value.enum_values, function(enumVal) {
                                let key = Object.keys(enumVal)[0];
                                return {
                                    value: key,
                                    name: enumVal[key],
                                };
                            }),
                        };
                        break;

                    case 'number':
                        field.type = 'number';
                        break;

                    case 'string':
                        field.type = 'string';
                        if (('ontology' in param.semantics) && (param.semantics.ontology.includes('agaveFile'))) {
                            field.format = 'agaveFile';
                        }
                        break;
                    default:
                        field.type = 'string';
                }
                schema.properties.parameters.properties[param.id] = field;
            });
        }

        if (inputs.length > 0) {
            schema.properties.inputs = {
                type: 'object',
                properties: {},
            };
            _.each(inputs, (input) => {
                if (input.id.startsWith('_') || !input.value.visible) {
                    return;
                }
                try {
                    RegExp(input.value.validator);
                } catch (e) {
                    input.value.validator = null;
                }
                let field = {
                    title: input.details.label,
                    description: input.details.description,
                    id: input.id,
                    // default: input.value.default,
                    pattern: input.value.validator || undefined,
                };
                if (input.semantics.maxCardinality === 1) {
                    field.type = 'string';
                    field.format = 'agaveFile';
                    field.required = input.value.required;
                } else {
                    field.type = 'array';
                    field.items = {
                        type: 'string',
                        format: 'agaveFile',
                        required: input.value.required,
                        'x-schema-form': { notitle: true },
                        title: input.details.label,
                        pattern: input.value.validator || undefined,
                    };
                    if (input.semantics.maxCardinality > 1) {
                        field.maxItems = input.semantics.maxCardinality;
                    }
                }
                schema.properties.inputs.properties[input.id] = field;
            });
        }

        function replaceAt(str, i, replace) {
            return str.slice(0, i) + replace + str.slice(i + 1);
        }

        /**
         * Create regex pattern for maxRunTime
         * @function
         * @param {String} maxRunTime - maxRunTime given in the format of hh:mm:ss, usually from the target queue's maxRequestedTime
         * Creates a multigrouped regex to accommodate several layers of timestamps.
         */
        function createMaxRunTimeRegex(maxRunTime) {
            let timeStr = maxRunTime.replace(/:/g, '');
            let tmp = '[0-0][0-0]:[0-0][0-0]:[0-0][0-0]$'; // procedurally populated max value regex
            const regBase = '[0-4][0-9]:[0-5][0-9]:[0-5][0-9]$'; // default max values

            let regStr = '^'; // procedurally generated regex string to be returned

            let index = 3;

            // iterate through each value in the maxRunTime to generate a regex group
            timeStr.split('').forEach((n, i, arr) => {

                // only need to generate regex for nonzero values
                if (n > 0) {
                    if ((arr.length - 1) !== i) {
                        tmp = replaceAt(tmp, index, n - 1);
                        if (regStr !== '^') {
                            regStr += '|^';
                        }
                        regStr += tmp.slice(0, index + 1) + regBase.slice(index + 1);
                    }

                    tmp = replaceAt(tmp, index, n);
                    if ((arr.length - 1) === i || (arr[i + 1] == 0)) {
                        if (regStr !== '^') {
                            regStr += '|^';
                        }
                        regStr += tmp;
                    }
                }

                index += (i % 2 == 0) ? 5 : 6;
            });
            return regStr;
        }

        let defaultQueue = app.defaultQueue ? app.exec_sys.queues.find((q) => q.name === app.defaultQueue) : app.exec_sys.queues.find((q) => q.default === true);

        schema.properties.maxRunTime = {
            title: 'Maximum job runtime',
            description: `In HH:MM:SS format. The maximum time you expect this job to run for. After this amount of time your job will be killed by the job scheduler. Shorter run times result in shorter queue wait times. Maximum possible time is ${defaultQueue.maxRequestedTime} (hrs:min:sec).`,
            type: 'string',
            pattern: createMaxRunTimeRegex(defaultQueue.maxRequestedTime),
            validationMessage: `Must be in format HH:MM:SS and be less than ${defaultQueue.maxRequestedTime} (hrs:min:sec).`,
            required: true,
            default: app.defaultMaxRunTime || '02:00:00'
        };

        schema.properties.name = {
            title: 'Job name',
            description: 'A recognizable name for this job. Make this descriptive if you submit many jobs.',
            type: 'string',
            required: true,
            default: app.id + '_' + this.getDateString(),
            maxLength: 64,
        };

        schema.properties.nodeCount = {
            title: 'Number of Nodes',
            description: `Number of requested process nodes.`,
            type: 'integer',
            default: app.defaultNodeCount,
            minimum: 1,
            maximum: defaultQueue.maxNodes,
            required: true
        };

        schema.properties.processorsPerNode = {
            title: 'Processors Per Node',
            description: `Number of processors (cores) per node.`,
            type: 'integer',
            default: Math.floor((app.defaultProcessorsPerNode || 1) / (app.defaultNodeCount || 1)),
            minimum: 1,
            maximum: Math.floor(defaultQueue.maxProcessorsPerNode / defaultQueue.maxNodes),
            required: true
        };

        schema.properties.archivePath = {
            title: 'Job output archive location',
            description: `All job output data will be archived here after job completion. If no path is specifed, job output will be archived to your My Data directory at <code>${Django.user}/archive/jobs/\${YYYY-MM-DD}/\${JOB_NAME}-\${JOB_ID}</code>.`,
            type: 'string',
            format: 'agaveFile',
            'x-schema-form': { placeholder: `${Django.user}/archive/jobs/\${YYYY-MM-DD}/\${JOB_NAME}-\${JOB_ID}` },
        };

        return schema;
    };

    return service;
}
