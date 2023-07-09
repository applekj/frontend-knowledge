class SyncWaterfallHook {
    constructor(args) {
        this.tasks = []
    }

    tap(name, task) {
        this.tasks.push(task)
    }

    call(...args) {
        this.tasks.reduce((a, b) => {
            return b(a)
        }, ...args)
    }
}

let hook = new SyncWaterfallHook(['name'])

hook.tap('node', function (name) {
    console.log('node', name)
    return '已经学完node了'
})

hook.tap('react', function (data) {
    console.log('react', data)
    return '已经学完react了'
})

hook.tap('vue', function (data) {
    console.log('vue', data)
})

hook.call('yan')