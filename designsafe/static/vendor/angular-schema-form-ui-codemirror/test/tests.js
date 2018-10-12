/* jshint expr: true */
chai.should();

describe('Schema form', function() {

  describe('directive', function() {
    beforeEach(module('templates'));
    beforeEach(module('schemaForm'));
    beforeEach(
      //We don't need no sanitation. We don't need no though control.
      module(function($sceProvider) {
        $sceProvider.enabled(false);
      })
    );

    it('should return correct form type for format "html"', function() {
      inject(function($compile, $rootScope, schemaForm) {
        var stringSchema = {
          type: 'object',
          properties: {
            color: {
              type: 'string',
              format: 'color'
            }
          }
        };

        var htmlSchema = {
          type: 'object',
          properties: {
            invitation: {
              type: 'string',
              format: 'html'
            }
          }
        };

        schemaForm.defaults(stringSchema).form[0].type.should.be.eq('text');
        schemaForm.defaults(htmlSchema).form[0].type.should.be.eq('wysiwyg');
      });
    });

  });
});
