# 手写webpack来彻底了解loader和plugin

作为一名前端工程师，相信大家一定用过webpack，但我们熟悉它的底层原理吗，与其查阅各种解释，不如手写一个简易版webpack，彻底理解其实现原理。

## 一、为什么要用webpack

webpack出现之前，假如我们要实现一个响应式的网页，可能会这样写：

```javascript
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>

    <script src="https://cdn.bootcdn.net/ajax/libs/jquery/3.6.4/jquery.min.js"></script>
    <script src="https://cdn.bootcdn.net/ajax/libs/bootstrap/5.2.3/js/bootstrap.min.js"></script>
    <script src="./src/index.js"></script>
</head>

<body>
</body>

</html>
```

这会导致以下几个问题：

    1、在index.js中，不知道该文件依赖哪些外部库
    2、模块间的通信困难，基本上都是靠往window对象上注入变量来暴露给外部使用
    3、浏览器会下载script标签中所有的代码，包括没有用到代码
    4、script标签的顺序必须正确，否则可能会导致找不到依赖报错
    5、如果该项目规模变大，js脚本会很杂乱导致项目管理混乱

简单来说，在webpack出现之前，前端代码是没有模块化的，webpack出现后，在上例中，我们只需要保留最后一个script标签，在index.js中通过require或import引入第三方依赖库即可完成功能开发，因为webpack帮我实现一套浏览器支持的模块管理方案。

说到这，大家可能还是有点蒙，下面我们来看看webpack到底做了什么：

创建一个项目webpack-dev，下载webpack、webpack-cli，项目目录如下：

![加载失败，请刷新网页](https://github.com/applekj/frontend-knowledge/blob/master/images/Webpack/webpack-dev/project.jpg)

index.js、a.js、b.js三个文件的内容如下：

```javascript
//index.js
const str = require('./a.js')

console.log(str)

//a.js
const b = require('./base/b.js')

module.exports = 'a' + b

//b.js
module.exports = 'b'
```

在项目根目录下增加webpack.config.js。

```javascript
const path = require('path')

module.exports = {
    mode: 'development',
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    }
}
```

此时我们运行 npx webpack ,在dist目录下生成了一个bundle.js文件，精简下代码：

```javascript
(function (modules) {
    var installedModules = {};
    function __webpack_require__(moduleId) {
        if (installedModules[moduleId]) {
            return installedModules[moduleId].exports;
        }
        var module = installedModules[moduleId] = {
            i: moduleId,
            l: false,
            exports: {}
        };
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
        module.l = true;
        return module.exports;
    }
    __webpack_require__.m = modules;
    __webpack_require__.c = installedModules;
    __webpack_require__.d = function (exports, name, getter) {
        if (!__webpack_require__.o(exports, name)) {
            Object.defineProperty(exports, name, { enumerable: true, get: getter });
        }
    };
    __webpack_require__.r = function (exports) {
        if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
            Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
        }
        Object.defineProperty(exports, '__esModule', { value: true });
    };
    __webpack_require__.t = function (value, mode) {
        if (mode & 1) value = __webpack_require__(value);
        if (mode & 8) return value;
        if ((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
        var ns = Object.create(null);
        __webpack_require__.r(ns);
        Object.defineProperty(ns, 'default', { enumerable: true, value: value });
        if (mode & 2 && typeof value != 'string') for (var key in value) __webpack_require__.d(ns, key, function (key) { return value[key]; }.bind(null, key));
        return ns;
    };
    __webpack_require__.n = function (module) {
        var getter = module && module.__esModule ?
            function getDefault() { return module['default']; } :
            function getModuleExports() { return module; };
        __webpack_require__.d(getter, 'a', getter);
        return getter;
    };
    __webpack_require__.o = function (object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
    __webpack_require__.p = "";
    return __webpack_require__(__webpack_require__.s = "./src/index.js");
})({
    "./src/a.js":
        (function (module, exports, __webpack_require__) {
            eval("const b = __webpack_require__(/*! ./base/b.js */ \"./src/base/b.js\")\r\n\r\nmodule.exports = 'a' + b\n\n//# sourceURL=webpack:///./src/a.js?");
        }),
    "./src/base/b.js":
        (function (module, exports) {
            eval("module.exports = 'b'\n\n//# sourceURL=webpack:///./src/base/b.js?");
        }),
    "./src/index.js":
        (function (module, exports, __webpack_require__) {
            eval("const str = __webpack_require__(/*! ./a.js */ \"./src/a.js\")\r\n// require('./index.less')\r\nconsole.log(str)\n\n//# sourceURL=webpack:///./src/index.js?");
        })
});
```

看eval方法里的字符串，这跟我们写的代码好像啊，是的，它就是我们写的代码，只不过用ast解析成了一段字符串，而且它还实现了__webpack_require__方法，替换了我们代码里的require，到这里我们就已经知道webpack主要干了两件事：解析ast、实现__webpack_require__，接下来我们自己实现一个webpack。

## 二、实现webpack

首先搭建开发环境，新建一个项目my-pack，目录结构如下：

![加载失败，请刷新网页](https://github.com/applekj/frontend-knowledge/blob/master/images/Webpack/webpack-dev/my-pack.jpg)

在my-pack.js文件中，增加如下代码：

```javascript
#! /usr/bin/env node

console.log('start')
```

在my-pack项目目录下，执行如下代码，将my-pack项目link到全局node_moudles中：

```
npm link my-pack
```

在webpack-dev项目执行如下代码：

```
npx my-pack
```

如果看到控制台打印了"start"，就表示环境搭建成功了，下面开始正式的编写webpack。

在my-pack项目中，将bin文件夹下的my-pack.js改成如下代码：

```javascript
#! /usr/bin/env node

//1、拿到webpack.config.js文件

const path = require('path')

const config = require(path.resolve('webpack.config.js'))

//2、创建Compiler类，在实例化时传入webpack.config.js文件，然后调用run方法开始解析代码

const Compiler = require('../lib/Compiler')

const compiler = new Compiler(config)

compiler.run()
```

将lib文件下的Compiler.js改成如下代码：

```javascript
const path = require('path')
const fs = require('fs')
const babylon = require('babylon')
const traverse = require('@babel/traverse').default
const types = require('@babel/types')
const generator = require('@babel/generator').default

class Compiler {
    constructor(config) {
        this.config = config
        this.entryId
        this.modules = {}
        this.entry = config.entry
        this.root = process.cwd()
    }

    // 使用node.js的模块fs通过源码路径读取源码
    getSource(modulePath) {
        let content = fs.readFileSync(modulePath, 'utf8')
        return content
    }

    // ast解析源码
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
                    moduleName = ('./' + path.join(parentPath, moduleName)).replace(/\\/g, '/')
                    dependencies.push(moduleName)
                    node.arguments = [types.stringLiteral(moduleName)]
                }
            }
        })
        const sourceCode = generator(ast).code
        return { sourceCode, dependencies }
    }

     /*
      * 构建module对象，该对象记录代码的路径及ast解析后的字符串
      * 这个过程是递归执行的，因为项目中的代码可能引用一些依赖或其他文件，比如index.js引入了a.js 
      */
    buildModule(modulePath, isEntry) {
        const source = this.getSource(modulePath)
        let moduleName = ('./' + path.relative(this.root, modulePath)).replace(/\\/g, '/')

        if (isEntry) {
            this.entryId = moduleName
        }

        const { sourceCode, dependencies } = this.parse(source, path.dirname(moduleName))

        this.modules[moduleName] = sourceCode

        dependencies.forEach(dep => {
            this.buildModule(path.join(this.root, dep), false)
        })
    }

    // 将文件写入前端项目中对应的目录中
    emitFile() {
        console.log(this.modules)
    }

    // 开启构建流程
    run() {
        this.buildModule(path.resolve(this.root, this.entry), true)
        this.emitFile()
    }
}

module.exports = Compiler
```

此时，我们在webpack-dev项目执行 npx my-pack ，输出代码如下，表示ast的解析已经完成了，而且也将require替换成了__webpack_require__：

```javascript
{
  './src/index.js': 'const str = __webpack_require__("./src/a.js");\n' +
    "// require('./index.less')\n" +
    'console.log(str);',
  './src/a.js': 'const b = __webpack_require__("./src/base/b.js");\n' + 
    "module.exports = 'a' + b;",
  './src/base/b.js': "module.exports = 'b';"
}
```

接下来，我们要将上面代码，通过模板最终生成webpack-dev项目的bundle.js文件，并在模板里实现__webpack_require__方法，在my-pack项目中下载ejs，然后在lib文件夹的main.ejs中增加以下代码：

```javascript
(function (modules) {
  var installedModules = {};
  function __webpack_require__(moduleId) {
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports;
    }
    var module = installedModules[moduleId] = {
      i: moduleId,
      l: false,
      exports: {}
    };
    modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
    module.l = true;
    return module.exports;
  }
  __webpack_require__.m = modules;
  __webpack_require__.c = installedModules;
  __webpack_require__.d = function (exports, name, getter) {
    if (!__webpack_require__.o(exports, name)) {
    Object.defineProperty(exports, name, { enumerable: true, get: getter });
    }
  };
  __webpack_require__.r = function (exports) {
    if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
      Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    }
    Object.defineProperty(exports, '__esModule', { value: true });
  };
  __webpack_require__.t = function (value, mode) {
    if (mode & 1) value = __webpack_require__(value);
    if (mode & 8) return value;
    if ((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
    var ns = Object.create(null);
    __webpack_require__.r(ns);
    Object.defineProperty(ns, 'default', { enumerable: true, value: value });
    if (mode & 2 && typeof value != 'string') for (var key in value) __webpack_require__.d(ns, key, function (key) { return
    value[key]; }.bind(null, key));
    return ns;
  };
  __webpack_require__.n = function (module) {
    var getter = module && module.__esModule ?
    function getDefault() { return module['default']; } :
    function getModuleExports() { return module; };
    __webpack_require__.d(getter, 'a', getter);
    return getter;
  };
  __webpack_require__.o = function (object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
  __webpack_require__.p = "";
  return __webpack_require__(__webpack_require__.s = "<%-entryId%>");
})
({
  <%for(let key in modules){%>
  "<%-key%>":
  (function (module, exports, __webpack_require__) {
  eval(`<%-modules[key]%>`);
  }),
  <%}%>
});
```

以上代码就是复制的webpack打包之后的bundle.js，只不过我们做了一些精简，增加了一些模板语法用来放入ast解析后的代码。

到这里，我们还不能在webpack-dev项目中生成bundle.js文件，在my-pack.js中增加以下代码：

```javascript
// ......省略代码......
    emitFile() {
        const main = path.resolve(this.config.output.path, this.config.output.filename)
        const templateStr = this.getSource(path.resolve(__dirname, 'main.ejs'))
        const code = ejs.render(templateStr, { entryId: this.entryId, modules: this.modules })

        this.assets = {}
        this.assets[main] = code
        fs.writeFileSync(main, this.assets[main])
    }
// ......省略代码......
```

在webpack-dev项目中执行 npx my-pack ，可以看到在dist目录下生成了bundle.js文件，在浏览器中测试下。

![加载失败，请刷新网页](https://github.com/applekj/frontend-knowledge/blob/master/images/Webpack/webpack-dev/result.jpg)

到这里，我们就实现了一个简易版的webpack，但是还不支持loader和plugin。

## 三、支持loader

我们知道webpack本身只支持js、json代码的打包，假如要在index.js文件中引入一个less文件怎么办，此时就可以使用loader扩展下webpack，让webpack支持多种文件类型的转化，比如打包less、sass、图片等，那loader是什么呢，其实就是一个函数，传入的参数为源码，传出的数据是经过loader函数处理之后的源码，我们写两个loader，来感受下。

在webpack-dev项目中下载less，在src目录下新增loader文件夹，在loader文件夹下新增style-loader.js、less-loader.js，代码如下：

```javascript
function loader(source) {
    const style = `
        let style = document.createElement('style')
        style.innerHTML = ${JSON.stringify(source)}
        document.head.appendChild(style)
    `
    return style
}

module.exports = loader
```

```javascript
const less = require('less')

function loader(source) {
    let css = ''
    less.render(source, (err, c) => {
        css = c.css
    })
    css = css.replace(/\n/g, '\\n')
    return css
}

module.exports = loader
```

然后在webpack.config.js中增加less-loader、style-loader的配置：

```javascript
// ......省略代码......
module: {
        rules: [
            {
                test: /\.less$/,
                use: [
                    path.resolve(__dirname, './loader', './style-loader.js'),
                    path.resolve(__dirname, './loader', './less-loader.js')
                ]
            }
        ]
    },
// ......省略代码......
```

最后在代码中使用下less，新增index.less文件，修改index.js，如下：

```javascript
const str = require('./a.js')
require('./index.less')
console.log(str)
```

```less
body {
    background-color: red;
}
```


到这里，我们已经在webpack-dev项目中使用了style-loader、less-loader，只需要让my-pack项目支持loader就可以了，Compiler.js文件增加如下代码：

```javascript
  getSource(modulePath) {
        // ......省略代码......
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
        // ......省略代码......
    }

```

在webpak-dev项目中执行 npx my-pack ，测试下浏览器效果。

![加载失败，请刷新网页](https://github.com/applekj/frontend-knowledge/blob/master/images/Webpack/webpack-dev/loader-result.jpg)

## 四、支持plugin

我们知道webpack是基于插件的架构体系，那上文介绍的loader是不是插件呢，很显然不是，loader只会对源码进行相应的处理，可以打包、压缩，而plugin是在webpack不同的执行时期里注册函数，等webpack执行到这里时触发对应的注册函数来完成各种任务，因此plugin才是作用于webpack本身上的插件，不仅可以打包优化和压缩，还可以重新定义环境变量，功能强大到可以用来处理各种各样的任务，对比loader要强大的多。

那webpack是怎么完成事件的注册和触发的呢，很明显要用到发布订阅模式，webpack就是借助tapable来完成事件的绑定和触发。

tapable是一个类似于node.js中的EventEmitter库，但更专注于自定义事件的绑定和触发，那tapable怎么使用呢？

```javascript
const { SyncHook } = require('tapable')

const hook = new SyncHook(['name'])

hook.tap('node', function (name) {
    console.log('node', name)
})

hook.tap('react', function (name) {
    console.log('react', name)
})

hook.call('张三')
// node 张三
// react 张三
```

可以看到在执行hook.call方法时，首先依次执行hook.tap方法，然后执行hook.call方法，这就是tapable提供的最简单的同步钩子，使用tap注册同步事件，再调用call来触发事件。

此外tapable还提供很多异步钩子，比如AsyncParallelHook：

```javascript
const { AsyncParallelHook } = require('tapable')

const hook = new AsyncParallelHook(['name'])

hook.tapAsync('node', function (name, cb) {
    setTimeout(() => {
        console.log('node', name)
        cb()
    }, 3000);
})

hook.tapAsync('react', function (name, cb) {
    setTimeout(() => {
        console.log('node', name)
        cb()
    }, 2000);
})

hook.tapAsync('vue', function (name, cb) {
    setTimeout(() => {
        console.log('node', name)
        cb()
    }, 1000);
})

hook.callAsync('yan', function () {
    console.log('end')
})

/*
 * 
 * vue 张三
 * react 张三
 * node 张三
 * end
 *  
 */
```

在上例中，使用hook.tapAsync来注册异步任务，再调用hook.callAsync来执行这些异步任务，所有异步任务执行完在执行callAsync的回调函数。

通过以上两个例子，我们就大致知道了tapable怎么使用的，接下来我们写一个插件，并在my-pack中注册一些事件。

plugin本质上是一个对外导出的class，类中包含一个固定方法名apply，apply方法的参数是Compiler的实例compiler。

在webpack-dev中，创建plugins文件夹，在该文件夹下增加test.js:

```javascript
class P {
    apply(compiler) {
        compiler.hooks.emit.tap('emit', function () {
            console.log('emit')
        })

    }
}

module.exports = P
```

在my-pack的Compiler.js中增加以下代码：

```javascript
 constructor(config) {
        // ......省略代码......
        this.hooks = {
            entryOption: new SyncHook(),
            compile: new SyncHook(),
            afterCompile: new SyncHook(),
            afterPlugins: new SyncHook(),
            run: new SyncHook(),
            emit: new SyncHook(),
            done: new SyncHook()
        },
        const plugins = this.config.plugins
        if (Array.isArray(plugins)) {
            plugins.forEach(plugin => {
                plugin.apply(this)
            })
        }
    }
```

这里我们注册一些webpack核心的钩子。

  - entryOption:webpack开始读取配置文件的Entries,递归遍历所有的入口文件.
  - run: 程序即将进入构建环节
  - compile: 程序即将进入ast解析
  - afterCompile:ast解析之后
  - afterPlugins:webpack注册所有的plugin之后
  - emit: 所有打包生成的文件内容已经在内存中按照相应的数据结构处理完毕,下一步会将文件内容输出到文件系统,emit钩子会在生成文件之前执行(通常想操作打包后的文件可以在emit阶段编写plugin实现).
  - done: 编译后的文件已经输出到目标目录,整体代码的构建工作结束时触发

但此时，这些钩子并不会执行，需要在合适的地方调用call方法。

在my-pack.js中增加如下代码

```javascript
// ......省略代码......
compiler.hooks.entryOption.call()

compiler.run()
```

修改Compiler.js：

```javascript
  constructor(config) {
        //......省略代码......
        this.hooks.afterPlugins.call()
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
```

到这里，我们已经实现了简易版的webpack，并支持loader和plugin，[完整代码请看我github](https://github.com/applekj/frontend-knowledge/tree/master/examples/webpack/my-pack)

## 总结

    1、webpack最基本的功能就是实现了一套浏览器支持的模块化语句，不仅支持CommonJS规范，还支持ES6的模块规范、AMD、CMD等模块规范
    2、webpack在打包代码前会进行ast解析，文中我们采用babel来进行ast解析，但webpack官方并没有采用babel，而是自己实现了一套ast解析
    3、loader就是一个函数，参数为源码，输出的是经过loader函数处理过的源码，文中我们采用普通loader的方式写了两个loader，此外loader还支持前置、后置和内联的方式
    4、plugin本质上就是一个类，类中包含一个固定方法apply，apply方法的参数是Compiler的实例compiler，只有Compiler实例化后才可以触发webpack生命周期的钩子