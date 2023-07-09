class SyncLoopHook {
    constructor(args) {
        this.index = 0
        this.tasks = []
    }

    tap(name, task) {
        this.tasks.push(task)
    }

    call(...args) {
        let res = null
        let p = 0
        while (p < this.tasks.length) {
            const task = this.tasks[p]
            res = task(...args)
            while (res !== undefined) {
                res = task(...args)
            }
            if (res === undefined) {
                p++
            }
        }
    }
}

let hook = new SyncLoopHook(['name'])
let total = 0
hook.tap('node', function (name) {
    console.log('node', name)
    return ++total == 3 ? undefined : '继续学'
})

hook.tap('react', function (data) {
    console.log('react', data)
})

hook.tap('vue', function (data) {
    console.log('vue', data)
})

hook.call('yan')