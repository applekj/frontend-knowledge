#! /usr/bin/env node

//1、拿到webpack.config.js文件

const path = require('path')

const config = require(path.resolve('webpack.config.js'))

//2、创建Compiler类，在实例化时传入webpack.config.js文件，然后调用run方法开始解析代码

const Compiler = require('../lib/Compiler')

const compiler = new Compiler(config)

compiler.hooks.entryOption.call()

compiler.run()