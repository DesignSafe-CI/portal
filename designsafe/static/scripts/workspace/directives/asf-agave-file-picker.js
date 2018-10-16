angular.module('schemaForm').config(
    ['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider',
        function(schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {
            let filePicker = function(name, schema, options) {
                if (schema.type === 'string' && schema.format === 'agaveFile') {
                    let f = schemaFormProvider.stdFormObj(name, schema, options);
                    f.key = options.path;
                    f.type = 'agaveFilePicker';
                    options.lookup[sfPathProvider.stringify(options.path)] = f;
                    return f;
                }
                return null;
            };

            schemaFormProvider.defaults.string.unshift(filePicker);

            // Add to the bootstrap directive
            schemaFormDecoratorsProvider.addMapping(
                'bootstrapDecorator',
                'agaveFilePicker',
                '/static/scripts/workspace/html/directives/asf-agave-file-picker.html'
            );
            schemaFormDecoratorsProvider.createDirective(
                'agaveFilePicker',
                '/static/scripts/workspace/html/directives/asf-agave-file-picker.html'
            );
        },
    ]);
