module.exports = {
  rules: {
    'no-instanceof': {
      create: function (context) {
        const targetTypes = [
          'Boolean',
          'Number',
          'String',
          'Object',
          'Function',
          'Symbol',
          'Date',
          'Array',
        ];

        return {
          BinaryExpression(node) {
            if (node.operator === 'instanceof' && targetTypes.includes(node.right.name)) {
              context.report(
                node,
                'Do not use instanceof (https://github.com/getgauge/gauge-js/issues/384). Update with Object prototype or typeof.',
              );
            }
          },
        };
      },
    },
  },
};
