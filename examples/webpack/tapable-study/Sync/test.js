const { SyncHook } = require('tapable')

class Lesson {
    constructor() {
        this.hooks = {
            user: new SyncHook(['name'])
        }
    }

    tap(name, callback) {
        this.hooks.user.tap(name, callback)
    }

    start(name) {
        this.hooks.user.call(name)
    }
}

const lesson = new Lesson()

lesson.tap('node', function (name) {
    console.log('node', name)
})

lesson.tap('react', function (name) {
    console.log('react', name)
})

lesson.start('张三')