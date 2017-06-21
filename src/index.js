
export default function({ types: t }) {

  function isCallExpression(node) {
    return node && node.type === 'CallExpression'
      && node.callee.name !== 'require'
  }

  function isGeneratedVariable(path) {
    return path.scope.hasUid(path.node.id.name)
  }

  function selfExecute(func) {
    return t.expressionStatement(
      t.callExpression(
        func,
        []
      )
    );
  }

  function buildNamedFunction(left, right) {
    return t.functionExpression(
      t.identifier(left.name),
      [t.restElement(t.identifier('args'))],
      t.blockStatement([
        t.returnStatement(
          t.callExpression(right, [t.identifier('args')])
        )
      ])
    )
  }

  function buildWrapFunction(localUid, left, right) {
    return t.functionExpression(
      t.identifier(''),
      [],
      t.blockStatement([
        t.variableDeclaration('const', [t.variableDeclarator(localUid, right)]),
        t.ifStatement(
          t.binaryExpression('===', t.unaryExpression('typeof', localUid), t.stringLiteral('function')),
          t.blockStatement([t.returnStatement(buildNamedFunction(left, localUid))]),
          t.returnStatement(localUid)
        )
      ])
    )
  }

  return {
    visitor: {
      VariableDeclarator(path) {
        if (isCallExpression(path.node.init) && !isGeneratedVariable(path)) {
          const localUid = path.scope.generateUidIdentifier(path.node.id.name)
          path.node.init = selfExecute(buildWrapFunction(localUid, path.node.id, path.node.init));
        }
      }
    }
  };
}
