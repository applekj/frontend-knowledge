
class P {
    apply(compiler) {
        console.log('start')
        compiler.hooks.emit.tap('emit', function () {
            console.log('emit')
        })

    }
}

module.exports = P