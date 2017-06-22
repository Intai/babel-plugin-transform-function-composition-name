
export default function({ types: t }) {

  function isCallExpression(node) {
    return node && node.type === 'CallExpression'
      && node.callee.name !== 'require'
  }

  function isGeneratedVariable(path) {
    return path.scope.hasUid(path.node.id.name)
  }

  function isInFunction(path) {
    return t.isProgram(path.scope.block)
      || t.isFunction(path.scope.block)
  }

  function isCompositeVariable(node, state) {
    return !!state.opts.variable
      && state.opts.variable.test(node.name)
  }

  function isCompositeCallee(node, state) {
    return !!state.opts.callee
      && node.callee.type === 'MemberExpression'
      && state.opts.callee.test(node.callee.object.name)
  }

  function isComposite(path, state) {
    return isCompositeVariable(path.node.id, state)
      || isCompositeCallee(path.node.init, state)
  }

  function shouldTransform(path, state) {
    return isCallExpression(path.node.init)
      && isComposite(path, state)
      && isInFunction(path)
      && !isGeneratedVariable(path)
  }

  function selfExecute(func) {
    return t.callExpression(
      t.callExpression(
        t.memberExpression(func, t.identifier('bind')),
        [t.identifier('this')]
      ),
      []
    )
  }

  function buildNamedFunction(left, right) {
    return t.functionExpression(
      left,
      [t.restElement(t.identifier('args'))],
      t.blockStatement([
        t.returnStatement(
          t.callExpression(
            t.memberExpression(right, t.identifier('apply')),
            [t.identifier('this'), t.identifier('args')]
          )
        )
      ])
    )
  }

  function buildWrapFunction(scope, left, right) {
    const localUid = scope.generateUidIdentifier(left.name)
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
      VariableDeclarator(path, state) {
        if (shouldTransform(path, state)) {
          path.node.init = selfExecute(
            buildWrapFunction(path.scope, path.node.id, path.node.init)
          )
        }
      }
    }
  }
}
