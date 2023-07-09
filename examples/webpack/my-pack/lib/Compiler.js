const path = require('path')
const fs = require('fs')
const babylon = require('babylon')
const traverse = require('@babel/traverse').default
const types = require('@babel/types')
const generator = require('@babel/generator').default
const ejs = require('ejs')
const { SyncHook } = require('tapable')

class Compiler {
    constructor(config) {
        this.config = config
        this.entryId
        this.modules = {}
        this.entry = config.entry
        this.root = process.cwd()
        this.hooks = {
            entryOption: new SyncHook(),
            compile: new SyncHook(),
            afterCompile: new SyncHook(),
            afterPlugins: new SyncHook(),
            run: new SyncHook(),
            emit: new SyncHook(),
            done: new SyncHook()
        }
        const plugins = this.config.plugins
        if (Array.isArray(plugins)) {
            plugins.forEach(plugin => {
                plugin.apply(this)
            })
        }
        this.hooks.afterPlugins.call()
    }

    getSource(modulePath) {
        let content = fs.readFileSync(modulePath, 'utf8')
        const rules = this.config.module.rules
        let p = 0
        while (p < rules.length) {
            const { test, use } = rules[p]
            if (test.test(modulePath)) {
                let len = use.length - 1
                while (len >= 0) {
                    const loaderPath = use[len]
                    const loader = require(loaderPath)
                    content = loader(content)
                    len--
                }
            }
            p++
        }
        return content
    }

    parse(source, parentPath) {
        const ast = babylon.parse(source)
        const dependencies = []
        traverse(ast, {
            CallExpression(p) {
                const node = p.node
                if (node.callee.name === 'require') {
                    node.callee.name = '__webpack_require__'
                    let moduleName = node.arguments[0].value
                    moduleName = moduleName + (path.extname(moduleName) ? '' : '.js')
                    moduleName = './' + path.join(parentPath, moduleName)
                    dependencies.push(moduleName)
                    node.arguments = [types.stringLiteral(moduleName)]
                }
            }
        })
        const sourceCode = generator(ast).code
        return { sourceCode, dependencies }
    }

    buildModule(modulePath, isEntry) {
        const source = this.getSource(modulePath)
        const moduleName = './' + path.relative(this.root, modulePath)

        if (isEntry) {
            this.entryId = moduleName
        }

        const { sourceCode, dependencies } = this.parse(source, path.dirname(moduleName))

        this.modules[moduleName] = sourceCode

        dependencies.forEach(dep => {
            this.buildModule(path.join(this.root, dep), false)
        })
    }

    emitFile() {
        const main = path.resolve(this.config.output.path, this.config.output.filename)
        const templateStr = this.getSource(path.resolve(__dirname, 'main.ejs'))
        const code = ejs.render(templateStr, { entryId: this.entryId, modules: this.modules })

        this.assets = {}
        this.assets[main] = code
        fs.writeFileSync(main, this.assets[main])
    }

    run() {
        this.hooks.run.call()
        this.hooks.compile.call()
        this.buildModule(path.resolve(this.root, this.entry), true)
        this.hooks.afterCompile.call()
        this.hooks.emit.call()
        this.emitFile()
        this.hooks.done.call()
    }
}

module.exports = Compiler