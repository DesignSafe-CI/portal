import _ from 'underscore';

export function appsService($http, $q, $translate, djangoUrl, Django) {
    'ngInject';
    let service = {};

    service.list = function(query) {
        return $http({
            url: djangoUrl.reverse('designsafe_workspace:call_api', ['meta']),
            method: 'GET',
            params: { q: query },
            cache: true,
        });
    };

    service.get = function(appId) {
        return $http({
            url: djangoUrl.reverse('designsafe_workspace:call_api', ['apps']),
            method: 'GET',
            params: { app_id: appId },
        });
    };

    service.getMeta = function(appId) {
        return $http({
            url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
            method: 'GET',
            params: { q: { name: $translate.instant('apps_metadata_name'), 'value.definition.id': appId } },
        });
    };

    service.copyNotebook = function(fileMgrName, systemId, filePath) {
        return $http({
            url: djangoUrl.reverse('designsafe_api:public_files_media', [fileMgrName, systemId, filePath]),
            method: 'PUT',
            data: {
                action: 'copy',
                ipynb: true,
                system: 'designsafe.storage.default',
            },
        });
    };

    service.setupNotebook = function(filePath) {
        return $http({
            url: djangoUrl.reverse('designsafe_workspace:call_api', ['ipynb']),
            method: 'PUT',
            data: {
                file_path: filePath,
                system: 'designsafe.storage.default',
            },
        });
    };

    service.getAppDropdownDescription = function(appId) {
        return $http({
            url: djangoUrl.reverse('designsafe_workspace:call_api', ['description']),
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
                        description: input.details.description,
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
         * @param {String} defaultMaxRunTime - defaultMaxRunTime defined in the app definition in the format of hh:mm:ss
         * Creates a multigrouped regex to accommodate several layers of timestamps.
         */
        function createMaxRunTimeRegex(defaultMaxRunTime) {
            let timeStr = defaultMaxRunTime.replace(/:/g, '');
            let tmp = '([0-0][0-0]:[0-0][0-0]:[0-0][0-0])'; // procedurally populated max value regex
            let regBase = '([0-4][0-9]:[0-5][0-9]:[0-5][0-9])'; // default max values

            let regStr = '^'; // procedurally generated regex string to be returned

            let index = 4;

            // iterate through each value in the defaultMaxRunTime to generate a regex group
            timeStr.split('').forEach((n, i, arr) => {

                // only need to generate regex for nonzero values
                if (n > 0) {
                    if (!Object.is(arr.length - 1, i)) {
                        tmp = replaceAt(tmp, index, n - 1);
                        if (regStr !== '^') {
                            regStr += '|^';
                        }
                        regStr += tmp.slice(0, index + 1) + regBase.slice(index + 1);
                    }

                    tmp = replaceAt(tmp, index, n);
                    if (Object.is(arr.length - 1, i) || (arr[i + 1] == 0)) {
                        if (regStr !== '^') {
                            regStr += '|';
                        }
                        regStr += tmp;
                    }
                }

                if (Object.is(arr.length - 1, i)) {
                    regStr += '$';
                }

                index += (i % 2 == 0) ? 5 : 6;
            });
            return regStr;
        }

        let maxQueueRunTime = app.defaultQueue ? app.exec_sys.queues.find((q) => q.name === app.defaultQueue).maxRequestedTime : app.exec_sys.queues.find((q) => q.default === true).maxRequestedTime;

        schema.properties.maxRunTime = {
            title: 'Maximum job runtime',
            description: `In HH:MM:SS format. The maximum time you expect this job to run for. After this amount of time your job will be killed by the job scheduler. Shorter run times result in shorter queue wait times. Maximum possible time is ${maxQueueRunTime} (hrs:min:sec).`,
            type: 'string',
            pattern: createMaxRunTimeRegex(maxQueueRunTime),
            validationMessage: `Must be in format HH:MM:SS and be less than ${maxQueueRunTime} (hrs:min:sec).`,
            required: true,
            'x-schema-form': { placeholder: app.defaultMaxRunTime || '06:00:00' },
        };

        schema.properties.name = {
            title: 'Job name',
            description: 'A recognizable name for this job.',
            type: 'string',
            required: true,
            default: app.id + '_' + this.getDateString(),
            maxLength: 64,
        };

        schema.properties.nodeCount = {
            title: 'Node Count',
            description: `Number of requested process nodes for the job. Default number of nodes is ${app.defaultNodeCount}.`,
            type: 'integer',
            enum: Array.from(Array(12).keys()).map((i) => i + 1),
            default: app.defaultNodeCount,
            'x-schema-form': {
                type: 'select',
                titleMap: _.map(Array.from(Array(12).keys()).map((i) => i + 1), function(val) {
                    return {
                        value: val,
                        name: val,
                    };
                }),
            },
        };

        schema.properties.processorsPerNode = {
            title: 'Processors Per Node',
            description: `Number of processors (cores) per node for the job. e.g. A selection of 16 processors per node along with 4 nodes
            will result in 4 nodes with 16 processors each, 64 processors total. Default number of processors per node is ${Math.floor(app.defaultProcessorsPerNode || 1) / (app.defaultNodeCount || 1)}.`,
            type: 'integer',
            default: Math.floor((app.defaultProcessorsPerNode || 1) / (app.defaultNodeCount || 1)),
            minimum: 1,
            maximum: Math.floor(app.defaultProcessorsPerNode || 1) / (app.defaultNodeCount || 1),
        };

        schema.properties.archivePath = {
            title: 'Job output archive location (optional)',
            description: `Specify a location where the job output should be archived. By default, job output will be archived at: <code>${Django.user}/archive/jobs/\${YYYY-MM-DD}/\${JOB_NAME}-\${JOB_ID}</code>.`,
            type: 'string',
            format: 'agaveFile',
            'x-schema-form': { placeholder: `${Django.user}/archive/jobs/\${YYYY-MM-DD}/\${JOB_NAME}-\${JOB_ID}` },
        };

        return schema;
    };

    return service;
}
